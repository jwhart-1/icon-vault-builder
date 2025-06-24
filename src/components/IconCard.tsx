
import React from 'react';
import { ExtractedIcon } from './SvgIconManager';

interface IconCardProps {
  icon: ExtractedIcon;
  onSave: (icon: ExtractedIcon) => void;
  onDelete: (iconId: string) => void;
  showMetadataForm: boolean;
  isLoading?: boolean;
}

export const IconCard: React.FC<IconCardProps> = ({ icon }) => {
  return (
    <div className="bg-white rounded-lg p-4 border-2 border-blue-500 m-2">
      <h3 className="font-bold mb-4 text-lg">{icon.name}</h3>
      
      {/* Test 1: Simple Black Square (Control Test) */}
      <div className="mb-4 p-2 border border-gray-300">
        <div className="text-sm font-semibold mb-2">🔹 Test 1: Simple Black Square (Should Always Work)</div>
        <div 
          className="w-16 h-16 border"
          dangerouslySetInnerHTML={{ 
            __html: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" fill="black"/></svg>' 
          }}
        />
      </div>

      {/* Test 2: Raw SVG Content */}
      <div className="mb-4 p-2 border border-gray-300">
        <div className="text-sm font-semibold mb-2">🔹 Test 2: Raw Original SVG</div>
        <div 
          className="w-16 h-16 border bg-gray-50"
          dangerouslySetInnerHTML={{ __html: icon.svgContent || 'NO CONTENT' }}
        />
      </div>

      {/* Test 3: Force Black Fill */}
      <div className="mb-4 p-2 border border-gray-300">
        <div className="text-sm font-semibold mb-2">🔹 Test 3: Force All Black</div>
        <div 
          className="w-16 h-16 border bg-gray-50"
          dangerouslySetInnerHTML={{ 
            __html: icon.svgContent
              ?.replace(/currentColor/g, 'black')
              ?.replace(/fill="[^"]*"/g, 'fill="black"')
              ?.replace(/stroke="[^"]*"/g, 'stroke="black"')
              ?.replace(/opacity="[^"]*"/g, '')
              || 'NO CONTENT'
          }}
        />
      </div>

      {/* Test 4: Simple Paths Only */}
      <div className="mb-4 p-2 border border-gray-300">
        <div className="text-sm font-semibold mb-2">🔹 Test 4: Extract Just Paths</div>
        <div 
          className="w-16 h-16 border bg-gray-50"
          dangerouslySetInnerHTML={{ 
            __html: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 100 100" fill="black">
              ${icon.svgContent?.match(/<path[^>]*>/g)?.slice(0, 3).join('') || '<rect x="10" y="10" width="80" height="80"/>'}
            </svg>`
          }}
        />
      </div>

      {/* Test 5: Data URL Method */}
      <div className="mb-4 p-2 border border-gray-300">
        <div className="text-sm font-semibold mb-2">🔹 Test 5: Data URL Method</div>
        <img 
          src={`data:image/svg+xml;base64,${btoa(
            icon.svgContent
              ?.replace(/currentColor/g, 'black')
              ?.replace(/fill="none"/g, 'fill="black"')
              ?.replace(/xmlns="[^"]*"/g, '')
              ?.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
              || '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="red"/></svg>'
          )}`}
          width="64" 
          height="64"
          className="border"
          onError={(e) => {
            console.log('Data URL failed for', icon.name);
            e.currentTarget.style.backgroundColor = 'red';
          }}
          onLoad={() => console.log('Data URL success for', icon.name)}
        />
      </div>

      {/* Test 6: Fallback Icon */}
      <div className="mb-4 p-2 border border-gray-300">
        <div className="text-sm font-semibold mb-2">🔹 Test 6: Fallback (Always Works)</div>
        <div 
          className="w-16 h-16 flex items-center justify-center text-white font-bold text-xl"
          style={{ 
            backgroundColor: `hsl(${icon.name.charCodeAt(0) * 137.5 % 360}, 70%, 50%)`,
            borderRadius: '8px'
          }}
        >
          {icon.name.slice(-1).toUpperCase()}
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-4 p-2 bg-gray-100 text-xs">
        <div><strong>Content Length:</strong> {icon.svgContent?.length || 0}</div>
        <div><strong>Has &lt;svg&gt;:</strong> {icon.svgContent?.includes('<svg') ? 'YES' : 'NO'}</div>
        <div><strong>Has paths:</strong> {icon.svgContent?.includes('<path') ? 'YES' : 'NO'}</div>
        <div><strong>File Size:</strong> {icon.fileSize} bytes</div>
      </div>
    </div>
  );
};
