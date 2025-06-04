"use client";

import { useAccount, useBalance } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { sepolia } from 'wagmi/chains';

export const WalletDebugPanel = () => {
    const { ready, authenticated, user } = usePrivy();
    const { address, isConnected, chain } = useAccount();
    
    // Get the effective address (prioritize wagmi address, fallback to privy)
    const effectiveAddress = address || user?.wallet?.address;
    
    const { data: balance, isLoading: balanceLoading, error: balanceError } = useBalance({
        address: effectiveAddress as `0x${string}`,
        chainId: sepolia.id,
        query: {
            enabled: !!effectiveAddress && authenticated && ready,
        }
    });

    const isWalletReady = ready && authenticated && !!effectiveAddress;

    if (!ready || !authenticated) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-6 rounded-lg text-xs max-w-md z-50">
            <h3 className="font-bold mb-3">🐛 Wallet Debug</h3>
            <div className="space-y-2">
                <div>Ready: {ready ? '✅' : '❌'}</div>
                <div>Authenticated: {authenticated ? '✅' : '❌'}</div>
                <div>Is Connected: {isConnected ? '✅' : '❌'}</div>
                <div>Wagmi Address: {address || 'None'}</div>
                <div>Privy Address: {user?.wallet?.address || 'None'}</div>
                <div>Effective Address: {effectiveAddress || 'None'}</div>
                <div>Chain ID: {chain?.id || 'None'}</div>
                <div>Chain Name: {chain?.name || 'None'}</div>
                <div>Balance Loading: {balanceLoading ? '⏳' : '✅'}</div>
                <div>Balance Error: {balanceError ? '❌' : '✅'}</div>
                <div>Balance: {balance?.formatted || 'None'} ETH</div>
                <div>Wallet Ready: {isWalletReady ? '✅' : '❌'}</div>
                
                {/* Status Summary */}
                <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="font-bold text-yellow-300">Status:</div>
                    {!ready && <div className="text-red-300">⏳ Privy initializing...</div>}
                    {ready && !authenticated && <div className="text-red-300">❌ Not authenticated</div>}
                    {ready && authenticated && !effectiveAddress && <div className="text-red-300">❌ No wallet address</div>}
                    {ready && authenticated && effectiveAddress && !isConnected && <div className="text-blue-300">⚠️ Privy connected, Wagmi disconnected</div>}
                    {ready && authenticated && effectiveAddress && isConnected && <div className="text-green-300">✅ Fully connected</div>}
                </div>
                
                {balanceError && (
                    <div className="text-red-300 text-xs mt-3">
                        Error: {balanceError.message}
                    </div>
                )}
            </div>
        </div>
    );
};
