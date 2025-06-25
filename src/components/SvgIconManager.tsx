
import React, { useState, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import { SmartIconExtractor } from './SmartIconExtractor';
import { IconGrid } from './IconGrid';
import { SearchAndFilter } from './SearchAndFilter';
import { IconifyBrowser } from './IconifyBrowser';
import { IconifySearch, IconifyIcon } from './IconifySearch';
import { IconifyIconCard } from './IconifyIconCard';
import { useIconStorage } from '@/hooks/useIconStorage';
import { useToast } from '@/hooks/use-toast';

export interface ExtractedIcon {
  id: string;
  svgContent: string;
  name: string;
  category: string;
  description: string;
  keywords: string[];
  license: string;
  author: string;
  dimensions: { width: number; height: number };
  fileSize: number;
}

export const SvgIconManager = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [extractedIcons, setExtractedIcons] = useState<ExtractedIcon[]>([]);
  const [iconifyIcons, setIconifyIcons] = useState<IconifyIcon[]>([]);
  const [savedIcons, setSavedIcons] = useState<ExtractedIcon[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'extract' | 'search' | 'browse' | 'manage'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { saveIcon, loadIcons, deleteIcon, isLoading } = useIconStorage();
  const { toast } = useToast();

  // Load saved icons on component mount
  useEffect(() => {
    const loadSavedIcons = async () => {
      const icons = await loadIcons();
      setSavedIcons(icons);
    };
    loadSavedIcons();
  }, []);

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files);
    setCurrentStep('extract');
    toast({
      title: 'Files uploaded successfully',
      description: `${files.length} SVG file(s) ready for intelligent processing`,
    });
  };

  const handleIconsExtracted = (icons: ExtractedIcon[]) => {
    setExtractedIcons(icons);
    setCurrentStep('manage');
    toast({
      title: 'Icons extracted successfully',
      description: `Found ${icons.length} individual icon(s) ready for metadata entry`,
    });
  };

  const handleIconifyIconSelected = async (icon: IconifyIcon) => {
    try {
      // Convert IconifyIcon to ExtractedIcon format
      const response = await fetch(`https://api.iconify.design/${icon.iconifyName}.svg`);
      const svgContent = await response.text();
      
      const extractedIcon: ExtractedIcon = {
        id: icon.id,
        svgContent: svgContent,
        name: icon.name,
        category: icon.category,
        description: icon.description,
        keywords: icon.keywords,
        license: icon.license,
        author: icon.author,
        dimensions: { width: 24, height: 24 },
        fileSize: new Blob([svgContent]).size,
      };

      setExtractedIcons(prev => [...prev, extractedIcon]);
      
      if (currentStep !== 'manage') {
        setCurrentStep('manage');
      }
      
      toast({
        title: 'Icon selected',
        description: `${icon.name} has been added to your collection`,
      });
    } catch (error) {
      console.error('Error fetching icon SVG:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch icon data',
        variant: 'destructive',
      });
    }
  };

  const handleIconifyIconSaved = async (icon: IconifyIcon) => {
    try {
      // Convert to ExtractedIcon format and save
      const response = await fetch(`https://api.iconify.design/${icon.iconifyName}.svg`);
      const svgContent = await response.text();
      
      const extractedIcon: ExtractedIcon = {
        id: icon.id,
        svgContent: svgContent,
        name: icon.name,
        category: icon.category,
        description: icon.description,
        keywords: icon.keywords,
        license: icon.license,
        author: icon.author,
        dimensions: { width: 24, height: 24 },
        fileSize: new Blob([svgContent]).size,
      };

      const success = await saveIcon(extractedIcon);
      if (success) {
        setSavedIcons(prev => [...prev, extractedIcon]);
        setIconifyIcons(prev => prev.filter(i => i.id !== icon.id));
      }
    } catch (error) {
      console.error('Error saving Iconify icon:', error);
      toast({
        title: 'Error',
        description: 'Failed to save icon',
        variant: 'destructive',
      });
    }
  };

  const handleIconSaved = async (icon: ExtractedIcon) => {
    const success = await saveIcon(icon);
    if (success) {
      setSavedIcons(prev => [...prev, icon]);
      setExtractedIcons(prev => prev.filter(i => i.id !== icon.id));
    }
  };

  const handleIconDeleted = async (iconId: string) => {
    const success = await deleteIcon(iconId);
    if (success) {
      setSavedIcons(prev => prev.filter(i => i.id !== iconId));
    }
  };

  const filteredIcons = savedIcons.filter(icon => {
    const matchesSearch = icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         icon.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || icon.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(savedIcons.map(icon => icon.category).filter(Boolean)));

  return (
    <div className="max-w-7xl mx-auto">
      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${currentStep === 'search' ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'search' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
              1
            </div>
            <span>Search Icons</span>
          </div>
          <div className="w-8 h-px bg-slate-300"></div>
          <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
              2
            </div>
            <span>Upload SVG Files</span>
          </div>
          <div className="w-8 h-px bg-slate-300"></div>
          <div className={`flex items-center space-x-2 ${currentStep === 'extract' ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'extract' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
              3
            </div>
            <span>Extract Icons</span>
          </div>
          <div className="w-8 h-px bg-slate-300"></div>
          <div className={`flex items-center space-x-2 ${currentStep === 'browse' ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'browse' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
              4
            </div>
            <span>Browse Uploaded</span>
          </div>
          <div className="w-8 h-px bg-slate-300"></div>
          <div className={`flex items-center space-x-2 ${currentStep === 'manage' ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'manage' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
              5
            </div>
            <span>Manage Library</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-center mb-6">
        <div className="flex space-x-2 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setCurrentStep('search')}
            className={`px-4 py-2 rounded-md transition-colors ${
              currentStep === 'search' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Search Icons
          </button>
          <button
            onClick={() => setCurrentStep('upload')}
            className={`px-4 py-2 rounded-md transition-colors ${
              currentStep === 'upload' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Upload Files
          </button>
          <button
            onClick={() => setCurrentStep('browse')}
            className={`px-4 py-2 rounded-md transition-colors ${
              currentStep === 'browse' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Browse Uploaded
          </button>
          <button
            onClick={() => setCurrentStep('manage')}
            className={`px-4 py-2 rounded-md transition-colors ${
              currentStep === 'manage' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Manage Library
          </button>
        </div>
      </div>

      {/* Content based on current step */}
      {currentStep === 'search' && (
        <IconifySearch onIconSelected={handleIconifyIconSelected} />
      )}

      {currentStep === 'upload' && (
        <div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload SVG Files</h2>
            <p className="text-slate-600">
              Upload SVG files containing multiple icons. Our smart extractor will identify and separate individual icons for you.
            </p>
          </div>
          <FileUpload onFilesUploaded={handleFilesUploaded} />
        </div>
      )}

      {currentStep === 'extract' && (
        <SmartIconExtractor files={uploadedFiles} onIconsExtracted={handleIconsExtracted} />
      )}

      {currentStep === 'browse' && (
        <IconifyBrowser onIconSelected={handleIconifyIconSelected} uploadedFiles={uploadedFiles} />
      )}

      {currentStep === 'manage' && (
        <div className="space-y-6">
          {extractedIcons.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">
                Extracted Icons ({extractedIcons.length}) - Add Metadata
              </h2>
              <p className="text-slate-600 mb-4">
                Review and add metadata to each extracted icon before saving to your library.
              </p>
              <IconGrid 
                icons={extractedIcons} 
                onIconSaved={handleIconSaved}
                onIconDeleted={() => {}}
                showMetadataForms={true}
                isLoading={isLoading}
              />
            </div>
          )}

          {savedIcons.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Your Icon Library ({savedIcons.length})</h2>
                <SearchAndFilter
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  categories={categories}
                />
              </div>
              <IconGrid 
                icons={filteredIcons} 
                onIconSaved={() => {}}
                onIconDeleted={handleIconDeleted}
                showMetadataForms={false}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
