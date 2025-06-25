
import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Download, Search, Grid, List } from 'lucide-react';
import { ExtractedIcon } from './SvgIconManager';
import { useToast } from '@/hooks/use-toast';

interface IconifyBrowserProps {
  onIconSelected: (icon: ExtractedIcon) => void;
}

interface IconifyIcon {
  name: string;
  collection: string;
  fullName: string;
  category?: string;
}

const POPULAR_COLLECTIONS = [
  { id: 'lucide', name: 'Lucide', description: 'Beautiful & consistent icons' },
  { id: 'heroicons', name: 'Heroicons', description: 'Crafted by the makers of Tailwind CSS' },
  { id: 'tabler', name: 'Tabler', description: 'Free and open source icons' },
  { id: 'carbon', name: 'Carbon', description: 'IBM\'s design system icons' },
  { id: 'mdi', name: 'Material Design', description: 'Google\'s Material Design icons' },
  { id: 'fa6-solid', name: 'Font Awesome', description: 'Popular web icons' },
  { id: 'simple-icons', name: 'Simple Icons', description: 'Brand icons' },
  { id: 'feather', name: 'Feather', description: 'Minimalist icons' }
];

export const IconifyBrowser: React.FC<IconifyBrowserProps> = ({ onIconSelected }) => {
  const [selectedCollection, setSelectedCollection] = useState('lucide');
  const [searchTerm, setSearchTerm] = useState('');
  const [icons, setIcons] = useState<IconifyIcon[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();

  useEffect(() => {
    loadIconsFromCollection(selectedCollection);
  }, [selectedCollection]);

  const loadIconsFromCollection = async (collection: string) => {
    setLoading(true);
    try {
      // Fetch collection info from Iconify API
      const response = await fetch(`https://api.iconify.design/collection?prefix=${collection}`);
      const data = await response.json();
      
      if (data.uncategorized) {
        const iconList = data.uncategorized.map((iconName: string) => ({
          name: iconName,
          collection,
          fullName: `${collection}:${iconName}`,
          category: 'general'
        }));
        setIcons(iconList.slice(0, 100)); // Limit to first 100 icons
      }
    } catch (error) {
      console.error('Error loading icons:', error);
      toast({
        title: 'Error loading icons',
        description: 'Failed to load icons from the selected collection',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const searchIcons = async () => {
    if (!searchTerm.trim()) {
      loadIconsFromCollection(selectedCollection);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(searchTerm)}&limit=100`);
      const data = await response.json();
      
      if (data.icons) {
        const searchResults = data.icons.map((iconName: string) => {
          const [collection, name] = iconName.split(':');
          return {
            name,
            collection,
            fullName: iconName,
            category: 'search-result'
          };
        });
        setIcons(searchResults);
      }
    } catch (error) {
      console.error('Error searching icons:', error);
      toast({
        title: 'Search failed',
        description: 'Failed to search for icons',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIconSelect = async (icon: IconifyIcon) => {
    try {
      // Get SVG data from Iconify
      const response = await fetch(`https://api.iconify.design/${icon.fullName}.svg`);
      const svgContent = await response.text();
      
      // Create ExtractedIcon object
      const extractedIcon: ExtractedIcon = {
        id: `iconify-${icon.fullName}-${Date.now()}`,
        svgContent,
        name: icon.name,
        category: icon.collection,
        description: `${icon.name} icon from ${icon.collection} collection`,
        keywords: [icon.collection, icon.name, 'iconify'],
        license: 'Various (see Iconify)',
        author: 'Iconify Collection',
        dimensions: { width: 24, height: 24 },
        fileSize: new Blob([svgContent]).size,
      };

      onIconSelected(extractedIcon);
      
      toast({
        title: 'Icon added',
        description: `${icon.name} has been added to your collection`,
      });
    } catch (error) {
      console.error('Error getting icon SVG:', error);
      toast({
        title: 'Error',
        description: 'Failed to get icon SVG data',
        variant: 'destructive',
      });
    }
  };

  const filteredIcons = icons.filter(icon =>
    icon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Iconify Icon Browser</h2>
        <p className="text-slate-600">
          Browse and import icons from popular icon collections
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Collection Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Icon Collection
            </label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {POPULAR_COLLECTIONS.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
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
                onKeyPress={(e) => e.key === 'Enter' && searchIcons()}
                placeholder="Search icons..."
                className="flex-1 p-2 border border-slate-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={searchIcons}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
              >
                <Search className="h-4 w-4" />
              </button>
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

        {/* Collection Info */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-slate-800">
            {POPULAR_COLLECTIONS.find(c => c.id === selectedCollection)?.name}
          </h3>
          <p className="text-sm text-slate-600">
            {POPULAR_COLLECTIONS.find(c => c.id === selectedCollection)?.description}
          </p>
        </div>
      </div>

      {/* Icons Display */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Loading icons...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                {filteredIcons.length} Icons Found
              </h3>
            </div>

            {filteredIcons.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">No icons found</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4'
                : 'space-y-2'
              }>
                {filteredIcons.map((icon) => (
                  <div
                    key={icon.fullName}
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
                      <Icon 
                        icon={icon.fullName} 
                        className="h-6 w-6 text-slate-700" 
                      />
                    </div>
                    <div className={viewMode === 'grid' ? '' : 'flex-1'}>
                      <p className="text-xs font-medium text-slate-800 truncate">
                        {icon.name}
                      </p>
                      {viewMode === 'list' && (
                        <p className="text-xs text-slate-500">{icon.collection}</p>
                      )}
                    </div>
                    {viewMode === 'list' && (
                      <Download className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
