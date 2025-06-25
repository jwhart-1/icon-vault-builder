
import React, { useState, useEffect } from 'react';
import { Search, Grid, List, Upload } from 'lucide-react';
import { ExtractedIcon } from './SvgIconManager';
import { useToast } from '@/hooks/use-toast';

interface IconifyBrowserProps {
  onIconSelected: (icon: ExtractedIcon) => void;
  uploadedFiles?: File[];
}

interface ProcessedIcon {
  id: string;
  name: string;
  svgContent: string;
  fileName: string;
  category: string;
}

export const IconifyBrowser: React.FC<IconifyBrowserProps> = ({ onIconSelected, uploadedFiles = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [icons, setIcons] = useState<ProcessedIcon[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    if (uploadedFiles.length > 0) {
      processUploadedFiles();
    }
  }, [uploadedFiles]);

  const extractIconsFromSvg = (svgContent: string, fileName: string): ProcessedIcon[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const icons: ProcessedIcon[] = [];

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.error('SVG parsing error:', parserError.textContent);
      return icons;
    }

    const rootSvg = doc.querySelector('svg');
    if (!rootSvg) {
      return icons;
    }

    const createIcon = (element: Element, index: number, elementType: string): ProcessedIcon | null => {
      try {
        const svgWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        
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
        
        const clonedElement = element.cloneNode(true) as Element;
        
        // Ensure visibility
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

        if (svgString.length < 100 || svgString.length > 50000) {
          return null;
        }

        return {
          id: `${fileName.replace('.svg', '')}-${elementType}-${index}-${Date.now()}`,
          name: `${fileName.replace('.svg', '')}-${elementType}-${index + 1}`,
          svgContent: svgString,
          fileName,
          category: elementType
        };
      } catch (error) {
        console.error(`Error creating icon ${index}:`, error);
        return null;
      }
    };

    // Extract symbols first
    const symbols = Array.from(rootSvg.querySelectorAll('symbol')).slice(0, 50);
    if (symbols.length > 0) {
      symbols.forEach((symbol, index) => {
        const icon = createIcon(symbol, index, 'symbol');
        if (icon) icons.push(icon);
      });
    }

    // Extract groups if no symbols
    if (icons.length === 0) {
      const groups = Array.from(rootSvg.querySelectorAll('g')).slice(0, 50);
      groups.forEach((group, index) => {
        const hasVisualContent = group.querySelector('path, circle, rect, polygon, polyline, ellipse, line');
        if (hasVisualContent) {
          const icon = createIcon(group, index, 'group');
          if (icon) icons.push(icon);
        }
      });
    }

    // Extract individual paths if no groups
    if (icons.length === 0) {
      const paths = Array.from(rootSvg.querySelectorAll('path')).slice(0, 50);
      paths.forEach((path, index) => {
        const icon = createIcon(path, index, 'path');
        if (icon) icons.push(icon);
      });
    }

    // Treat entire SVG as one icon if nothing else found
    if (icons.length === 0) {
      try {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(rootSvg);
        
        if (svgString.length < 50000) {
          const rootViewBox = rootSvg.getAttribute('viewBox');
          let width = 24, height = 24;
          
          if (rootViewBox) {
            const [, , w, h] = rootViewBox.split(' ').map(Number);
            width = w || 24;
            height = h || 24;
          }

          icons.push({
            id: `${fileName.replace('.svg', '')}-full-${Date.now()}`,
            name: fileName.replace('.svg', ''),
            svgContent: svgString,
            fileName,
            category: 'full'
          });
        }
      } catch (error) {
        console.error('Error creating full SVG icon:', error);
      }
    }

    return icons.slice(0, 100);
  };

  const processUploadedFiles = async () => {
    setLoading(true);
    const allIcons: ProcessedIcon[] = [];

    for (const file of uploadedFiles) {
      try {
        if (file.size > 10000000) continue; // Skip large files
        
        const content = await file.text();
        const extractedIcons = extractIconsFromSvg(content, file.name);
        allIcons.push(...extractedIcons);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    setIcons(allIcons);
    setLoading(false);
    
    if (allIcons.length > 0) {
      toast({
        title: 'Icons processed',
        description: `Found ${allIcons.length} icons in your uploaded files`,
      });
    }
  };

  const handleIconSelect = (icon: ProcessedIcon) => {
    const extractedIcon: ExtractedIcon = {
      id: icon.id,
      svgContent: icon.svgContent,
      name: icon.name,
      category: icon.fileName.replace('.svg', ''),
      description: `${icon.name} from ${icon.fileName}`,
      keywords: [icon.fileName.replace('.svg', ''), icon.category, icon.name],
      license: 'Custom Upload',
      author: 'User Upload',
      dimensions: { width: 24, height: 24 },
      fileSize: new Blob([icon.svgContent]).size,
    };

    onIconSelected(extractedIcon);
    
    toast({
      title: 'Icon selected',
      description: `${icon.name} has been added to your collection`,
    });
  };

  const filteredIcons = icons.filter(icon => {
    const matchesSearch = icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         icon.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFile = selectedFile === 'all' || icon.fileName === selectedFile;
    return matchesSearch && matchesFile;
  });

  const fileNames = Array.from(new Set(icons.map(icon => icon.fileName)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Browse Uploaded Icons</h2>
        <p className="text-slate-600">
          Browse and select icons from your uploaded SVG files
        </p>
      </div>

      {uploadedFiles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Files Uploaded</h3>
          <p className="text-slate-500">
            Upload SVG files first to browse and select individual icons
          </p>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* File Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Filter by File
                </label>
                <select
                  value={selectedFile}
                  onChange={(e) => setSelectedFile(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Files ({fileNames.length})</option>
                  {fileNames.map((fileName) => (
                    <option key={fileName} value={fileName}>
                      {fileName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Search Icons
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search icons..."
                    className="flex-1 p-2 border border-slate-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="px-4 py-2 bg-blue-600 text-white rounded-r-lg">
                    <Search className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* View Mode */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  View Mode
                </label>
                <div className="flex border border-slate-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 p-2 flex items-center justify-center ${
                      viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 p-2 flex items-center justify-center ${
                      viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* File Info */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-800">
                {uploadedFiles.length} SVG Files Uploaded
              </h3>
              <p className="text-sm text-slate-600">
                {icons.length} individual icons extracted and ready for selection
              </p>
            </div>
          </div>

          {/* Icons Display */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-500">Processing uploaded files...</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {filteredIcons.length} Icons Available
                  </h3>
                </div>

                {filteredIcons.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500">No icons found matching your criteria</p>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' 
                    ? 'grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4'
                    : 'space-y-2'
                  }>
                    {filteredIcons.map((icon) => (
                      <div
                        key={icon.id}
                        onClick={() => handleIconSelect(icon)}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          viewMode === 'grid'
                            ? 'bg-slate-50 rounded-lg p-4 text-center hover:bg-blue-50'
                            : 'bg-slate-50 rounded-lg p-3 flex items-center space-x-3 hover:bg-blue-50'
                        }`}
                      >
                        <div className={`flex items-center justify-center ${
                          viewMode === 'grid' ? 'mb-2' : ''
                        }`}>
                          <div 
                            dangerouslySetInnerHTML={{ __html: icon.svgContent }} 
                            className="h-6 w-6 text-slate-700" 
                          />
                        </div>
                        <div className={viewMode === 'grid' ? '' : 'flex-1'}>
                          <p className="text-xs font-medium text-slate-800 truncate">
                            {icon.name}
                          </p>
                          {viewMode === 'list' && (
                            <p className="text-xs text-slate-500">{icon.fileName}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
