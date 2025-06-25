
import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Search, Grid, List, Download, Eye, Heart, Plus, Upload } from 'lucide-react';
import { ExtractedIcon, UnifiedIcon } from './SvgIconManager';
import { useToast } from '@/hooks/use-toast';

interface IconifyBrowserProps {
  onIconSelected: (icon: any) => void;
  extractedIcons?: UnifiedIcon[];
}

interface ProcessedIcon {
  id: string;
  name: string;
  svgContent: string;
  fileName: string;
  category: string;
}

export const IconifyBrowser: React.FC<IconifyBrowserProps> = ({ 
  onIconSelected, 
  extractedIcons = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<'iconify' | 'uploaded'>('uploaded'); // Default to uploaded tab
  const { toast } = useToast();

  // Popular Iconify collections
  const popularCollections = [
    { id: 'all', name: 'All Collections' },
    { id: 'mdi', name: 'Material Design Icons' },
    { id: 'lucide', name: 'Lucide' },
    { id: 'heroicons', name: 'Heroicons' },
    { id: 'tabler', name: 'Tabler' },
    { id: 'carbon', name: 'Carbon' },
    { id: 'fluent', name: 'Fluent UI' },
    { id: 'ant-design', name: 'Ant Design' }
  ];

  // Search Iconify icons
  const searchIcons = async (query: string, collection: string = 'all') => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const collectionParam = collection !== 'all' ? `&prefix=${collection}` : '';
      const response = await fetch(
        `https://api.iconify.design/search?query=${encodeURIComponent(query)}${collectionParam}&limit=50`
      );
      const data = await response.json();
      setSearchResults(data.icons || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === 'iconify') {
      const debounceTimer = setTimeout(() => {
        searchIcons(searchTerm, selectedCollection);
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm, selectedCollection, currentTab]);

  // Fixed filtering logic for extracted icons
  const filteredExtractedIcons = currentTab === 'uploaded' 
    ? extractedIcons.filter(icon => {
        if (!searchTerm.trim()) return true; // Show all icons when no search term
        const matchesSearch = icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               icon.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
      })
    : [];

  const handleIconifyIconSelect = (iconName: string) => {
    const iconifyIcon = {
      type: 'iconify',
      id: `iconify-${iconName}-${Date.now()}`,
      name: iconName.split(':')[1] || iconName,
      iconifyName: iconName,
      collection: iconName.split(':')[0] || 'unknown',
      category: '',
      description: '',
      keywords: [],
      license: '',
      author: '',
    };

    onIconSelected(iconifyIcon);
    
    toast({
      title: 'Icon selected',
      description: `${iconifyIcon.name} has been added to your collection`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Browse Icon Libraries</h2>
        <p className="text-slate-600">
          Search and select icons from Iconify's massive collection or browse your uploaded icons
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setCurrentTab('iconify')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentTab === 'iconify'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Browse Iconify ({searchResults.length})
          </button>
          <button
            onClick={() => setCurrentTab('uploaded')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentTab === 'uploaded'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Browse Uploaded ({extractedIcons.length})
          </button>
        </nav>
      </div>

      {/* Search Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder={currentTab === 'iconify' ? "Search Iconify icons..." : "Search uploaded icons..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {currentTab === 'iconify' && (
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {popularCollections.map(collection => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {currentTab === 'iconify' && (
          <>
            {/* Iconify Search Results */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-500">Searching icons...</p>
              </div>
            )}

            {!isLoading && searchResults.length > 0 && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {searchResults.length} Icons Found
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {searchResults.map((iconName: string) => (
                    <div
                      key={iconName}
                      onClick={() => handleIconifyIconSelect(iconName)}
                      className="cursor-pointer transition-all duration-200 hover:shadow-md bg-slate-50 rounded-lg p-6 text-center hover:bg-blue-50"
                    >
                      <div className="flex items-center justify-center mb-4">
                        <Icon 
                          icon={iconName} 
                          width={256} 
                          height={256}
                          className="text-slate-700" 
                        />
                      </div>
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {iconName.split(':')[1] || iconName}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!isLoading && searchTerm && searchResults.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500">No Iconify icons found for "{searchTerm}"</p>
              </div>
            )}

            {!searchTerm && (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Search Iconify Icons</h3>
                <p className="text-slate-500">
                  Enter a search term to find icons from Iconify's collection
                </p>
              </div>
            )}
          </>
        )}

        {currentTab === 'uploaded' && (
          <>
            {/* Uploaded Icons Grid */}
            {filteredExtractedIcons.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {filteredExtractedIcons.length} Uploaded Icons Available
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {filteredExtractedIcons.map((icon) => (
                    <div
                      key={icon.id}
                      onClick={() => onIconSelected(icon)}
                      className="cursor-pointer transition-all duration-200 hover:shadow-md bg-slate-50 rounded-lg p-8 text-center hover:bg-blue-50"
                    >
                      <div className="flex items-center justify-center mb-6">
                        <UnifiedIconDisplay icon={icon} size={1000} />
                      </div>
                      <p className="text-lg font-medium text-slate-800 truncate">
                        {icon.name}
                      </p>
                      <p className="text-sm text-blue-600 mt-2">
                        Extracted
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                {searchTerm ? (
                  <p className="text-slate-500">No uploaded icons found for "{searchTerm}"</p>
                ) : (
                  <div>
                    <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No uploaded icons</h3>
                    <p className="text-slate-500">Upload and extract some SVG files to see them here.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Legacy SVG renderer for extracted icons
const ExtractedIconDisplay: React.FC<{ icon: ExtractedIcon; size?: number }> = ({ 
  icon, 
  size = 32 
}) => {
  if (!icon.svgContent) {
    return (
      <div 
        className="flex items-center justify-center text-white font-bold rounded"
        style={{ 
          width: size, 
          height: size,
          backgroundColor: `hsl(${icon.name.charCodeAt(0) * 137.5 % 360}, 70%, 50%)`
        }}
      >
        {icon.name.slice(-1).toUpperCase()}
      </div>
    );
  }

  try {
    const pathMatches = icon.svgContent.match(/<path[^>]*>/g) || [];
    const circleMatches = icon.svgContent.match(/<circle[^>]*>/g) || [];
    const rectMatches = icon.svgContent.match(/<rect[^>]*>/g) || [];
    const lineMatches = icon.svgContent.match(/<line[^>]*>/g) || [];
    const ellipseMatches = icon.svgContent.match(/<ellipse[^>]*>/g) || [];
    const polygonMatches = icon.svgContent.match(/<polygon[^>]*>/g) || [];
    
    const allElements = [
      ...pathMatches,
      ...circleMatches,
      ...rectMatches,
      ...lineMatches,
      ...ellipseMatches,
      ...polygonMatches
    ];

    if (allElements.length === 0) {
      return (
        <div 
          className="flex items-center justify-center text-white font-bold rounded"
          style={{ 
            width: size, 
            height: size,
            backgroundColor: `hsl(${icon.name.charCodeAt(0) * 137.5 % 360}, 70%, 50%)`
          }}
        >
          {icon.name.slice(-1).toUpperCase()}
        </div>
      );
    }

    const cleanElements = allElements.map(element => {
      let cleanElement = element;
      
      if (!element.includes('fill=') && !element.includes('stroke=')) {
        cleanElement = element.replace('>', ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">');
      }
      
      return cleanElement;
    }).join('');

    const viewBoxMatch = icon.svgContent.match(/viewBox="([^"]*)"/);
    const originalViewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 100 100';

    const cleanSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" 
           width="${size}" 
           height="${size}" 
           viewBox="${originalViewBox}" 
           fill="none"
           stroke="currentColor"
           stroke-width="2"
           stroke-linecap="round"
           stroke-linejoin="round">
        ${cleanElements}
      </svg>
    `;

    return (
      <div 
        className="flex items-center justify-center text-slate-700"
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: cleanSvg }}
      />
    );

  } catch (error) {
    return (
      <div 
        className="flex items-center justify-center text-white font-bold rounded"
        style={{ 
          width: size, 
          height: size,
          backgroundColor: `hsl(${icon.name.charCodeAt(0) * 137.5 % 360}, 70%, 50%)`
        }}
      >
        {icon.name.slice(-1).toUpperCase()}
      </div>
    );
  }
};

// Unified icon display component
const UnifiedIconDisplay: React.FC<{ icon: UnifiedIcon; size?: number }> = ({ icon, size = 32 }) => {
  if (icon.type === 'iconify') {
    return (
      <Icon 
        icon={icon.iconifyName} 
        width={size} 
        height={size}
        className="text-slate-700"
      />
    );
  } else {
    return <ExtractedIconDisplay icon={icon} size={size} />;
  }
};
