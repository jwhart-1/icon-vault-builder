
import React, { useState, useRef, useEffect } from 'react';
import { ExtractedIcon } from './SvgIconManager';
import { IconMetadataForm } from './IconMetadataForm';
import { Download, Eye, Trash2 } from 'lucide-react';

interface IconCardProps {
  icon: ExtractedIcon;
  onSave: (icon: ExtractedIcon) => void;
  onDelete: (iconId: string) => void;
  showMetadataForm: boolean;
  isLoading?: boolean;
}

const SVGIcon: React.FC<{ svgContent: string; name: string; size?: number }> = ({ 
  svgContent, 
  name, 
  size = 64 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  if (!svgContent) {
    return (
      <div className="flex flex-col items-center justify-center text-slate-400 text-sm">
        <div className="text-2xl mb-2">🔧</div>
        <div>No icon content</div>
      </div>
    );
  }

  // Create a data URL for the SVG to ensure it renders properly
  const createSVGDataUrl = (content: string) => {
    try {
      // Clean and optimize the SVG for display - force visibility
      let cleanSVG = content
        .replace(/fill="none"/g, 'fill="currentColor"')
        .replace(/stroke="none"/g, 'stroke="currentColor"')
        .replace(/opacity="[^"]*"/g, ''); // Remove any opacity that might hide icons
      
      // Ensure the SVG has proper dimensions and styling for visibility
      if (!cleanSVG.includes('fill=') && !cleanSVG.includes('stroke=')) {
        cleanSVG = cleanSVG.replace('<svg', '<svg fill="currentColor" stroke="currentColor"');
      }
      
      const blob = new Blob([cleanSVG], { type: 'image/svg+xml' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error(`Failed to create data URL for ${name}:`, error);
      setError(true);
      return null;
    }
  };

  const svgUrl = createSVGDataUrl(svgContent);

  useEffect(() => {
    return () => {
      if (svgUrl) {
        URL.revokeObjectURL(svgUrl);
      }
    };
  }, [svgUrl]);

  // Enhanced debug logging for visibility issues
  useEffect(() => {
    console.log(`SVG Icon Debug for ${name}:`, {
      hasContent: !!svgContent,
      contentLength: svgContent?.length,
      hasViewBox: svgContent?.includes('viewBox'),
      viewBox: svgContent?.match(/viewBox="([^"]+)"/)?.[1],
      hasFill: svgContent?.includes('fill='),
      hasCurrentColor: svgContent?.includes('currentColor'),
      svgUrl: !!svgUrl
    });
  }, [svgContent, name, svgUrl]);

  if (error || !svgUrl) {
    return (
      <div className="flex flex-col items-center justify-center text-slate-400 text-sm">
        <div className="text-2xl mb-2">⚠️</div>
        <div>Render error</div>
        <button 
          className="text-xs text-blue-500 underline mt-1"
          onClick={() => {
            console.log(`=== DEBUG ${name} ===`);
            console.log("SVG Content:", svgContent);
            console.log("Content preview:", svgContent?.substring(0, 300));
          }}
        >
          Debug
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {!showFallback ? (
        <img 
          src={svgUrl}
          alt={name}
          className="object-contain"
          style={{ 
            width: `${size}px`,
            height: `${size}px`,
            color: '#1f2937'
          }}
          onLoad={() => {
            setIsLoaded(true);
            console.log(`Icon ${name} loaded successfully`);
          }}
          onError={() => {
            console.error(`Icon ${name} failed to load, trying fallback`);
            setShowFallback(true);
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-600" style={{ width: `${size}px`, height: `${size}px` }}>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
            <span className="text-lg">🔧</span>
          </div>
          <div className="text-xs text-center">Icon extracted</div>
          <button 
            className="text-xs text-blue-500 underline mt-1"
            onClick={() => {
              console.log(`=== FALLBACK DEBUG ${name} ===`);
              console.log("SVG Content:", svgContent);
              console.log("SVG URL:", svgUrl);
            }}
          >
            Debug
          </button>
        </div>
      )}
    </div>
  );
};

export const IconCard: React.FC<IconCardProps> = ({
  icon,
  onSave,
  onDelete,
  showMetadataForm,
  isLoading = false,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Enhanced debug logging
  console.log("Rendering IconCard for:", icon.name, {
    hasContent: !!icon.svgContent,
    contentLength: icon.svgContent?.length,
    dimensions: icon.dimensions,
    contentPreview: icon.svgContent?.substring(0, 100),
    viewBox: icon.svgContent?.match(/viewBox="([^"]+)"/)?.[1]
  });

  const handleSave = (updatedIcon: ExtractedIcon) => {
    onSave(updatedIcon);
    setShowForm(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this icon?')) {
      onDelete(icon.id);
    }
  };

  const downloadIcon = () => {
    const blob = new Blob([icon.svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${icon.name}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:shadow-md transition-shadow">
      {/* Icon Preview with enhanced debugging */}
      <div className="aspect-square bg-white rounded-lg mb-4 flex items-center justify-center p-4 border min-h-32 relative">
        <SVGIcon 
          svgContent={icon.svgContent} 
          name={icon.name}
          size={80}
        />
        
        {/* Debug info overlay (only visible in console) */}
        <div className="absolute top-1 right-1">
          <button 
            className="text-xs bg-slate-100 text-slate-500 px-1 rounded opacity-50 hover:opacity-100"
            onClick={() => {
              console.log(`=== ICON CARD DEBUG ${icon.name} ===`);
              console.log("Full icon object:", icon);
              console.log("SVG Content:", icon.svgContent);
              console.log("ViewBox:", icon.svgContent?.match(/viewBox="([^"]+)"/)?.[1]);
              console.log("Dimensions:", icon.dimensions);
              console.log("Has visible elements:", icon.svgContent?.includes('<path') || icon.svgContent?.includes('<circle') || icon.svgContent?.includes('<rect'));
            }}
            title="Debug this icon"
          >
            ?
          </button>
        </div>
      </div>

      {/* Icon Info */}
      <div className="space-y-2">
        <h3 className="font-semibold text-slate-800 truncate" title={icon.name}>
          {icon.name}
        </h3>
        <div className="flex justify-between text-sm text-slate-600">
          <span>{icon.dimensions.width}×{icon.dimensions.height}</span>
          <span>{(icon.fileSize / 1024).toFixed(1)}KB</span>
        </div>
        
        {icon.category && (
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            {icon.category}
          </span>
        )}

        {icon.keywords.length > 0 && (
          <p className="text-xs text-slate-500 truncate" title={icon.keywords.join(', ')}>
            Tags: {icon.keywords.join(', ')}
          </p>
        )}
        
        {/* Debug info */}
        <div className="text-xs text-slate-400">
          ViewBox: {icon.svgContent?.match(/viewBox="([^"]+)"/)?.[1] || 'default'}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        {showMetadataForm && (
          <button
            onClick={() => setShowForm(true)}
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Add Metadata'}
          </button>
        )}
        
        <button
          onClick={() => setShowPreview(true)}
          className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
          title="Preview"
        >
          <Eye className="h-4 w-4" />
        </button>
        
        <button
          onClick={downloadIcon}
          className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
          title="Download"
        >
          <Download className="h-4 w-4" />
        </button>

        {!showMetadataForm && (
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Metadata Form Modal */}
      {showForm && (
        <IconMetadataForm
          icon={icon}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Enhanced Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{icon.name}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-8 mb-4 flex items-center justify-center min-h-48">
              <SVGIcon 
                svgContent={icon.svgContent} 
                name={icon.name}
                size={200}
              />
            </div>
            
            {/* Enhanced debug info */}
            <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
              <p><strong>ViewBox:</strong> {icon.svgContent?.match(/viewBox="([^"]+)"/)?.[1] || 'Not specified'}</p>
              <p><strong>Dimensions:</strong> {icon.dimensions.width}×{icon.dimensions.height}</p>
              <p><strong>Content Length:</strong> {icon.svgContent?.length} characters</p>
            </div>
            
            <div className="bg-slate-100 rounded p-3 text-sm font-mono overflow-auto max-h-40">
              {icon.svgContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
