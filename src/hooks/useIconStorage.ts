
import { useState } from 'react';
import { supabase, IconRecord } from '@/lib/supabase';
import { ExtractedIcon } from '@/components/SvgIconManager';
import { useToast } from '@/hooks/use-toast';

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

  const loadIcons = async (): Promise<ExtractedIcon[]> => {
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

      return (data || []).map((record: IconRecord) => ({
        id: record.id,
        svgContent: record.svg_content,
        name: record.name,
        category: record.category || '',
        description: record.description || '',
        keywords: record.keywords || [],
        license: record.license || '',
        author: record.author || '',
        dimensions: record.dimensions || { width: 24, height: 24 },
        fileSize: record.file_size || 0,
      }));
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
