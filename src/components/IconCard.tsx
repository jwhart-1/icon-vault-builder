
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
  // DIAGNOSTIC LOGGING - Remove after fixing
  console.log(`🔍 DIAGNOSING ${name}:`);
  console.log('SVG Content:', svgContent);
  console.log('Content length:', svgContent?.length);
  console.log('Contains <svg>:', svgContent?.includes('<svg>'));
  console.log('Contains </svg>:', svgContent?.includes('</svg>'));
  console.log('Contains viewBox:', svgContent?.includes('viewBox'));
  console.log('Contains path:', svgContent?.includes('<path'));
  console.log('Contains fill:', svgContent?.includes('fill='));
  console.log('Full content:', svgContent);
  console.log('-------------------');

  if (!svgContent) {
    return (
      <div className="w-full h-full bg-red-100 flex items-center justify-center text-red-600 text-xs">
        No SVG Content
      </div>
    );
  }

  try {
    // Parse the SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = doc.documentElement;

    if (svgElement.tagName !== 'svg') {
      throw new Error('Not a valid SVG');
    }

    // Force visibility with aggressive styling
    svgElement.setAttribute('width', size.toString());
    svgElement.setAttribute('height', size.toString());
    svgElement.setAttribute('fill', 'black'); // Force black fill
    svgElement.setAttribute('stroke', 'black'); // Force black stroke
    svgElement.style.display = 'block';
    svgElement.style.width = `${size}px`;
    svgElement.style.height = `${size}px`;

    // Find all drawing elements and force visibility
    const drawingElements = svgElement.querySelectorAll('path, circle, rect, polygon, line, ellipse, g');
    drawingElements.forEach((element) => {
      // Remove any invisible attributes
      element.removeAttribute('fill');
      element.removeAttribute('opacity');
      element.setAttribute('fill', 'currentColor');
      element.setAttribute('stroke', 'currentColor');
      element.setAttribute('stroke-width', '1');
      element.style.opacity = '1';
      element.style.visibility = 'visible';
    });

    // Also check for nested groups
    const groups = svgElement.querySelectorAll('g');
    groups.forEach(group => {
      group.style.opacity = '1';
      group.style.visibility = 'visible';
      group.removeAttribute('opacity');
    });

    return (
      <div 
        className="flex items-center justify-center border border-gray-300 text-slate-700"
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          backgroundColor: '#f9f9f9' // Light background to see if anything renders
        }}
        dangerouslySetInnerHTML={{ __html: svgElement.outerHTML }}
      />
    );

  } catch (error) {
    console.error(`SVG Render Error for ${name}:`, error);
    return (
      <div className="w-full h-full bg-yellow-100 flex items-center justify-center text-yellow-800 text-xs text-center p-2">
        <div>
          <div>Parse Error</div>
          <div className="text-xs">{error.message}</div>
        </div>
      </div>
    );
  }
};

const SVGIconDataURL: React.FC<{ svgContent: string; name: string; size?: number }> = ({ 
  svgContent, 
  name, 
  size = 120 
}) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (svgContent) {
      try {
        // Create a clean SVG with forced visibility
        let cleanSvg = svgContent;
        
        // Add xmlns if missing
        if (!cleanSvg.includes('xmlns=')) {
          cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        
        // Force black fill for testing
        cleanSvg = cleanSvg.replace(/fill="[^"]*"/g, 'fill="black"');
        cleanSvg = cleanSvg.replace(/stroke="[^"]*"/g, 'stroke="black"');
        
        // Create data URL
        const svgBlob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        setImgSrc(url);

        return () => URL.revokeObjectURL(url);
      } catch (err) {
        setError(err.message);
      }
    }
  }, [svgContent]);

  if (error) {
    return <div className="text-red-500 text-xs">{error}</div>;
  }

  if (!imgSrc) {
    return <div className="text-gray-500 text-xs">Loading...</div>;
  }

  return (
    <img 
      src={imgSrc}
      alt={name}
      style={{ 
        width: `${size}px`,
        height: `${size}px`,
        border: '1px solid #ccc'
      }}
      onError={() => setError('Image failed to load')}
    />
  );
};

const RawSVGTest: React.FC<{ icon: ExtractedIcon }> = ({ icon }) => {
  return (
    <div className="border-2 border-blue-500 p-4 m-2">
      <h3 className="font-bold">{icon.name}</h3>
      <div className="text-sm mb-2">
        <div>Content Length: {icon.svgContent?.length}</div>
        <div>File Size: {icon.fileSize} bytes</div>
      </div>
      
      {/* Raw SVG display */}
      <div className="mb-4">
        <div className="text-xs font-semibold mb-1">Raw SVG Content:</div>
        <textarea 
          className="w-full h-20 text-xs font-mono border p-1"
          value={icon.svgContent || ''}
          readOnly
        />
      </div>
      
      {/* Direct HTML injection */}
      <div className="mb-4">
        <div className="text-xs font-semibold mb-1">Direct HTML Injection:</div>
        <div 
          className="w-24 h-24 border bg-white flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: icon.svgContent || '' }}
        />
      </div>
      
      {/* Simple black test */}
      <div className="mb-4">
        <div className="text-xs font-semibold mb-1">Forced Black Fill:</div>
        <div 
          className="w-24 h-24 border bg-white flex items-center justify-center"
          dangerouslySetInnerHTML={{ 
            __html: icon.svgContent?.replace(/fill="[^"]*"/g, 'fill="black"').replace(/stroke="[^"]*"/g, 'stroke="black"') || '' 
          }}
        />
      </div>
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
  const [showDebug, setShowDebug] = useState(false);

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

      {/* Alternative rendering for debugging */}
      <div className="mb-4">
        <div className="text-xs font-semibold mb-2">Alternative Rendering:</div>
        <div className="bg-white rounded border p-2 flex items-center justify-center" style={{ height: '80px' }}>
          <SVGIconDataURL 
            svgContent={icon.svgContent} 
            name={icon.name}
            size={60}
          />
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
          onClick={() => setShowDebug(true)}
          className="p-2 bg-purple-200 text-purple-600 rounded-lg hover:bg-purple-300 transition-colors"
          title="Debug"
        >
          🔧
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

      {/* Debug Modal */}
      {showDebug && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Debug: {icon.name}</h3>
              <button
                onClick={() => setShowDebug(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <RawSVGTest icon={icon} />
          </div>
        </div>
      )}
    </div>
  );
};
