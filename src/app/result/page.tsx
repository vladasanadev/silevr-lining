'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Copy, Share2 } from 'lucide-react';

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

const ResultPage = () => {
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
    
  // This function is now properly defined above
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            {isSigned ? 'Video Signed Successfully!' : 'Signing Your Video'}
          </h1>
          <p className="text-gray-400">
            {isSigned 
              ? 'Your video is now signed on the blockchain' 
              : 'This will only take a moment...'}
          </p>
        </div>

        {/* Video Preview */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden mb-8 border border-gray-800">
          <video 
            src="/sample-video.mp4" 
            className="w-full aspect-video bg-black"
            controls
            autoPlay
            muted
            loop
          />
        </div>

        {/* Signing Status */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-800">
          {!isSigned ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative mb-6">
                <div className="w-20 h-20 border-4 border-blue-500/20 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-t-4 border-blue-500 rounded-full animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-white">
                  {countdown}
                </div>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">
                Signing on Blockchain...
              </h3>
              <p className="text-gray-400 text-center max-w-md">
                Securely storing your video's signature on the blockchain. 
                This usually takes about 5 seconds.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Successfully Signed!
              </h3>
              <p className="text-gray-300 mb-6 max-w-md">
                Your video is now permanently verified on the blockchain.
              </p>
              
              {txHash && (
                <div className="w-full max-w-md bg-gray-800/50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Transaction Hash:</span>
                    <button 
                      onClick={copyToClipboard}
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
                    >
                      {hasCopied ? 'Copied!' : 'Copy'}
                      <Copy className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
                  <div className="font-mono text-sm text-gray-200 break-all">
                    {txHash}
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Button 
                  onClick={handleShare}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-12"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Video
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 border-gray-700 hover:bg-gray-800 text-white h-12"
                  onClick={handleBackToHome}
                >
                  Back to Home
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Video Info */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <div className="flex items-center mt-1">
                {isSigned ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-green-400">Signed on Blockchain</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-yellow-400">Signing in progress...</span>
                  </>
                )}
              </div>
            </div>
            {isSigned && txHash && (
              <div>
                <p className="text-sm text-gray-400">Transaction</p>
                <a 
                  href={`https://etherscan.io/tx/${txHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline text-sm flex items-center mt-1"
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
  );
}

export default ResultPage;