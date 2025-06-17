'use client';
import { useEffect, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useRouter } from 'next/navigation';
import { ConnectWalletButton } from "@/components/simplekit";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

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

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-3.5">
      <main className="flex flex-col items-center gap-y-9">
        <div className="max-w-lg space-y-3.5 text-center">
          <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">
            Silver Lining
          </h1>
          <p className="md:text-balance text-muted-foreground md:text-xl">
            a platform for creators TikTok meets Verifiable AI
          </p>
        </div>
        <div className="flex items-center gap-3.5">
          <ThemeToggle />
          <ConnectWalletButton />
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
  );
}
