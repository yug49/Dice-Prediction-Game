"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePrivy, useConnectOrCreateWallet } from '@privy-io/react-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiquidityPool } from '../../hooks/useLiquidityPool';
import { useLiquidityPoolActions } from '../../hooks/useLiquidityPoolActions';
import {
  LoadingSpinner,
  AnimatedButton,
  AnimatedCounter,
  NotificationToast,
  AnimatedLink
} from '../../components/AnimatedComponents';

export default function LiquidityPage() {
  const [addAmount, setAddAmount] = useState<string>('');
  const [removeAmount, setRemoveAmount] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const { ready, authenticated } = usePrivy();
  const { connectOrCreateWallet } = useConnectOrCreateWallet();
  
  // Contract data hooks
  const {
    totalLiquidity,
    userDiceTokens,
    userContribution,
    poolSharePercentage,
    isLoading: dataLoading,
    error: dataError,
    refetch
  } = useLiquidityPool();
  
  // Contract actions hooks
  const {
    addLiquidity,
    removeLiquidity,
    isAddingLiquidity,
    isRemovingLiquidity,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
    confirmError,
    transactionHash,
    isAuthenticated
  } = useLiquidityPoolActions();

  // Show notification when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && transactionHash) {
      setNotification({ 
        message: `Transaction confirmed successfully! Hash: ${transactionHash.slice(0, 8)}...${transactionHash.slice(-6)}`, 
        type: 'success' 
      });
      setAddAmount('');
      setRemoveAmount('');
      // Refetch data after successful transaction
      setTimeout(() => refetch(), 2000);
    }
  }, [isConfirmed, refetch, transactionHash]);

  // Show error notifications
  useEffect(() => {
    if (writeError || confirmError) {
      const error = writeError || confirmError;
      setNotification({ 
        message: `Transaction failed: ${error?.message || 'Unknown error'}`, 
        type: 'error' 
      });
    }
  }, [writeError, confirmError]);

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleAddLiquidity = async () => {
    if (!addAmount || parseFloat(addAmount) <= 0) return;
    
    try {
      await addLiquidity(addAmount);
    } catch (error) {
      console.error('Add liquidity error:', error);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!removeAmount || parseFloat(removeAmount) <= 0) return;
    
    try {
      await removeLiquidity(removeAmount);
    } catch (error) {
      console.error('Remove liquidity error:', error);
    }
  };

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show wallet connection prompt if not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen">
        <main className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-900/30 backdrop-blur-md text-white rounded-lg hover:bg-blue-800/40 transition-colors shadow-md border border-blue-400/30"
            >
              ← Back to Game
            </Link>
          </div>

          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-blue-900/30 backdrop-blur-md rounded-3xl shadow-2xl p-16 border border-blue-300/20">
              <div className="text-6xl mb-6">💰</div>
              <h1 className="text-4xl font-bold text-white mb-4">Liquidity Pool</h1>
              <p className="text-blue-100 mb-8 text-lg">
                Connect your wallet to access the liquidity pool and start earning rewards
              </p>
              <button
                onClick={connectOrCreateWallet}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-xl"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // If wallet is connected, show the liquidity interface
  return (
    <motion.div 
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <main className="container mx-auto px-4 py-8">
        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <NotificationToast
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          )}
        </AnimatePresence>

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
              Liquidity Pool
            </motion.h1>
            <motion.p 
              className="text-blue-100 text-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Provide liquidity and earn rewards from player losses
            </motion.p>
          </motion.div>

          {/* Connection Status Check */}
          {!isAuthenticated && (
            <motion.div 
              className="bg-yellow-900/30 backdrop-blur-md border border-yellow-400/30 rounded-xl p-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <p className="text-yellow-200">⚠️ Wallet not authenticated. Please connect your wallet first.</p>
            </motion.div>
          )}

          {/* Loading State */}
          {dataLoading && (
            <motion.div 
              className="text-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <LoadingSpinner size="lg" />
              <motion.p 
                className="text-white text-lg mt-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                Loading pool data...
              </motion.p>
            </motion.div>
          )}

          {/* Error State */}
          {dataError && (
            <motion.div 
              className="bg-red-900/30 backdrop-blur-md border border-red-400/30 rounded-xl p-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <p className="text-red-200">Error loading pool data. Please refresh the page.</p>
            </motion.div>
          )}

          {/* Pool Overview */}
          <motion.div 
            className="bg-blue-900/30 backdrop-blur-md rounded-3xl shadow-2xl p-10 mb-8 border border-blue-300/20"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <motion.h2 
              className="text-2xl font-semibold text-yellow-400 mb-6 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              Pool Overview
            </motion.h2>
            <motion.div 
              className="grid md:grid-cols-2 gap-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <motion.div 
                className="bg-green-900/30 backdrop-blur-md p-6 rounded-xl border border-green-400/30"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-300 mb-2">
                    {dataLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <AnimatedCounter 
                        value={parseFloat(totalLiquidity)} 
                        duration={1000}
                      />
                    )} ETH
                  </div>
                  <div className="text-blue-200">Total Pool Liquidity</div>
                </div>
              </motion.div>
              <motion.div 
                className="bg-blue-900/30 backdrop-blur-md p-6 rounded-xl border border-blue-400/30"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-300 mb-2">
                    {dataLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <AnimatedCounter 
                        value={parseFloat(parseFloat(userDiceTokens).toFixed(6))} 
                        duration={1000}
                      />
                    )} DICE
                  </div>
                  <div className="text-blue-200">Your DICE Tokens</div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Your Position */}
          <motion.div 
            className="bg-blue-900/30 backdrop-blur-md rounded-3xl shadow-2xl p-10 mb-8 border border-blue-300/20"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <motion.h2 
              className="text-2xl font-semibold text-yellow-400 mb-6 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.1 }}
            >
              Your Position
            </motion.h2>
            <motion.div 
              className="grid md:grid-cols-2 gap-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              <motion.div 
                className="bg-purple-900/30 backdrop-blur-md p-6 rounded-xl border border-purple-400/30"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-300 mb-2">
                    {dataLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <AnimatedCounter 
                        value={parseFloat(parseFloat(userContribution).toFixed(6))} 
                        duration={1000}
                      />
                    )} ETH
                  </div>
                  <div className="text-blue-200">Your Contribution</div>
                </div>
              </motion.div>
              <motion.div 
                className="bg-orange-900/30 backdrop-blur-md p-6 rounded-xl border border-orange-400/30"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-300 mb-2">
                    {dataLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <AnimatedCounter 
                        value={parseFloat(poolSharePercentage)} 
                        duration={1000}
                      />
                    )}%
                  </div>
                  <div className="text-blue-200">Pool Share</div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Transaction Status */}
          {transactionHash && (
            <motion.div 
              className="bg-blue-900/30 backdrop-blur-md border border-blue-400/30 rounded-xl p-4 mb-8"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
            >
              <motion.div 
                className="text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.p 
                  className="text-blue-200 font-medium"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  Transaction Submitted
                </motion.p>
                <p className="text-blue-300 text-sm mt-1">
                  Hash: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                </p>
                <motion.a 
                  href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-100 text-sm underline mt-2 inline-block"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View on Etherscan
                </motion.a>
              </motion.div>
            </motion.div>
          )}

          {/* Liquidity Actions */}
          <motion.div 
            className="grid md:grid-cols-2 gap-8"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.3 }}
          >
            {/* Add Liquidity */}
            <motion.div 
              className="bg-blue-900/30 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-blue-300/20"
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <motion.h2 
                className="text-2xl font-semibold text-yellow-400 mb-6 text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.4 }}
              >
                Add Liquidity
              </motion.h2>
              
              <motion.div 
                className="mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.5 }}
              >
                <label className="block text-lg font-medium text-white mb-3">
                  Amount (ETH)
                </label>
                <motion.input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="0.1"
                  step="0.001"
                  min="0"
                  className="w-full px-4 py-4 text-lg text-center border-2 border-blue-400/30 rounded-xl focus:border-green-400 focus:outline-none transition-colors bg-blue-800/20 backdrop-blur-sm font-mono text-white placeholder-blue-200"
                  whileFocus={{ scale: 1.02, borderColor: "#34d399" }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>

              <motion.div 
                className="mb-6 p-4 bg-green-900/30 backdrop-blur-md rounded-xl border border-green-400/30"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.6 }}
              >
                <div className="text-sm text-blue-200 space-y-1">
                  <div className="flex justify-between">
                    <span>You will spend:</span>
                    <span className="font-semibold text-red-300">{addAmount || '0'} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>You will receive:</span>
                    <span className="font-semibold text-green-300">{addAmount || '0'} DICE tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pool share:</span>
                    <span className="font-semibold text-white">
                      {addAmount && totalLiquidity ? (
                        (parseFloat(addAmount) / (parseFloat(totalLiquidity) + parseFloat(addAmount)) * 100).toFixed(2)
                      ) : '0'}%
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.7 }}
              >
                <AnimatedButton
                  onClick={handleAddLiquidity}
                  variant="success"
                  className="w-full py-4 text-lg font-semibold"
                  disabled={!addAmount || parseFloat(addAmount) <= 0 || isAddingLiquidity || isWritePending || isConfirming || !isAuthenticated}
                >
                  {!isAuthenticated ? (
                    'Connect Wallet First'
                  ) : isAddingLiquidity || isWritePending ? (
                    <div className="flex items-center justify-center">
                      <div className="mr-2">
                        <LoadingSpinner size="sm" />
                      </div>
                      Preparing Transaction...
                    </div>
                  ) : isConfirming ? (
                    <div className="flex items-center justify-center">
                      <div className="mr-2">
                        <LoadingSpinner size="sm" />
                      </div>
                      Confirming...
                    </div>
                  ) : (
                    'Add Liquidity'
                  )}
                </AnimatedButton>
              </motion.div>
            </motion.div>

            {/* Remove Liquidity */}
            <motion.div 
              className="bg-blue-900/30 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-blue-300/20"
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <motion.h2 
                className="text-2xl font-semibold text-yellow-400 mb-6 text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.4 }}
              >
                Remove Liquidity
              </motion.h2>
              
              <motion.div 
                className="mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.5 }}
              >
                <label className="block text-lg font-medium text-white mb-3">
                  Amount (ETH)
                </label>
                <motion.input
                  type="number"
                  value={removeAmount}
                  onChange={(e) => setRemoveAmount(e.target.value)}
                  placeholder="0.1"
                  step="0.001"
                  min="0"
                  max={userContribution}
                  className="w-full px-4 py-4 text-lg text-center border-2 border-blue-400/30 rounded-xl focus:border-red-400 focus:outline-none transition-colors bg-blue-800/20 backdrop-blur-sm font-mono text-white placeholder-blue-200"
                  whileFocus={{ scale: 1.02, borderColor: "#f87171" }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>

              <motion.div 
                className="mb-6 p-4 bg-red-900/30 backdrop-blur-md rounded-xl border border-red-400/30"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.6 }}
              >
                <div className="text-sm text-blue-200 space-y-1">
                  <div className="flex justify-between">
                    <span>You will burn:</span>
                    <span className="font-semibold text-red-300">{removeAmount || '0'} DICE tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span>You will receive:</span>
                    <span className="font-semibold text-green-300">{removeAmount || '0'} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <span className="font-semibold text-white">{userContribution} ETH</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.7 }}
              >
                <AnimatedButton
                  onClick={handleRemoveLiquidity}
                  variant="warning"
                  className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                  disabled={!removeAmount || parseFloat(removeAmount) <= 0 || parseFloat(removeAmount) > parseFloat(userContribution) || isRemovingLiquidity || isWritePending || isConfirming}
                >
                  {isRemovingLiquidity || isWritePending ? (
                    <div className="flex items-center justify-center">
                      <div className="mr-2">
                        <LoadingSpinner size="sm" />
                      </div>
                      Preparing Transaction...
                    </div>
                  ) : isConfirming ? (
                    <div className="flex items-center justify-center">
                      <div className="mr-2">
                        <LoadingSpinner size="sm" />
                      </div>
                      Confirming...
                    </div>
                  ) : (
                    'Remove Liquidity'
                  )}
                </AnimatedButton>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* How it Works */}
          <motion.div 
            className="bg-blue-900/30 backdrop-blur-md rounded-3xl shadow-2xl p-10 mt-8 border border-blue-300/20"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.8 }}
          >
            <motion.h2 
              className="text-2xl font-semibold text-yellow-400 mb-6 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.9 }}
            >
              How it Works
            </motion.h2>
            <motion.div 
              className="grid md:grid-cols-3 gap-6 text-center"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 2.0 }}
            >
              {[
                { icon: '💰', title: 'Provide Liquidity', description: 'Add ETH to the pool and receive DICE tokens representing your share', delay: 2.1 },
                { icon: '🎲', title: 'Earn from Losses', description: 'When players lose their bets, the money gets added to the pool', delay: 2.2 },
                { icon: '📈', title: 'Automatic Rebase', description: 'DICE tokens automatically rebase to reflect your growing share of the pool', delay: 2.3 }
              ].map((step, index) => (
                <motion.div 
                  key={index}
                  className="p-4"
                  initial={{ y: 30, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: step.delay }}
                  whileHover={{ y: -5, scale: 1.05 }}
                >
                  <motion.div 
                    className="text-4xl mb-3"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {step.icon}
                  </motion.div>
                  <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-blue-100 text-sm">{step.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
}
