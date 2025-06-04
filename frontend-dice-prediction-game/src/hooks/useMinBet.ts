import { useReadContract, useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { sepolia } from 'wagmi/chains'
import { diceGameAbi, chainsToTSender } from '@/constants'

export function useDiceGameData() {
  const { address } = useAccount()
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()
  
  // Get user address from Privy wallets as fallback
  const privyAddress = wallets?.[0]?.address
  const userAddress = address || privyAddress

  const diceGameAddress = chainsToTSender[sepolia.id]?.diceGame
  
  const { data: minBetWei, isLoading: minBetLoading, isError: minBetError, refetch: refetchMinBet } = useReadContract({
    address: diceGameAddress as `0x${string}`,
    abi: diceGameAbi,
    functionName: 'getMinBet',
    chainId: sepolia.id,
  })

  const { data: multiplier, isLoading: multiplierLoading, isError: multiplierError, refetch: refetchMultiplier } = useReadContract({
    address: diceGameAddress as `0x${string}`,
    abi: diceGameAbi,
    functionName: 'getMultiplier',
    chainId: sepolia.id,
  })

  const { data: mostRecentRoll, isLoading: rollLoading, isError: rollError, refetch: refetchRoll } = useReadContract({
    address: diceGameAddress as `0x${string}`,
    abi: diceGameAbi,
    functionName: 'getMostRecentRoll',
    chainId: sepolia.id,
  })

  const { data: playerScore, isLoading: scoreLoading, isError: scoreError, refetch: refetchScore } = useReadContract({
    address: diceGameAddress as `0x${string}`,
    abi: diceGameAbi,
    functionName: 'getPlayerScore',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: !!userAddress && !!authenticated && !!diceGameAddress, // Only run if address is available and authenticated
    }
  })

  // Debug logging for address resolution and score fetching
  console.log('🎯 useDiceGameData Debug:', {
    userAddress: userAddress,
    authenticated: authenticated,
    diceGameAddress: diceGameAddress,
    playerScore: playerScore,
    scoreLoading: scoreLoading,
    scoreError: scoreError
  });

  // Convert wei to ETH for display
  const minBetEth = minBetWei ? formatEther(minBetWei as bigint) : '0.001'

  return {
    // Min bet data
    minBetWei,
    minBetEth,
    minBetLoading,
    minBetError,
    
    // Multiplier data
    multiplier: multiplier as number,
    multiplierLoading,
    multiplierError,
    
    // Most recent roll data
    mostRecentRoll: mostRecentRoll as number,
    rollLoading,
    rollError,
    
    // Player score data
    playerScore: playerScore as bigint,
    scoreLoading,
    scoreError,
    
    // Debug info
    userAddress,
    wagmiAddress: address,
    privyAddress,
    diceGameAddress,
    
    // Refetch functions
    refetchScore,
    refetchMinBet,
    refetchMultiplier,
    refetchRoll,
    
    // Overall loading state
    isLoading: minBetLoading || multiplierLoading || rollLoading || scoreLoading,
    hasError: minBetError || multiplierError || rollError || scoreError
  }
}

// Keep the original hook for backward compatibility
export function useMinBet() {
  const { minBetWei, minBetEth, minBetLoading, minBetError } = useDiceGameData()
  
  return {
    minBetWei,
    minBetEth,
    isLoading: minBetLoading,
    isError: minBetError,
    error: minBetError
  }
}
