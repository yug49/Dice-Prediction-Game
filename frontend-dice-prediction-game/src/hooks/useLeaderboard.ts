import { useState, useEffect, useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { chainsToTSender, diceGameAbi } from '../constants';
import { sepolia } from 'wagmi/chains';

export interface Player {
  address: string;
  score: number;
  position: number;
}

export interface LeaderboardStats {
  totalPlayers: number;
  highestScore: number;
  averageScore: number;
}

export const useLeaderboard = (currentUserAddress?: string) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<LeaderboardStats>({
    totalPlayers: 0,
    highestScore: 0,
    averageScore: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const diceGameAddress = chainsToTSender[sepolia.id]?.diceGame;

  // Get all players addresses
  const { 
    data: playersAddresses, 
    error: playersError,
    isLoading: playersLoading,
    refetch: refetchPlayers
  } = useReadContract({
    address: diceGameAddress as `0x${string}`,
    abi: diceGameAbi,
    functionName: 'getPlayers',
    chainId: sepolia.id,
  });

  // Fetch scores for all players
  useEffect(() => {
    const fetchScores = async () => {
      if (!playersAddresses || !Array.isArray(playersAddresses) || playersAddresses.length === 0) {
        setPlayers([]);
        setStats({
          totalPlayers: 0,
          highestScore: 0,
          averageScore: 0,
        });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Create promises for all score fetches
        const scorePromises = playersAddresses.map(async (address: string) => {
          try {
            // We'll use the contract directly here
            const response = await fetch('/api/get-player-score', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                playerAddress: address,
                contractAddress: diceGameAddress 
              }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to fetch score');
            }
            
            const data = await response.json();
            return {
              address,
              score: data.score || 0,
              position: 0, // Will be set after sorting
            };
          } catch (err) {
            console.error(`Error fetching score for ${address}:`, err);
            return {
              address,
              score: 0,
              position: 0,
            };
          }
        });

        const playersWithScores = await Promise.all(scorePromises);

        // Sort players by score in descending order and assign positions
        const sortedPlayers = playersWithScores
          .sort((a, b) => b.score - a.score)
          .map((player, index) => ({
            ...player,
            position: index + 1,
          }));

        // Calculate stats
        const scores = sortedPlayers.map(p => p.score);
        const totalPlayers = sortedPlayers.length;
        const highestScore = Math.max(...scores, 0);
        const averageScore = totalPlayers > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / totalPlayers) : 0;

        setPlayers(sortedPlayers);
        setStats({
          totalPlayers,
          highestScore,
          averageScore,
        });
      } catch (err) {
        console.error('Error fetching leaderboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchScores();
  }, [playersAddresses, diceGameAddress]);

  const isLoadingComplete = playersLoading || isLoading;
  const errorMessage = playersError?.message || error || null;

  const refetch = () => {
    refetchPlayers();
    // The useEffect will automatically re-run when playersAddresses changes
  };

  return {
    players,
    stats,
    isLoading: isLoadingComplete,
    error: errorMessage,
    refetch,
  };
};
