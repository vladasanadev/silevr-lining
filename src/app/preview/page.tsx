'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function PreviewVideo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = searchParams.get('videoUrl');
  const title = searchParams.get('title');
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

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
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        zIndex: 0
      }}>
        {/* Background Image with Overlay */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}>
          <img
            src="https://s3.amazonaws.com/shecodesio-production/uploads/files/000/168/356/original/Screenshot_2025-06-18_at_17.38.36.png?1750273757"
            alt="Background"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(8px)',
              transform: 'scale(1.05)'
            }}
          />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.4)'
          }} />
        </div>
        
        {/* Content */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 2
        }}>
          <div className="text-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No video found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Please go back and generate a video first.</p>
            <Link href="/upload">
              <Button className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Upload
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      zIndex: 0
    }}>
      {/* Background Image with Overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1
      }}>
        <img
          src="https://s3.amazonaws.com/shecodesio-production/uploads/files/000/168/356/original/Screenshot_2025-06-18_at_17.38.36.png?1750273757"
          alt="Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(8px)',
            transform: 'scale(1.05)'
          }}
        />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.4)'
        }} />
      </div>
      
      {/* Content */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1rem',
        zIndex: 2,
        overflowY: 'auto'
      }}>
        <div className="w-full max-w-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl my-4">
          <div className="mb-6">
            <Link href="/upload">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Upload
              </Button>
            </Link>
            
            {/* Cloudinary Video Player */}
            <div className="w-full bg-white/90 dark:bg-gray-800/90 rounded-2xl p-6 shadow-2xl">
              <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                <iframe
                  src="https://player.cloudinary.com/embed/?cloud_name=dwylthr28&public_id=5144A9ED-D20C-505C-5668-0D80E65B6E96_ggqcyp&profile=cld-default"
                  width="100%"
                  height="100%"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    borderRadius: '0.5rem',
                    border: 'none'
                  }}
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="mt-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{title || 'Your Generated Video'}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">AI Generated Video</p>
              </div>
            </div>
          </div>
        
          <div className="p-4">
            <div className="flex flex-row justify-between items-center gap-4 w-full">
              <Button 
                variant="outline" 
                className="flex-1"
                disabled={isSigning}
              >
                Download
              </Button>
              <Button 
                className={`flex-1 ${isSigned ? 'bg-green-600 hover:bg-green-700' : 'bg-black text-white hover:bg-gray-800'}`}
                onClick={async () => {
                  if (isSigned) return;
                  setIsSigning(true);
                  // Simulate signing process
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  setIsSigned(true);
                  // Redirect to results page after a short delay
                  setTimeout(() => {
                    router.push(`/result?title=${encodeURIComponent(title || '')}&signed=true`);
                  }, 1000);
                }}
                disabled={isSigning}
              >
                {isSigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing...
                  </>
                ) : isSigned ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Signed!
                  </>
                ) : (
                  'Sign the Video'
                )}
              </Button>
            </div>
            {isSigned && (
              <div className="mt-4 text-green-600 dark:text-green-400 text-sm flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Video signed successfully! Redirecting to results...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
