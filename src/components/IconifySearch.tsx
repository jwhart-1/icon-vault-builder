
import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Search, Grid, List } from 'lucide-react';

export interface IconifyIcon {
  id: string;
  name: string;
  iconifyName: string; // e.g., 'mdi:home', 'lucide:play'
  category: string;
  description: string;
  keywords: string[];
  license: string;
  author: string;
  collection: string; // e.g., 'Material Design Icons', 'Lucide'
  fileSize?: number;
}

interface IconifySearchProps {
  onIconSelected: (iconData: IconifyIcon) => void;
}

export const IconifySearch: React.FC<IconifySearchProps> = ({ onIconSelected }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

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
    const debounceTimer = setTimeout(() => {
      searchIcons(searchTerm, selectedCollection);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCollection]);

  const handleIconSelect = (iconName: string) => {
    const iconData: IconifyIcon = {
      id: `iconify-${iconName}-${Date.now()}`,
      name: iconName.split(':')[1] || iconName,
      iconifyName: iconName,
      category: iconName.split(':')[0] || 'unknown',
      description: `${iconName.split(':')[1] || iconName} from ${iconName.split(':')[0] || 'unknown'} collection`,
      keywords: [iconName.split(':')[1] || iconName, iconName.split(':')[0] || 'unknown'],
      license: 'Check collection license',
      author: 'Iconify Collection',
      collection: iconName.split(':')[0] || 'unknown'
    };
    
    onIconSelected(iconData);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Search Icon Libraries</h2>
        <p className="text-slate-600">
          Search and select icons from Iconify's collection of 200,000+ icons from 150+ icon sets.
        </p>
      </div>

      {/* Search Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search icons (e.g., home, user, arrow)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
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
        </div>

        {/* Popular searches hint */}
        {!searchTerm && (
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-medium text-slate-800 mb-2">Popular searches:</h3>
            <div className="flex flex-wrap gap-2">
              {['home', 'user', 'settings', 'arrow', 'menu', 'close', 'heart', 'star'].map(term => (
                <button
                  key={term}
                  onClick={() => setSearchTerm(term)}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-slate-600">Searching icons...</p>
          </div>
        )}

        {!isLoading && searchResults.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                {searchResults.length} Icons Found
              </h3>
            </div>
            
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
              {searchResults.map((iconName: string) => (
                <button
                  key={iconName}
                  onClick={() => handleIconSelect(iconName)}
                  className="flex flex-col items-center p-3 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                  title={iconName}
                >
                  <Icon 
                    icon={iconName} 
                    width={32} 
                    height={32}
                    className="text-slate-700 group-hover:text-blue-600 mb-2"
                  />
                  <span className="text-xs text-slate-600 truncate w-full text-center">
                    {iconName.split(':')[1] || iconName}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {!isLoading && searchTerm && searchResults.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <p>No icons found for "{searchTerm}"</p>
            <p className="text-sm mt-2">Try different keywords or select a specific collection</p>
          </div>
        )}

        {!searchTerm && !isLoading && (
          <div className="text-center py-8 text-slate-500">
            <Grid className="mx-auto h-12 w-12 mb-4 text-slate-400" />
            <p>Enter a search term to discover icons</p>
            <p className="text-sm mt-2">Search through 200,000+ icons from popular collections</p>
          </div>
        )}
      </div>
    </div>
  );
};
