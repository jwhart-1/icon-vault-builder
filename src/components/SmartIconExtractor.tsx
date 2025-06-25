
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

  const createIconFromPath = (pathElement: Element, index: number, fileName: string, svgViewBox: string): ExtractedIcon | null => {
    try {
      const pathData = pathElement.getAttribute('d');
      if (!pathData || pathData.length < 10) {
        console.warn(`Path ${index} has insufficient data`);
        return null;
      }

      // Create a proper SVG wrapper for the path
      const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${svgViewBox}" width="100" height="100" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="${pathData}" fill="#000000"/>
</svg>`;

      const extractedIcon: ExtractedIcon = {
        type: 'extracted',
        id: `${fileName}-path-${index}-${Date.now()}`,
        svgContent: iconSVG,
        name: `${fileName.replace('.svg', '')} Icon ${index + 1}`,
        category: 'Extracted Path',
        description: `Path extracted from ${fileName}`,
        keywords: ['extracted', 'path', fileName.replace('.svg', '').toLowerCase()],
        license: '',
        author: '',
        dimensions: { width: 100, height: 100 },
        fileSize: new Blob([iconSVG]).size,
      };

      console.log(`✅ Created path icon ${index + 1}:`, extractedIcon.name);
      return extractedIcon;
    } catch (error) {
      console.error(`❌ Error creating path icon ${index}:`, error);
      return null;
    }
  };

  const extractIconsFromSVG = async (svgContent: string, fileName: string): Promise<ExtractedIcon[]> => {
    console.log("=== STARTING IMPROVED ICON EXTRACTION ===");
    console.log("File name:", fileName);
    console.log("SVG content length:", svgContent.length);
    
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    
    const parseError = svgDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Invalid SVG file format');
    }

    const svgElement = svgDoc.querySelector('svg');
    if (!svgElement) {
      throw new Error('No SVG element found');
    }

    const extractedIcons: ExtractedIcon[] = [];
    
    // Get viewBox or create one from width/height
    let viewBox = svgElement.getAttribute('viewBox') || '0 0 100 100';
    if (!svgElement.getAttribute('viewBox')) {
      const width = svgElement.getAttribute('width') || '100';
      const height = svgElement.getAttribute('height') || '100';
      viewBox = `0 0 ${width} ${height}`;
    }

    console.log(`Using viewBox: ${viewBox}`);

    // Strategy 1: Try to extract from groups first
    setCurrentStrategy('Looking for grouped icons...');
    const groups = svgElement.querySelectorAll('g');
    console.log(`Found ${groups.length} groups`);

    if (groups.length > 0) {
      let groupIcons = 0;
      groups.forEach((group, index) => {
        const pathsInGroup = group.querySelectorAll('path, circle, rect, polygon');
        if (pathsInGroup.length > 0 && pathsInGroup.length < 10) { // Reasonable group size
          try {
            const groupHTML = group.outerHTML;
            const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100" height="100" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  ${groupHTML}
</svg>`;

            extractedIcons.push({
              type: 'extracted',
              id: `${fileName}-group-${index}-${Date.now()}`,
              svgContent: iconSVG,
              name: `${fileName.replace('.svg', '')} Group ${index + 1}`,
              category: 'Extracted Group',
              description: `Group extracted from ${fileName}`,
              keywords: ['extracted', 'group', fileName.replace('.svg', '').toLowerCase()],
              license: '',
              author: '',
              dimensions: { width: 100, height: 100 },
              fileSize: new Blob([iconSVG]).size,
            });
            groupIcons++;
          } catch (error) {
            console.warn(`Failed to extract group ${index}:`, error);
          }
        }
      });
      console.log(`Extracted ${groupIcons} group icons`);
    }

    // Strategy 2: If no groups or few group icons, extract individual paths
    if (extractedIcons.length < 5) {
      setCurrentStrategy('Extracting individual path elements...');
      const paths = svgElement.querySelectorAll('path');
      console.log(`Found ${paths.length} path elements`);

      let pathIcons = 0;
      paths.forEach((path, index) => {
        if (pathIcons >= 50) return; // Limit to prevent too many icons
        
        const icon = createIconFromPath(path, index, fileName, viewBox);
        if (icon) {
          extractedIcons.push(icon);
          pathIcons++;
        }
      });
      console.log(`Extracted ${pathIcons} path icons`);
    }

    // Strategy 3: Extract other drawing elements if still low count
    if (extractedIcons.length < 10) {
      setCurrentStrategy('Extracting other drawing elements...');
      const otherElements = svgElement.querySelectorAll('circle, rect, polygon, line, ellipse');
      console.log(`Found ${otherElements.length} other drawing elements`);

      otherElements.forEach((element, index) => {
        if (extractedIcons.length >= 50) return;
        
        try {
          const elementHTML = element.outerHTML;
          const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100" height="100" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  ${elementHTML}
</svg>`;

          extractedIcons.push({
            type: 'extracted',
            id: `${fileName}-${element.tagName}-${index}-${Date.now()}`,
            svgContent: iconSVG,
            name: `${fileName.replace('.svg', '')} ${element.tagName} ${index + 1}`,
            category: 'Extracted Element',
            description: `${element.tagName} extracted from ${fileName}`,
            keywords: ['extracted', element.tagName.toLowerCase(), fileName.replace('.svg', '').toLowerCase()],
            license: '',
            author: '',
            dimensions: { width: 100, height: 100 },
            fileSize: new Blob([iconSVG]).size,
          });
        } catch (error) {
          console.warn(`Failed to extract ${element.tagName} ${index}:`, error);
        }
      });
    }

    console.log(`=== EXTRACTION COMPLETE: ${extractedIcons.length} icons extracted ===`);
    return extractedIcons;
  };

  const processFiles = async () => {
    setIsProcessing(true);
    setProcessedFiles(0);
    setExtractionStats([]);
    const allIcons: ExtractedIcon[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`\n=== PROCESSING FILE ${i + 1}/${files.length}: ${file.name} ===`);
      
      try {
        if (file.size > 10000000) {
          console.error(`File ${file.name} too large, skipping`);
          setExtractionStats(prev => [...prev, `${file.name}: File too large (>10MB)`]);
          continue;
        }
        
        const svgText = await file.text();
        console.log("File read successfully, length:", svgText.length);
        
        const extractedIcons = await extractIconsFromSVG(svgText, file.name);
        
        console.log(`SUCCESS: Extracted ${extractedIcons.length} icons from ${file.name}`);
        allIcons.push(...extractedIcons);
        setProcessedFiles(i + 1);
        
        setExtractionStats(prev => [...prev, `${file.name}: ${extractedIcons.length} icons extracted`]);
        
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
