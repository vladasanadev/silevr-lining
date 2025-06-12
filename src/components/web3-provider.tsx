"use client";

// 1. Import modules
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, http, createConfig } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected, coinbaseWallet, walletConnect } from "wagmi/connectors";
import { SimpleKitProvider } from "@/components/simplekit";

// WalletConnect Project ID from cloud.reown
const projectId = "a4bd260f29eb7d7fbcc2fd92b95a6a9a";

// 2. Define your Wagmi config
const config = createConfig({
  chains: [mainnet],
  connectors: [
    injected({ target: "metaMask" }),
    coinbaseWallet(),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http(),
  },
});

// 3. Initialize your new QueryClient
const queryClient = new QueryClient();

// 4. Create your Wagmi provider
export function Web3Provider(props: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <SimpleKitProvider>{props.children}</SimpleKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
