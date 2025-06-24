
import React, { useEffect, useState } from 'react';
import { ExtractedIcon } from './SvgIconManager';
import { Loader2 } from 'lucide-react';

interface AdvancedIconExtractorProps {
  files: File[];
  onIconsExtracted: (icons: ExtractedIcon[]) => void;
}

export const AdvancedIconExtractor: React.FC<AdvancedIconExtractorProps> = ({
  files,
  onIconsExtracted,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState(0);
  const [currentStrategy, setCurrentStrategy] = useState('');

  useEffect(() => {
    if (files.length > 0) {
      processFiles();
    }
  }, [files]);

  const detectGridPattern = (elements: Element[], svgContainer: SVGElement): ExtractedIcon[] => {
    console.log('Detecting grid pattern...');
    const positions: Array<{element: Element, x: number, y: number, width: number, height: number}> = [];
    
    elements.forEach(el => {
      try {
        const bbox = (el as any).getBBox ? (el as any).getBBox() : { x: 0, y: 0, width: 20, height: 20 };
        positions.push({
          element: el,
          x: bbox.x || 0,
          y: bbox.y || 0,
          width: bbox.width || 20,
          height: bbox.height || 20
        });
      } catch (error) {
        // Fallback for elements that don't support getBBox
        positions.push({
          element: el,
          x: 0,
          y: 0,
          width: 20,
          height: 20
        });
      }
    });

    // Group by approximate Y positions (rows)
    const rows: { [key: number]: typeof positions } = {};
    positions.forEach(pos => {
      const rowKey = Math.round(pos.y / 50) * 50; // Group by 50px rows
      if (!rows[rowKey]) rows[rowKey] = [];
      rows[rowKey].push(pos);
    });

    const gridIcons: ExtractedIcon[] = [];
    Object.values(rows).forEach((row, rowIndex) => {
      row.sort((a, b) => a.x - b.x); // Sort by X position
      row.forEach((item, colIndex) => {
        if (item.element && item.element.outerHTML) {
          const svgWrapper = createIndividualSVG(item.element.outerHTML, svgContainer);
          if (svgWrapper) {
            gridIcons.push({
              id: `grid-${Date.now()}-${rowIndex}-${colIndex}`,
              svgContent: svgWrapper,
              name: `grid-icon-${rowIndex}-${colIndex}`,
              category: '',
              description: '',
              keywords: [],
              license: '',
              author: '',
              dimensions: { width: item.width, height: item.height },
              fileSize: new Blob([svgWrapper]).size,
            });
          }
        }
      });
    });

    return gridIcons.slice(0, 50); // Limit grid icons
  };

  const createIndividualSVG = (iconContent: string, originalSvg: SVGElement): string => {
    try {
      const viewBox = originalSvg.getAttribute('viewBox') || '0 0 100 100';
      const width = originalSvg.getAttribute('width') || '100';
      const height = originalSvg.getAttribute('height') || '100';
      
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">
        ${iconContent}
      </svg>`;
    } catch (error) {
      console.error('Error creating individual SVG:', error);
      return '';
    }
  };

  const extractIconsAdvanced = (svgContent: string, fileName: string): ExtractedIcon[] => {
    console.log(`Advanced extraction for: ${fileName}`);
    setCurrentStrategy('Parsing SVG structure...');
    
    if (svgContent.length > 5000000) {
      console.error('SVG file too large:', fileName);
      return [];
    }

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

    // Strategy 1: Look for <symbol> elements
    setCurrentStrategy('Extracting symbols...');
    const symbols = Array.from(svgElement.querySelectorAll('symbol')).slice(0, 50);
    console.log(`Found ${symbols.length} symbols`);
    
    if (symbols.length > 0) {
      symbols.forEach((symbol, index) => {
        try {
          const svgWrapper = createIndividualSVG(symbol.outerHTML, svgElement);
          if (svgWrapper) {
            icons.push({
              id: `${fileName}-symbol-${index}-${Date.now()}`,
              svgContent: svgWrapper,
              name: symbol.getAttribute('id') || `${fileName}-symbol-${index + 1}`,
              category: '',
              description: '',
              keywords: [],
              license: '',
              author: '',
              dimensions: { width: 24, height: 24 },
              fileSize: new Blob([svgWrapper]).size,
            });
          }
        } catch (error) {
          console.error(`Error processing symbol ${index}:`, error);
        }
      });
    }

    // Strategy 2: Look for <defs> with groups
    if (icons.length === 0) {
      setCurrentStrategy('Extracting definitions...');
      const defsGroups = Array.from(svgElement.querySelectorAll('defs > g')).slice(0, 50);
      console.log(`Found ${defsGroups.length} definition groups`);
      
      defsGroups.forEach((group, index) => {
        try {
          const svgWrapper = createIndividualSVG(group.outerHTML, svgElement);
          if (svgWrapper) {
            icons.push({
              id: `${fileName}-def-${index}-${Date.now()}`,
              svgContent: svgWrapper,
              name: group.getAttribute('id') || `${fileName}-def-${index + 1}`,
              category: '',
              description: '',
              keywords: [],
              license: '',
              author: '',
              dimensions: { width: 24, height: 24 },
              fileSize: new Blob([svgWrapper]).size,
            });
          }
        } catch (error) {
          console.error(`Error processing def group ${index}:`, error);
        }
      });
    }

    // Strategy 3: Look for direct child groups
    if (icons.length === 0) {
      setCurrentStrategy('Extracting groups...');
      const groups = Array.from(svgElement.querySelectorAll('svg > g')).slice(0, 50);
      console.log(`Found ${groups.length} direct groups`);
      
      groups.forEach((group, index) => {
        const childElements = group.children.length;
        if (childElements > 0 && childElements < 50) {
          try {
            const svgWrapper = createIndividualSVG(group.outerHTML, svgElement);
            if (svgWrapper) {
              icons.push({
                id: `${fileName}-group-${index}-${Date.now()}`,
                svgContent: svgWrapper,
                name: group.getAttribute('id') || `${fileName}-group-${index + 1}`,
                category: '',
                description: '',
                keywords: [],
                license: '',
                author: '',
                dimensions: { width: 24, height: 24 },
                fileSize: new Blob([svgWrapper]).size,
              });
            }
          } catch (error) {
            console.error(`Error processing group ${index}:`, error);
          }
        }
      });
    }

    // Strategy 4: Look for <use> elements referencing symbols
    if (icons.length === 0) {
      setCurrentStrategy('Extracting use elements...');
      const useElements = Array.from(svgElement.querySelectorAll('use')).slice(0, 50);
      console.log(`Found ${useElements.length} use elements`);
      
      useElements.forEach((useEl, index) => {
        try {
          const href = useEl.getAttribute('href') || useEl.getAttribute('xlink:href');
          if (href) {
            const svgWrapper = createIndividualSVG(useEl.outerHTML, svgElement);
            if (svgWrapper) {
              icons.push({
                id: `${fileName}-use-${index}-${Date.now()}`,
                svgContent: svgWrapper,
                name: `${fileName}-use-${href.replace('#', '')}-${index + 1}`,
                category: '',
                description: '',
                keywords: [],
                license: '',
                author: '',
                dimensions: { width: 24, height: 24 },
                fileSize: new Blob([svgWrapper]).size,
              });
            }
          }
        } catch (error) {
          console.error(`Error processing use element ${index}:`, error);
        }
      });
    }

    // Strategy 5: Grid-based extraction
    if (icons.length < 5) {
      setCurrentStrategy('Detecting grid patterns...');
      const allElements = Array.from(svgElement.querySelectorAll('g, path, circle, rect, polygon, ellipse')).slice(0, 100);
      const gridIcons = detectGridPattern(allElements, svgElement);
      icons.push(...gridIcons);
    }

    // Strategy 6: Extract individual shapes if nothing else worked
    if (icons.length === 0) {
      setCurrentStrategy('Extracting individual paths...');
      const paths = Array.from(svgElement.querySelectorAll('path, circle, rect, polygon, ellipse')).slice(0, 50);
      console.log(`Found ${paths.length} individual shapes`);
      
      paths.forEach((path, index) => {
        try {
          const svgWrapper = createIndividualSVG(path.outerHTML, svgElement);
          if (svgWrapper) {
            icons.push({
              id: `${fileName}-path-${index}-${Date.now()}`,
              svgContent: svgWrapper,
              name: `${fileName}-path-${index + 1}`,
              category: '',
              description: '',
              keywords: [],
              license: '',
              author: '',
              dimensions: { width: 24, height: 24 },
              fileSize: new Blob([svgWrapper]).size,
            });
          }
        } catch (error) {
          console.error(`Error processing path ${index}:`, error);
        }
      });
    }

    // Last resort: entire SVG as one icon
    if (icons.length === 0) {
      setCurrentStrategy('Using entire SVG...');
      try {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        
        if (svgString.length < 50000) {
          icons.push({
            id: `${fileName}-full-${Date.now()}`,
            svgContent: svgString,
            name: fileName.replace('.svg', ''),
            category: '',
            description: '',
            keywords: [],
            license: '',
            author: '',
            dimensions: { width: 100, height: 100 },
            fileSize: new Blob([svgString]).size,
          });
        }
      } catch (error) {
        console.error('Error creating full SVG icon:', error);
      }
    }

    console.log(`Extracted ${icons.length} icons from ${fileName}`);
    return icons.slice(0, 100); // Limit total icons
  };

  const processFiles = async () => {
    setIsProcessing(true);
    setProcessedFiles(0);
    const allIcons: ExtractedIcon[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);
      
      try {
        if (file.size > 10000000) {
          console.error(`File ${file.name} too large, skipping`);
          continue;
        }
        
        const content = await file.text();
        const extractedIcons = extractIconsAdvanced(content, file.name);
        allIcons.push(...extractedIcons);
        setProcessedFiles(i + 1);
        
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    console.log(`Total icons extracted: ${allIcons.length}`);
    setIsProcessing(false);
    setCurrentStrategy('');
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
          {currentStrategy || 'Extracting individual icons from your files...'}
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
