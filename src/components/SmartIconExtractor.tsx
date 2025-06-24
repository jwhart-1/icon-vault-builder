
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

  const createStandaloneIcon = (elementHTML: string, originalViewBox: string = '0 0 24 24', styles: string = ''): string => {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${originalViewBox}" fill="currentColor">
      ${styles ? `<style>${styles}</style>` : ''}
      ${elementHTML}
    </svg>`;
  };

  const isValidIconElement = (element: Element): boolean => {
    // Check if element has visual content
    const hasDrawingElements = element.querySelector('path, circle, rect, polygon, ellipse, line, polyline') !== null;
    if (!hasDrawingElements) return false;

    // Check if path has meaningful data
    const paths = element.querySelectorAll('path');
    if (paths.length > 0) {
      for (const path of paths) {
        const pathData = path.getAttribute('d');
        if (pathData && pathData.length > 10) {
          return true;
        }
      }
    }

    // Check for other drawing elements
    const otherElements = element.querySelectorAll('circle, rect, polygon, ellipse, line, polyline');
    return otherElements.length > 0;
  };

  const extractIconsFromSVG = (svgContent: string, fileName: string): ExtractedIcon[] => {
    console.log(`\n=== PROCESSING: ${fileName} ===`);
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
    const styles = svgElement.querySelector('style')?.innerHTML || '';
    
    // Strategy 1: Extract symbols (highest priority)
    setCurrentStrategy('Extracting symbol definitions...');
    const symbols = Array.from(svgElement.querySelectorAll('symbol'));
    console.log(`Found ${symbols.length} symbols`);
    
    symbols.forEach((symbol, index) => {
      if (isValidIconElement(symbol)) {
        const iconId = symbol.getAttribute('id') || `symbol-${index}`;
        const svgWrapper = createStandaloneIcon(symbol.innerHTML, viewBox, styles);
        
        icons.push({
          id: `${fileName}-symbol-${iconId}-${Date.now()}`,
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
      }
    });

    // Strategy 2: Extract from defs if symbols found but low count
    if (icons.length < 5) {
      setCurrentStrategy('Extracting definition groups...');
      const defsGroups = Array.from(svgElement.querySelectorAll('defs > g'));
      console.log(`Found ${defsGroups.length} definition groups`);
      
      defsGroups.forEach((group, index) => {
        if (isValidIconElement(group)) {
          const groupId = group.getAttribute('id') || `def-${index}`;
          const svgWrapper = createStandaloneIcon(group.innerHTML, viewBox, styles);
          
          icons.push({
            id: `${fileName}-def-${groupId}-${Date.now()}`,
            svgContent: svgWrapper,
            name: groupId.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            category: 'Definition',
            description: `Extracted from ${fileName}`,
            keywords: [groupId, 'definition'],
            license: '',
            author: '',
            dimensions: { width: 24, height: 24 },
            fileSize: new Blob([svgWrapper]).size,
          });
        }
      });
    }

    // Strategy 3: Extract top-level groups with meaningful content
    if (icons.length < 3) {
      setCurrentStrategy('Extracting content groups...');
      const topLevelGroups = Array.from(svgElement.querySelectorAll('svg > g'));
      console.log(`Found ${topLevelGroups.length} top-level groups`);
      
      topLevelGroups.forEach((group, index) => {
        if (isValidIconElement(group)) {
          const groupId = group.getAttribute('id') || group.getAttribute('class') || `group-${index}`;
          const svgWrapper = createStandaloneIcon(group.innerHTML, viewBox, styles);
          
          icons.push({
            id: `${fileName}-group-${groupId}-${Date.now()}`,
            svgContent: svgWrapper,
            name: `Icon ${index + 1}`,
            category: 'Group',
            description: `Extracted from ${fileName}`,
            keywords: ['group', 'icon'],
            license: '',
            author: '',
            dimensions: { width: 24, height: 24 },
            fileSize: new Blob([svgWrapper]).size,
          });
        }
      });
    }

    // Strategy 4: Smart grid detection for organized layouts
    if (icons.length < 2) {
      setCurrentStrategy('Detecting grid patterns...');
      const allGroups = Array.from(svgElement.querySelectorAll('g'));
      const validGroups = allGroups.filter(group => isValidIconElement(group));
      
      console.log(`Found ${validGroups.length} valid groups for grid detection`);
      
      if (validGroups.length > 2) {
        // Try to detect grid-like arrangements
        const groupsWithBounds = validGroups.map(group => {
          try {
            const bbox = (group as any).getBBox ? (group as any).getBBox() : null;
            return {
              element: group,
              x: bbox?.x || 0,
              y: bbox?.y || 0,
              width: bbox?.width || 20,
              height: bbox?.height || 20
            };
          } catch {
            return null;
          }
        }).filter(Boolean);

        // Group by approximate Y positions (rows)
        const tolerance = 50;
        const rows: { [key: number]: typeof groupsWithBounds } = {};
        
        groupsWithBounds.forEach(item => {
          if (!item) return;
          const rowKey = Math.round(item.y / tolerance) * tolerance;
          if (!rows[rowKey]) rows[rowKey] = [];
          rows[rowKey].push(item);
        });

        Object.values(rows).forEach((row, rowIndex) => {
          row.sort((a, b) => (a?.x || 0) - (b?.x || 0));
          row.slice(0, 12).forEach((item, colIndex) => {
            if (item?.element) {
              const svgWrapper = createStandaloneIcon(item.element.innerHTML, viewBox, styles);
              icons.push({
                id: `${fileName}-grid-${rowIndex}-${colIndex}-${Date.now()}`,
                svgContent: svgWrapper,
                name: `Grid Icon ${rowIndex + 1}-${colIndex + 1}`,
                category: 'Grid',
                description: `Extracted from ${fileName}`,
                keywords: ['grid', 'icon'],
                license: '',
                author: '',
                dimensions: { width: Math.round(item.width), height: Math.round(item.height) },
                fileSize: new Blob([svgWrapper]).size,
              });
            }
          });
        });
      }
    }

    const finalCount = Math.min(icons.length, 25); // Reasonable limit
    const finalIcons = icons.slice(0, finalCount);
    
    console.log(`Successfully extracted ${finalIcons.length} icons from ${fileName}`);
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
        const extractedIcons = extractIconsFromSVG(content, file.name);
        allIcons.push(...extractedIcons);
        setProcessedFiles(i + 1);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
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
            {currentStrategy || 'Analyzing SVG structure and extracting individual icons...'}
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
