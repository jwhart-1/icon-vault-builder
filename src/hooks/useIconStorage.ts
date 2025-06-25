
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExtractedIcon, UnifiedIcon } from '@/components/SvgIconManager';
import { useToast } from '@/hooks/use-toast';

export interface IconRecord {
  id: string;
  name: string;
  svg_content: string;
  category?: string;
  description?: string;
  keywords?: string[];
  license?: string;
  author?: string;
  file_size?: number;
  dimensions?: { width: number; height: number };
  created_at: string;
  updated_at: string;
}

export interface CategoryRecord {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export const useIconStorage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const saveIcon = async (icon: ExtractedIcon): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('icons')
        .insert({
          name: icon.name,
          svg_content: icon.svgContent,
          category: icon.category || null,
          description: icon.description || null,
          keywords: icon.keywords.length > 0 ? icon.keywords : null,
          license: icon.license || null,
          author: icon.author || null,
          file_size: icon.fileSize,
          dimensions: icon.dimensions
        });

      if (error) {
        console.error('Error saving icon:', error);
        toast({
          title: 'Error saving icon',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Icon saved successfully',
        description: `${icon.name} has been saved to your library`,
      });
      return true;
    } catch (error) {
      console.error('Error saving icon:', error);
      toast({
        title: 'Error saving icon',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loadIcons = async (): Promise<UnifiedIcon[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('icons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading icons:', error);
        toast({
          title: 'Error loading icons',
          description: error.message,
          variant: 'destructive',
        });
        return [];
      }

      return (data || []).map((record): UnifiedIcon => {
        // Safely parse dimensions from Json type
        let dimensions = { width: 24, height: 24 };
        if (record.dimensions && typeof record.dimensions === 'object' && record.dimensions !== null) {
          const dims = record.dimensions as any;
          if (typeof dims.width === 'number' && typeof dims.height === 'number') {
            dimensions = { width: dims.width, height: dims.height };
          }
        }

        return {
          type: 'extracted' as const,
          id: record.id,
          svgContent: record.svg_content,
          name: record.name,
          category: record.category || '',
          description: record.description || '',
          keywords: record.keywords || [],
          license: record.license || '',
          author: record.author || '',
          dimensions,
          fileSize: record.file_size || 0,
        };
      });
    } catch (error) {
      console.error('Error loading icons:', error);
      toast({
        title: 'Error loading icons',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const deleteIcon = async (iconId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('icons')
        .delete()
        .eq('id', iconId);

      if (error) {
        console.error('Error deleting icon:', error);
        toast({
          title: 'Error deleting icon',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Icon deleted',
        description: 'Icon has been removed from your library',
      });
      return true;
    } catch (error) {
      console.error('Error deleting icon:', error);
      toast({
        title: 'Error deleting icon',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveIcon,
    loadIcons,
    deleteIcon,
    isLoading
  };
};
