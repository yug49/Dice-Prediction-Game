"use client";

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useReadContract } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { chainsToTSender, diceGameAbi } from '../../constants';
import { sepolia } from 'wagmi/chains';
import {
  LoadingSpinner,
  AnimatedButton,
  AnimatedCard,
  AnimatedCounter,
  AnimatedLink
} from '../../components/AnimatedComponents';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Show wallet connection prompt if not authenticated
  if (!authenticated) {
    return (
      <motion.div 
        className="min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <main className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <motion.div 
            className="mb-6"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatedLink
              href="/"
              variant="secondary"
              size="medium"
            >
              ← Back to Game
            </AnimatedLink>
          </motion.div>

          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <AnimatedCard className="p-12">
              <motion.div 
                className="text-6xl mb-6"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 200 }}
                whileHover={{ 
                  scale: 1.2,
                  rotate: [0, -10, 10, 0],
                  transition: { duration: 0.5 }
                }}
              >
                🏆
              </motion.div>
              <motion.h1 
                className="text-3xl font-bold text-white mb-4"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                Leaderboard
              </motion.h1>
              <motion.p 
                className="text-blue-100 text-lg mb-8"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                Connect your wallet to view the leaderboard and see where you rank among other players!
              </motion.p>
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <AnimatedButton
                  onClick={connectOrCreateWallet}
                  variant="primary"
                  size="large"
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Connect Wallet to View Leaderboard
                </AnimatedButton>
              </motion.div>
            </AnimatedCard>
          </motion.div>
        </main>
      </motion.div>
    );
  }

  // Show loading while data is being fetched
  if (isLoading) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <LoadingSpinner size="lg" />
          <motion.p 
            className="text-white text-lg mt-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Loading leaderboard...
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }

  // Show error if there's an issue
  if (error) {
    return (
      <motion.div 
        className="min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <main className="container mx-auto px-4 py-8">
          <motion.div 
            className="mb-6"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatedLink
              href="/"
              variant="secondary"
              size="medium"
            >
              ← Back to Game
            </AnimatedLink>
          </motion.div>
          <motion.div 
            className="max-w-2xl mx-auto text-center"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <AnimatedCard className="p-12">
              <motion.div 
                className="text-6xl mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4, type: "spring", stiffness: 200 }}
              >
                ⚠️
              </motion.div>
              <motion.h1 
                className="text-3xl font-bold text-white mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                Error Loading Leaderboard
              </motion.h1>
              <motion.p 
                className="text-blue-100 text-lg mb-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                {error}
              </motion.p>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <AnimatedButton
                  onClick={refetch}
                  variant="primary"
                  size="large"
                >
                  Try Again
                </AnimatedButton>
              </motion.div>
            </AnimatedCard>
          </motion.div>
        </main>
      </motion.div>
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
    <motion.div 
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.div 
          className="mb-6"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatedLink
            href="/"
            variant="secondary"
            size="medium"
          >
            ← Back to Game
          </AnimatedLink>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.h1 
              className="text-4xl font-bold text-yellow-400 mb-2"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Leaderboard
            </motion.h1>
            <motion.p 
              className="text-blue-100 text-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Top players ranked by their total scores
            </motion.p>
          </motion.div>

          {/* Current Player Position */}
          {currentPlayer && (
            <motion.div 
              className="bg-blue-900/30 backdrop-blur-md border border-blue-300/20 rounded-3xl shadow-2xl p-6 mb-8"
              initial={{ y: 30, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <motion.div 
                className="text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <motion.h2 
                  className="text-xl font-semibold text-yellow-400 mb-4"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  Your Position
                </motion.h2>
                <motion.div 
                  className="flex items-center justify-center gap-4"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <motion.div 
                    className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${getPositionColor(currentPlayer.position)}`}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: 0.9, type: "spring", stiffness: 200 }}
                  >
                    {getPositionIcon(currentPlayer.position)}
                  </motion.div>
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.0 }}
                  >
                    <div className="text-2xl font-bold text-white">
                      <AnimatedCounter value={currentPlayer.score} duration={1000} /> points
                    </div>
                    <div className="text-blue-200">{formatAddress(currentPlayer.address)}</div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* Leaderboard */}
          <motion.div 
            className="bg-blue-900/30 backdrop-blur-md border border-blue-300/20 rounded-3xl shadow-2xl overflow-hidden"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <motion.div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.1 }}
            >
              <motion.h2 
                className="text-2xl font-semibold text-white text-center"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
              >
                Top Players
              </motion.h2>
            </motion.div>
            
            <div className="divide-y divide-blue-300/20">
              {players.map((player, index) => (
                <motion.div 
                  key={player.address} 
                  className={`p-6 transition-colors hover:bg-blue-800/20 ${
                    player.address.toLowerCase() === effectiveAddress?.toLowerCase() ? 'bg-blue-700/30 border-l-4 border-blue-400 hover:bg-blue-700/40' : 'hover:bg-blue-800/20'
                  }`}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 1.3 + (index * 0.1),
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    x: 10,
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        className={`text-2xl font-bold ${player.position <= 3 ? 'text-3xl' : 'text-blue-100'}`}
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ 
                          duration: 0.5, 
                          delay: 1.4 + (index * 0.1),
                          type: "spring",
                          stiffness: 200
                        }}
                        whileHover={{ 
                          scale: 1.2,
                          rotate: 10,
                          transition: { duration: 0.2 }
                        }}
                      >
                        {getPositionIcon(player.position)}
                      </motion.div>
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1.5 + (index * 0.1) }}
                      >
                        <div className="font-mono text-lg font-semibold text-white">
                          {formatAddress(player.address)}
                          {player.address.toLowerCase() === effectiveAddress?.toLowerCase() && (
                            <motion.span 
                              className="ml-2 px-2 py-1 bg-blue-500/30 text-blue-200 text-xs rounded-full backdrop-blur-sm"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ 
                                duration: 0.3, 
                                delay: 1.6 + (index * 0.1),
                                type: "spring",
                                stiffness: 300
                              }}
                            >
                              You
                            </motion.span>
                          )}
                        </div>
                        <div className="text-blue-200 text-sm">
                          Position #{player.position}
                        </div>
                      </motion.div>
                    </div>
                    <motion.div 
                      className="text-right"
                      initial={{ x: 30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1.5 + (index * 0.1) }}
                    >
                      <div className="text-2xl font-bold text-white">
                        <AnimatedCounter value={player.score} duration={1000} />
                      </div>
                      <div className="text-blue-200 text-sm">
                        points
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="grid md:grid-cols-3 gap-6 mt-8"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.8 }}
          >
            <motion.div 
              className="bg-blue-900/30 backdrop-blur-md border border-blue-300/20 rounded-xl shadow-lg p-6 text-center"
              initial={{ y: 30, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.9 }}
              whileHover={{ 
                y: -10, 
                scale: 1.05,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                transition: { duration: 0.3 }
              }}
            >
              <motion.div 
                className="text-3xl font-bold text-purple-300 mb-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 2.0, type: "spring", stiffness: 200 }}
              >
                <AnimatedCounter value={stats.totalPlayers} duration={1000} />
              </motion.div>
              <motion.div 
                className="text-blue-100"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 2.1 }}
              >
                Total Players
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="bg-blue-900/30 backdrop-blur-md border border-blue-300/20 rounded-xl shadow-lg p-6 text-center"
              initial={{ y: 30, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 2.0 }}
              whileHover={{ 
                y: -10, 
                scale: 1.05,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                transition: { duration: 0.3 }
              }}
            >
              <motion.div 
                className="text-3xl font-bold text-green-300 mb-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 2.1, type: "spring", stiffness: 200 }}
              >
                <AnimatedCounter value={stats.highestScore} duration={1000} />
              </motion.div>
              <motion.div 
                className="text-blue-100"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 2.2 }}
              >
                Highest Score
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="bg-blue-900/30 backdrop-blur-md border border-blue-300/20 rounded-xl shadow-lg p-6 text-center"
              initial={{ y: 30, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 2.1 }}
              whileHover={{ 
                y: -10, 
                scale: 1.05,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                transition: { duration: 0.3 }
              }}
            >
              <motion.div 
                className="text-3xl font-bold text-blue-300 mb-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 2.2, type: "spring", stiffness: 200 }}
              >
                <AnimatedCounter value={stats.averageScore} duration={1000} />
              </motion.div>
              <motion.div 
                className="text-blue-100"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 2.3 }}
              >
                Average Score
              </motion.div>
            </motion.div>
          </motion.div>

          {/* How Scoring Works */}
          <motion.div 
            className="bg-blue-900/30 backdrop-blur-md border border-blue-300/20 rounded-3xl shadow-2xl p-8 mt-8"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 2.4 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <motion.h2 
              className="text-2xl font-semibold text-yellow-400 mb-6 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 2.5 }}
            >
              How Scoring Works
            </motion.h2>
            <motion.div 
              className="flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 2.6, type: "spring", stiffness: 150 }}
            >
              <motion.div 
                className="p-4 text-center"
                whileHover={{ 
                  scale: 1.1,
                  y: -10,
                  transition: { duration: 0.3 }
                }}
              >
                <motion.div 
                  className="text-4xl mb-3"
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ duration: 0.8, delay: 2.7, type: "spring", stiffness: 200 }}
                  whileHover={{ 
                    rotate: [0, -10, 10, 0],
                    transition: { duration: 0.5 }
                  }}
                >
                  🎯
                </motion.div>
                <motion.h3 
                  className="font-semibold text-white mb-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 2.8 }}
                >
                  Correct Prediction
                </motion.h3>
                <motion.p 
                  className="text-blue-100 text-sm"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 2.9 }}
                >
                  +1 point for each successful dice prediction
                </motion.p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
}
