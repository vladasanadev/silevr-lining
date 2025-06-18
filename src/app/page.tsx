'use client';
import { useEffect, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useRouter } from 'next/navigation';
import { ConnectWalletButton } from "@/components/simplekit";
import { ThemeToggle } from "./theme-toggle";
import Link from "next/link";
import { IDKitWidget, VerificationLevel, ISuccessResult } from '@worldcoin/idkit';
import SplineCanvas from '@/components/SplineCanvas';
import { Button } from "@/components/ui/button";

export default function Home() {
  const [isResetting, setIsResetting] = useState(true);
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  // Handle wallet disconnection on mount
  useEffect(() => {
    // Only run this in the browser
    if (typeof window === 'undefined') return;

    // Check if we've already processed the disconnection
    if (sessionStorage.getItem('walletDisconnected')) {
      sessionStorage.removeItem('walletDisconnected');
      return;
    }

    // Mark that we're processing disconnection
    sessionStorage.setItem('walletDisconnected', 'true');

    const disconnectWallet = async () => {
      try {
        console.log('Disconnecting wallet...');
        await disconnect();
        
        // Clear wagmi-related localStorage keys
        const wagmiKeys = Object.keys(localStorage).filter(key => key.startsWith('wagmi'));
        wagmiKeys.forEach(key => localStorage.removeItem(key));
        
        // Clear common wallet connection keys
        ['walletconnect', 'WEB3_CONNECT_CACHED_PROVIDER'].forEach(key => {
          localStorage.removeItem(key);
        });
        
        console.log('Wallet disconnected successfully');
      } catch (error) {
        console.error('Error disconnecting wallet:', error);
      } finally {
        // Remove the flag after a short delay to allow the disconnection to complete
        setTimeout(() => {
          sessionStorage.removeItem('walletDisconnected');
          setIsResetting(false);
        }, 1000);
      }
    };

    disconnectWallet();
    
    // Cleanup function
    return () => {
      // Cleanup if component unmounts
      sessionStorage.removeItem('walletDisconnected');
    };
  }, []);
  
  // Handle redirection if connected
  useEffect(() => {
    if (isConnected && !isResetting) {
      console.log('Wallet connected, redirecting to /upload');
      router.push('/upload');
    }
  }, [isConnected, isResetting, router]);

  const verifyProof = async (proof: ISuccessResult) => {
    console.log('Proof received from IDKit, sending to backend for verification:', proof);
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proof), // Send the entire proof object from IDKit
      });

      const data = await response.json();

      if (response.ok) {
        if (data.verified) {
          console.log('Proof successfully verified by the backend!');
          // TODO: Implement next steps after successful backend verification
          // e.g., redirect to a protected page, update UI state
          alert("Verification Successful!");
          // onSuccess(); // You can call your existing onSuccess or a new function
        } else {
          console.warn('Proof verification failed by the backend:', data.error || 'Unknown reason');
          alert(`Verification Failed: ${data.error || 'The proof could not be verified by the server.'}`);
        }
      } else {
        console.error('Error calling verification API:', data.error || response.statusText);
        alert(`API Error: ${data.error || 'Failed to contact verification server.'}`);
      }
    } catch (error) {
      console.error('Network or other error in verifyProof:', error);
      alert(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // This onSuccess is for the IDKitWidget itself, when it successfully generates a proof.
  // The actual backend verification result is handled within verifyProof.
  const onIDKitSuccess = (result: ISuccessResult) => {
    console.log("IDKitWidget successfully generated a proof:", result);
    // The handleVerify (verifyProof) function will be called with this result automatically.
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-black">
      {/* Spline Background - Full Viewport */}
      <div className="fixed inset-0 w-full h-full z-0">
        <SplineCanvas 
          splineUrl="https://prod.spline.design/XV8wjbIwMthxrmpw/scene.splinecode"
          className="w-full h-full"
          onLoaded={() => console.log('Spline scene loaded')}
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-3.5">
      <main className="flex flex-col items-center gap-y-9">
        <div className="max-w-lg space-y-3.5 text-center">
          <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">
            Silver Lining
          </h1>
          <p className="md:text-balance text-muted-foreground md:text-xl">
            you own your content
          </p>
        </div>
        <div className="flex items-center gap-3.5">

          <div className="flex items-center gap-3.5">
            <ConnectWalletButton />
            <IDKitWidget
              app_id="app_staging_781083c0ffb00f545b52ebff3a8fcbf8"
              action="login-with-silver-lining"
              verification_level={VerificationLevel.Device}
              handleVerify={verifyProof}
              onSuccess={onIDKitSuccess}>
              {({ open }) => (
                <Button 
                  onClick={open}
                  className="rounded-xl"
                >
                  Verify with World ID
                </Button>
              )}
            </IDKitWidget>
          </div>
          <Link href="https://github.com/vaunblu/SimpleKit" target="_blank">
            {/* <Button variant="ghost" className="rounded-xl">
              GitHub &rarr;
            </Button> */}
          </Link>
        </div>
      </main>

      <footer className="absolute bottom-3.5 mx-auto flex items-center gap-[0.5ch] text-center text-muted-foreground">
      </footer>
      </div>
    </div>
  );
}
