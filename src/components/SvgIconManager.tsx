import React, { useState, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import { SmartIconExtractor } from './SmartIconExtractor';
import { IconGrid } from './IconGrid';
import { SearchAndFilter } from './SearchAndFilter';
import { IconifyBrowser } from './IconifyBrowser';
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
  const [savedIcons, setSavedIcons] = useState<ExtractedIcon[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'extract' | 'browse' | 'manage'>('upload');
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

  const handleIconifyIconSelected = (icon: ExtractedIcon) => {
    setExtractedIcons(prev => [...prev, icon]);
    if (currentStep !== 'manage') {
      setCurrentStep('manage');
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
          <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
              1
            </div>
            <span>Upload SVG Files</span>
          </div>
          <div className="w-8 h-px bg-slate-300"></div>
          <div className={`flex items-center space-x-2 ${currentStep === 'extract' ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'extract' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
              2
            </div>
            <span>Extract Icons</span>
          </div>
          <div className="w-8 h-px bg-slate-300"></div>
          <div className={`flex items-center space-x-2 ${currentStep === 'browse' ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'browse' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
              3
            </div>
            <span>Browse Icons</span>
          </div>
          <div className="w-8 h-px bg-slate-300"></div>
          <div className={`flex items-center space-x-2 ${currentStep === 'manage' ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'manage' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
              4
            </div>
            <span>Manage Library</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-center mb-6">
        <div className="flex space-x-2 bg-slate-100 rounded-lg p-1">
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
            Browse Icons
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
