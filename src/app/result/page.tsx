'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createPublicClient, http } from 'viem';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { signVideo, isVideoSigned, getVideoSignature } from '@/lib/contract';

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
  const [isCheckingSignature, setIsCheckingSignature] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<any>(null);
  const videoHash = '0x' + Math.random().toString(16).substring(2, 66);
  
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const router = useRouter();
  
  // Check if video is already signed on mount
  useEffect(() => {
    const checkSignature = async () => {
      if (isConnected && videoHash && publicClient) {
        try {
          setIsCheckingSignature(true);
          const signed = await isVideoSigned(publicClient, videoHash);
          setIsSigned(signed);
          
          if (signed) {
            const sigData = await getVideoSignature(publicClient, videoHash);
            setSignatureData(sigData);
          }
        } catch (error) {
          console.error('Error checking signature:', error);
          setVideoState(prev => ({ ...prev, error: 'Failed to check video signature' }));
        } finally {
          setIsCheckingSignature(false);
        }
      }
    };
    
    checkSignature();
  }, [isConnected, videoHash, publicClient]);

  // Handle the sign message button click
  const handleSignMessage = async () => {
    if (!isConnected || !walletClient) {
      alert('Please connect your wallet first');
      return;
    }
    
    if (!videoState.url) {
      alert('No video available to sign');
      return;
    }
    
    if (isSigned) {
      alert('This video has already been signed');
      return;
    }
    
    try {
      setIsSigning(true);
      setVideoState(prev => ({
        ...prev,
        loading: true,
        error: null
      }));
      
      // In a real app, you would sign an actual message hash
      // This is just a placeholder for demonstration
      const signature = await walletClient.signMessage({
        account: address!,
        message: `Signing video: ${videoHash}`,
      });
      
      // Send the signature to the contract using the wallet client
      const tx = await signVideo(walletClient, videoHash, signature);
      setTxHash(tx);
      console.log('Transaction hash:', tx);
      
      // Wait for the transaction to be mined (optional)
      const publicClient = createPublicClient({
        chain: walletClient.chain,
        transport: http()
      });
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
        confirmations: 1
      });
      console.log('Transaction mined in block:', receipt.blockNumber);
      
      // Update UI
      setIsSigned(true);
      const sigData = await getVideoSignature(publicClient, videoHash);
      setSignatureData(sigData);
      
      setVideoState(prev => ({
        ...prev,
        loading: false
      }));
      
    } catch (error) {
      console.error('Error signing video:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign video';
      setVideoState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
      alert(`Error: ${errorMessage}`);
    } finally {
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

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Generated Video</h1>
          <p className="text-gray-400">Your video has been successfully generated and is ready to view.</p>
        </header>

        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
            {videoState.url ? (
              <video 
                src={videoState.url} 
                controls 
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Error loading video:', e);
                  setVideoState(prev => ({ ...prev, error: 'Failed to load video' }));
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <p className="text-gray-500">No video available</p>
              </div>
            )}
          </div>
          {/* Signature Status */}
          <div className="mb-6 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <h3 className="text-lg font-medium mb-3">Blockchain Verification</h3>
            
            {isCheckingSignature ? (
              <div className="flex items-center space-x-2 text-gray-400">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Checking signature status...</span>
              </div>
            ) : isSigned ? (
              <div className="space-y-3">
                <div className="flex items-center text-green-400">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>This video is verified on the blockchain</span>
                </div>
                {signatureData && (
                  <div className="mt-3 space-y-2 text-sm">
                    <p><span className="text-gray-400">Signed by:</span> {signatureData.signer}</p>
                    <p><span className="text-gray-400">Timestamp:</span> {new Date(signatureData.timestamp * 1000).toLocaleString()}</p>
                    {txHash && (
                      <p className="break-all">
                        <span className="text-gray-400">Transaction:</span>{' '}
                        <a 
                          href={`https://etherscan.io/tx/${txHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          View on Etherscan
                        </a>
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-yellow-400">This video is not yet verified on the blockchain</p>
                <Button 
                  onClick={handleSignMessage}
                  disabled={isSigning || !isConnected}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full"
                >
                  {isSigning ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing...
                    </span>
                  ) : 'Sign & Verify on Blockchain'}
                </Button>
                {!isConnected && (
                  <p className="text-sm text-gray-400">Connect your wallet to verify this video on the blockchain</p>
                )}
              </div>
            )}
          </div>

          {/* Video Hash */}
          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Video Hash</h3>
            <p className="font-mono text-sm text-gray-300 break-all">{videoHash}</p>
            
            {isSigned && signatureData?.signature && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Signature</h3>
                <p className="font-mono text-xs text-gray-400 break-all">{signatureData.signature}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-700 w-full flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex gap-4 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="text-gray-300 hover:text-white border-gray-600 hover:border-white w-full sm:w-auto"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
              </Button>
              
              <Button
                onClick={() => router.push('/')}
                className="bg-gray-700 hover:bg-gray-600 text-white w-full sm:w-auto"
              >
                Back to Home
              </Button>
            </div>
            
            <Link 
              href="/upload" 
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors w-full sm:w-auto"
            >
              Create Another
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}