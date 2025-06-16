'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PreviewVideo() {
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = searchParams.get('videoUrl');

  useEffect(() => {
    // Auto-play the video when the component mounts
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error('Auto-play failed:', error);
      });
    }
  }, []);

  if (!videoUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No video found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please go back and generate a video first.</p>
          <Link href="/upload">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Upload
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/upload">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Upload
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your Generated Story</h1>
          <p className="text-gray-600 dark:text-gray-400">Here's your AI-generated video story</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            autoPlay
            loop
            className="w-full aspect-video bg-black"
          >
            Your browser does not support the video tag.
          </video>
          
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Story</h2>
              <div className="flex space-x-2">
                <Button variant="outline">
                  Download
                </Button>
                <Button>Share</Button>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              This is your AI-generated video story. You can download it or share it with others.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
