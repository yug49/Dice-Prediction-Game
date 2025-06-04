import { useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, createWalletClient, custom } from 'viem';
import { chainsToTSender, liquidityPool } from '../constants';
import { sepolia } from 'wagmi/chains';
import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

const useLiquidityPoolActions = () => {
    const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
    const [isRemovingLiquidity, setIsRemovingLiquidity] = useState(false);
    const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(null);
    const [writeError, setWriteError] = useState<Error | null>(null);
    
    const { ready, authenticated } = usePrivy();
    const { wallets } = useWallets();
    
    const liquidityPoolAddress = chainsToTSender[sepolia.id]?.liquidityPool;
    
    const { 
        isLoading: isConfirming, 
        isSuccess: isConfirmed,
        error: confirmError 
    } = useWaitForTransactionReceipt({
        hash: transactionHash || undefined,
    });

    // Helper function to switch to Sepolia chain
    const ensureCorrectChain = async (provider: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }) => {
        try {
            // Get current chain ID
            const currentChainId = await provider.request({ method: 'eth_chainId' });
            const currentChainIdDecimal = parseInt(currentChainId as string, 16);
            
            // If already on Sepolia, return
            if (currentChainIdDecimal === sepolia.id) {
                return;
            }
            
            console.log(`Current chain: ${currentChainIdDecimal}, switching to Sepolia (${sepolia.id})`);
            
            try {
                // Try to switch to Sepolia
                await provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: `0x${sepolia.id.toString(16)}` }],
                });
            } catch (switchError: unknown) {
                // If the chain hasn't been added to the wallet, add it
                if (switchError && typeof switchError === 'object' && 'code' in switchError && switchError.code === 4902) {
                    await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: `0x${sepolia.id.toString(16)}`,
                                chainName: sepolia.name,
                                nativeCurrency: sepolia.nativeCurrency,
                                rpcUrls: sepolia.rpcUrls.default.http,
                                blockExplorerUrls: sepolia.blockExplorers?.default ? [sepolia.blockExplorers.default.url] : [],
                            },
                        ],
                    });
                } else {
                    throw switchError;
                }
            }
            
            // Wait a bit for the chain switch to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error('Error switching chain:', error);
            throw new Error(`Failed to switch to Sepolia network: ${error}`);
        }
    };

    const addLiquidity = async (amount: string) => {
        if (!amount || parseFloat(amount) <= 0) {
            throw new Error('Invalid amount');
        }

        if (!ready || !authenticated) {
            throw new Error('Wallet not authenticated with Privy');
        }

        if (!wallets || wallets.length === 0) {
            throw new Error('No wallets connected');
        }

        try {
            setIsAddingLiquidity(true);
            setWriteError(null);
            
            // Get the first connected wallet (usually the primary wallet)
            const wallet = wallets[0];
            
            // Get the Ethereum provider from the wallet
            const provider = await wallet.getEthereumProvider();
            if (!provider) {
                throw new Error('No Ethereum provider available');
            }

            // Ensure we're on the correct chain (Sepolia)
            await ensureCorrectChain(provider);

            // Create wallet client with Privy's provider
            const walletClient = createWalletClient({
                chain: sepolia,
                transport: custom(provider),
            });

            // Get the connected account
            const [account] = await walletClient.getAddresses();
            if (!account) {
                throw new Error('No account connected');
            }

            // Write contract directly with viem
            const hash = await walletClient.writeContract({
                address: liquidityPoolAddress as `0x${string}`,
                abi: liquidityPool,
                functionName: 'addLiquidity',
                value: parseEther(amount),
                account,
            });
            
            setTransactionHash(hash);
            return hash;
        } catch (error) {
            console.error('Error adding liquidity:', error);
            setWriteError(error as Error);
            throw error;
        } finally {
            setIsAddingLiquidity(false);
        }
    };

    const removeLiquidity = async (amount: string) => {
        if (!amount || parseFloat(amount) <= 0) {
            throw new Error('Invalid amount');
        }

        if (!ready || !authenticated) {
            throw new Error('Wallet not authenticated with Privy');
        }

        if (!wallets || wallets.length === 0) {
            throw new Error('No wallets connected');
        }

        try {
            setIsRemovingLiquidity(true);
            setWriteError(null);
            
            // Get the first connected wallet (usually the primary wallet)
            const wallet = wallets[0];
            
            // Get the Ethereum provider from the wallet
            const provider = await wallet.getEthereumProvider();
            if (!provider) {
                throw new Error('No Ethereum provider available');
            }

            // Ensure we're on the correct chain (Sepolia)
            await ensureCorrectChain(provider);

            // Create wallet client with Privy's provider
            const walletClient = createWalletClient({
                chain: sepolia,
                transport: custom(provider),
            });

            // Get the connected account
            const [account] = await walletClient.getAddresses();
            if (!account) {
                throw new Error('No account connected');
            }

            // Write contract directly with viem
            const hash = await walletClient.writeContract({
                address: liquidityPoolAddress as `0x${string}`,
                abi: liquidityPool,
                functionName: 'removeLiquidity',
                args: [parseEther(amount)],
                account,
            });
            
            setTransactionHash(hash);
            return hash;
        } catch (error) {
            console.error('Error removing liquidity:', error);
            setWriteError(error as Error);
            throw error;
        } finally {
            setIsRemovingLiquidity(false);
        }
    };

    return {
        addLiquidity,
        removeLiquidity,
        isAddingLiquidity,
        isRemovingLiquidity,
        isWritePending: isAddingLiquidity || isRemovingLiquidity, // For compatibility
        isConfirming,
        isConfirmed,
        writeError,
        confirmError,
        transactionHash,
        isWalletConnected: ready && authenticated,
        isAuthenticated: ready && authenticated,
    };
};

export default useLiquidityPoolActions;
export { useLiquidityPoolActions };
