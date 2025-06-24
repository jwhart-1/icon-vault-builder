
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

  const analyzeIconSVGStructure = (svgContent: string) => {
    console.log("=== DETAILED SVG STRUCTURE ANALYSIS ===");
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svg = doc.documentElement;
    
    // Log the complete structure
    console.log("SVG dimensions:", {
      width: svg.getAttribute('width'),
      height: svg.getAttribute('height'),
      viewBox: svg.getAttribute('viewBox')
    });
    
    // Analyze all child elements
    console.log("Direct children of SVG:", svg.children.length);
    Array.from(svg.children).forEach((child, i) => {
      console.log(`Child ${i}:`, {
        tag: child.tagName,
        id: child.id,
        class: (child as any).className?.baseVal || (child as any).className || '',
        children: child.children.length,
        hasTransform: child.hasAttribute('transform'),
        transform: child.getAttribute('transform')
      });
      
      // Look deeper into groups
      if (child.tagName === 'g' && child.children.length > 0) {
        console.log(`  Group ${i} contains:`, Array.from(child.children).map(c => c.tagName));
      }
    });
    
    // Look for patterns that indicate individual icons
    const allGroups = svg.querySelectorAll('g');
    console.log(`Total groups found: ${allGroups.length}`);

    allGroups.forEach((group, index) => {
      try {
        // Try to get bounding box with better error handling
        let bbox = null;
        try {
          bbox = (group as any).getBBox();
        } catch (e) {
          console.warn(`Could not get bbox for group ${index}, trying alternative method`);
          // Try alternative method to get dimensions
          const paths = group.querySelectorAll('path, circle, rect, polygon');
          if (paths.length > 0) {
            bbox = { x: 0, y: 0, width: 100, height: 100 }; // Default fallback
          }
        }
        
        const pathCount = group.querySelectorAll('path, circle, rect, polygon').length;
        
        console.log(`Group ${index}:`, {
          paths: pathCount,
          bbox: bbox ? `${bbox.x.toFixed(1)},${bbox.y.toFixed(1)} ${bbox.width.toFixed(1)}x${bbox.height.toFixed(1)}` : 'no bbox',
          transform: group.getAttribute('transform'),
          id: group.id,
          hasValidPaths: pathCount > 0
        });
      } catch (e) {
        console.warn(`Could not analyze group ${index}:`, e);
      }
    });
    
    return { svg, allGroups };
  };

  const createProperIconSVG = (groupElement: Element, bbox: any, originalSVG: Element, fileName: string): string => {
    // Use provided bbox or calculate reasonable defaults
    let viewBoxX = bbox?.x || 0;
    let viewBoxY = bbox?.y || 0;
    let viewBoxWidth = bbox?.width || 100;
    let viewBoxHeight = bbox?.height || 100;
    
    // Add some padding
    const padding = Math.max(viewBoxWidth, viewBoxHeight) * 0.1;
    viewBoxX -= padding;
    viewBoxY -= padding;
    viewBoxWidth += padding * 2;
    viewBoxHeight += padding * 2;
    
    const viewBox = `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`;
    
    // Clone the group and clean it up
    const clonedGroup = groupElement.cloneNode(true) as Element;
    
    // Fix visibility for all drawing elements - USE BLACK INSTEAD OF currentColor
    const allPaths = clonedGroup.querySelectorAll('path, circle, rect, polygon, line, ellipse');
    allPaths.forEach(path => {
      const fill = path.getAttribute('fill');
      const stroke = path.getAttribute('stroke');
      
      // Instead of currentColor, use black directly
      if (!fill && !stroke) {
        path.setAttribute('fill', '#000000');
      } else if (fill === 'currentColor') {
        path.setAttribute('fill', '#000000');
      } else if (stroke === 'currentColor') {
        path.setAttribute('stroke', '#000000');
      }
      
      // If fill is none, ensure there's a stroke
      if (fill === 'none' && !stroke) {
        path.setAttribute('stroke', '#000000');
        path.setAttribute('stroke-width', '1');
      }
    });
    
    const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100" height="100" fill="#000000">
${clonedGroup.outerHTML}
</svg>`;
    
    console.log(`Created icon SVG with viewBox: ${viewBox}`);
    return iconSVG;
  };

  const extractActualIcons = (svgContent: string, fileName: string): ExtractedIcon[] => {
    const { svg, allGroups } = analyzeIconSVGStructure(svgContent);
    const extractedIcons: ExtractedIcon[] = [];
    
    console.log("=== SMART ICON EXTRACTION ===");
    
    // Strategy: Look for groups with drawing elements (more permissive approach)
    Array.from(allGroups).forEach((group, index) => {
      try {
        const pathElements = group.querySelectorAll('path, circle, rect, polygon, line');
        
        // More permissive criteria - if it has drawing elements, it's likely an icon
        const hasDrawingElements = pathElements.length > 0;
        const notTooComplex = pathElements.length < 50; // Very generous limit
        
        if (hasDrawingElements && notTooComplex) {
          console.log(`✓ Valid icon found at group ${index}:`, {
            elements: pathElements.length,
            id: group.id,
            hasId: !!group.id
          });
          
          // Try to get bbox, use fallback if needed
          let bbox = { x: 0, y: 0, width: 100, height: 100 };
          try {
            const actualBbox = (group as any).getBBox();
            if (actualBbox && actualBbox.width > 0 && actualBbox.height > 0) {
              bbox = actualBbox;
            }
          } catch (e) {
            console.log(`Using fallback bbox for group ${index}`);
          }
          
          // Create the icon with proper viewBox
          const iconSVG = createProperIconSVG(group, bbox, svg, fileName);
          
          extractedIcons.push({
            id: `${fileName}-icon-${Date.now()}-${index}`,
            svgContent: iconSVG,
            name: `${fileName.replace('.svg', '')} Icon ${extractedIcons.length + 1}`,
            category: 'Extracted Icon',
            description: `Extracted from ${fileName}`,
            keywords: ['extracted', fileName.replace('.svg', '').toLowerCase()],
            license: '',
            author: '',
            dimensions: {
              width: Math.round(bbox.width),
              height: Math.round(bbox.height)
            },
            fileSize: new Blob([iconSVG]).size,
          });
        } else {
          console.log(`✗ Skipped group ${index}:`, {
            elements: pathElements.length,
            reason: pathElements.length === 0 ? 'no drawing elements' : 'too complex'
          });
        }
      } catch (error) {
        console.warn(`Could not process group ${index}:`, error);
      }
    });
    
    console.log(`=== SMART EXTRACTION COMPLETE: ${extractedIcons.length} valid icons found ===`);
    return extractedIcons;
  };

  const extractIconsFromSVG = async (svgContent: string, fileName: string): Promise<ExtractedIcon[]> => {
    console.log("=== STARTING IMPROVED ICON EXTRACTION ===");
    console.log("File name:", fileName);
    console.log("SVG content length:", svgContent.length);
    
    // Parse the SVG content
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    
    // Check for parsing errors
    const parseError = svgDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Invalid SVG file format');
    }
    
    let extractedIcons: ExtractedIcon[] = [];
    
    // Try smart detection with more permissive criteria
    setCurrentStrategy('Analyzing SVG structure and detecting icons...');
    extractedIcons = extractActualIcons(svgContent, fileName);
    
    console.log(`Final result: ${extractedIcons.length} icons extracted`);
    
    // Enhanced debug logging for complete icons
    console.log("=== COMPLETE ICON DEBUG INFO ===");
    extractedIcons.slice(0, 3).forEach((icon, index) => {
      console.log(`Complete Icon ${index} (${icon.name}):`);
      console.log("SVG Content:", icon.svgContent.substring(0, 200) + "...");
      console.log("Content length:", icon.svgContent?.length);
      console.log("ViewBox:", icon.svgContent?.match(/viewBox="([^"]+)"/)?.[1]);
      console.log("Has complete structure:", icon.svgContent?.includes('<svg') && icon.svgContent?.includes('</svg>'));
      console.log("---");
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
      console.log(`\n=== STARTING IMPROVED SVG PROCESSING ===`);
      console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);
      console.log("File size:", file.size);
      
      try {
        if (file.size > 10000000) { // 10MB limit
          console.error(`File ${file.name} too large, skipping`);
          setExtractionStats(prev => [...prev, `${file.name}: File too large (>10MB)`]);
          continue;
        }
        
        // Read the SVG content as text
        const svgText = await file.text();
        console.log("SVG content length:", svgText.length);
        console.log("First 200 chars:", svgText.substring(0, 200));
        
        // Extract individual icons from the SVG content using improved logic
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
            {currentStrategy || 'Analyzing SVG structure to find icons...'}
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
