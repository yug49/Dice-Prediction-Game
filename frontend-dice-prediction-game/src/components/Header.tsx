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
            <header className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <a 
                        href="https://github.com/yug49/Dice-Prediction-Game" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-600 hover:text-black hover:cursor-pointer transition-colors"
                    >
                        <FaGithub size={24} />
                    </a>
                    <h1 className="text-xl font-bold text-gray-700">🎲 Dice Prediction Game</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-6 py-2 bg-gray-200 text-gray-500 rounded-lg">
                        Loading...
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm">
            <div className="flex items-center gap-4">
                <a 
                    href="https://github.com/yug49/Dice-Prediction-Game" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-600 hover:text-black hover:cursor-pointer transition-colors"
                >
                    <FaGithub size={24} />
                </a>
                <h1 className="text-xl font-bold text-gray-700">🎲 Dice Prediction Game</h1>
            </div>
            <div className="flex items-center gap-4">
                {ready && authenticated && (isConnected && address || user?.wallet?.address) ? (
                    <div className="flex items-center gap-4">
                        <div className="text-sm bg-white rounded-lg px-3 py-2 shadow-sm border">
                            <div className="font-semibold text-gray-700">
                                {formatAddress(effectiveAddress || '')}
                            </div>
                            <div className="text-gray-500 text-xs">
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
                                    <div className="text-red-500 text-xs mt-1">
                                        ⚠️ Switch to Sepolia
                                    </div>
                                )}
                                {balanceError && (
                                    <div className="text-orange-500 text-xs mt-1">
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
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                            onClick={handleDisconnect}
                        >
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <button
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
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