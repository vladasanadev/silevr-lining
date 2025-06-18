'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, CheckCircle2, Copy, Share2, RefreshCw } from 'lucide-react';
import FallingStars from '@/components/FallingStars';

// Ensure TypeScript recognizes JSX
type ReactNode = React.ReactNode;

// Mock function to simulate blockchain signing
const simulateBlockchainSign = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        txHash: '0x' + Math.random().toString(16).substring(2, 66),
        timestamp: new Date().toISOString()
      });
    }, 5000); // 5 second delay to simulate blockchain
  });
};

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const title = searchParams.get('title') || 'Your Generated Video';
  
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [txHash, setTxHash] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  // Handle the sign video process
  const handleSignVideo = useCallback(async () => {
    if (isSigned) return;
    
    setIsSigning(true);
    
    // Start countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      // Simulate blockchain signing
      const result: any = await simulateBlockchainSign();
      
      if (result.success) {
        setTxHash(result.txHash);
        setIsSigned(true);
      }
    } catch (error) {
      console.error('Error signing video:', error);
    } finally {
      setIsSigning(false);
      clearInterval(timer);
    }
  }, [isSigned]);

  // Auto-start signing when page loads
  useEffect(() => {
    handleSignVideo();
  }, [handleSignVideo]);

  // Handle copy to clipboard
  const copyToClipboard = () => {
    if (!txHash) return;
    navigator.clipboard.writeText(txHash);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  // Handle share
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out my video',
          text: `I just created "${title}" on Silver Lining`,
          url: window.location.href,
        });
      } else {
        copyToClipboard();
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };
  
  // Handle back to home
  const handleBackToHome = () => {
    router.push('/');
  };
  
  // Handle create another
  const handleCreateAnother = () => {
    router.push('/upload');
  };
    
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Background with Blur */}
      <div className="fixed inset-0 overflow-hidden">
        <img
          src="https://s3.amazonaws.com/shecodesio-production/uploads/files/000/168/356/original/Screenshot_2025-06-18_at_17.38.36.png?1750273757"
          alt="Background"
          className="w-full h-full object-cover"
          style={{
            filter: 'blur(8px) brightness(0.5)',
            WebkitFilter: 'blur(8px) brightness(0.5)',
            transform: 'scale(1.1)'
          }}
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen w-full flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
            {/* Left Column - Video and Signing Status */}
            <div className="space-y-6">
              {/* Video Preview */}
              <div className="w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
                <div className="relative w-full" style={{ aspectRatio: '9/16' }}>
                  <video
                    src="https://res.cloudinary.com/dwylthr28/video/upload/v1620000000/5144A9ED-D20C-505C-5668-0D80E65B6E96_ggqcyp.mp4"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="mt-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{title}</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">AI Generated Video</p>
                </div>
              </div>
              
              {/* Success Status - Only show in left column when signed */}
              {isSigned && (
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-green-400 text-sm font-medium">Successfully Signed</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Verification Details */}
            <div className="flex flex-col justify-start space-y-6">
              {/* Signing Status - Moved to top of right column */}
              {!isSigned && (
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="relative mb-4">
                      <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 border-t-4 border-blue-500 rounded-full animate-spin"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-bold text-white">
                        {countdown}
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      Signing on Blockchain...
                    </h3>
                    <p className="text-gray-400 text-center text-sm">
                      Securely storing your video's signature on the blockchain.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Video Successfully Signed!</h2>
                  <p className="text-gray-300 mb-6">
                    Your video is now permanently verified on the blockchain.
                  </p>
                </div>

                {txHash && (
                  <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400 font-medium">Transaction Hash:</span>
                      <button
                        onClick={copyToClipboard}
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                      >
                        {hasCopied ? 'Copied!' : 'Copy'}
                        <Copy className="ml-1 h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3 font-mono text-sm text-gray-300 break-all">
                      {txHash}
                    </div>
                  </div>
                )}

                <div className="flex flex-col space-y-3">
                  <Button 
                    onClick={handleShare}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Video
                  </Button>
                  <Button 
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                    onClick={handleCreateAnother}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Create Another
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-white hover:bg-gray-800/30"
                    onClick={handleBackToHome}
                  >
                    Back to Home
                  </Button>
                </div>
                
                {isSigned && txHash && (
                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <p className="text-sm text-gray-400 mb-2">Transaction Details</p>
                    <a 
                      href={`https://etherscan.io/tx/${txHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline text-sm flex items-center"
                    >
                      View on Explorer
                      <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
