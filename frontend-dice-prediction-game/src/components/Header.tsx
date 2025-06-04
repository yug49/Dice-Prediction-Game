"use client";

import { useConnectOrCreateWallet, useLogout, usePrivy, useLogin } from '@privy-io/react-auth';
import { useAccount, useBalance } from 'wagmi';
import { FaGithub } from "react-icons/fa";
import { sepolia } from 'wagmi/chains';
import { useEffect } from 'react';

const Header: React.FC = () => {
    const { connectOrCreateWallet } = useConnectOrCreateWallet();
    const { logout } = useLogout();
    const { login } = useLogin();
    const { ready, authenticated, user } = usePrivy();
    const { address, isConnected, chain } = useAccount();
    
    // Get the effective address (prioritize wagmi address, fallback to privy)
    const effectiveAddress = address || user?.wallet?.address;
    
    const { 
        data: balance, 
        isLoading: balanceLoading, 
        error: balanceError,
        refetch: refetchBalance 
    } = useBalance({
        address: effectiveAddress as `0x${string}`,
        chainId: sepolia.id,
        query: {
            enabled: !!effectiveAddress && authenticated && ready,
            refetchInterval: 10000, // Refetch every 10 seconds
            retry: 3,
        }
    });

    // Refetch balance when wallet connects or address changes
    useEffect(() => {
        if (effectiveAddress && authenticated && ready) {
            const timer = setTimeout(() => {
                refetchBalance();
            }, 1000); // Small delay to ensure wallet is fully connected
            
            return () => clearTimeout(timer);
        }
    }, [effectiveAddress, authenticated, ready, refetchBalance]);

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const formatBalance = (balance: string) => {
        return parseFloat(balance).toFixed(4);
    };

    const handleConnect = () => {
        if (!authenticated) {
            login();
        } else {
            connectOrCreateWallet();
        }
    };

    const handleDisconnect = () => {
        logout();
    };

    // Wait for Privy to be ready before rendering wallet state
    if (!ready) {
        return (
            <header className="flex justify-between items-center p-4 bg-blue-900/30 backdrop-blur-md border-b border-blue-300/20 shadow-sm">
                <div className="flex items-center gap-4">
                    <a 
                        href="https://github.com/yug49/Dice-Prediction-Game" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-200 hover:text-white hover:cursor-pointer transition-colors"
                    >
                        <FaGithub size={24} />
                    </a>
                    <h1 className="text-xl font-bold text-white">Dice Prediction Game</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-6 py-2 bg-blue-800/30 text-blue-200 rounded-lg backdrop-blur-sm">
                        Loading...
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className="flex justify-between items-center p-6 bg-blue-900/30 backdrop-blur-md border-b border-blue-300/20 shadow-sm">
            <div className="flex items-center gap-4">
                <a 
                    href="https://github.com/yug49/Dice-Prediction-Game" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-200 hover:text-white hover:cursor-pointer transition-colors"
                >
                    <FaGithub size={32} />
                </a>
                <h1 className="text-xl font-bold text-yellow-400">Dice Prediction Game</h1>
            </div>
            <div className="flex items-center gap-4">
                {ready && authenticated && (isConnected && address || user?.wallet?.address) ? (
                    <div className="flex items-center gap-4">
                        <div className="text-sm bg-blue-900/30 backdrop-blur-md rounded-lg px-4 py-3 shadow-sm border border-blue-300/20">
                            <div className="font-semibold text-yellow-400">
                                {formatAddress(effectiveAddress || '')}
                            </div>
                            <div className="text-blue-200 text-xs">
                                {/* Show chain info - prioritize wagmi chain, fallback to Sepolia */}
                                {chain?.name || 'Sepolia'} • {
                                    balanceLoading 
                                        ? 'Loading...' 
                                        : balanceError
                                            ? 'Error loading balance'
                                            : balance 
                                                ? formatBalance(balance.formatted) 
                                                : '0.0000'
                                } ETH
                                {/* Network mismatch warning - only show if wagmi is connected */}
                                {isConnected && chain && chain.id !== sepolia.id && (
                                    <div className="text-red-300 text-xs mt-1">
                                        ⚠️ Switch to Sepolia
                                    </div>
                                )}
                                {balanceError && (
                                    <div className="text-orange-300 text-xs mt-1">
                                        <button 
                                            onClick={() => refetchBalance()}
                                            className="hover:underline"
                                        >
                                            🔄 Retry
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            className="px-6 py-3 bg-red-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                            onClick={handleDisconnect}
                        >
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <button
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                        onClick={handleConnect}
                    >
                        Connect Wallet
                    </button>
                )}
            </div>
        </header>
    )
}

export default Header