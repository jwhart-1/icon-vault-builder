
import React, { useEffect, useState } from 'react';
import { ExtractedIcon } from './SvgIconManager';
import { Loader2 } from 'lucide-react';

interface IconExtractorProps {
  files: File[];
  onIconsExtracted: (icons: ExtractedIcon[]) => void;
}

export const IconExtractor: React.FC<IconExtractorProps> = ({
  files,
  onIconsExtracted,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState(0);

  useEffect(() => {
    if (files.length > 0) {
      processFiles();
    }
  }, [files]);

  const extractIconsFromSvg = (svgContent: string, fileName: string): ExtractedIcon[] => {
    console.log('Processing SVG file:', fileName);
    console.log('SVG content length:', svgContent.length);
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const icons: ExtractedIcon[] = [];

    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.error('SVG parsing error:', parserError.textContent);
      return icons;
    }

    const rootSvg = doc.querySelector('svg');
    if (!rootSvg) {
      console.error('No root SVG element found');
      return icons;
    }

    console.log('Found root SVG element');

    // Function to calculate bounding box of an element
    const getBoundingBox = (element: Element) => {
      // Try to get explicit x, y, width, height
      const x = parseFloat(element.getAttribute('x') || '0');
      const y = parseFloat(element.getAttribute('y') || '0');
      const width = parseFloat(element.getAttribute('width') || '0');
      const height = parseFloat(element.getAttribute('height') || '0');
      
      if (width > 0 && height > 0) {
        return { x, y, width, height };
      }

      // For paths and other elements, try to extract from viewBox or calculate bounds
      const viewBox = element.getAttribute('viewBox');
      if (viewBox) {
        const [vx, vy, vw, vh] = viewBox.split(' ').map(Number);
        return { x: vx, y: vy, width: vw, height: vh };
      }

      // Default bounds if we can't determine
      return { x: 0, y: 0, width: 24, height: 24 };
    };

    // Function to create an icon from an element
    const createIcon = (element: Element, index: number, elementType: string, bounds?: any): ExtractedIcon => {
      const svgWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      // Get dimensions
      const rootViewBox = rootSvg.getAttribute('viewBox');
      let width = 24, height = 24;
      
      if (bounds) {
        width = bounds.width;
        height = bounds.height;
        svgWrapper.setAttribute('viewBox', `0 0 ${width} ${height}`);
      } else if (rootViewBox) {
        const [, , w, h] = rootViewBox.split(' ').map(Number);
        width = w || 24;
        height = h || 24;
        svgWrapper.setAttribute('viewBox', `0 0 ${width} ${height}`);
      } else {
        svgWrapper.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }

      svgWrapper.setAttribute('width', width.toString());
      svgWrapper.setAttribute('height', height.toString());
      svgWrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      // Copy style attributes from root SVG
      const stylesToCopy = ['fill', 'stroke', 'stroke-width', 'fill-rule', 'clip-rule', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit'];
      stylesToCopy.forEach(attr => {
        const value = rootSvg.getAttribute(attr) || element.getAttribute(attr);
        if (value) {
          svgWrapper.setAttribute(attr, value);
        }
      });

      // Copy style attribute if present
      const rootStyle = rootSvg.getAttribute('style');
      const elementStyle = element.getAttribute('style');
      if (rootStyle || elementStyle) {
        svgWrapper.setAttribute('style', [rootStyle, elementStyle].filter(Boolean).join('; '));
      }
      
      // Clone the element
      const clonedElement = element.cloneNode(true) as Element;
      
      // If the element has a transform, we might need to adjust it
      if (bounds && (bounds.x !== 0 || bounds.y !== 0)) {
        const existingTransform = clonedElement.getAttribute('transform') || '';
        const translateTransform = `translate(${-bounds.x}, ${-bounds.y})`;
        clonedElement.setAttribute('transform', 
          existingTransform ? `${translateTransform} ${existingTransform}` : translateTransform
        );
      }
      
      svgWrapper.appendChild(clonedElement);

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgWrapper);

      console.log(`Created icon ${index + 1} from ${elementType}:`, svgString.substring(0, 200) + '...');

      return {
        id: `${fileName.replace('.svg', '')}-${elementType}-${index}-${Date.now()}`,
        svgContent: svgString,
        name: `${fileName.replace('.svg', '')}-${elementType}-${index + 1}`,
        category: '',
        description: '',
        keywords: [],
        license: '',
        author: '',
        dimensions: { width, height },
        fileSize: new Blob([svgString]).size,
      };
    };

    // Look for different types of icon containers
    const symbols = rootSvg.querySelectorAll('symbol');
    const defs = rootSvg.querySelectorAll('defs > *');
    const groups = rootSvg.querySelectorAll('g');
    const uses = rootSvg.querySelectorAll('use');
    
    console.log('Found elements:', {
      symbols: symbols.length,
      defs: defs.length,
      groups: groups.length,
      uses: uses.length
    });

    let extractedCount = 0;

    // Priority 1: Extract symbols (most common in icon libraries)
    if (symbols.length > 0) {
      console.log('Extracting from symbols');
      symbols.forEach((symbol, index) => {
        const bounds = getBoundingBox(symbol);
        const icon = createIcon(symbol, index, 'symbol', bounds);
        icons.push(icon);
        extractedCount++;
      });
    }

    // Priority 2: Extract from defs (definitions)
    if (extractedCount === 0 && defs.length > 0) {
      console.log('Extracting from defs');
      defs.forEach((def, index) => {
        // Skip if it's just a style or other non-visual element
        if (['style', 'clipPath', 'mask', 'filter', 'linearGradient', 'radialGradient'].includes(def.tagName.toLowerCase())) {
          return;
        }
        const bounds = getBoundingBox(def);
        const icon = createIcon(def, index, 'def', bounds);
        icons.push(icon);
        extractedCount++;
      });
    }

    // Priority 3: Extract meaningful groups
    if (extractedCount === 0 && groups.length > 1) {
      console.log('Extracting from groups');
      groups.forEach((group, index) => {
        // Skip groups that are just containers or have IDs suggesting they're not individual icons
        const groupId = group.getAttribute('id') || '';
        const hasVisualContent = group.querySelector('path, circle, rect, polygon, polyline, ellipse, line, use');
        
        if (hasVisualContent && !groupId.includes('layer') && !groupId.includes('background')) {
          const bounds = getBoundingBox(group);
          const icon = createIcon(group, index, 'group', bounds);
          icons.push(icon);
          extractedCount++;
        }
      });
    }

    // Priority 4: Look for use elements (references to symbols/defs)
    if (uses.length > 0) {
      console.log('Processing use elements');
      uses.forEach((use, index) => {
        const href = use.getAttribute('href') || use.getAttribute('xlink:href');
        if (href) {
          // Find the referenced element
          const referencedId = href.replace('#', '');
          const referenced = doc.getElementById(referencedId);
          if (referenced) {
            const bounds = getBoundingBox(use);
            const icon = createIcon(referenced, index, 'use', bounds);
            icons.push(icon);
            extractedCount++;
          }
        }
      });
    }

    // Priority 5: Extract individual shape elements if no other structure found
    if (extractedCount === 0) {
      console.log('Extracting individual shapes');
      const shapes = rootSvg.querySelectorAll('path, circle, rect, polygon, polyline, ellipse, line');
      
      shapes.forEach((shape, index) => {
        const bounds = getBoundingBox(shape);
        const icon = createIcon(shape, index, shape.tagName.toLowerCase(), bounds);
        icons.push(icon);
        extractedCount++;
      });
    }

    // Last resort: treat entire SVG as one icon
    if (extractedCount === 0) {
      console.log('No individual elements found, treating entire SVG as one icon');
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(rootSvg);
      
      const viewBox = rootSvg.getAttribute('viewBox');
      let width = 24, height = 24;
      
      if (viewBox) {
        const [, , w, h] = viewBox.split(' ').map(Number);
        width = w || 24;
        height = h || 24;
      }

      icons.push({
        id: `${fileName.replace('.svg', '')}-full-${Date.now()}`,
        svgContent: svgString,
        name: fileName.replace('.svg', ''),
        category: '',
        description: '',
        keywords: [],
        license: '',
        author: '',
        dimensions: { width, height },
        fileSize: new Blob([svgString]).size,
      });
    }

    console.log(`Extracted ${icons.length} icons from ${fileName}`);
    return icons;
  };

  const processFiles = async () => {
    setIsProcessing(true);
    setProcessedFiles(0);
    const allIcons: ExtractedIcon[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);
      
      try {
        const content = await file.text();
        console.log(`File content length: ${content.length}`);
        
        const extractedIcons = extractIconsFromSvg(content, file.name);
        allIcons.push(...extractedIcons);
        setProcessedFiles(i + 1);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    console.log(`Total icons extracted: ${allIcons.length}`);
    setIsProcessing(false);
    onIconsExtracted(allIcons);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          Processing SVG Files
        </h3>
        <p className="text-slate-500 mb-4">
          Extracting individual icons from your sprite sheet...
        </p>
        <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(processedFiles / files.length) * 100}%` }}
          ></div>
        </div>
        <p className="text-sm text-slate-600">
          {processedFiles} of {files.length} files processed
        </p>
      </div>
    </div>
  );
};
