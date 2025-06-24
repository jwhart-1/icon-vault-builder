import React, { useState } from 'react';
import { ExtractedIcon } from './SvgIconManager';
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
    // Method 1: Try to extract content from groups first
    let extractedContent = '';
    
    // Look for group content (most comprehensive)
    const groupMatches = svgContent.match(/<g[^>]*>(.*?)<\/g>/gs);
    if (groupMatches && groupMatches.length > 0) {
      // Take the largest group (likely contains the most content)
      const largestGroup = groupMatches.reduce((largest, current) => 
        current.length > largest.length ? current : largest
      );
      
      // Extract content inside the group
      const groupContentMatch = largestGroup.match(/<g[^>]*>(.*?)<\/g>/s);
      if (groupContentMatch) {
        extractedContent = groupContentMatch[1];
      }
    }
    
    // Method 2: If no groups, extract all drawing elements
    if (!extractedContent) {
      const pathMatches = svgContent.match(/<path[^>]*>/g) || [];
      const circleMatches = svgContent.match(/<circle[^>]*>/g) || [];
      const rectMatches = svgContent.match(/<rect[^>]*>/g) || [];
      const lineMatches = svgContent.match(/<line[^>]*>/g) || [];
      const ellipseMatches = svgContent.match(/<ellipse[^>]*>/g) || [];
      const polygonMatches = svgContent.match(/<polygon[^>]*>/g) || [];
      
      extractedContent = [
        ...pathMatches,
        ...circleMatches,
        ...rectMatches,
        ...lineMatches,
        ...ellipseMatches,
        ...polygonMatches
      ].join('');
    }
    
    // Method 3: If still nothing, try to extract everything between svg tags
    if (!extractedContent) {
      const svgContentMatch = svgContent.match(/<svg[^>]*>(.*?)<\/svg>/s);
      if (svgContentMatch) {
        extractedContent = svgContentMatch[1]
          // Remove defs, metadata, etc.
          .replace(/<defs[^>]*>.*?<\/defs>/gs, '')
          .replace(/<metadata[^>]*>.*?<\/metadata>/gs, '')
          .replace(/<title[^>]*>.*?<\/title>/gs, '')
          .replace(/<desc[^>]*>.*?<\/desc>/gs, '');
      }
    }

    if (!extractedContent.trim()) {
      // Fallback to colored square
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

    // Process the extracted content to ensure visibility
    const processedContent = extractedContent
      // Force stroke styling for line elements
      .replace(/<(path|circle|rect|line|ellipse|polygon)([^>]*?)>/g, (match, tag, attrs) => {
        let newAttrs = attrs;
        
        // If no fill or stroke specified, add stroke
        if (!attrs.includes('fill=') && !attrs.includes('stroke=')) {
          newAttrs += ' fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
        } else {
          // Replace currentColor and problematic values
          newAttrs = newAttrs
            .replace(/fill="currentColor"/g, 'fill="#000000"')
            .replace(/stroke="currentColor"/g, 'stroke="#000000"')
            .replace(/fill="none"/g, 'fill="none"')
            .replace(/stroke="none"/g, 'stroke="#000000"');
          
          // Ensure stroke width for stroke elements
          if (newAttrs.includes('stroke=') && !newAttrs.includes('stroke-width=')) {
            newAttrs += ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
          }
          
          // If fill="none", ensure stroke exists
          if (newAttrs.includes('fill="none"') && !newAttrs.includes('stroke=')) {
            newAttrs += ' stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
          }
        }
        
        return `<${tag}${newAttrs}>`;
      })
      // Handle groups
      .replace(/<g([^>]*?)>/g, '<g$1>')
      // Remove problematic attributes
      .replace(/opacity="[^"]*"/g, '')
      .replace(/visibility="[^"]*"/g, '');

    // Get original viewBox or use default
    const viewBoxMatch = svgContent.match(/viewBox="([^"]*)"/);
    const originalViewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 100 100';

    const cleanSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" 
           width="${size}" 
           height="${size}" 
           viewBox="${originalViewBox}" 
           fill="none"
           stroke="#000000"
           stroke-width="2"
           stroke-linecap="round"
           stroke-linejoin="round">
        ${processedContent}
      </svg>
    `;

    return (
      <div 
        className="flex items-center justify-center"
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: cleanSvg }}
      />
    );

  } catch (error) {
    console.error(`SVG render error for ${name}:`, error);
    // Fallback to colored square
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
      {/* Icon Preview */}
      <div className="aspect-square bg-white rounded-lg mb-4 flex items-center justify-center p-8 border">
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
            onClick={() => onSave(icon)}
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
              <SVGIcon 
                svgContent={icon.svgContent} 
                name={icon.name}
                size={240}
              />
            </div>
            
            <div className="text-sm text-slate-600">
              <p><strong>Dimensions:</strong> {icon.dimensions.width}×{icon.dimensions.height}</p>
              <p><strong>File Size:</strong> {(icon.fileSize / 1024).toFixed(1)}KB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
