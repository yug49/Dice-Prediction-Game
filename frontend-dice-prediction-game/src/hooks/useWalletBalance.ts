import { useBalance } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useEffect } from 'react';

const useWalletBalance = () => {
    const { ready, authenticated, user } = usePrivy();
    const { address, isConnected } = useAccount();
    
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

    return {
        balance,
        balanceLoading,
        balanceError,
        refetchBalance,
        effectiveAddress,
        isWalletReady: ready && authenticated && !!effectiveAddress
    };
};

export default useWalletBalance;
export { useWalletBalance };
