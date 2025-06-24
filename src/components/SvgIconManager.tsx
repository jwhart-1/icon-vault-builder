
import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { IconExtractor } from './IconExtractor';
import { IconGrid } from './IconGrid';
import { SearchAndFilter } from './SearchAndFilter';
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
  const [currentStep, setCurrentStep] = useState<'upload' | 'extract' | 'manage'>('upload');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { toast } = useToast();

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files);
    setCurrentStep('extract');
    toast({
      title: 'Files uploaded successfully',
      description: `${files.length} SVG file(s) ready for processing`,
    });
  };

  const handleIconsExtracted = (icons: ExtractedIcon[]) => {
    setExtractedIcons(icons);
    setCurrentStep('manage');
    toast({
      title: 'Icons extracted',
      description: `${icons.length} icon(s) found and ready for metadata entry`,
    });
  };

  const handleIconSaved = (icon: ExtractedIcon) => {
    setSavedIcons(prev => [...prev, icon]);
    setExtractedIcons(prev => prev.filter(i => i.id !== icon.id));
    toast({
      title: 'Icon saved',
      description: `${icon.name} has been saved to your library`,
    });
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
            <span>Upload</span>
          </div>
          <div className="w-8 h-px bg-slate-300"></div>
          <div className={`flex items-center space-x-2 ${currentStep === 'extract' ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'extract' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
              2
            </div>
            <span>Extract</span>
          </div>
          <div className="w-8 h-px bg-slate-300"></div>
          <div className={`flex items-center space-x-2 ${currentStep === 'manage' ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'manage' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
              3
            </div>
            <span>Manage</span>
          </div>
        </div>
      </div>

      {/* Content based on current step */}
      {currentStep === 'upload' && (
        <FileUpload onFilesUploaded={handleFilesUploaded} />
      )}

      {currentStep === 'extract' && (
        <IconExtractor files={uploadedFiles} onIconsExtracted={handleIconsExtracted} />
      )}

      {currentStep === 'manage' && (
        <div className="space-y-6">
          {extractedIcons.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">New Icons - Add Metadata</h2>
              <IconGrid 
                icons={extractedIcons} 
                onIconSaved={handleIconSaved}
                showMetadataForms={true}
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
                showMetadataForms={false}
              />
            </div>
          )}
        </div>
      )}

      {/* Reset button */}
      {currentStep !== 'upload' && (
        <div className="text-center mt-8">
          <button
            onClick={() => {
              setCurrentStep('upload');
              setUploadedFiles([]);
              setExtractedIcons([]);
            }}
            className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Upload More Files
          </button>
        </div>
      )}
    </div>
  );
};
