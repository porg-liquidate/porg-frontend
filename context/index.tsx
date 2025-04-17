"use client";

import { wagmiAdapter, projectId } from "../config/index";
import { createAppKit } from "@reown/appkit";
import { mainnet, arbitrum, solana } from "@reown/appkit/networks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";

const queryClient = new QueryClient();

if (!projectId) {
  throw new Error("Project is not defined in .env file.");
}

const metadata = {
  name: "Prog",
  description: "One Click liquidation tool for DeFi",
  url: "https://example.com", // origin must match your domain & subdomain
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};


const modal = createAppKit({
    adapters: [wagmiAdapter],
    networks: [mainnet, arbitrum, solana],
    projectId,
    defaultNetwork: mainnet,
    themeMode: 'dark' // Optional - defaults to your Cloud configuration
})

export function ContextProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}