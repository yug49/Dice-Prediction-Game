"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePrivy, useConnectOrCreateWallet } from '@privy-io/react-auth';
import { useMinBet, useDiceGameData } from '@/hooks/useMinBet';
import { useDiceGameActions } from '@/hooks/useDiceGameActions';
import { useDiceGameEvents } from '@/hooks/useDiceGameEvents';

export default function Home() {
  const [prediction, setPrediction] = useState<number>(1);
  const [betAmount, setBetAmount] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isPendingResult, setIsPendingResult] = useState<boolean>(false); // Track if waiting for VRF result
  const [processedTransactionHash, setProcessedTransactionHash] = useState<string | null>(null); // Track processed transactions
  const [hasReceivedResult, setHasReceivedResult] = useState<boolean>(false); // Track if result was received for current transaction
  
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
      
      const hash = await rollDice(prediction, betAmount);
      setNotification({ 
        message: `🎲 Dice roll submitted! Transaction: ${hash.slice(0, 10)}...`, 
        type: 'success' 
      });
    } catch (error: any) {
      console.error('Roll dice error:', error);
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
      
      if (latestResult.type === 'won') {
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show introductory page if wallet is not connected
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero Section */}
            <div className="mb-12">
              <div className="text-8xl mb-6">🎲</div>
              <h1 className="text-6xl font-bold text-gray-800 mb-6">
                Dice Prediction Game
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Test your luck and prediction skills! Guess the dice number and win 2x your bet. 
                Connect your wallet to start playing and earning rewards.
              </p>
            </div>

            {/* Connect Wallet CTA */}
            <div className="bg-white rounded-3xl shadow-2xl p-12 mb-12 backdrop-blur-sm border border-white/20">
              <div className="text-4xl mb-6">🔗</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
              <p className="text-gray-600 mb-8 text-lg">
                You need to connect your wallet to start playing the dice prediction game
              </p>
              <button
                onClick={connectOrCreateWallet}
                className="px-12 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xl font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-xl"
              >
                🎮 Connect Wallet & Start Playing
              </button>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Predict & Win</h3>
                <p className="text-gray-600">
                  Choose a number from 1-6, place your bet, and if you guess correctly, you win 2x your bet amount!
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Liquidity Pool</h3>
                <p className="text-gray-600">
                  Provide liquidity to the pool and earn rewards from player losses. Get DICE tokens representing your share.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Leaderboard</h3>
                <p className="text-gray-600">
                  Compete with other players and climb the leaderboard. Track your wins and see how you rank!
                </p>
              </div>
            </div>

            {/* How to Play */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">🎮 How to Play</h2>
              <div className="grid md:grid-cols-4 gap-6 text-center">
                <div className="p-4">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Connect Wallet</h4>
                  <p className="text-gray-600 text-sm">Connect your Web3 wallet to get started</p>
                </div>
                <div className="p-4">
                  <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-purple-600">2</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Choose Number</h4>
                  <p className="text-gray-600 text-sm">Pick your lucky number from 1 to 6</p>
                </div>
                <div className="p-4">
                  <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600">3</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Place Bet</h4>
                  <p className="text-gray-600 text-sm">Enter your bet amount in ETH</p>
                </div>
                <div className="p-4">
                  <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-yellow-600">4</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Roll & Win</h4>
                  <p className="text-gray-600 text-sm">Roll the dice and win 2x if you guess right!</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // If wallet is connected, show the game interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-8">
        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <Link 
            href="/liquidity"
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg font-semibold"
          >
            💰 Liquidity Pool
          </Link>
          <Link 
            href="/leaderboard"
            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl hover:from-yellow-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg font-semibold"
          >
            🏆 Leaderboard
          </Link>
        </div>

        {/* Game Section */}
        <div className="max-w-2xl mx-auto">
          {/* Game Result Display */}
          {latestResult && (
            <div className={`mb-6 p-6 rounded-2xl shadow-2xl border-2 ${
              latestResult.type === 'won' 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300' 
                : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`text-6xl mr-4 ${
                    latestResult.type === 'won' ? 'animate-bounce' : 'animate-pulse'
                  }`}>
                    {latestResult.type === 'won' ? '🎉' : '😢'}
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold mb-2 ${
                      latestResult.type === 'won' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {latestResult.type === 'won' ? 'Congratulations! You Won!' : 'Better Luck Next Time!'}
                    </h3>
                    <div className="space-y-1">
                      <p className="text-lg">
                        <span className="font-semibold">Rolled: </span>
                        <span className="text-2xl font-bold">{latestResult.rolledNumber}</span>
                      </p>
                      <p className="text-lg">
                        <span className="font-semibold">Bet Amount: </span>
                        <span className="font-mono">{parseFloat(latestResult.betAmount).toFixed(6)} ETH</span>
                      </p>
                      {latestResult.type === 'won' && latestResult.winningAmount && (
                        <p className="text-lg text-green-700">
                          <span className="font-semibold">You Won: </span>
                          <span className="font-mono text-xl font-bold">{parseFloat(latestResult.winningAmount).toFixed(6)} ETH</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {latestResult.transactionHash && (
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${latestResult.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      View Transaction ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notification */}
          {notification && (
            <div className={`mb-6 p-4 rounded-xl shadow-lg transition-all ${
              notification.type === 'success' 
                ? 'bg-green-100 border border-green-300 text-green-800' 
                : 'bg-red-100 border border-red-300 text-red-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{notification.message}</span>
                <button 
                  onClick={() => setNotification(null)}
                  className="text-gray-500 hover:text-gray-700 ml-4"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* VRF Waiting Status */}
          {isPendingResult && !isRollingDice && !isConfirming && !latestResult && (
            <div className="mb-6 p-4 rounded-xl bg-yellow-100 border border-yellow-300 text-yellow-800">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
                <span className="font-medium">
                  🎲 Waiting for Chainlink VRF to determine dice result...
                </span>
              </div>
              <div className="mt-2 text-sm">
                <p>Your transaction has been confirmed. The dice result will appear shortly.</p>
                {transactionHash && (
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-600 hover:text-yellow-800 underline"
                  >
                    View transaction ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Transaction Status */}
          {(isRollingDice || isConfirming) && (
            <div className="mb-6 p-4 rounded-xl bg-blue-100 border border-blue-300 text-blue-800">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <span className="font-medium">
                  {isRollingDice ? '🎲 Rolling dice...' : '⏳ Confirming transaction...'}
                </span>
              </div>
              {transactionHash && (
                <div className="mt-2 text-sm">
                  <div>Transaction: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}</div>
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    View on Etherscan ↗
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          {isConfirmed && transactionHash && (
            <div className="mb-6 p-4 rounded-xl bg-green-100 border border-green-300 text-green-800">
              <div className="flex items-center">
                <span className="text-green-600 mr-3">✅</span>
                <span className="font-medium">Transaction confirmed! Your dice has been rolled.</span>
              </div>
              <div className="mt-2 text-sm">
                <a 
                  href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-800 underline"
                >
                  View transaction ↗
                </a>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm border border-white/20">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">🎲 Roll The Dice</h1>
              <p className="text-gray-600 text-lg">Predict the number and win 2x your bet!</p>
            </div>

            {/* Dice Prediction Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">Choose Your Lucky Number</h2>
              <div className="grid grid-cols-6 gap-3">
                {diceNumbers.map((num) => (
                  <button
                    key={num}
                    onClick={() => setPrediction(num)}
                    className={`aspect-square rounded-xl text-2xl font-bold transition-all transform hover:scale-110 ${
                      prediction === num
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-center text-gray-600 mt-2">Selected: {prediction}</p>
            </div>

            {/* Bet Amount Section */}
            <div className="mb-8">
              <label className="block text-xl font-semibold text-gray-700 mb-4 text-center">
                Place Your Bet (ETH)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder={minBetLoading ? "0.001" : minBetEth}
                  step="0.001"
                  min={minBetEth}
                  className="w-full px-6 py-4 text-xl text-center border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-gray-50 font-mono"
                />
              </div>
              <div className="flex justify-between mt-3 text-sm text-gray-600">
                <span>
                  Min bet: {minBetLoading ? '...' : minBetError ? '0.001' : minBetEth} ETH
                  {minBetError && <span className="text-red-500 ml-1" title="Error loading min bet from contract">(fallback)</span>}
                </span>
                <span>Win: {betAmount ? (parseFloat(betAmount) * (multiplier || 2)).toFixed(6) : '0.000000'} ETH</span>
              </div>
            </div>

            {/* Roll Dice Button */}
            <div className="text-center">
              <button
                onClick={handleRollDice}
                className="px-12 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xl font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={
                  !betAmount || 
                  parseFloat(betAmount) <= 0 || 
                  (parseFloat(betAmount) < parseFloat(minBetEth)) ||
                  isRollingDice ||
                  isConfirming ||
                  isPendingResult ||
                  !isAuthenticated
                }
              >
                {isRollingDice ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Rolling...
                  </>
                ) : isConfirming ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Confirming...
                  </>
                ) : isPendingResult ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Waiting for VRF...
                  </>
                ) : (
                  '🎲 Roll The Dice!'
                )}
              </button>
              {betAmount && parseFloat(betAmount) < parseFloat(minBetEth) && (
                <p className="text-red-500 text-sm mt-2">
                  Bet amount must be at least {minBetEth} ETH
                </p>
              )}
              {!isAuthenticated && (
                <p className="text-red-500 text-sm mt-2">
                  Please ensure your wallet is connected and authenticated
                </p>
              )}
              {writeError && (
                <p className="text-red-500 text-sm mt-2">
                  Error: {writeError.message}
                </p>
              )}
            </div>

            {/* Game Stats */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-6 text-center max-w-md mx-auto">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">
                    {scoreLoading ? '...' : 
                     scoreError ? 'Error' : 
                     playerScore !== undefined ? Number(playerScore).toString() : '0'}
                  </div>
                  <div className="text-sm text-gray-600">Your Score</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">
                    {gameDataLoading ? '...' : `${multiplier || 2}x`}
                  </div>
                  <div className="text-sm text-gray-600">Multiplier</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}