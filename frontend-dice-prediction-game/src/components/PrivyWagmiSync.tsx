"use client";

import { usePrivy } from '@privy-io/react-auth';
import { useConnect, useAccount, useDisconnect } from 'wagmi';
import { useEffect } from 'react';

export const PrivyWagmiSync = () => {
    const { ready, authenticated, user } = usePrivy();
    const { connect, connectors } = useConnect();
    const { isConnected, address } = useAccount();
    const { disconnect } = useDisconnect();

    // Sync Privy authentication with wagmi connection
    useEffect(() => {
        if (ready && authenticated && user?.wallet?.address && !isConnected && connectors.length > 0) {
            // Try to connect with the first available connector
            const connector = connectors[0];
            if (connector) {
                console.log('Connecting wagmi with connector:', connector.name);
                try {
                    connect({ connector });
                } catch (error) {
                    console.error('Failed to connect wagmi:', error);
                }
            }
        } else if (ready && !authenticated && isConnected) {
            // If Privy is not authenticated but wagmi is connected, disconnect wagmi
            console.log('Disconnecting wagmi as Privy is not authenticated...');
            disconnect();
        }
    }, [ready, authenticated, user?.wallet?.address, isConnected, connect, disconnect, connectors]);

    // Debug logging
    useEffect(() => {
        if (ready) {
            console.log('PrivyWagmiSync state:', {
                privyReady: ready,
                privyAuthenticated: authenticated,
                privyAddress: user?.wallet?.address,
                wagmiConnected: isConnected,
                wagmiAddress: address,
                connectorsCount: connectors.length,
                connectorNames: connectors.map(c => c.name),
            });
        }
    }, [ready, authenticated, user?.wallet?.address, isConnected, address, connectors]);

    return null; // This is a utility component
};
