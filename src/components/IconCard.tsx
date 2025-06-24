
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
  size = 120 
}) => {
  // Enhanced debug logging
  console.log(`=== SVGIcon Debug for ${name} ===`);
  console.log('Has content:', !!svgContent);
  console.log('Content length:', svgContent?.length);
  console.log('First 200 chars:', svgContent?.substring(0, 200));
  console.log('Starts with <svg:', svgContent?.startsWith('<svg'));
  console.log('Contains </svg>:', svgContent?.includes('</svg>'));
  console.log('================================');

  if (!svgContent || svgContent.trim().length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-slate-400 text-sm h-full">
        <div className="text-2xl mb-2">📄</div>
        <div>No Content</div>
      </div>
    );
  }

  try {
    // Clean and prepare SVG content
    let cleanSvg = svgContent.trim();
    
    // Ensure SVG has proper structure
    if (!cleanSvg.startsWith('<svg')) {
      console.error(`Invalid SVG for ${name}: doesn't start with <svg>`);
      throw new Error('Invalid SVG structure');
    }

    // Parse the SVG to validate and enhance it
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanSvg, 'image/svg+xml');
    
    // Check for parser errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      console.error(`SVG Parse error for ${name}:`, parseError.textContent);
      throw new Error('SVG parsing failed');
    }

    const svgElement = doc.documentElement;
    
    if (svgElement.tagName !== 'svg') {
      console.error(`Not an SVG element for ${name}:`, svgElement.tagName);
      throw new Error('Not a valid SVG');
    }

    // Enhance SVG for better visibility
    svgElement.setAttribute('width', size.toString());
    svgElement.setAttribute('height', size.toString());
    svgElement.style.display = 'block';
    svgElement.style.maxWidth = '100%';
    svgElement.style.maxHeight = '100%';

    // Ensure visibility - add fill if none exists
    const allPaths = svgElement.querySelectorAll('path, circle, rect, polygon, line, ellipse');
    let hasVisibleElements = false;
    
    allPaths.forEach(element => {
      const fill = element.getAttribute('fill');
      const stroke = element.getAttribute('stroke');
      
      if (!fill && !stroke) {
        element.setAttribute('fill', 'currentColor');
        hasVisibleElements = true;
      } else if (fill !== 'none' || stroke) {
        hasVisibleElements = true;
      }
    });

    if (!hasVisibleElements) {
      // If no visible elements found, set fill on the SVG itself
      svgElement.setAttribute('fill', 'currentColor');
    }

    const finalSvg = svgElement.outerHTML;
    console.log(`Successfully processed SVG for ${name}, final length: ${finalSvg.length}`);

    return (
      <div 
        className="flex items-center justify-center w-full h-full text-slate-700"
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`
        }}
        dangerouslySetInnerHTML={{ __html: finalSvg }}
      />
    );

  } catch (error) {
    console.error(`Failed to render SVG for ${name}:`, error);
    console.log(`SVG content that failed:`, svgContent?.substring(0, 500));
    
    return (
      <div className="flex flex-col items-center justify-center text-red-400 text-sm h-full">
        <div className="text-2xl mb-2">⚠️</div>
        <div className="text-center">
          <div>Render Error</div>
          <div className="text-xs mt-1">{error.message}</div>
        </div>
      </div>
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
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Add comprehensive debugging at component level
  console.log(`=== IconCard Debug for ${icon.name} ===`);
  console.log('Icon object:', icon);
  console.log('SVG Content exists:', !!icon.svgContent);
  console.log('SVG Content length:', icon.svgContent?.length);
  console.log('SVG Content preview:', icon.svgContent?.substring(0, 200));
  console.log('Has svg tag:', icon.svgContent?.includes('<svg'));
  console.log('Has closing svg tag:', icon.svgContent?.includes('</svg>'));
  console.log('==============================');

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
      {/* Icon Preview - Fixed dimensions */}
      <div className="bg-white rounded-lg mb-4 flex items-center justify-center border" style={{ 
        width: '160px', 
        height: '160px',
        minHeight: '160px',
        minWidth: '160px'
      }}>
        <SVGIcon 
          svgContent={icon.svgContent} 
          name={icon.name}
          size={120}
        />
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

      {/* Preview Modal */}
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
            
            <div className="bg-slate-50 rounded-lg p-8 mb-4 flex items-center justify-center min-h-64">
              <SVGIcon 
                svgContent={icon.svgContent} 
                name={icon.name}
                size={240}
              />
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
              <p><strong>ViewBox:</strong> {icon.svgContent?.match(/viewBox="([^"]+)"/)?.[1] || 'Not specified'}</p>
              <p><strong>Dimensions:</strong> {icon.dimensions.width}×{icon.dimensions.height}</p>
              <p><strong>Content Length:</strong> {icon.svgContent?.length} characters</p>
              <p><strong>Valid SVG:</strong> {icon.svgContent?.includes('<svg') && icon.svgContent?.includes('</svg>') ? 'Yes' : 'No'}</p>
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
