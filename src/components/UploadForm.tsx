'use client';
import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Video, File, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';

type FileWithPreview = File & {
  preview: string;
  type: 'image' | 'video' | 'other';
};

export default function UploadForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const mappedFiles = acceptedFiles.map(file => {
      const type = file.type.startsWith('image/') ? 'image' : 
                file.type.startsWith('video/') ? 'video' : 'other';
      
      const preview = type === 'image' ? URL.createObjectURL(file) : '';
      
      return Object.assign(file, {
        preview,
        type: type as 'image' | 'video' | 'other'
      }) as FileWithPreview;
    });
    
    setFiles(prev => [...prev, ...mappedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov'],
    },
    maxFiles: 5,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload and processing
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5; // Slower progress for better UX
      });
    }, 300);
    
    try {
      // Simulate API call for video generation
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
      
      // In a real app, you would upload the files and get a video URL back
      // For now, we'll use a placeholder video
      const videoUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      
      // Navigate to preview page with the video URL
      router.push(`/preview?videoUrl=${encodeURIComponent(videoUrl)}`);
      
      // Reset form
      setTitle('');
      setDescription('');
      setFiles([]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      clearInterval(interval);
      setIsUploading(false);
    }
  };

  // Clean up object URLs to avoid memory leaks
  React.useEffect(() => {
    return () => {
      files.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  const renderFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-5 w-5 text-blue-500" />;
      case 'video':
        return <Video className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Upload Your Content</h2>
        <p className="text-gray-600 dark:text-gray-300">Share your creativity with the world</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Prompt <span className="text-red-500">*</span>
          </label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your content"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            required
          />
        </div>
      
        
        <div className="space-y-4">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50 dark:bg-gray-800/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-2">
              <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isDragActive ? (
                  <p>Drop the files here ...</p>
                ) : (
                  <>
                    <p className="font-medium">Drag & drop files here, or click to select</p>
                    <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">Supports images and videos (max 100MB)</p>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            {files.length > 0 && (
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Selected files ({files.length})
              </h3>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {files.map((file, index) => (
                <div 
                  key={index}
                  className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  {file.type === 'image' ? (
                    <div className="aspect-square flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="object-cover w-full h-full"
                        onLoad={() => {
                          // Revoke the data uri to avoid memory leaks
                          URL.revokeObjectURL(file.preview);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-square flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 p-4">
                      {renderFileIcon(file.type)}
                      <p className="mt-2 text-xs text-center text-gray-600 dark:text-gray-300 truncate w-full px-2">
                        {file.name}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="p-2 text-xs text-gray-500 dark:text-gray-400">
                    <p className="truncate">{file.name}</p>
                    <p className="text-xs">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {isUploading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
        
        <div className="pt-2">
          <Button
            type="submit"
            className="w-full py-6 text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 rounded-lg shadow-lg relative overflow-hidden"
            disabled={isUploading || !title || files.length === 0}
          >
            {isUploading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Generating your story...</span>
                <span className="absolute bottom-0 left-0 h-1 bg-blue-400 transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }} />
              </div>
            ) : (
              'Generate Story'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
