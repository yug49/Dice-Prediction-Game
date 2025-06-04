"use client"

import {QueryClient, QueryClientProvider} from "@tanstack/react-query"
import {type ReactNode, useMemo} from "react"
import config from "@/privyConfig"
import {WagmiProvider} from "wagmi"
import {PrivyProvider} from '@privy-io/react-auth';
import {sepolia} from "viem/chains"

export function Providers(props: {children: ReactNode}) {
    // Use useMemo to prevent QueryClient recreation on re-renders
    const queryClient = useMemo(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Prevent refetching on window focus in development
                refetchOnWindowFocus: false,
            },
        },
    }), [])

    return (
      <PrivyProvider
          appId="cmbh57guu005djl0nm1vjk5be"
          config={{
            embeddedWallets: {
              ethereum: {
                createOnLogin: 'users-without-wallets'
              }
            },
            appearance: {
              theme: 'dark'
            },
            // Add default chain configuration
            defaultChain: sepolia
          }}
      >
          <WagmiProvider config={config}>
              <QueryClientProvider client={queryClient}>
                  {props.children}
              </QueryClientProvider>
          </WagmiProvider>
      </PrivyProvider>
    )
}