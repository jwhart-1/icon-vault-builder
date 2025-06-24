
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

// Test SVG component to verify basic SVG rendering works
const TestSVG = () => (
  <div className="p-2 border-2 border-green-500 mb-4">
    <div className="text-xs font-bold mb-1">Test SVG (should show black circle):</div>
    <div 
      className="w-16 h-16 border bg-white flex items-center justify-center"
      dangerouslySetInnerHTML={{ 
        __html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="64" height="64"><circle cx="50" cy="50" r="40" fill="black"/></svg>' 
      }}
    />
  </div>
);

export const IconCard: React.FC<IconCardProps> = ({
  icon,
  onSave,
  onDelete,
  showMetadataForm,
  isLoading = false,
}) => {
  const [showForm, setShowForm] = useState(false);

  // Add comprehensive debugging at component level
  console.log(`=== IconCard Debug for ${icon.name} ===`);
  console.log('Icon object:', icon);
  console.log('SVG Content exists:', !!icon.svgContent);
  console.log('SVG Content length:', icon.svgContent?.length);
  console.log('SVG Content preview:', icon.svgContent?.substring(0, 200));
  console.log('Has svg tag:', icon.svgContent?.includes('<svg'));
  console.log('Has closing svg tag:', icon.svgContent?.includes('</svg>'));
  console.log('Full SVG Content:', icon.svgContent);
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
      <h3 className="font-bold mb-2 text-slate-800">{icon.name}</h3>
      
      {/* Test SVG to verify rendering works */}
      <TestSVG />
      
      {/* RAW SVG CONTENT DISPLAY */}
      <div className="mb-4">
        <div className="text-xs font-bold mb-1">Raw SVG Content (first 500 chars):</div>
        <textarea 
          className="w-full h-32 text-xs font-mono border p-2 bg-gray-100"
          value={icon.svgContent?.substring(0, 500) || 'NO CONTENT'}
          readOnly
        />
      </div>
      
      {/* FULL SVG CONTENT DISPLAY */}
      <div className="mb-4">
        <div className="text-xs font-bold mb-1">Full SVG Content:</div>
        <textarea 
          className="w-full h-40 text-xs font-mono border p-2 bg-gray-50"
          value={icon.svgContent || 'NO CONTENT'}
          readOnly
        />
      </div>
      
      {/* SVG STATS */}
      <div className="text-xs mb-4 space-y-1 bg-blue-50 p-2 rounded">
        <div><strong>Content Length:</strong> {icon.svgContent?.length || 0}</div>
        <div><strong>Has &lt;svg&gt;:</strong> {icon.svgContent?.includes('<svg') ? 'YES' : 'NO'}</div>
        <div><strong>Has &lt;/svg&gt;:</strong> {icon.svgContent?.includes('</svg>') ? 'YES' : 'NO'}</div>
        <div><strong>Has paths:</strong> {icon.svgContent?.includes('<path') ? 'YES' : 'NO'}</div>
        <div><strong>Has viewBox:</strong> {icon.svgContent?.includes('viewBox') ? 'YES' : 'NO'}</div>
        <div><strong>Has fill:</strong> {icon.svgContent?.includes('fill=') ? 'YES' : 'NO'}</div>
        <div><strong>Has stroke:</strong> {icon.svgContent?.includes('stroke=') ? 'YES' : 'NO'}</div>
        <div><strong>ViewBox value:</strong> {icon.svgContent?.match(/viewBox="([^"]+)"/)?.[1] || 'Not found'}</div>
      </div>
      
      {/* TEST RENDERS */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs font-bold mb-1">Direct Injection:</div>
          <div 
            className="w-20 h-20 border-2 border-red-500 bg-white flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: icon.svgContent || 'NO CONTENT' }}
          />
        </div>
        
        <div>
          <div className="text-xs font-bold mb-1">With Black Fill:</div>
          <div 
            className="w-20 h-20 border-2 border-blue-500 bg-white flex items-center justify-center"
            dangerouslySetInnerHTML={{ 
              __html: icon.svgContent?.replace(/fill="[^"]*"/g, 'fill="black"').replace(/stroke="[^"]*"/g, 'stroke="black"') || 'NO CONTENT' 
            }}
          />
        </div>
      </div>

      {/* ADDITIONAL TEST RENDERS */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs font-bold mb-1">Force All Black:</div>
          <div 
            className="w-20 h-20 border-2 border-purple-500 bg-white flex items-center justify-center"
            dangerouslySetInnerHTML={{ 
              __html: icon.svgContent
                ?.replace(/fill="[^"]*"/g, 'fill="black"')
                ?.replace(/stroke="[^"]*"/g, 'stroke="black"')
                ?.replace(/opacity="[^"]*"/g, 'opacity="1"')
                ?.replace(/visibility="[^"]*"/g, 'visibility="visible"') || 'NO CONTENT' 
            }}
          />
        </div>
        
        <div>
          <div className="text-xs font-bold mb-1">Simplified:</div>
          <div 
            className="w-20 h-20 border-2 border-green-500 bg-white flex items-center justify-center"
            style={{ color: 'black' }}
          >
            <div dangerouslySetInnerHTML={{ __html: icon.svgContent || 'NO CONTENT' }} />
          </div>
        </div>
      </div>
      
      {/* ORIGINAL METADATA */}
      <div className="text-xs bg-slate-100 p-2 rounded mb-4">
        <div><strong>Dimensions:</strong> {icon.dimensions.width}×{icon.dimensions.height}</div>
        <div><strong>File Size:</strong> {icon.fileSize} bytes</div>
        <div><strong>Category:</strong> {icon.category || 'None'}</div>
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
    </div>
  );
};
