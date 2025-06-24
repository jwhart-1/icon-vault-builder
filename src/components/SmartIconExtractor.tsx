
import React, { useEffect, useState } from 'react';
import { ExtractedIcon } from './SvgIconManager';
import { SvgAnalyzer } from './SvgAnalyzer';
import { Loader2, AlertCircle } from 'lucide-react';

interface SmartIconExtractorProps {
  files: File[];
  onIconsExtracted: (icons: ExtractedIcon[]) => void;
}

export const SmartIconExtractor: React.FC<SmartIconExtractorProps> = ({
  files,
  onIconsExtracted,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState(0);
  const [currentStrategy, setCurrentStrategy] = useState('');
  const [extractionStats, setExtractionStats] = useState<string[]>([]);

  useEffect(() => {
    if (files.length > 0) {
      processFiles();
    }
  }, [files]);

  const createStandaloneIcon = (element: Element, originalViewBox: string = '0 0 24 24'): string => {
    // Get the inner content of the element, not the element itself as a wrapper
    const innerHTML = element.innerHTML || '';
    const outerHTML = element.outerHTML || '';
    
    // If the element has children, use innerHTML, otherwise use the element itself
    const iconContent = innerHTML.trim() ? innerHTML : outerHTML;
    
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${originalViewBox}" fill="currentColor">
      ${iconContent}
    </svg>`;
  };

  const isValidIconElement = (element: Element): boolean => {
    // Check if element has actual visual content
    const hasPath = element.querySelector('path') !== null;
    const hasCircle = element.querySelector('circle') !== null;
    const hasRect = element.querySelector('rect') !== null;
    const hasPolygon = element.querySelector('polygon') !== null;
    const hasLine = element.querySelector('line') !== null;
    const hasPolyline = element.querySelector('polyline') !== null;
    const hasEllipse = element.querySelector('ellipse') !== null;
    
    if (!hasPath && !hasCircle && !hasRect && !hasPolygon && !hasLine && !hasPolyline && !hasEllipse) {
      return false;
    }

    // Additional validation for paths
    if (hasPath) {
      const paths = element.querySelectorAll('path');
      let hasValidPath = false;
      paths.forEach(path => {
        const pathData = path.getAttribute('d');
        if (pathData && pathData.length > 15) { // Meaningful path data
          hasValidPath = true;
        }
      });
      if (!hasValidPath && !hasCircle && !hasRect && !hasPolygon) {
        return false;
      }
    }

    return true;
  };

  const extractIconsFromSVG = (svgContent: string, fileName: string): ExtractedIcon[] => {
    console.log(`\n=== PROCESSING: ${fileName} ===`);
    console.log('SVG content length:', svgContent.length);
    setCurrentStrategy(`Analyzing ${fileName}...`);
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const icons: ExtractedIcon[] = [];

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.error('SVG parsing error:', parserError.textContent);
      return icons;
    }

    const svgElement = doc.querySelector('svg');
    if (!svgElement) {
      console.error('No root SVG element found');
      return icons;
    }

    const viewBox = svgElement.getAttribute('viewBox') || '0 0 24 24';
    console.log('SVG viewBox:', viewBox);
    
    // Strategy 1: Extract symbols (highest priority)
    setCurrentStrategy('Extracting symbol definitions...');
    const symbols = Array.from(svgElement.querySelectorAll('symbol'));
    console.log(`Found ${symbols.length} symbols`);
    
    symbols.forEach((symbol, index) => {
      if (isValidIconElement(symbol)) {
        const iconId = symbol.getAttribute('id') || `symbol-${index}`;
        const svgWrapper = createStandaloneIcon(symbol, viewBox);
        
        icons.push({
          id: `${fileName}-symbol-${iconId}-${Date.now()}-${index}`,
          svgContent: svgWrapper,
          name: iconId.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          category: 'Symbol',
          description: `Extracted from ${fileName}`,
          keywords: [iconId, 'symbol'],
          license: '',
          author: '',
          dimensions: { width: 24, height: 24 },
          fileSize: new Blob([svgWrapper]).size,
        });
        console.log(`Extracted symbol: ${iconId}`);
      }
    });

    // Strategy 2: Extract groups with IDs (second priority)
    if (icons.length < 3) {
      setCurrentStrategy('Extracting named groups...');
      const namedGroups = Array.from(svgElement.querySelectorAll('g[id]'));
      console.log(`Found ${namedGroups.length} named groups`);
      
      namedGroups.forEach((group, index) => {
        if (isValidIconElement(group)) {
          const groupId = group.getAttribute('id') || `group-${index}`;
          const svgWrapper = createStandaloneIcon(group, viewBox);
          
          icons.push({
            id: `${fileName}-group-${groupId}-${Date.now()}-${index}`,
            svgContent: svgWrapper,
            name: groupId.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            category: 'Group',
            description: `Extracted from ${fileName}`,
            keywords: [groupId, 'group'],
            license: '',
            author: '',
            dimensions: { width: 24, height: 24 },
            fileSize: new Blob([svgWrapper]).size,
          });
          console.log(`Extracted named group: ${groupId}`);
        }
      });
    }

    // Strategy 3: Extract all groups (if still not enough icons)
    if (icons.length < 2) {
      setCurrentStrategy('Extracting all content groups...');
      const allGroups = Array.from(svgElement.querySelectorAll('g')).slice(0, 25);
      console.log(`Found ${allGroups.length} total groups`);
      
      allGroups.forEach((group, index) => {
        if (isValidIconElement(group)) {
          const groupId = group.getAttribute('id') || group.getAttribute('class') || `icon-${index + 1}`;
          const svgWrapper = createStandaloneIcon(group, viewBox);
          
          icons.push({
            id: `${fileName}-auto-${index}-${Date.now()}`,
            svgContent: svgWrapper,
            name: `Icon ${index + 1}`,
            category: 'Auto-extracted',
            description: `Extracted from ${fileName}`,
            keywords: ['auto', 'extracted'],
            license: '',
            author: '',
            dimensions: { width: 24, height: 24 },
            fileSize: new Blob([svgWrapper]).size,
          });
          console.log(`Extracted group ${index + 1}`);
        }
      });
    }

    // Strategy 4: Extract individual paths (last resort)
    if (icons.length === 0) {
      setCurrentStrategy('Extracting individual paths...');
      const paths = Array.from(svgElement.querySelectorAll('path')).slice(0, 15);
      console.log(`Found ${paths.length} paths as fallback`);
      
      paths.forEach((path, index) => {
        const pathData = path.getAttribute('d');
        if (pathData && pathData.length > 15) {
          // Create a wrapper group for the path
          const pathGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          pathGroup.appendChild(path.cloneNode(true));
          
          const svgWrapper = createStandaloneIcon(pathGroup, viewBox);
          
          icons.push({
            id: `${fileName}-path-${index}-${Date.now()}`,
            svgContent: svgWrapper,
            name: `Path Icon ${index + 1}`,
            category: 'Path',
            description: `Extracted from ${fileName}`,
            keywords: ['path', 'extracted'],
            license: '',
            author: '',
            dimensions: { width: 24, height: 24 },
            fileSize: new Blob([svgWrapper]).size,
          });
          console.log(`Extracted path ${index + 1}`);
        }
      });
    }

    // Remove duplicates based on similar SVG content
    const uniqueIcons = icons.filter((icon, index, arr) => {
      return arr.findIndex(other => other.svgContent === icon.svgContent) === index;
    });

    const finalCount = Math.min(uniqueIcons.length, 20); // Reasonable limit
    const finalIcons = uniqueIcons.slice(0, finalCount);
    
    console.log(`Successfully extracted ${finalIcons.length} unique icons from ${fileName}`);
    setExtractionStats(prev => [...prev, `${fileName}: ${finalIcons.length} icons extracted`]);
    
    return finalIcons;
  };

  const processFiles = async () => {
    setIsProcessing(true);
    setProcessedFiles(0);
    setExtractionStats([]);
    const allIcons: ExtractedIcon[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`\nProcessing file ${i + 1}/${files.length}: ${file.name}`);
      
      try {
        if (file.size > 10000000) {
          console.error(`File ${file.name} too large, skipping`);
          setExtractionStats(prev => [...prev, `${file.name}: File too large (>10MB)`]);
          continue;
        }
        
        const content = await file.text();
        console.log(`File content loaded, length: ${content.length}`);
        
        const extractedIcons = extractIconsFromSVG(content, file.name);
        allIcons.push(...extractedIcons);
        setProcessedFiles(i + 1);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        setExtractionStats(prev => [...prev, `${file.name}: Processing error`]);
      }
    }

    console.log(`\n=== EXTRACTION COMPLETE ===`);
    console.log(`Total icons extracted: ${allIcons.length}`);
    setIsProcessing(false);
    setCurrentStrategy('');
    onIconsExtracted(allIcons);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center mb-6">
          <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            Smart Icon Extraction
          </h3>
          <p className="text-slate-500 mb-4">
            {currentStrategy || 'Parsing SVG content and extracting individual icons...'}
          </p>
        </div>
        
        <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${(processedFiles / files.length) * 100}%` }}
          ></div>
        </div>
        
        <div className="text-center mb-4">
          <p className="text-sm text-slate-600">
            {processedFiles} of {files.length} files processed
          </p>
        </div>

        {extractionStats.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-medium text-slate-700 mb-2 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Extraction Results
            </h4>
            <div className="space-y-1">
              {extractionStats.map((stat, index) => (
                <p key={index} className="text-xs text-slate-600">{stat}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
