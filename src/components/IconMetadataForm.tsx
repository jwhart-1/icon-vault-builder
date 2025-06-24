
import React from 'react';
import { useForm } from 'react-hook-form';
import { ExtractedIcon } from './SvgIconManager';
import { X } from 'lucide-react';

interface IconMetadataFormProps {
  icon: ExtractedIcon;
  onSave: (icon: ExtractedIcon) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  category: string;
  description: string;
  keywords: string;
  license: string;
  author: string;
}

export const IconMetadataForm: React.FC<IconMetadataFormProps> = ({
  icon,
  onSave,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: icon.name,
      category: icon.category,
      description: icon.description,
      keywords: icon.keywords.join(', '),
      license: icon.license,
      author: icon.author,
    },
  });

  const onSubmit = (data: FormData) => {
    const updatedIcon: ExtractedIcon = {
      ...icon,
      name: data.name,
      category: data.category,
      description: data.description,
      keywords: data.keywords.split(',').map(k => k.trim()).filter(k => k),
      license: data.license,
      author: data.author,
    };
    onSave(updatedIcon);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Icon Metadata</h3>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Icon Preview */}
        <div className="bg-slate-50 rounded-lg p-4 mb-4 flex items-center justify-center">
          <div
            className="w-16 h-16"
            dangerouslySetInnerHTML={{ __html: icon.svgContent }}
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name *
            </label>
            <input
              {...register('name', { required: 'Name is required' })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter icon name"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <input
              {...register('category')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. UI, Social, Navigation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe what this icon represents"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Keywords
            </label>
            <input
              {...register('keywords')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="search, find, magnify (comma separated)"
            />
            <p className="text-xs text-slate-500 mt-1">
              Separate keywords with commas for better search
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              License
            </label>
            <input
              {...register('license')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. MIT, CC0, Commercial"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Author
            </label>
            <input
              {...register('author')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Creator or source"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Icon
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
