import { useReadContracts } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { formatEther } from 'viem';
import { chainsToTSender, liquidityPool } from '../constants';

const useLiquidityPool = () => {
    const { ready, authenticated, user } = usePrivy();
    const { address } = useAccount();
    
    // Get the effective address (prioritize wagmi address, fallback to privy)
    const effectiveAddress = address || user?.wallet?.address;
    
    const liquidityPoolAddress = chainsToTSender[sepolia.id]?.liquidityPool;
    
    // Contract reads using multicall for better performance
    const { 
        data: contractData, 
        isLoading, 
        error,
        refetch 
    } = useReadContracts({
        contracts: [
            {
                address: liquidityPoolAddress as `0x${string}`,
                abi: liquidityPool,
                functionName: 'getTotalLiquidity',
            },
            {
                address: liquidityPoolAddress as `0x${string}`,
                abi: liquidityPool,
                functionName: 'getLiquidityProviderBalance',
                args: [effectiveAddress as `0x${string}`],
            },
            {
                address: liquidityPoolAddress as `0x${string}`,
                abi: liquidityPool,
                functionName: 'getLiquidityProviderShares',
                args: [effectiveAddress as `0x${string}`],
            },
        ],
        query: {
            enabled: !!effectiveAddress && !!liquidityPoolAddress && authenticated && ready,
            refetchInterval: 10000, // Refetch every 10 seconds
            retry: 3,
        }
    });

    // Parse the contract data
    const totalLiquidity = contractData?.[0]?.result ? formatEther(contractData[0].result as bigint) : '0';
    const userDiceTokens = contractData?.[1]?.result ? formatEther(contractData[1].result as bigint) : '0';
    const userShares = contractData?.[2]?.result ? contractData[2].result as bigint : BigInt(0);
    
    // Calculate user contribution (same as DICE tokens but in ETH)
    const userContribution = userDiceTokens;
    
    // Calculate pool share percentage
    const poolSharePercentage = totalLiquidity && parseFloat(totalLiquidity) > 0 && parseFloat(userContribution) > 0
        ? ((parseFloat(userContribution) / parseFloat(totalLiquidity)) * 100).toFixed(2)
        : '0';

    return {
        totalLiquidity,
        userDiceTokens,
        userContribution,
        userShares,
        poolSharePercentage,
        isLoading,
        error,
        refetch,
        effectiveAddress,
        isWalletReady: ready && authenticated && !!effectiveAddress,
        liquidityPoolAddress
    };
};

export default useLiquidityPool;
export { useLiquidityPool };
