
import React from 'react';
import { SvgIconManager } from '@/components/SvgIconManager';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            SVG Icon Extractor
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upload SVG files, extract individual icons, and organize them with metadata. 
            Build your perfect icon library with ease.
          </p>
        </div>
        <SvgIconManager />
      </div>
    </div>
  );
};

export default Index;
