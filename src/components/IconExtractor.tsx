
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

    // Function to create an icon from an SVG element
    const createIcon = (element: Element, index: number, elementType: string): ExtractedIcon => {
      const svgWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      // Get dimensions from viewBox or width/height
      const rootSvg = doc.querySelector('svg');
      const viewBox = rootSvg?.getAttribute('viewBox') || element.getAttribute('viewBox');
      let width = 24, height = 24;
      
      if (viewBox) {
        const [, , w, h] = viewBox.split(' ').map(Number);
        width = w || 24;
        height = h || 24;
        svgWrapper.setAttribute('viewBox', viewBox);
      } else {
        const w = rootSvg?.getAttribute('width') || element.getAttribute('width');
        const h = rootSvg?.getAttribute('height') || element.getAttribute('height');
        if (w && h) {
          width = parseFloat(w) || 24;
          height = parseFloat(h) || 24;
        }
        svgWrapper.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }

      svgWrapper.setAttribute('width', width.toString());
      svgWrapper.setAttribute('height', height.toString());
      svgWrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      // Copy any necessary attributes from the root SVG
      if (rootSvg) {
        const attributesToCopy = ['fill', 'stroke', 'stroke-width', 'style'];
        attributesToCopy.forEach(attr => {
          const value = rootSvg.getAttribute(attr);
          if (value && !svgWrapper.getAttribute(attr)) {
            svgWrapper.setAttribute(attr, value);
          }
        });
      }
      
      // Clone the element to avoid modifying the original
      const clonedElement = element.cloneNode(true) as Element;
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

    // Check if the SVG is already a single icon
    const rootSvg = doc.querySelector('svg');
    if (rootSvg) {
      console.log('Found root SVG element');
      
      const symbols = rootSvg.querySelectorAll('symbol');
      const groups = rootSvg.querySelectorAll('g');
      const paths = rootSvg.querySelectorAll('path');
      const circles = rootSvg.querySelectorAll('circle');
      const rects = rootSvg.querySelectorAll('rect');
      const polygons = rootSvg.querySelectorAll('polygon');
      const polylines = rootSvg.querySelectorAll('polyline');
      const ellipses = rootSvg.querySelectorAll('ellipse');
      const lines = rootSvg.querySelectorAll('line');

      console.log('Found elements:', {
        symbols: symbols.length,
        groups: groups.length,
        paths: paths.length,
        circles: circles.length,
        rects: rects.length,
        polygons: polygons.length,
        polylines: polylines.length,
        ellipses: ellipses.length,
        lines: lines.length
      });

      let extractedCount = 0;

      // If it has symbols, extract each symbol as an icon
      if (symbols.length > 0) {
        symbols.forEach((symbol, index) => {
          const icon = createIcon(symbol, index, 'symbol');
          icons.push(icon);
          extractedCount++;
        });
      }
      // If it has multiple groups, treat each as a potential icon
      else if (groups.length > 1) {
        groups.forEach((group, index) => {
          // Skip groups that are just containers with no visible content
          const hasContent = group.querySelector('path, circle, rect, polygon, polyline, ellipse, line');
          if (hasContent) {
            const icon = createIcon(group, index, 'group');
            icons.push(icon);
            extractedCount++;
          }
        });
      }
      // Extract individual shape elements
      else {
        // Extract paths
        if (paths.length > 0) {
          paths.forEach((path, index) => {
            const icon = createIcon(path, index, 'path');
            icons.push(icon);
            extractedCount++;
          });
        }
        
        // Extract other shapes
        [...circles, ...rects, ...polygons, ...polylines, ...ellipses, ...lines].forEach((element, index) => {
          const icon = createIcon(element, index, element.tagName.toLowerCase());
          icons.push(icon);
          extractedCount++;
        });
      }

      // If no individual elements found, treat the entire SVG as one icon
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
        } else {
          const w = rootSvg.getAttribute('width');
          const h = rootSvg.getAttribute('height');
          if (w && h) {
            width = parseFloat(w) || 24;
            height = parseFloat(h) || 24;
          }
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
          Extracting icons from your uploaded files...
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
