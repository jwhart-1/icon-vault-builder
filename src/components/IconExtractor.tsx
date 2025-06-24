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
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const icons: ExtractedIcon[] = [];

    // Function to create an icon from an SVG element
    const createIcon = (element: Element, index: number): ExtractedIcon => {
      const svgWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      // Get dimensions from viewBox or width/height
      const viewBox = element.getAttribute('viewBox');
      let width = 24, height = 24;
      
      if (viewBox) {
        const [, , w, h] = viewBox.split(' ').map(Number);
        width = w;
        height = h;
        svgWrapper.setAttribute('viewBox', viewBox);
      } else {
        const w = element.getAttribute('width');
        const h = element.getAttribute('height');
        if (w && h) {
          width = parseFloat(w);
          height = parseFloat(h);
        }
      }

      svgWrapper.setAttribute('width', width.toString());
      svgWrapper.setAttribute('height', height.toString());
      svgWrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      // Clone the element to avoid modifying the original
      const clonedElement = element.cloneNode(true) as Element;
      svgWrapper.appendChild(clonedElement);

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgWrapper);

      return {
        id: `${fileName.replace('.svg', '')}-${index}-${Date.now()}`,
        svgContent: svgString,
        name: `${fileName.replace('.svg', '')}-icon-${index + 1}`,
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
      const paths = rootSvg.querySelectorAll('path');
      const groups = rootSvg.querySelectorAll('g');
      const circles = rootSvg.querySelectorAll('circle');
      const rects = rootSvg.querySelectorAll('rect');
      const symbols = rootSvg.querySelectorAll('symbol');

      // If it has symbols, extract each symbol as an icon
      if (symbols.length > 0) {
        symbols.forEach((symbol, index) => {
          const icon = createIcon(symbol, index);
          icons.push(icon);
        });
      }
      // If it has multiple groups, treat each as a potential icon
      else if (groups.length > 1) {
        groups.forEach((group, index) => {
          const icon = createIcon(group, index);
          icons.push(icon);
        });
      }
      // If it has multiple paths, create individual icons
      else if (paths.length > 1) {
        paths.forEach((path, index) => {
          const icon = createIcon(path, index);
          icons.push(icon);
        });
      }
      // Otherwise, treat the entire SVG as one icon
      else {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(rootSvg);
        
        const viewBox = rootSvg.getAttribute('viewBox');
        let width = 24, height = 24;
        
        if (viewBox) {
          const [, , w, h] = viewBox.split(' ').map(Number);
          width = w;
          height = h;
        }

        icons.push({
          id: `${fileName.replace('.svg', '')}-${Date.now()}`,
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

    return icons;
  };

  const processFiles = async () => {
    setIsProcessing(true);
    setProcessedFiles(0);
    const allIcons: ExtractedIcon[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const content = await file.text();
        const extractedIcons = extractIconsFromSvg(content, file.name);
        allIcons.push(...extractedIcons);
        setProcessedFiles(i + 1);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

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
