import React, { useEffect, useState } from 'react';
import { ExtractedIcon } from './SvgIconManager';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

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

  const getElementDimensions = (element: Element) => {
    try {
      if ((element as any).getBBox) {
        const bbox = (element as any).getBBox();
        return {
          width: Math.round(bbox.width),
          height: Math.round(bbox.height),
          x: Math.round(bbox.x),
          y: Math.round(bbox.y)
        };
      }
    } catch (e) {
      console.warn("Could not get element dimensions:", e);
    }
    
    return { width: 24, height: 24, x: 0, y: 0 };
  };

  const createIndividualIconSVG = (element: Element, originalSVG: Element): string => {
    // Use a standard 24x24 viewBox for consistency
    const viewBox = '0 0 24 24';
    
    // Get any relevant attributes from the original SVG
    const xmlns = originalSVG.getAttribute('xmlns') || 'http://www.w3.org/2000/svg';
    
    // Get styles from original SVG if any
    const styleElement = originalSVG.querySelector('style');
    const styleContent = styleElement ? `<style>${styleElement.innerHTML}</style>` : '';
    
    // Get defs from original SVG if any
    const defsElement = originalSVG.querySelector('defs');
    const defsContent = defsElement ? defsElement.outerHTML : '';
    
    // Create a standalone SVG for this icon with proper styling
    const iconSVG = `<svg xmlns="${xmlns}" viewBox="${viewBox}" width="48" height="48" fill="currentColor" stroke="currentColor" stroke-width="1">
  ${defsContent}
  ${styleContent}
  ${element.outerHTML}
</svg>`;
    
    console.log(`Created icon SVG (${iconSVG.length} chars):`, iconSVG.substring(0, 200));
    return iconSVG;
  };

  const detectGridIcons = (svgElement: Element, fileName: string): ExtractedIcon[] => {
    console.log("=== GRID DETECTION MODE ===");
    
    // Get all potential icon elements
    const allElements = Array.from(svgElement.querySelectorAll('g, path, circle, rect, polygon'));
    console.log(`Analyzing ${allElements.length} elements for grid patterns`);
    
    const elementsWithPositions: Array<{
      element: Element;
      index: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];
    
    allElements.forEach((element, index) => {
      try {
        const bbox = (element as any).getBBox ? (element as any).getBBox() : null;
        if (bbox && bbox.width > 0 && bbox.height > 0) {
          elementsWithPositions.push({
            element,
            index,
            x: Math.round(bbox.x),
            y: Math.round(bbox.y),
            width: Math.round(bbox.width),
            height: Math.round(bbox.height)
          });
        }
      } catch (e) {
        // Skip elements that can't provide bbox
      }
    });
    
    console.log(`Found ${elementsWithPositions.length} positioned elements`);
    
    // Group by Y position (rows) with tolerance
    const tolerance = 20;
    const rows: { [key: number]: typeof elementsWithPositions } = {};
    
    elementsWithPositions.forEach(item => {
      const rowKey = Math.round(item.y / tolerance) * tolerance;
      if (!rows[rowKey]) rows[rowKey] = [];
      rows[rowKey].push(item);
    });
    
    console.log(`Detected ${Object.keys(rows).length} potential rows`);
    
    const gridIcons: ExtractedIcon[] = [];
    
    // Process each row
    Object.entries(rows).forEach(([rowY, rowItems]) => {
      // Sort by X position
      rowItems.sort((a, b) => a.x - b.x);
      
      rowItems.slice(0, 20).forEach((item, colIndex) => { // Limit to 20 per row
        const iconSVG = createIndividualIconSVG(item.element, svgElement);
        
        gridIcons.push({
          id: `grid-icon-${Date.now()}-${rowY}-${colIndex}`,
          svgContent: iconSVG,
          name: `${fileName.replace('.svg', '')} Grid ${Math.round(Number(rowY)/tolerance)}-${colIndex}`,
          category: 'Grid-detected',
          description: `Extracted from ${fileName}`,
          keywords: ['grid', 'detected'],
          license: '',
          author: '',
          dimensions: { width: item.width, height: item.height },
          fileSize: new Blob([iconSVG]).size,
        });
      });
    });
    
    console.log(`Grid detection found ${gridIcons.length} icons`);
    return gridIcons.slice(0, 50); // Limit total grid icons
  };

  const extractIconsFromSVG = async (svgContent: string, fileName: string): Promise<ExtractedIcon[]> => {
    console.log("=== EXTRACTING ICONS FROM SVG ===");
    console.log("File name:", fileName);
    console.log("SVG content length:", svgContent.length);
    console.log("First 200 chars:", svgContent.substring(0, 200));
    
    // Parse the SVG content
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    
    // Check for parsing errors
    const parseError = svgDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Invalid SVG file format');
    }
    
    const svgElement = svgDoc.documentElement;
    console.log("SVG root element:", svgElement.tagName);
    console.log("SVG viewBox:", svgElement.getAttribute('viewBox'));
    console.log("SVG width:", svgElement.getAttribute('width'));
    console.log("SVG height:", svgElement.getAttribute('height'));
    
    const extractedIcons: ExtractedIcon[] = [];
    
    // STRATEGY 1: Look for <symbol> elements first (highest priority)
    setCurrentStrategy('Extracting symbol definitions...');
    const symbols = Array.from(svgElement.querySelectorAll('symbol'));
    console.log(`Found ${symbols.length} symbols`);
    
    symbols.forEach((symbol, index) => {
      const paths = symbol.querySelectorAll('path');
      const circles = symbol.querySelectorAll('circle');
      const rects = symbol.querySelectorAll('rect');
      const polygons = symbol.querySelectorAll('polygon');
      const lines = symbol.querySelectorAll('line');
      
      const totalElements = paths.length + circles.length + rects.length + polygons.length + lines.length;
      
      if (totalElements > 0) {
        const iconSVG = createIndividualIconSVG(symbol, svgElement);
        const symbolId = symbol.getAttribute('id') || `symbol-${index}`;
        
        console.log(`Symbol ${index} SVG:`, iconSVG.substring(0, 200));
        console.log(`Symbol ${index} original:`, symbol.outerHTML.substring(0, 200));
        
        extractedIcons.push({
          id: `${fileName}-symbol-${symbolId}-${Date.now()}-${index}`,
          svgContent: iconSVG,
          name: symbolId.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          category: 'Symbol',
          description: `Extracted from ${fileName}`,
          keywords: [symbolId, 'symbol'],
          license: '',
          author: '',
          dimensions: { width: 24, height: 24 },
          fileSize: new Blob([iconSVG]).size,
        });
        
        console.log(`✓ Extracted symbol: ${symbolId} with ${totalElements} elements`);
      }
    });

    // STRATEGY 2: Look for <g> groups (most common for icon sets)
    if (extractedIcons.length < 5) {
      setCurrentStrategy('Extracting group elements...');
      const allGroups = Array.from(svgElement.querySelectorAll('g'));
      console.log(`Found ${allGroups.length} total groups`);
      
      allGroups.slice(0, 50).forEach((group, index) => {
        // Check what's inside this group
        const paths = group.querySelectorAll('path');
        const circles = group.querySelectorAll('circle');
        const rects = group.querySelectorAll('rect');
        const polygons = group.querySelectorAll('polygon');
        const lines = group.querySelectorAll('line');
        
        const totalElements = paths.length + circles.length + rects.length + polygons.length + lines.length;
        
        console.log(`Group ${index}: ${totalElements} drawing elements`);
        
        // If this group has drawing elements, it's likely an individual icon
        if (totalElements > 0 && totalElements < 50) { // Reasonable complexity for a single icon
          const iconSVG = createIndividualIconSVG(group, svgElement);
          const groupId = group.getAttribute('id') || group.getAttribute('class') || `group-${index}`;
          
          console.log(`Group ${index} SVG:`, iconSVG.substring(0, 200));
          console.log(`Group ${index} original:`, group.outerHTML.substring(0, 200));
          
          extractedIcons.push({
            id: `${fileName}-group-${groupId}-${Date.now()}-${index}`,
            svgContent: iconSVG,
            name: groupId !== `group-${index}` ? 
                  groupId.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                  `${fileName.replace('.svg', '')} Icon ${index + 1}`,
            category: 'Group',
            description: `Extracted from ${fileName}`,
            keywords: [groupId, 'group'],
            license: '',
            author: '',
            dimensions: getElementDimensions(group),
            fileSize: new Blob([iconSVG]).size,
          });
          
          console.log(`✓ Extracted icon ${index + 1} with ${totalElements} elements`);
        }
      });
    }
    
    // STRATEGY 3: If no groups found, look for direct child elements
    if (extractedIcons.length === 0) {
      setCurrentStrategy('Extracting direct elements...');
      console.log("No groups found, trying direct child elements...");
      
      const directPaths = Array.from(svgElement.querySelectorAll('svg > path'));
      const directShapes = Array.from(svgElement.querySelectorAll('svg > circle, svg > rect, svg > polygon'));
      
      console.log(`Found ${directPaths.length} direct paths, ${directShapes.length} direct shapes`);
      
      [...directPaths, ...directShapes].slice(0, 30).forEach((element, index) => {
        const iconSVG = createIndividualIconSVG(element, svgElement);
        
        console.log(`Direct element ${index} SVG:`, iconSVG.substring(0, 200));
        
        extractedIcons.push({
          id: `${fileName}-direct-${Date.now()}-${index}`,
          svgContent: iconSVG,
          name: `${fileName.replace('.svg', '')} Element ${index + 1}`,
          category: 'Direct Element',
          description: `Extracted from ${fileName}`,
          keywords: ['direct', 'element'],
          license: '',
          author: '',
          dimensions: getElementDimensions(element),
          fileSize: new Blob([iconSVG]).size,
        });
      });
    }
    
    // STRATEGY 4: Grid detection for icon sheets
    if (extractedIcons.length < 5) {
      setCurrentStrategy('Detecting grid patterns...');
      console.log("Few icons found, attempting grid detection...");
      const gridIcons = detectGridIcons(svgElement, fileName);
      extractedIcons.push(...gridIcons);
    }
    
    console.log(`=== EXTRACTION COMPLETE: ${extractedIcons.length} icons ===`);
    
    // Log a sample of the extracted icons for debugging
    extractedIcons.slice(0, 3).forEach((icon, index) => {
      console.log(`Sample icon ${index}:`, {
        name: icon.name,
        hasContent: !!icon.svgContent,
        contentLength: icon.svgContent?.length,
        contentPreview: icon.svgContent?.substring(0, 100)
      });
    });
    
    return extractedIcons;
  };

  const processFiles = async () => {
    setIsProcessing(true);
    setProcessedFiles(0);
    setExtractionStats([]);
    const allIcons: ExtractedIcon[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`\n=== STARTING SVG PROCESSING ===`);
      console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);
      console.log("File size:", file.size);
      
      try {
        if (file.size > 10000000) { // 10MB limit
          console.error(`File ${file.name} too large, skipping`);
          setExtractionStats(prev => [...prev, `${file.name}: File too large (>10MB)`]);
          continue;
        }
        
        // Read the SVG content as text (NOT as data URL)
        const svgText = await file.text();
        console.log("SVG content length:", svgText.length);
        console.log("First 200 chars:", svgText.substring(0, 200));
        
        // Extract individual icons from the SVG content
        const extractedIcons = await extractIconsFromSVG(svgText, file.name);
        
        console.log(`SUCCESS: Extracted ${extractedIcons.length} icons from ${file.name}`);
        allIcons.push(...extractedIcons);
        setProcessedFiles(i + 1);
        
        setExtractionStats(prev => [...prev, `${file.name}: ${extractedIcons.length} icons extracted`]);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        setExtractionStats(prev => [...prev, `${file.name}: Processing error - ${error}`]);
      }
    }

    console.log(`\n=== ALL FILES PROCESSED ===`);
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
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
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
