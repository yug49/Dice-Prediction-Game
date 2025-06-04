"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePrivy, useConnectOrCreateWallet } from '@privy-io/react-auth';
import { useMinBet, useDiceGameData } from '@/hooks/useMinBet';
import { useDiceGameActions } from '@/hooks/useDiceGameActions';
import { useDiceGameEvents } from '@/hooks/useDiceGameEvents';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  DiceRollAnimation, 
  ConfettiAnimation, 
  AnimatedButton, 
  AnimatedCard, 
  LoadingSpinner,
  NotificationToast,
  FloatingDice 
} from '@/components/AnimatedComponents';

export default function Home() {
  const [prediction, setPrediction] = useState<number>(1);
  const [betAmount, setBetAmount] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isPendingResult, setIsPendingResult] = useState<boolean>(false); // Track if waiting for VRF result
  const [processedTransactionHash, setProcessedTransactionHash] = useState<string | null>(null); // Track processed transactions
  const [hasReceivedResult, setHasReceivedResult] = useState<boolean>(false); // Track if result was received for current transaction
  
  // Animation states
  const [isRollingAnimation, setIsRollingAnimation] = useState<boolean>(false);
  const [showDiceResult, setShowDiceResult] = useState<boolean>(false);
  const [currentDiceFrame, setCurrentDiceFrame] = useState<number>(1);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  
  const { ready, authenticated } = usePrivy();
  const { connectOrCreateWallet } = useConnectOrCreateWallet();
  const { 
    minBetEth, 
    minBetWei, 
    minBetLoading, 
    minBetError,
    multiplier,
    mostRecentRoll,
    playerScore,
    isLoading: gameDataLoading,
    userAddress,
    wagmiAddress,
    privyAddress,
    diceGameAddress,
    scoreLoading,
    scoreError,
    refetchScore
  } = useDiceGameData();

  // Dice game actions hook
  const {
    rollDice,
    isRollingDice,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
    confirmError,
    transactionHash,
    isAuthenticated
  } = useDiceGameActions();

  // Dice game events hook
  const { latestResult, gameResults, clearLatestResult } = useDiceGameEvents();

  // Debug logging for latestResult changes
  useEffect(() => {
    console.log('🎯 latestResult changed:', latestResult);
  }, [latestResult]);

  // Debug logging for score issues
  useEffect(() => {
    console.log('🎯 Score debug:', {
      userAddress,
      playerScore,
      scoreLoading,
      scoreError
    });
  }, [userAddress, playerScore, scoreLoading, scoreError]);

  const diceNumbers = [1, 2, 3, 4, 5, 6];

  // Confetti Component - using imported component
  const Confetti = ConfettiAnimation;

  // Start dice rolling animation
  const startDiceRollingAnimation = () => {
    setIsRollingAnimation(true);
    setShowDiceResult(false);
    
    // Animate through different dice frames
    let frameIndex = 1;
    const frameInterval = setInterval(() => {
      frameIndex = (frameIndex % 6) + 1;
      setCurrentDiceFrame(frameIndex);
    }, 150);

    // Stop animation after 3 seconds
    setTimeout(() => {
      clearInterval(frameInterval);
      setIsRollingAnimation(false);
    }, 3000);
  };

  // Stop dice rolling animation and show result
  const stopDiceRollingAnimation = (result: number) => {
    setIsRollingAnimation(false);
    setCurrentDiceFrame(result);
    setShowDiceResult(true);
  };

  // Handle dice roll
  const handleRollDice = async () => {
    if (!betAmount || parseFloat(betAmount) <= 0) {
      setNotification({ message: 'Please enter a valid bet amount', type: 'error' });
      return;
    }

    if (parseFloat(betAmount) < parseFloat(minBetEth)) {
      setNotification({ message: `Bet amount must be at least ${minBetEth} ETH`, type: 'error' });
      return;
    }

    try {
      // Reset transaction state for new roll
      setProcessedTransactionHash(null);
      setHasReceivedResult(false);
      setIsPendingResult(false);
      
      // Clear previous notifications and game results when starting a new roll
      setNotification(null);
      clearLatestResult();
      
      // Start dice rolling animation
      startDiceRollingAnimation();
      
      const hash = await rollDice(prediction, betAmount);
      setNotification({ 
        message: `🎲 Dice roll submitted! Transaction: ${hash.slice(0, 10)}...`, 
        type: 'success' 
      });
    } catch (error: any) {
      console.error('Roll dice error:', error);
      setIsRollingAnimation(false); // Stop animation on error
      setNotification({ 
        message: error.message || 'Failed to roll dice. Please try again.', 
        type: 'error' 
      });
    }
  };

  // Clear notifications after 5 seconds (except game results)
  useEffect(() => {
    if (notification && !notification.message.includes('WON!') && !notification.message.includes('You lost')) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle transaction confirmation and set pending result state (only once per transaction)
  useEffect(() => {
    if (isConfirmed && transactionHash && transactionHash !== processedTransactionHash) {
      console.log('🎲 Transaction confirmed, setting pending result state for:', transactionHash);
      setIsPendingResult(true);
      setProcessedTransactionHash(transactionHash); // Mark this transaction as processed
      setHasReceivedResult(false); // Reset result flag for new transaction
      
      // Show generic confirmation notification
      setNotification({ 
        message: '🎲 Dice roll confirmed! Waiting for VRF result...', 
        type: 'success' 
      });
      // Clear bet amount after successful roll
      setBetAmount('');
    }
  }, [isConfirmed, transactionHash, processedTransactionHash]);

  // Clear pending result state when we receive a game result (only if we haven't already processed it)
  useEffect(() => {
    if (latestResult && isPendingResult && !hasReceivedResult) {
      console.log('🎯 Game result received, clearing pending result state');
      setIsPendingResult(false);
      setHasReceivedResult(true); // Mark that we received a result for this transaction
    }
  }, [latestResult, isPendingResult, hasReceivedResult]);

  // Clear generic notification when game result arrives
  useEffect(() => {
    if (latestResult && notification?.message.includes('Waiting for result')) {
      setNotification(null);
    }
  }, [latestResult, notification]);

  // Handle game results from events
  useEffect(() => {
    if (latestResult) {
      console.log('🎲 Latest game result received:', latestResult);
      
      // Stop dice rolling animation and show result
      stopDiceRollingAnimation(latestResult.rolledNumber);
      
      if (latestResult.type === 'won') {
        // Show confetti for wins
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        
        setNotification({ 
          message: `🎉 You WON! Rolled ${latestResult.rolledNumber}. You won ${parseFloat(latestResult.winningAmount || '0').toFixed(6)} ETH!`, 
          type: 'success' 
        });
      } else {
        setNotification({ 
          message: `😔 You lost. Rolled ${latestResult.rolledNumber}. Better luck next time!`, 
          type: 'error' 
        });
      }
      
      // Clear bet amount after getting result
      setBetAmount('');
    }
  }, [latestResult]);

  // Handle transaction errors
  useEffect(() => {
    if (confirmError) {
      setNotification({ 
        message: 'Transaction failed to confirm. Please try again.', 
        type: 'error' 
      });
    }
  }, [confirmError]);



  // Refetch score when game result is received
  useEffect(() => {
    if (latestResult && refetchScore) {
      console.log('🎯 Game result received, refreshing score');
      setTimeout(() => {
        refetchScore();
      }, 1000); // Wait 1 second before refetching to ensure blockchain state is updated
    }
  }, [latestResult, refetchScore]);

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6">
            <FloatingDice />
          </div>
          <motion.div 
            className="mx-auto mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <LoadingSpinner size="lg" color="purple" />
          </motion.div>
          <motion.p 
            className="text-gray-600 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Loading...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Show introductory page if wallet is not connected
  if (!authenticated) {
    return (
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero Section */}
            <motion.div 
              className="mb-12"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div 
                className="text-8xl mb-6"
                animate={{ 
                  rotateY: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotateY: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                🎲
              </motion.div>
              <motion.h1 
                className="text-6xl font-bold text-gray-800 mb-6"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Dice Prediction Game
              </motion.h1>
              <motion.p 
                className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                Test your luck and prediction skills! Guess the dice number and win 2x your bet. 
                Connect your wallet to start playing and earning rewards.
              </motion.p>
            </motion.div>

            {/* Connect Wallet CTA */}
            <motion.div 
              className="bg-white rounded-3xl shadow-2xl p-12 mb-12 backdrop-blur-sm border border-white/20"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <motion.div 
                className="text-4xl mb-6"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🔗
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
              <p className="text-gray-600 mb-8 text-lg">
                You need to connect your wallet to start playing the dice prediction game
              </p>
              <AnimatedButton
                onClick={connectOrCreateWallet}
                variant="primary"
                className="px-12 py-4 text-xl font-bold"
              >
                🎮 Connect Wallet & Start Playing
              </AnimatedButton>
            </motion.div>

            {/* Features Grid */}
            <motion.div 
              className="grid md:grid-cols-3 gap-8 mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.0 }}
            >
              {[
                { icon: '🎯', title: 'Predict & Win', description: 'Choose a number from 1-6, place your bet, and if you guess correctly, you win 2x your bet amount!' },
                { icon: '💰', title: 'Liquidity Pool', description: 'Provide liquidity to the pool and earn rewards from player losses. Get DICE tokens representing your share.' },
                { icon: '🏆', title: 'Leaderboard', description: 'Compete with other players and climb the leaderboard. Track your wins and see how you rank!' }
              ].map((feature, index) => (
                <AnimatedCard 
                  key={index}
                  delay={1.2 + index * 0.2}
                  className="p-8"
                >
                  <motion.div 
                    className="text-4xl mb-4"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </AnimatedCard>
              ))}
            </motion.div>

            {/* How to Play */}
            <motion.div 
              className="bg-white rounded-3xl shadow-2xl p-8"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.8 }}
            >
              <h2 className="text-3xl font-bold text-gray-800 mb-8">🎮 How to Play</h2>
              <div className="grid md:grid-cols-4 gap-6 text-center">
                {[
                  { step: '1', title: 'Connect Wallet', description: 'Connect your Web3 wallet to get started', color: 'blue' },
                  { step: '2', title: 'Choose Number', description: 'Pick your lucky number from 1 to 6', color: 'purple' },
                  { step: '3', title: 'Place Bet', description: 'Enter your bet amount in ETH', color: 'green' },
                  { step: '4', title: 'Roll & Win', description: 'Roll the dice and win 2x if you guess right!', color: 'yellow' }
                ].map((step, index) => (
                  <motion.div 
                    key={index}
                    className="p-4"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 2.0 + index * 0.15 }}
                    whileHover={{ y: -5 }}
                  >
                    <motion.div 
                      className={`bg-gradient-to-br from-${step.color}-100 to-${step.color}-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4`}
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <span className={`text-2xl font-bold text-${step.color}-600`}>{step.step}</span>
                    </motion.div>
                    <h4 className="font-semibold text-gray-800 mb-2">{step.title}</h4>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </main>
      </motion.div>
    );
  }

  // If wallet is connected, show the game interface
  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && <Confetti />}
      </AnimatePresence>

      <main className="container mx-auto px-4 py-8">
        {/* Navigation Buttons */}
        <motion.div 
          className="flex justify-center gap-4 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link href="/liquidity">
            <AnimatedButton variant="success" className="px-6 py-3">
              💰 Liquidity Pool
            </AnimatedButton>
          </Link>
          <Link href="/leaderboard">
            <AnimatedButton variant="warning" className="px-6 py-3">
              🏆 Leaderboard
            </AnimatedButton>
          </Link>
        </motion.div>

        {/* Game Section */}
        <motion.div 
          className="max-w-2xl mx-auto"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {/* Game Result Display */}
          <AnimatePresence>
            {latestResult && (
              <motion.div 
                className={`mb-6 p-6 rounded-2xl shadow-2xl border-2 ${
                  latestResult.type === 'won' 
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300' 
                    : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-300'
                }`}
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 10 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <motion.div 
                      className={`text-6xl mr-4 ${
                        latestResult.type === 'won' ? '' : ''
                      }`}
                      animate={latestResult.type === 'won' ? 
                        { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : 
                        { opacity: [1, 0.5, 1] }
                      }
                      transition={{ duration: 1, repeat: 3 }}
                    >
                      {latestResult.type === 'won' ? '🎉' : '😢'}
                    </motion.div>
                    <div>
                      <motion.h3 
                        className={`text-2xl font-bold mb-2 ${
                          latestResult.type === 'won' ? 'text-green-800' : 'text-red-800'
                        }`}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {latestResult.type === 'won' ? 'Congratulations! You Won!' : 'Better Luck Next Time!'}
                      </motion.h3>
                      <motion.div 
                        className="space-y-1"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <p className="text-lg">
                          <span className="font-semibold">Rolled: </span>
                          <motion.span 
                            className="text-2xl font-bold"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 0.6, delay: 0.7 }}
                          >
                            {latestResult.rolledNumber}
                          </motion.span>
                        </p>
                        <p className="text-lg">
                          <span className="font-semibold">Bet Amount: </span>
                          <span className="font-mono">{parseFloat(latestResult.betAmount).toFixed(6)} ETH</span>
                        </p>
                        {latestResult.type === 'won' && latestResult.winningAmount && (
                          <motion.p 
                            className="text-lg text-green-700"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.8, type: "spring", stiffness: 500 }}
                          >
                            <span className="font-semibold">You Won: </span>
                            <span className="font-mono text-xl font-bold">{parseFloat(latestResult.winningAmount).toFixed(6)} ETH</span>
                          </motion.p>
                        )}
                      </motion.div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {latestResult.transactionHash && (
                      <motion.a 
                        href={`https://sepolia.etherscan.io/tx/${latestResult.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                        whileHover={{ scale: 1.1 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                      >
                        View Transaction ↗
                      </motion.a>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notification */}
          <AnimatePresence>
            {notification && (
              <div className="mb-6">
                <NotificationToast
                  message={notification.message}
                  type={notification.type}
                  onClose={() => setNotification(null)}
                />
              </div>
            )}
          </AnimatePresence>

          {/* VRF Waiting Status */}
          <AnimatePresence>
            {isPendingResult && !isRollingDice && !isConfirming && !latestResult && (
              <motion.div 
                className="mb-6 p-4 rounded-xl bg-yellow-100 border border-yellow-300 text-yellow-800"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center">
                  <div className="mr-3">
                    <LoadingSpinner size="sm" color="yellow" />
                  </div>
                  <span className="font-medium">
                    🎲 Waiting for Chainlink VRF to determine dice result...
                  </span>
                </div>
                <div className="mt-2 text-sm">
                  <p>Your transaction has been confirmed. The dice result will appear shortly.</p>
                  {transactionHash && (
                    <motion.a 
                      href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-yellow-600 hover:text-yellow-800 underline"
                      whileHover={{ scale: 1.05 }}
                    >
                      View transaction ↗
                    </motion.a>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transaction Status */}
          <AnimatePresence>
            {(isRollingDice || isConfirming) && (
              <motion.div 
                className="mb-6 p-4 rounded-xl bg-blue-100 border border-blue-300 text-blue-800"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center">
                  <div className="mr-3">
                    <LoadingSpinner size="sm" color="blue" />
                  </div>
                  <span className="font-medium">
                    {isRollingDice ? '🎲 Rolling dice...' : '⏳ Confirming transaction...'}
                  </span>
                </div>
                {transactionHash && (
                  <motion.div 
                    className="mt-2 text-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div>Transaction: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}</div>
                    <motion.a 
                      href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                      whileHover={{ scale: 1.05 }}
                    >
                      View on Etherscan ↗
                    </motion.a>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          <AnimatePresence>
            {isConfirmed && transactionHash && (
              <motion.div 
                className="mb-6 p-4 rounded-xl bg-green-100 border border-green-300 text-green-800"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 10 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="flex items-center">
                  <motion.span 
                    className="text-green-600 mr-3"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: 2 }}
                  >
                    ✅
                  </motion.span>
                  <span className="font-medium">Transaction confirmed! Your dice has been rolled.</span>
                </div>
                <motion.div 
                  className="mt-2 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.a 
                    href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-800 underline"
                    whileHover={{ scale: 1.05 }}
                  >
                    View transaction ↗
                  </motion.a>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div 
            className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm border border-white/20"
            initial={{ y: 50, scale: 0.9, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <motion.div 
              className="text-center mb-8"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <h1 className="text-4xl font-bold text-gray-800 mb-2">🎲 Roll The Dice</h1>
              <p className="text-gray-600 text-lg">Predict the number and win 2x your bet!</p>
            </motion.div>

            {/* Animated Dice Display */}
            <div className="mb-8">
              <DiceRollAnimation 
                isRolling={isRollingAnimation} 
                currentFrame={currentDiceFrame} 
                finalResult={showDiceResult ? currentDiceFrame : undefined}
                size={120}
              />
            </div>

            {/* Dice Prediction Section */}
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">Choose Your Lucky Number</h2>
              <div className="grid grid-cols-6 gap-3">
                {diceNumbers.map((num, index) => (
                  <motion.button
                    key={num}
                    onClick={() => setPrediction(num)}
                    className={`aspect-square rounded-xl text-2xl font-bold transition-all ${
                      prediction === num
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                  >
                    <motion.span
                      animate={prediction === num ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {num}
                    </motion.span>
                  </motion.button>
                ))}
              </div>
              <motion.p 
                className="text-center text-gray-600 mt-2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5, delay: 0.2 }}
                key={prediction}
              >
                Selected: {prediction}
              </motion.p>
            </motion.div>

            {/* Bet Amount Section */}
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4 }}
            >
              <label className="block text-xl font-semibold text-gray-700 mb-4 text-center">
                Place Your Bet (ETH)
              </label>
              <div className="relative">
                <motion.input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder={minBetLoading ? "0.001" : minBetEth}
                  step="0.001"
                  min={minBetEth}
                  className="w-full px-6 py-4 text-xl text-center border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-gray-50 font-mono"
                  whileFocus={{ scale: 1.02, borderColor: "#3b82f6" }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              </div>
              <motion.div 
                className="flex justify-between mt-3 text-sm text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
              >
                <span>
                  Min bet: {minBetLoading ? '...' : minBetError ? '0.001' : minBetEth} ETH
                  {minBetError && <span className="text-red-500 ml-1" title="Error loading min bet from contract">(fallback)</span>}
                </span>
                <motion.span
                  key={betAmount}
                  animate={{ scale: [1, 1.1, 1], color: ["#6b7280", "#10b981", "#6b7280"] }}
                  transition={{ duration: 0.5 }}
                >
                  Win: {betAmount ? (parseFloat(betAmount) * (multiplier || 2)).toFixed(6) : '0.000000'} ETH
                </motion.span>
              </motion.div>
            </motion.div>

            {/* Roll Dice Button */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 }}
            >
              <motion.button
                onClick={handleRollDice}
                className="px-12 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xl font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  !betAmount || 
                  parseFloat(betAmount) <= 0 || 
                  (parseFloat(betAmount) < parseFloat(minBetEth)) ||
                  isRollingDice ||
                  isConfirming ||
                  isPendingResult ||
                  !isAuthenticated
                }
                whileHover={!isRollingDice && !isConfirming && !isPendingResult ? { 
                  scale: 1.05, 
                  y: -2,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                } : {}}
                whileTap={!isRollingDice && !isConfirming && !isPendingResult ? { scale: 0.95 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.div className="flex items-center justify-center">
                  {isRollingDice ? (
                    <>
                      <div className="mr-2">
                        <LoadingSpinner size="sm" color="blue" />
                      </div>
                      Rolling...
                    </>
                  ) : isConfirming ? (
                    <>
                      <div className="mr-2">
                        <LoadingSpinner size="sm" color="blue" />
                      </div>
                      Confirming...
                    </>
                  ) : isPendingResult ? (
                    <>
                      <div className="mr-2">
                        <LoadingSpinner size="sm" color="blue" />
                      </div>
                      Waiting for VRF...
                    </>
                  ) : (
                    <motion.span
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🎲 Roll The Dice!
                    </motion.span>
                  )}
                </motion.div>
              </motion.button>
              <AnimatePresence>
                {betAmount && parseFloat(betAmount) < parseFloat(minBetEth) && (
                  <motion.p 
                    className="text-red-500 text-sm mt-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    Bet amount must be at least {minBetEth} ETH
                  </motion.p>
                )}
                {!isAuthenticated && (
                  <motion.p 
                    className="text-red-500 text-sm mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Please ensure your wallet is connected and authenticated
                  </motion.p>
                )}
                {writeError && (
                  <motion.p 
                    className="text-red-500 text-sm mt-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    Error: {writeError.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Game Stats */}
            <motion.div 
              className="mt-8 pt-6 border-t border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.0 }}
            >
              <div className="grid grid-cols-2 gap-6 text-center max-w-md mx-auto">
                <motion.div 
                  className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl"
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <motion.div 
                    className="text-2xl font-bold text-green-600"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {scoreLoading ? (
                      <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        ...
                      </motion.span>
                    ) : scoreError ? 'Error' : 
                     playerScore !== undefined ? Number(playerScore).toString() : '0'}
                  </motion.div>
                  <div className="text-sm text-gray-600">Your Score</div>
                </motion.div>
                <motion.div 
                  className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl"
                  whileHover={{ scale: 1.05, rotate: -1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <motion.div 
                    className="text-2xl font-bold text-purple-600"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  >
                    {gameDataLoading ? (
                      <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        ...
                      </motion.span>
                    ) : `${multiplier || 2}x`}
                  </motion.div>
                  <div className="text-sm text-gray-600">Multiplier</div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </main>
    </motion.div>
  );
}