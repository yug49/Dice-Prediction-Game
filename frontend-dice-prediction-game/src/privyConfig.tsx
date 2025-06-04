"use client"

import {sepolia} from "wagmi/chains"
import {createConfig} from '@privy-io/wagmi';
import {http} from 'wagmi';

const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(
      process.env.SEPOLIA_RPC_URL
    )
  },
  // Explicitly set ssr to false to prevent hydration issues
  ssr: false,
  // Enable multiInjectedProviderDiscovery for better wallet detection
  multiInjectedProviderDiscovery: true,
  // Add batch configuration for better performance
  batch: {
    multicall: true,
  },
  // Don't add connectors when using Privy - Privy manages connections
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}

export default config;