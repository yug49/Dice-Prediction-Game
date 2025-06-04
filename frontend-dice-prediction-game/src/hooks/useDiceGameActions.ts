import { useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, createWalletClient, custom } from 'viem';
import { chainsToTSender, diceGameAbi } from '../constants';
import { sepolia } from 'wagmi/chains';
import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

const useDiceGameActions = () => {
    const [isRollingDice, setIsRollingDice] = useState(false);
    const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(null);
    const [writeError, setWriteError] = useState<Error | null>(null);
    
    const { ready, authenticated } = usePrivy();
    const { wallets } = useWallets();
    
    const diceGameAddress = chainsToTSender[sepolia.id]?.diceGame;
    
    const { 
        isLoading: isConfirming, 
        isSuccess: isConfirmed,
        error: confirmError 
    } = useWaitForTransactionReceipt({
        hash: transactionHash || undefined,
    });

    // Helper function to switch to Sepolia chain
    const ensureCorrectChain = async (provider: any) => {
        try {
            // Get current chain ID
            const currentChainId = await provider.request({ method: 'eth_chainId' });
            const currentChainIdDecimal = parseInt(currentChainId, 16);
            
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
            } catch (switchError: any) {
                // If the chain hasn't been added to the wallet, add it
                if (switchError.code === 4902) {
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

    const rollDice = async (prediction: number, betAmount: string) => {
        if (!prediction || prediction < 1 || prediction > 6) {
            throw new Error('Invalid prediction. Must be between 1 and 6');
        }

        if (!betAmount || parseFloat(betAmount) <= 0) {
            throw new Error('Invalid bet amount');
        }

        if (!ready || !authenticated) {
            throw new Error('Wallet not authenticated with Privy');
        }

        if (!wallets || wallets.length === 0) {
            throw new Error('No wallets connected');
        }

        try {
            setIsRollingDice(true);
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
                address: diceGameAddress as `0x${string}`,
                abi: diceGameAbi,
                functionName: 'rollDice',
                args: [prediction],
                value: parseEther(betAmount),
                account,
            });
            
            setTransactionHash(hash);
            return hash;
        } catch (error) {
            console.error('Error rolling dice:', error);
            setWriteError(error as Error);
            throw error;
        } finally {
            setIsRollingDice(false);
        }
    };

    return {
        rollDice,
        isRollingDice,
        isWritePending: isRollingDice, // For compatibility
        isConfirming,
        isConfirmed,
        writeError,
        confirmError,
        transactionHash,
        isWalletConnected: ready && authenticated,
        isAuthenticated: ready && authenticated,
    };
};

export default useDiceGameActions;
export { useDiceGameActions };
