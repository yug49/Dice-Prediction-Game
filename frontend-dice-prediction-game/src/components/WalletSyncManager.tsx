"use client";

import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useSwitchChain } from 'wagmi';
import { useEffect } from 'react';
import { sepolia } from 'wagmi/chains';

export const WalletSyncManager = () => {
    const { ready, authenticated, user } = usePrivy();
    const { address, isConnected, chain } = useAccount();
    const { switchChain } = useSwitchChain();

    // Auto-switch to Sepolia if connected but on wrong network
    useEffect(() => {
        if (isConnected && chain && chain.id !== sepolia.id) {
            console.log('Auto-switching to Sepolia network...');
            switchChain({ chainId: sepolia.id });
        }
    }, [isConnected, chain, switchChain]);

    // Debug connection state
    useEffect(() => {
        if (ready && authenticated) {
            console.log('WalletSyncManager:', {
                privyReady: ready,
                privyAuthenticated: authenticated,
                privyAddress: user?.wallet?.address,
                wagmiConnected: isConnected,
                wagmiAddress: address,
                chainId: chain?.id,
                chainName: chain?.name,
                needsSync: !isConnected && !!user?.wallet?.address
            });
        }
    }, [ready, authenticated, user?.wallet?.address, isConnected, address, chain]);

    return null; // This is a utility component with no UI
};
