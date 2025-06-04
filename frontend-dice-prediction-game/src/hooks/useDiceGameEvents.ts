import { useEffect, useState } from 'react';
import { useWatchContractEvent, useAccount } from 'wagmi';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { chainsToTSender, diceGameAbi } from '../constants';
import { sepolia } from 'wagmi/chains';
import { formatEther } from 'viem';

export interface GameResult {
  type: 'won' | 'lost';
  betAmount: string;
  winningAmount?: string;
  rolledNumber: number;
  transactionHash: string;
  timestamp: number;
}

export const useDiceGameEvents = () => {
  const [latestResult, setLatestResult] = useState<GameResult | null>(null);
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const { address } = useAccount();
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  
  // Get user address from Privy wallets as fallback
  const privyAddress = wallets?.[0]?.address;
  const userAddress = address || privyAddress;
  
  const diceGameAddress = chainsToTSender[sepolia.id]?.diceGame;

  // Debug logging
  useEffect(() => {
    console.log('🎲 DiceGameEvents Hook initialized');
    console.log('📍 DiceGame Address:', diceGameAddress);
    console.log('👛 Wagmi Address:', address);
    console.log('👛 Privy Address:', privyAddress);
    console.log('👛 User Address (final):', userAddress);
    console.log('🔗 Chain ID:', sepolia.id);
    console.log('🔐 Authenticated:', authenticated);
  }, [diceGameAddress, address, privyAddress, userAddress, authenticated]);

  // Additional debugging for address changes
  useEffect(() => {
    console.log('👛 Address changed in events hook - Wagmi:', address, 'Privy:', privyAddress, 'Final:', userAddress);
  }, [address, privyAddress, userAddress]);

  // Listen for PlayerWon events
  useWatchContractEvent({
    address: diceGameAddress as `0x${string}`,
    abi: diceGameAbi,
    eventName: 'PlayerWon',
    chainId: sepolia.id,
    onLogs: (logs) => {
      console.log('🎉 PlayerWon events received:', logs.length);
      
      logs.forEach((log, index) => {
        console.log(`🎉 PlayerWon Event #${index + 1}:`, log);
        
        try {
          // Type assertion for the log args
          const eventArgs = (log as unknown as { args: {
            player: string;
            betAmount: bigint;
            winningAmount: bigint;
            rolledNumber: bigint;
          } }).args;
          
          const { player, betAmount, winningAmount, rolledNumber } = eventArgs;
          console.log('🎉 Event args:', { player, betAmount, winningAmount, rolledNumber });
          console.log('🔍 Address comparison:', { 
            eventPlayer: player, 
            wagmiAddress: address,
            privyAddress: privyAddress,
            userAddress: userAddress,
            eventPlayerLower: player?.toLowerCase(), 
            userAddressLower: userAddress?.toLowerCase(),
            match: userAddress && player && player.toLowerCase() === userAddress.toLowerCase()
          });

          // Only process events for the connected user
          if (userAddress && player && player.toLowerCase() === userAddress.toLowerCase()) {
            console.log('🎯 Processing PlayerWon event for current user');
            
            const result: GameResult = {
              type: 'won',
              betAmount: formatEther(betAmount),
              winningAmount: formatEther(winningAmount),
              rolledNumber: Number(rolledNumber),
              transactionHash: (log as unknown as { transactionHash: string }).transactionHash || '',
              timestamp: Date.now(),
            };

            console.log('🎯 Setting won result:', result);
            setLatestResult(result);
            setGameResults((prev) => [result, ...prev.slice(0, 9)]); // Keep last 10 results
          } else if (userAddress) {
            console.log('🚫 Event not for current user:', { eventPlayer: player, currentUser: userAddress });
          }
        } catch (error) {
          console.error('❌ Error processing PlayerWon event:', error);
        }
      });
    },
    onError: (error) => {
      console.error('❌ Error watching PlayerWon events:', error);
    }
  });

  // Listen for PlayerLost events
  useWatchContractEvent({
    address: diceGameAddress as `0x${string}`,
    abi: diceGameAbi,
    eventName: 'PlayerLost',
    chainId: sepolia.id,
    onLogs: (logs) => {
      console.log('😔 PlayerLost events received:', logs.length);
      
      logs.forEach((log, index) => {
        console.log(`😔 PlayerLost Event #${index + 1}:`, log);
        
        try {
          // Type assertion for the log args
          const eventArgs = (log as unknown as { args: {
            player: string;
            betAmount: bigint;
            rolledNumber: bigint;
          } }).args;
          
          const { player, betAmount, rolledNumber } = eventArgs;
          console.log('😔 Event args:', { player, betAmount, rolledNumber });
          console.log('🔍 Address comparison:', { 
            eventPlayer: player, 
            wagmiAddress: address,
            privyAddress: privyAddress,
            userAddress: userAddress,
            eventPlayerLower: player?.toLowerCase(), 
            userAddressLower: userAddress?.toLowerCase(),
            match: userAddress && player && player.toLowerCase() === userAddress.toLowerCase()
          });

          // Only process events for the connected user
          if (userAddress && player && player.toLowerCase() === userAddress.toLowerCase()) {
            console.log('🎯 Processing PlayerLost event for current user');
            
            const result: GameResult = {
              type: 'lost',
              betAmount: formatEther(betAmount),
              rolledNumber: Number(rolledNumber),
              transactionHash: (log as unknown as { transactionHash: string }).transactionHash || '',
              timestamp: Date.now(),
            };

            console.log('🎯 Setting lost result:', result);
            setLatestResult(result);
            setGameResults((prev) => [result, ...prev.slice(0, 9)]); // Keep last 10 results
          } else if (userAddress) {
            console.log('🚫 Event not for current user:', { eventPlayer: player, currentUser: userAddress });
          }
        } catch (error) {
          console.error('❌ Error processing PlayerLost event:', error);
        }
      });
    },
    onError: (error) => {
      console.error('❌ Error watching PlayerLost events:', error);
    }
  });

  // Note: Latest result is now persistent and only cleared manually

  return {
    latestResult,
    gameResults,
    clearLatestResult: () => setLatestResult(null),
  };
};
