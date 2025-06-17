'use client';
import React, { useState, useCallback } from 'react';
import { Upload, Video, Loader2, X, Sparkles } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { generateVideo, pollVideoStatus } from '@/lib/google-ai';

type FileWithPreview = File & {
  preview: string;
};

export default function UploadForm() {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState('');
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length) {
      const fileWithPreview = Object.assign(acceptedFiles[0], {
        preview: URL.createObjectURL(acceptedFiles[0])
      });
      setFile(fileWithPreview);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const removeFile = useCallback(() => {
    if (file) {
      URL.revokeObjectURL(file.preview);
      setFile(null);
    }
  }, [file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) return;
    
    setIsUploading(true);
    setStatus('Starting video generation...');
    setUploadProgress(10);
    
    try {
      console.log('Starting video generation with title:', title);
      console.log('Image file:', file);
      
      // Show processing state
      setStatus('Processing your image...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
      setUploadProgress(30);
      
      // Log the payload being sent
      const payload = {
        prompt: title,
        imageUrl: file.preview,
        aspectRatio: '16:9',
      };
      console.log('Sending payload to generateVideo:', payload);
      
      // Start the video generation
      setStatus('Creating your video (this may take a moment)...');
      const { jobId } = await generateVideo(payload);
      console.log('Video generation started with job ID:', jobId);
      
      setUploadProgress(50);
      setStatus('Generating your video. Please wait...');
      
      // Poll for status updates
      const videoUrl = await pollVideoStatus(jobId, 2000);
      
      setUploadProgress(90);
      setStatus('Finalizing your video...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to result page with the video URL
      console.log('Video generation complete, navigating to result page');
      router.push(`/result?videoUrl=${encodeURIComponent(videoUrl)}`);
      
    } catch (error) {
      console.error('Error in video generation process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate video';
      setStatus(`Error: ${errorMessage}`);
      setUploadProgress(0);
      
      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setStatus('');
      }, 5000);
    } finally {
      setIsUploading(false);
    }
  };

  // Clean up object URLs to avoid memory leaks
  React.useEffect(() => {
    return () => {
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
    };
  }, [file]);

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 mb-4">
            <Video className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">
            Create AI Video
          </h1>
          <p className="text-gray-400 max-w-md mx-auto">
            Upload an image and describe your vision. We'll turn it into an amazing video.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sm:p-8">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 block mb-2">
              Video Title
            </label>
            <div className="relative">
              <Input
                placeholder="Enter a title for your video"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isUploading}
                className="w-full bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 h-12 px-4 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 block mb-2">
              Upload Image
            </label>
            {file ? (
              <div className="relative group">
                <div className="relative aspect-video bg-gray-900/50 rounded-xl overflow-hidden border-2 border-gray-800 group-hover:border-purple-500/30 transition-all duration-300">
                  <img
                    src={file.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <button
                      type="button"
                      onClick={removeFile}
                      className="ml-auto bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                  isDragActive 
                    ? 'border-purple-500/50 bg-purple-500/5' 
                    : 'border-gray-800 hover:border-gray-700 bg-gray-900/30 hover:bg-gray-900/50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="p-3 rounded-full bg-gray-800/50 border border-gray-700">
                    <Upload className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-200">
                      {isDragActive ? 'Drop the image here' : 'Drag & drop an image'}
                    </p>
                    <p className="text-xs text-gray-500">
                      or click to select (JPG, PNG, WebP up to 10MB)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {status && (
            <div className="space-y-3 mt-6">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${
                    status.startsWith('Error') ? 'bg-red-500' : 'animate-pulse bg-purple-500'
                  }`} />
                  <span className={`font-medium ${
                    status.startsWith('Error') ? 'text-red-400' : 'text-gray-300'
                  }`}>
                    {status}
                  </span>
                </div>
                {uploadProgress > 0 && (
                  <span className="font-mono text-sm bg-gray-800/50 px-2 py-1 rounded">
                    {uploadProgress}%
                  </span>
                )}
              </div>
              {uploadProgress > 0 && (
                <div className="relative pt-1">
                  <div className="overflow-hidden h-1.5 rounded-full bg-gray-800/50">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            className={`w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl text-base shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-0.5 ${
              (isUploading || !title || !file) ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            disabled={isUploading || !title || !file}
          >
            {isUploading ? (
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 animate-spin text-white/80" />
                <span>Generating Your Video...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span>Generate Video</span>
              </div>
            )}
          </Button>
        </form>
        
        <div className="mt-12 text-center text-xs text-gray-500">
          <p>Your image will be sent to our AI to generate a unique video.</p>
          <p className="mt-1">Processing typically takes 1-3 minutes.</p>
        </div>
      </div>
    </div>
  );
}
