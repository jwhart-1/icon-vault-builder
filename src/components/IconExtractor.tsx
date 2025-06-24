
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
    
    // Limit SVG content size to prevent memory issues
    if (svgContent.length > 5000000) { // 5MB limit
      console.error('SVG file too large:', fileName);
      return [];
    }
    
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

    // Function to create an icon from an element
    const createIcon = (element: Element, index: number, elementType: string): ExtractedIcon => {
      try {
        const svgWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        
        // Get dimensions from viewBox or default
        const rootViewBox = rootSvg.getAttribute('viewBox');
        let width = 24, height = 24;
        
        if (rootViewBox) {
          const [, , w, h] = rootViewBox.split(' ').map(Number);
          width = w || 24;
          height = h || 24;
        }

        svgWrapper.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svgWrapper.setAttribute('width', width.toString());
        svgWrapper.setAttribute('height', height.toString());
        svgWrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        // Clone the element
        const clonedElement = element.cloneNode(true) as Element;
        
        // Ensure visibility for extracted icons
        const allPaths = clonedElement.querySelectorAll('path, circle, rect, polygon, line, ellipse');
        allPaths.forEach(path => {
          if (!path.getAttribute('fill') && !path.getAttribute('stroke')) {
            path.setAttribute('fill', 'currentColor');
          }
          if (path.getAttribute('fill') === 'none' && !path.getAttribute('stroke')) {
            path.setAttribute('stroke', 'currentColor');
            path.setAttribute('stroke-width', '1');
          }
        });
        
        svgWrapper.appendChild(clonedElement);

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgWrapper);

        // Validate the SVG
        if (svgString.length < 100 || svgString.length > 50000) {
          console.warn(`Icon ${index} invalid size, skipping`);
          return null;
        }

        console.log(`Created icon ${index + 1} from ${elementType}`, {
          contentLength: svgString.length,
          hasViewBox: svgString.includes('viewBox'),
          dimensions: { width, height }
        });

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
      } catch (error) {
        console.error(`Error creating icon ${index}:`, error);
        return null;
      }
    };

    // Look for different types of icon containers with limits
    const MAX_ICONS_PER_TYPE = 50; // Prevent processing too many elements
    
    // Priority 1: Extract symbols
    const symbols = Array.from(rootSvg.querySelectorAll('symbol')).slice(0, MAX_ICONS_PER_TYPE);
    console.log('Found symbols:', symbols.length);
    
    if (symbols.length > 0) {
      symbols.forEach((symbol, index) => {
        const icon = createIcon(symbol, index, 'symbol');
        if (icon) icons.push(icon);
      });
    }

    // Priority 2: Extract from groups if no symbols found
    if (icons.length === 0) {
      const groups = Array.from(rootSvg.querySelectorAll('g')).slice(0, MAX_ICONS_PER_TYPE);
      console.log('Found groups:', groups.length);
      
      groups.forEach((group, index) => {
        // Skip groups that are just containers
        const hasVisualContent = group.querySelector('path, circle, rect, polygon, polyline, ellipse, line');
        if (hasVisualContent) {
          const icon = createIcon(group, index, 'group');
          if (icon) icons.push(icon);
        }
      });
    }

    // Priority 3: Extract individual paths if no groups found
    if (icons.length === 0) {
      const paths = Array.from(rootSvg.querySelectorAll('path')).slice(0, MAX_ICONS_PER_TYPE);
      console.log('Found paths:', paths.length);
      
      paths.forEach((path, index) => {
        const icon = createIcon(path, index, 'path');
        if (icon) icons.push(icon);
      });
    }

    // Last resort: treat entire SVG as one icon
    if (icons.length === 0) {
      console.log('No individual elements found, treating entire SVG as one icon');
      try {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(rootSvg);
        
        if (svgString.length < 50000) { // Only if not too large
          const rootViewBox = rootSvg.getAttribute('viewBox');
          let width = 24, height = 24;
          
          if (rootViewBox) {
            const [, , w, h] = rootViewBox.split(' ').map(Number);
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
      } catch (error) {
        console.error('Error creating full SVG icon:', error);
      }
    }

    console.log(`Extracted ${icons.length} icons from ${fileName}`);
    return icons.slice(0, 100); // Limit total icons to prevent memory issues
  };

  const processFiles = async () => {
    setIsProcessing(true);
    setProcessedFiles(0);
    const allIcons: ExtractedIcon[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);
      
      try {
        // Limit file size
        if (file.size > 10000000) { // 10MB limit
          console.error(`File ${file.name} too large, skipping`);
          continue;
        }
        
        const content = await file.text();
        console.log(`File content length: ${content.length}`);
        
        const extractedIcons = extractIconsFromSvg(content, file.name);
        allIcons.push(...extractedIcons);
        setProcessedFiles(i + 1);
        
        // Small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 100));
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
