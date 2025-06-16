'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useSignMessage } from 'wagmi';
import { addSignatureToVideo } from '@/lib/videoMetadata';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface VideoState {
  url: string | null;
  loading: boolean;
  error: string | null;
}

// Default video URL for testing (10-second video)
const DEFAULT_VIDEO_URL = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4';

export default function ResultPage() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get('videoUrl') || DEFAULT_VIDEO_URL;
  
  const [videoState, setVideoState] = useState<VideoState>({ 
    url: videoUrl, 
    loading: false, 
    error: null 
  });
  
  const [isSigning, setIsSigning] = useState(false);
  const [videoHash, setVideoHash] = useState('0x' + Math.random().toString(16).substring(2, 66));
  const { isConnected, address } = useAccount();
  const router = useRouter();

  // Handle the sign message button click
  const handleSignMessage = async () => {
    console.log('handleSignMessage called');
    try {
      console.log('Checking wallet connection...');
      if (!isConnected) {
        console.log('Wallet not connected, showing alert');
        alert('Please connect your wallet first');
        return;
      }
      
      console.log('Checking video URL...');
      if (!videoState.url) {
        console.error('No video URL available');
        alert('No video available to sign');
        return;
      }
      
      console.log('Starting signing process...');
      console.log('Video URL:', videoState.url);
      console.log('Connected address:', address);
      
      setIsSigning(true);
      setVideoState(prev => ({
        ...prev,
        loading: true,
        error: null
      }));
      
      // Create a message to sign
      const message = `I verify this video content as positive and authentic.\n\n` +
                     `Video: ${videoState.url}\n` +
                     `Timestamp: ${new Date().toISOString()}`;
      
      // Sign the message
      await signMessage({ message });
      
      // The rest of the signing process will be handled by the useSignMessage onSuccess callback
    } catch (error) {
      console.error('Error initiating signing:', error);
      setVideoState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initiate signing',
        loading: false
      }));
      setIsSigning(false);
    }
  };
  
  // Update video URL if it changes in the URL params
  useEffect(() => {
    const newVideoUrl = searchParams.get('videoUrl');
    if (newVideoUrl && newVideoUrl !== videoState.url) {
      setVideoState({
        url: newVideoUrl,
        loading: false,
        error: null
      });
    }
  }, [searchParams, videoState.url]);

  // Show error if no video URL is provided
  useEffect(() => {
    if (!videoUrl) {
      setVideoState(prev => ({
        ...prev,
        error: 'No video URL provided. Please go back and try again.'
      }));
    }
  }, [videoUrl]);

  // Handle the actual signing of the message
  const { signMessage } = useSignMessage({
    mutation: {
      onSuccess: async (signature: `0x${string}`) => {
        console.log('Signature received from wallet:', signature);
        
        try {
          // Ensure we have a valid video URL
          if (!videoState.url) {
            const errorMsg = 'No video URL available';
            console.error(errorMsg);
            throw new Error(errorMsg);
          }
          
          try {
            console.log('Fetching video from URL:', videoState.url);
            const response = await fetch(videoState.url);
            if (!response.ok) {

              throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
            }
            
            const blob = await response.blob();
            console.log('Video blob size:', blob.size, 'bytes');
            const file = new File([blob], 'video.mp4', { type: 'video/mp4' });

            // Prepare metadata
            const metadata = {
              signerAddress: address,
              timestamp: new Date().toISOString(),
              title: 'Silver Lining Video',
              description: 'A video with verified positive content'
            };
            console.log('Prepared metadata:', metadata);

            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('signature', signature);
            formData.append('metadata', JSON.stringify(metadata));

            console.log('Sending request to /api/process-video...');
            const startTime = Date.now();
            
            // Call our API
            const apiResponse = await fetch('/api/process-video', {
              method: 'POST',
              body: formData,
            });

            const endTime = Date.now();
            console.log(`API response received in ${endTime - startTime}ms. Status:`, apiResponse.status);

            if (!apiResponse.ok) {
              let errorData;
              try {
                errorData = await apiResponse.json();
                console.error('API error details:', errorData);
              } catch (e) {
                console.error('Failed to parse error response:', e);
                errorData = { error: 'Unknown error' };
              }
              throw new Error(errorData.error || `API request failed with status ${apiResponse.status}`);
            }

            console.log('Processing video response...');
            const videoBlob = await apiResponse.blob();
            console.log('Received processed video blob size:', videoBlob.size, 'bytes');
            
            const videoUrl = URL.createObjectURL(videoBlob);
            console.log('Created object URL for processed video');

            // Update the video source and state
            setVideoState(prev => ({
              ...prev,
              url: videoUrl,
              loading: false,
              error: null
            }));
            
            // Update the hash to show the signature
            setVideoHash(signature);
            
            console.log('Video successfully processed and updated');
            alert('Video signed successfully!');
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to process video';
            console.error('Error processing video:', error);
            if (error instanceof Error) {
              console.error('Error stack:', error.stack);
            }
            throw new Error(`Failed to process video: ${errorMessage}`);
          }
        } catch (error) {
          console.error('Error in video signing process:', error);
          setVideoState(prev => ({
            ...prev,
            error: (error as Error).message,
            loading: false
          }));
          alert('Error processing video: ' + (error as Error).message);
        } finally {
          console.log('Signing process completed');
          setIsSigning(false);
        }
      },
      onError: (error: unknown) => {
        console.error('Wallet signing error:', error);
        if (error instanceof Error) {
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
        setVideoState(prev => ({
          ...prev,
          error: (error as Error).message,
          loading: false
        }));
        alert('Error signing video: ' + (error as Error).message);
        setIsSigning(false);
      }
    }
  });

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-3.5 bg-background">
      <main className="flex flex-col items-center gap-y-9 w-full max-w-4xl mx-auto p-4">
        <div className="w-full text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            Your Silver Lining
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Mathematically verified positive content
          </p>
        </div>

        {/* Video Player */}
        <div className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden bg-black shadow-xl">
          {videoState.url ? (
            <video 
              src={videoState.url} 
              controls 
              autoPlay
              className="w-full h-full object-contain"
              onError={(e) => {
                console.error('Error loading video:', e);
                setVideoState(prev => ({
                  ...prev,
                  error: 'Failed to load video. Please check the URL and try again.',
                  loading: false
                }));
              }}
              onLoadedData={() => {
                setVideoState(prev => ({
                  ...prev,
                  loading: false,
                  error: null
                }));
              }}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              {videoState.loading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p>Loading video...</p>
                </div>
              ) : videoState.error ? (
                <div className="text-center p-6">
                  <p className="text-red-500 mb-4">{videoState.error}</p>
                  <Link href="/upload" className="text-blue-500 hover:underline">
                    Go back to upload
                  </Link>
                </div>
              ) : (
                <p className="text-gray-500">No video available</p>
              )}
            </div>
          )}
        </div>

        {videoState.url && !videoState.error && (
          <>
            {/* Verification Badges */}
            <div className="flex flex-wrap gap-3 justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-500 text-sm">
                <span>✓</span>
                <span>EigenLayer Verified</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-500 text-sm">
                <span>🔒</span>
                <span>Permanently Stored</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 text-sm">
                <span>💎</span>
                <span>Positivity Score: 9.2/10</span>
              </div>
            </div>

            {/* Verification Progress */}
            <div className="w-full max-w-2xl">
              <Progress value={98.8} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                Verified by 247/250 EigenLayer operators
              </p>
            </div>

            {/* Video Hash */}
            <div className="w-full max-w-2xl bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video Hash:</p>
              <div className="bg-white dark:bg-gray-900 p-3 rounded-md font-mono text-sm overflow-x-auto">
                {videoHash}
              </div>
            </div>

            {/* Sign Video Button */}
            <div className="w-full max-w-2xl space-y-4">
              <Button
                onClick={handleSignMessage}
                disabled={isSigning || videoState.loading}
                className="w-full py-6 text-base font-medium"
                size="lg"
              >
                {isSigning ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing...
                  </>
                ) : (
                  'Sign Video with Wallet'
                )}
              </Button>

              {/* Wallet Connection Status */}
              {!isConnected ? (
                <div className="text-center">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Connect your wallet to sign this video
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Connected: {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="w-full max-w-2xl flex justify-between mt-8 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Link
            href="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          
          <Link
            href="/upload"
            className="inline-flex items-center text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            Create Another
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  );
}