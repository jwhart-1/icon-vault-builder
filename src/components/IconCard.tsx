
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
  if (!svgContent) {
    return (
      <div className="flex items-center justify-center w-full h-full text-slate-400">
        No content
      </div>
    );
  }

  try {
    // Fix the SVG content by replacing problematic values
    let fixedSvg = svgContent
      // Replace currentColor with black
      .replace(/fill="currentColor"/g, 'fill="#000000"')
      .replace(/stroke="currentColor"/g, 'stroke="#000000"')
      // Remove any opacity that might make it invisible
      .replace(/opacity="[^"]*"/g, '')
      // Remove any visibility hidden
      .replace(/visibility="hidden"/g, '')
      // Ensure we have a stroke if no fill
      .replace(/<path([^>]*?)fill="none"([^>]*?)>/g, '<path$1fill="none" stroke="#000000" stroke-width="1"$2>');

    // Parse and enhance the SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(fixedSvg, 'image/svg+xml');
    const svgElement = doc.documentElement;

    if (svgElement.tagName !== 'svg') {
      throw new Error('Invalid SVG');
    }

    // Set proper dimensions
    svgElement.setAttribute('width', size.toString());
    svgElement.setAttribute('height', size.toString());
    (svgElement as HTMLElement).style.display = 'block';

    // Find all path elements and ensure they're visible
    const paths = svgElement.querySelectorAll('path');
    paths.forEach(path => {
      const currentFill = path.getAttribute('fill');
      const currentStroke = path.getAttribute('stroke');
      
      // If it has currentColor or no fill/stroke, make it black
      if (currentFill === 'currentColor' || (!currentFill && !currentStroke)) {
        path.setAttribute('fill', '#000000');
      }
      if (currentStroke === 'currentColor') {
        path.setAttribute('stroke', '#000000');
      }
      
      // Remove problematic attributes
      path.removeAttribute('opacity');
      path.removeAttribute('visibility');
    });

    // Also check groups
    const groups = svgElement.querySelectorAll('g');
    groups.forEach(group => {
      group.removeAttribute('opacity');
      group.removeAttribute('visibility');
    });

    return (
      <div 
        className="flex items-center justify-center"
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          color: '#000000' // Set context color to black
        }}
        dangerouslySetInnerHTML={{ __html: svgElement.outerHTML }}
      />
    );

  } catch (error) {
    console.error(`SVG render error for ${name}:`, error);
    return (
      <div className="flex items-center justify-center w-full h-full text-red-500 text-xs">
        Render error
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
      
      {/* Icon Preview */}
      <div className="aspect-square bg-white rounded-lg mb-4 flex items-center justify-center p-8 border">
        <SVGIcon 
          svgContent={icon.svgContent} 
          name={icon.name}
          size={120}
        />
      </div>
      
      {/* Icon Metadata */}
      <div className="text-xs text-slate-600 mb-4 space-y-1">
        <div><strong>Dimensions:</strong> {icon.dimensions.width}×{icon.dimensions.height}</div>
        <div><strong>File Size:</strong> {icon.fileSize} bytes</div>
        {icon.category && <div><strong>Category:</strong> {icon.category}</div>}
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
