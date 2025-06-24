
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
        const bbox = (group as any).getBBox ? (group as any).getBBox() : null;
        const pathCount = group.querySelectorAll('path, circle, rect, polygon').length;
        
        if (bbox) {
          console.log(`Group ${index}:`, {
            paths: pathCount,
            bbox: `${bbox.x},${bbox.y} ${bbox.width}x${bbox.height}`,
            transform: group.getAttribute('transform'),
            id: group.id
          });
        }
      } catch (e) {
        console.warn(`Could not analyze group ${index}:`, e);
      }
    });
    
    return { svg, allGroups };
  };

  const createProperIconSVG = (groupElement: Element, bbox: any, originalSVG: Element): string => {
    // Calculate viewBox that centers and shows the complete icon
    const padding = Math.max(bbox.width, bbox.height) * 0.2; // 20% padding
    const viewBoxX = bbox.x - padding;
    const viewBoxY = bbox.y - padding;
    const viewBoxWidth = bbox.width + (padding * 2);
    const viewBoxHeight = bbox.height + (padding * 2);
    
    const viewBox = `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`;
    
    // Clone the group and clean it up
    const clonedGroup = groupElement.cloneNode(true) as Element;
    
    // Ensure visibility for all drawing elements
    const allPaths = clonedGroup.querySelectorAll('path, circle, rect, polygon, line');
    allPaths.forEach(path => {
      // Make sure elements are visible
      if (!path.hasAttribute('fill') || path.getAttribute('fill') === 'none') {
        path.setAttribute('fill', 'currentColor');
      }
      if (!path.hasAttribute('stroke') && !path.hasAttribute('fill')) {
        path.setAttribute('stroke', 'currentColor');
      }
    });
    
    const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100" height="100" fill="currentColor" stroke="currentColor" stroke-width="0.5">
${clonedGroup.outerHTML}
</svg>`;
    
    console.log(`Created icon SVG with viewBox: ${viewBox}`);
    return iconSVG;
  };

  const extractActualIcons = (svgContent: string, fileName: string): ExtractedIcon[] => {
    const { svg, allGroups } = analyzeIconSVGStructure(svgContent);
    const extractedIcons: ExtractedIcon[] = [];
    
    console.log("=== SMART ICON EXTRACTION ===");
    
    // Strategy 1: Look for groups with reasonable icon characteristics
    Array.from(allGroups).forEach((group, index) => {
      try {
        const bbox = (group as any).getBBox();
        const pathElements = group.querySelectorAll('path, circle, rect, polygon, line');
        const hasTransform = group.hasAttribute('transform');
        const transform = group.getAttribute('transform') || '';
        
        // Criteria for a valid icon:
        // 1. Has drawing elements (paths, shapes)
        // 2. Has reasonable size (not too tiny, not too huge)
        // 3. Reasonable complexity (not too simple, not too complex)
        const isValidIcon = 
          pathElements.length > 0 && 
          pathElements.length < 50 && // Not too complex
          bbox.width > 10 && bbox.height > 10 && // Not too tiny
          bbox.width < 1000 && bbox.height < 1000; // Not too huge
        
        if (isValidIcon) {
          console.log(`✓ Valid icon found at group ${index}:`, {
            elements: pathElements.length,
            size: `${bbox.width.toFixed(1)}x${bbox.height.toFixed(1)}`,
            position: `${bbox.x.toFixed(1)},${bbox.y.toFixed(1)}`,
            transform: transform.substring(0, 50)
          });
          
          // Create the icon with proper viewBox
          const iconSVG = createProperIconSVG(group, bbox, svg);
          
          extractedIcons.push({
            id: `${fileName}-icon-${Date.now()}-${index}`,
            svgContent: iconSVG,
            name: `${fileName.replace('.svg', '')} Icon ${extractedIcons.length + 1}`,
            category: 'Detected Icon',
            description: `Extracted from ${fileName}`,
            keywords: ['detected', 'extracted'],
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
            size: bbox ? `${bbox.width.toFixed(1)}x${bbox.height.toFixed(1)}` : 'no bbox',
            reason: pathElements.length === 0 ? 'no elements' : 
                    bbox.width <= 10 ? 'too small' : 
                    bbox.width >= 1000 ? 'too large' : 
                    pathElements.length >= 50 ? 'too complex' : 'unknown'
          });
        }
      } catch (error) {
        console.warn(`Could not process group ${index}:`, error);
      }
    });
    
    console.log(`=== SMART EXTRACTION COMPLETE: ${extractedIcons.length} valid icons found ===`);
    return extractedIcons;
  };

  const extractIconsFromGrid = (svgContent: string, fileName: string): ExtractedIcon[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svg = doc.documentElement;
    
    console.log("=== GRID-BASED EXTRACTION ===");
    
    // If the icons are arranged in a grid, we need to detect the grid pattern
    const svgViewBox = svg.getAttribute('viewBox') || '0 0 1000 1000';
    const [vbX, vbY, vbWidth, vbHeight] = svgViewBox.split(' ').map(Number);
    
    console.log("SVG ViewBox:", { vbX, vbY, vbWidth, vbHeight });
    
    // Try to detect if this is a grid layout
    // Look for elements arranged in regular patterns
    const allElements = svg.querySelectorAll('g, path, circle, rect');
    const positions: Array<{
      element: Element;
      index: number;
      x: number;
      y: number;
      width: number;
      height: number;
      centerX: number;
      centerY: number;
    }> = [];
    
    allElements.forEach((el, index) => {
      try {
        const bbox = (el as any).getBBox();
        if (bbox && bbox.width > 15 && bbox.height > 15) { // Reasonable size
          positions.push({
            element: el,
            index,
            x: bbox.x,
            y: bbox.y,
            width: bbox.width,
            height: bbox.height,
            centerX: bbox.x + bbox.width / 2,
            centerY: bbox.y + bbox.height / 2
          });
        }
      } catch (e) {
        // Skip elements without bbox
      }
    });
    
    console.log(`Found ${positions.length} positioned elements`);
    
    // Group by approximate rows and columns
    const gridIcons: ExtractedIcon[] = [];
    const tolerance = 50; // Pixels tolerance for grid alignment
    
    // Sort by Y then X to get row-by-row order
    positions.sort((a, b) => a.centerY - b.centerY || a.centerX - b.centerX);
    
    positions.slice(0, 50).forEach((pos, index) => {
      // Create individual icon for each positioned element
      const iconSVG = createProperIconSVG(pos.element, pos, svg);
      
      gridIcons.push({
        id: `${fileName}-grid-icon-${Date.now()}-${index}`,
        svgContent: iconSVG,
        name: `${fileName.replace('.svg', '')} Grid ${index + 1}`,
        category: 'Grid Icon',
        description: `Extracted from ${fileName}`,
        keywords: ['grid', 'extracted'],
        license: '',
        author: '',
        dimensions: {
          width: Math.round(pos.width),
          height: Math.round(pos.height)
        },
        fileSize: new Blob([iconSVG]).size,
      });
    });
    
    console.log(`Grid extraction found ${gridIcons.length} icons`);
    return gridIcons;
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
    
    // Try smart detection first
    setCurrentStrategy('Analyzing SVG structure and detecting complete icons...');
    extractedIcons = extractActualIcons(svgContent, fileName);
    
    // If that doesn't work well, try grid-based extraction
    if (extractedIcons.length < 5) {
      setCurrentStrategy('Smart detection found few icons, trying grid extraction...');
      console.log("Smart detection found few icons, trying grid extraction...");
      const gridIcons = extractIconsFromGrid(svgContent, fileName);
      extractedIcons = [...extractedIcons, ...gridIcons];
    }
    
    // Remove duplicates based on position
    const uniqueIcons = extractedIcons.filter((icon, index, array) => {
      return array.findIndex(other => {
        const xDiff = Math.abs((other.dimensions?.width || 0) - (icon.dimensions?.width || 0));
        const yDiff = Math.abs((other.dimensions?.height || 0) - (icon.dimensions?.height || 0));
        return xDiff < 5 && yDiff < 5;
      }) === index;
    });
    
    console.log(`Final result: ${uniqueIcons.length} unique icons extracted`);
    
    // Enhanced debug logging for complete icons
    console.log("=== COMPLETE ICON DEBUG INFO ===");
    uniqueIcons.slice(0, 3).forEach((icon, index) => {
      console.log(`Complete Icon ${index} (${icon.name}):`);
      console.log("SVG Content:", icon.svgContent);
      console.log("Content length:", icon.svgContent?.length);
      console.log("ViewBox:", icon.svgContent?.match(/viewBox="([^"]+)"/)?.[1]);
      console.log("Has complete structure:", icon.svgContent?.includes('<svg') && icon.svgContent?.includes('</svg>'));
      console.log("---");
    });
    
    return uniqueIcons;
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
        
        console.log(`SUCCESS: Extracted ${extractedIcons.length} complete icons from ${file.name}`);
        allIcons.push(...extractedIcons);
        setProcessedFiles(i + 1);
        
        setExtractionStats(prev => [...prev, `${file.name}: ${extractedIcons.length} complete icons extracted`]);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        setExtractionStats(prev => [...prev, `${file.name}: Processing error - ${error}`]);
      }
    }

    console.log(`\n=== ALL FILES PROCESSED WITH IMPROVED LOGIC ===`);
    console.log(`Total complete icons extracted: ${allIcons.length}`);
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
            {currentStrategy || 'Analyzing SVG structure to find complete icons...'}
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
