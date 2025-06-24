
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFilesUploaded: (files: File[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      toast({
        title: 'Invalid files',
        description: 'Please upload only SVG files',
        variant: 'destructive',
      });
    }

    if (acceptedFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...acceptedFiles]);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/svg+xml': ['.svg'],
    },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select at least one SVG file',
        variant: 'destructive',
      });
      return;
    }
    onFilesUploaded(selectedFiles);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {isDragActive ? 'Drop your SVG files here' : 'Upload SVG Files'}
          </h3>
          <p className="text-slate-500 mb-4">
            Drag and drop your SVG files here, or click to browse
          </p>
          <p className="text-sm text-slate-400">
            Supports multiple files • SVG format only
          </p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-slate-700 mb-3">
              Selected Files ({selectedFiles.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-700">{file.name}</p>
                      <p className="text-sm text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleUpload}
              className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Process Files ({selectedFiles.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
