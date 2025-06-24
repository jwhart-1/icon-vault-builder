
import React from 'react';

interface SvgAnalysisResult {
  totalElements: number;
  groups: number;
  paths: number;
  symbols: number;
  useElements: number;
  hasViewBox: boolean;
  dimensions: { width: number; height: number };
  structure: string[];
}

interface SvgAnalyzerProps {
  svgContent: string;
  onAnalysisComplete: (result: SvgAnalysisResult) => void;
}

export const SvgAnalyzer: React.FC<SvgAnalyzerProps> = ({ svgContent, onAnalysisComplete }) => {
  React.useEffect(() => {
    const analyzeSVG = (content: string): SvgAnalysisResult => {
      console.log("=== SVG ANALYSIS START ===");
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'image/svg+xml');
      const svg = doc.querySelector('svg');
      
      if (!svg) {
        console.error("No SVG element found");
        return {
          totalElements: 0,
          groups: 0,
          paths: 0,
          symbols: 0,
          useElements: 0,
          hasViewBox: false,
          dimensions: { width: 0, height: 0 },
          structure: []
        };
      }

      const groups = svg.querySelectorAll('g').length;
      const paths = svg.querySelectorAll('path').length;
      const symbols = svg.querySelectorAll('symbol').length;
      const useElements = svg.querySelectorAll('use').length;
      const hasViewBox = svg.hasAttribute('viewBox');
      
      // Get dimensions
      const viewBox = svg.getAttribute('viewBox');
      let width = 24, height = 24;
      if (viewBox) {
        const [, , w, h] = viewBox.split(' ').map(Number);
        width = w || 24;
        height = h || 24;
      }

      // Analyze structure
      const structure: string[] = [];
      Array.from(svg.children).forEach((child, i) => {
        const childInfo = `${child.tagName}: ${child.children.length} children`;
        structure.push(childInfo);
        console.log(`Child ${i}:`, childInfo);
      });

      const result = {
        totalElements: groups + paths + symbols + useElements,
        groups,
        paths,
        symbols,
        useElements,
        hasViewBox,
        dimensions: { width, height },
        structure
      };

      console.log("Analysis Result:", result);
      console.log("=== SVG ANALYSIS END ===");
      
      return result;
    };

    const result = analyzeSVG(svgContent);
    onAnalysisComplete(result);
  }, [svgContent, onAnalysisComplete]);

  return null; // This is a utility component with no UI
};
