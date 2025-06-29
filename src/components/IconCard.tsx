
import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { Download, Eye, Trash2 } from 'lucide-react';
import type { UnifiedIcon, ExtractedIcon, IconifyIcon } from './SvgIconManager';

interface IconCardProps {
  icon: UnifiedIcon;
  onSave: (icon: UnifiedIcon) => void;
  onDelete: (iconId: string) => void;
  showMetadataForm: boolean;
  isLoading?: boolean;
}

const SVGIcon: React.FC<{ svgContent: string; name: string; size?: number }> = ({ 
  svgContent, 
  name, 
  size = 120 
}) => {
  if (!svgContent) {
    return (
      <div 
        className="flex items-center justify-center text-white font-bold rounded-lg"
        style={{ 
          width: size, 
          height: size,
          backgroundColor: `hsl(${name.charCodeAt(0) * 137.5 % 360}, 70%, 50%)`
        }}
      >
        {name.slice(-1).toUpperCase()}
      </div>
    );
  }

  try {
    // Clean the SVG content for proper display
    let cleanSvg = svgContent;
    
    // If it's already a complete SVG, use it directly
    if (cleanSvg.includes('<svg')) {
      // Make sure it has proper dimensions
      cleanSvg = cleanSvg.replace(
        /<svg([^>]*)>/,
        `<svg$1 width="${size}" height="${size}" style="display: block;">`
      );
      
      // Ensure visibility by adding stroke to paths without fill
      cleanSvg = cleanSvg.replace(
        /<path([^>]*?)>/g,
        (match, attrs) => {
          if (!attrs.includes('fill=') && !attrs.includes('stroke=')) {
            return `<path${attrs} fill="none" stroke="currentColor" stroke-width="2">`;
          }
          return match;
        }
      );
    }

    return (
      <div 
        className="flex items-center justify-center text-slate-800"
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: cleanSvg }}
      />
    );

  } catch (error) {
    console.error(`SVG render error for ${name}:`, error);
    return (
      <div 
        className="flex items-center justify-center text-white font-bold rounded-lg"
        style={{ 
          width: size, 
          height: size,
          backgroundColor: `hsl(${name.charCodeAt(0) * 137.5 % 360}, 70%, 50%)`
        }}
      >
        {name.slice(-1).toUpperCase()}
      </div>
    );
  }
};

// Unified Icon Display Component
const UnifiedIconDisplay: React.FC<{ icon: UnifiedIcon; size?: number }> = ({ icon, size = 120 }) => {
  if (icon.type === 'iconify') {
    return (
      <Icon 
        icon={icon.iconifyName} 
        width={size} 
        height={size}
        className="text-slate-800"
      />
    );
  } else {
    return (
      <SVGIcon 
        svgContent={icon.svgContent} 
        name={icon.name}
        size={size}
      />
    );
  }
};

export const IconCard: React.FC<IconCardProps> = ({
  icon,
  onSave,
  onDelete,
  showMetadataForm,
  isLoading = false,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this icon?')) {
      onDelete(icon.id);
    }
  };

  const downloadIcon = async () => {
    try {
      if (icon.type === 'iconify') {
        // Download Iconify icon
        const response = await fetch(`https://api.iconify.design/${icon.iconifyName}.svg`);
        const svgContent = await response.text();
        
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${icon.name}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Download extracted icon
        const blob = new Blob([icon.svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${icon.name}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:shadow-md transition-shadow">
      {/* Icon Preview */}
      <div className="aspect-square bg-white rounded-lg mb-4 flex items-center justify-center p-8 border">
        <UnifiedIconDisplay icon={icon} size={120} />
      </div>

      {/* Icon Info */}
      <div className="space-y-2">
        <h3 className="font-semibold text-slate-800 truncate" title={icon.name}>
          {icon.name}
        </h3>
        
        <div className="text-sm text-slate-600">
          {icon.type === 'iconify' ? (
            <>
              <div className="truncate" title={icon.iconifyName}>
                {icon.iconifyName}
              </div>
              <div className="text-xs text-slate-500">{icon.collection}</div>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <span>{icon.dimensions.width}×{icon.dimensions.height}</span>
                <span>{(icon.fileSize / 1024).toFixed(1)}KB</span>
              </div>
              <div className="text-xs text-slate-500">Extracted Icon</div>
            </>
          )}
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
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        {showMetadataForm && (
          <button
            onClick={() => onSave(icon)}
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Add to Library'}
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
          title="Download SVG"
        >
          <Download className="h-4 w-4" />
        </button>

        {!showMetadataForm && (
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
            title="Remove from Library"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{icon.name}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-8 mb-4 flex items-center justify-center">
              <UnifiedIconDisplay icon={icon} size={240} />
            </div>
            
            <div className="text-sm text-slate-600 space-y-2">
              {icon.type === 'iconify' ? (
                <>
                  <p><strong>Iconify Name:</strong> {icon.iconifyName}</p>
                  <p><strong>Collection:</strong> {icon.collection}</p>
                  <p><strong>License:</strong> {icon.license || 'Check collection license'}</p>
                </>
              ) : (
                <>
                  <p><strong>Dimensions:</strong> {icon.dimensions.width}×{icon.dimensions.height}</p>
                  <p><strong>File Size:</strong> {(icon.fileSize / 1024).toFixed(1)}KB</p>
                  <p><strong>Type:</strong> Extracted SVG</p>
                </>
              )}
              {icon.author && <p><strong>Author:</strong> {icon.author}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
