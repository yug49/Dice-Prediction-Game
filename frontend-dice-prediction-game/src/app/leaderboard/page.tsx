"use client";

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useReadContract } from 'wagmi';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { chainsToTSender, diceGameAbi } from '../../constants';
import { sepolia } from 'wagmi/chains';

export default function LeaderboardPage() {
  const { ready, authenticated, connectOrCreateWallet, user } = usePrivy();
  const { address, isConnected } = useAccount();
  const { players, stats, isLoading, error, refetch } = useLeaderboard();
  
  // Get the effective address (prioritize wagmi address, fallback to privy)
  const effectiveAddress = address || user?.wallet?.address;

  // Debug logging
  console.log('Leaderboard Debug:', {
    ready,
    authenticated,
    isConnected,
    address,
    userWalletAddress: user?.wallet?.address,
    effectiveAddress,
    currentUserScore: 'will be fetched below'
  });

  const diceGameAddress = chainsToTSender[sepolia.id]?.diceGame;

  // Get current user's score separately
  const { data: currentUserScore, error: scoreError, isLoading: scoreLoading } = useReadContract({
    address: diceGameAddress as `0x${string}`,
    abi: diceGameAbi,
    functionName: 'getPlayerScore',
    args: effectiveAddress ? [effectiveAddress as `0x${string}`] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: !!effectiveAddress && authenticated && ready,
    },
  });

  // Debug the score fetch
  console.log('Score fetch debug:', {
    diceGameAddress,
    effectiveAddress,
    currentUserScore,
    scoreError,
    scoreLoading,
    enabled: !!effectiveAddress && authenticated && ready
  });

  // Show loading while Privy is initializing
  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show wallet connection prompt if not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-100">
        <main className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-md"
            >
              ← Back to Game
            </Link>
          </div>

          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-3xl shadow-2xl p-12">
              <div className="text-6xl mb-6">🏆</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Leaderboard
              </h1>
              <p className="text-gray-600 text-lg mb-8">
                Connect your wallet to view the leaderboard and see where you rank among other players!
              </p>
              <button
                onClick={connectOrCreateWallet}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Connect Wallet to View Leaderboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show loading while data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  // Show error if there's an issue
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-100">
        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-md"
            >
              ← Back to Game
            </Link>
          </div>
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-3xl shadow-2xl p-12">
              <div className="text-6xl mb-6">⚠️</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Error Loading Leaderboard
              </h1>
              <p className="text-gray-600 text-lg mb-8">
                {error}
              </p>
              <button
                onClick={refetch}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentPlayer = players.find(p => p.address.toLowerCase() === effectiveAddress?.toLowerCase());

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return `#${position}`;
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return "from-yellow-400 to-yellow-600";
      case 2: return "from-gray-300 to-gray-500";
      case 3: return "from-amber-600 to-amber-800";
      default: return "from-blue-400 to-blue-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-100">
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-md"
          >
            ← Back to Game
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">🏆 Leaderboard</h1>
            <p className="text-gray-600 text-lg">Top players ranked by their total scores</p>
          </div>

          {/* Current Player Position */}
          {currentPlayer && (
            <div className="bg-white rounded-3xl shadow-2xl p-6 mb-8 border-2 border-blue-300">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Position</h2>
                <div className="flex items-center justify-center gap-4">
                  <div className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${getPositionColor(currentPlayer.position)}`}>
                    {getPositionIcon(currentPlayer.position)}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{currentPlayer.score} points</div>
                    <div className="text-gray-600">{formatAddress(currentPlayer.address)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Current Player Score - Always Show */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl shadow-2xl p-6 mb-8 text-white">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Your Score</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/20 rounded-xl p-4">
                  <div className="text-sm opacity-90 mb-1">Wallet Address</div>
                  <div className="font-mono text-lg font-semibold">
                    {effectiveAddress && authenticated ? formatAddress(effectiveAddress) : 'Not Connected'}
                  </div>
                </div>
                <div className="bg-white/20 rounded-xl p-4">
                  <div className="text-sm opacity-90 mb-1">Your Score</div>
                  <div className="text-2xl font-bold">
                    {currentUserScore ? Number(currentUserScore) : 0} points
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
              <h2 className="text-2xl font-semibold text-white text-center">Top Players</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {players.map((player, index) => (
                <div 
                  key={player.address} 
                  className={`p-6 transition-colors hover:bg-gray-50 ${
                    player.address.toLowerCase() === effectiveAddress?.toLowerCase() ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-bold ${player.position <= 3 ? 'text-3xl' : 'text-gray-600'}`}>
                        {getPositionIcon(player.position)}
                      </div>
                      <div>
                        <div className="font-mono text-lg font-semibold text-gray-800">
                          {formatAddress(player.address)}
                          {player.address.toLowerCase() === effectiveAddress?.toLowerCase() && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-gray-600 text-sm">
                          Position #{player.position}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">
                        {player.score}
                      </div>
                      <div className="text-gray-600 text-sm">
                        points
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{stats.totalPlayers}</div>
              <div className="text-gray-600">Total Players</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.highestScore}</div>
              <div className="text-gray-600">Highest Score</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.averageScore}</div>
              <div className="text-gray-600">Average Score</div>
            </div>
          </div>

          {/* How Scoring Works */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">📊 How Scoring Works</h2>
            <div className="flex justify-center">
              <div className="p-4 text-center">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="font-semibold text-gray-800 mb-2">Correct Prediction</h3>
                <p className="text-gray-600 text-sm">+1 point for each successful dice prediction</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
