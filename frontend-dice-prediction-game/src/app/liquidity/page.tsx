"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePrivy, useConnectOrCreateWallet } from '@privy-io/react-auth';
import { useLiquidityPool } from '../../hooks/useLiquidityPool';
import { useLiquidityPoolActions } from '../../hooks/useLiquidityPoolActions';

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
    refetch,
    isWalletReady
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show wallet connection prompt if not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100">
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
              <div className="text-6xl mb-6">💰</div>
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Liquidity Pool</h1>
              <p className="text-gray-600 mb-8 text-lg">
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100">
      <main className="container mx-auto px-4 py-8">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {notification.message}
          </div>
        )}

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
            <h1 className="text-4xl font-bold text-gray-800 mb-2">💰 Liquidity Pool</h1>
            <p className="text-gray-600 text-lg">Provide liquidity and earn rewards from player losses</p>
          </div>

          {/* Connection Status Check */}
          {!isAuthenticated && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
              <p className="text-yellow-700">⚠️ Wallet not authenticated. Please connect your wallet first.</p>
            </div>
          )}

          {/* Loading State */}
          {dataLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading pool data...</p>
            </div>
          )}

          {/* Error State */}
          {dataError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
              <p className="text-red-600">Error loading pool data. Please refresh the page.</p>
            </div>
          )}

          {/* Pool Overview */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Pool Overview</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {dataLoading ? '...' : `${parseFloat(totalLiquidity).toFixed(4)} ETH`}
                  </div>
                  <div className="text-gray-600">Total Pool Liquidity</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-100 p-6 rounded-xl">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {dataLoading ? '...' : `${parseFloat(userDiceTokens).toFixed(4)} DICE`}
                  </div>
                  <div className="text-gray-600">Your DICE Tokens</div>
                </div>
              </div>
            </div>
          </div>

          {/* Your Position */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Your Position</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-xl">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {dataLoading ? '...' : `${parseFloat(userContribution).toFixed(4)} ETH`}
                  </div>
                  <div className="text-gray-600">Your Contribution</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-orange-100 p-6 rounded-xl">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {dataLoading ? '...' : `${poolSharePercentage}%`}
                  </div>
                  <div className="text-gray-600">Pool Share</div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Status */}
          {transactionHash && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
              <div className="text-center">
                <p className="text-blue-800 font-medium">Transaction Submitted</p>
                <p className="text-blue-600 text-sm mt-1">
                  Hash: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                </p>
                <a 
                  href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 text-sm underline mt-2 inline-block"
                >
                  View on Etherscan
                </a>
              </div>
            </div>
          )}

          {/* Liquidity Actions */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Add Liquidity */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">💧 Add Liquidity</h2>
              
              <div className="mb-6">
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  Amount (ETH)
                </label>
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="0.1"
                  step="0.001"
                  min="0"
                  className="w-full px-4 py-4 text-lg text-center border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none transition-colors bg-gray-50 font-mono"
                />
              </div>

              <div className="mb-6 p-4 bg-green-50 rounded-xl">
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>You will spend:</span>
                    <span className="font-semibold text-red-600">{addAmount || '0'} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>You will receive:</span>
                    <span className="font-semibold text-green-600">{addAmount || '0'} DICE tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pool share:</span>
                    <span className="font-semibold">
                      {addAmount && totalLiquidity ? (
                        (parseFloat(addAmount) / (parseFloat(totalLiquidity) + parseFloat(addAmount)) * 100).toFixed(2)
                      ) : '0'}%
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddLiquidity}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={!addAmount || parseFloat(addAmount) <= 0 || isAddingLiquidity || isWritePending || isConfirming || !isAuthenticated}
              >
                {!isAuthenticated ? (
                  'Connect Wallet First'
                ) : isAddingLiquidity || isWritePending ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Preparing Transaction...
                  </div>
                ) : isConfirming ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Confirming...
                  </div>
                ) : (
                  'Add Liquidity'
                )}
              </button>
            </div>

            {/* Remove Liquidity */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">💸 Remove Liquidity</h2>
              
              <div className="mb-6">
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  Amount (ETH)
                </label>
                <input
                  type="number"
                  value={removeAmount}
                  onChange={(e) => setRemoveAmount(e.target.value)}
                  placeholder="0.1"
                  step="0.001"
                  min="0"
                  max={userContribution}
                  className="w-full px-4 py-4 text-lg text-center border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none transition-colors bg-gray-50 font-mono"
                />
              </div>

              <div className="mb-6 p-4 bg-red-50 rounded-xl">
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>You will burn:</span>
                    <span className="font-semibold text-red-600">{removeAmount || '0'} DICE tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span>You will receive:</span>
                    <span className="font-semibold text-green-600">{removeAmount || '0'} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <span className="font-semibold">{userContribution} ETH</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleRemoveLiquidity}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white text-lg font-semibold rounded-xl hover:from-red-600 hover:to-rose-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={!removeAmount || parseFloat(removeAmount) <= 0 || parseFloat(removeAmount) > parseFloat(userContribution) || isRemovingLiquidity || isWritePending || isConfirming}
              >
                {isRemovingLiquidity || isWritePending ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Preparing Transaction...
                  </div>
                ) : isConfirming ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Confirming...
                  </div>
                ) : (
                  'Remove Liquidity'
                )}
              </button>
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">📚 How it Works</h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-4">
                <div className="text-4xl mb-3">💰</div>
                <h3 className="font-semibold text-gray-800 mb-2">Provide Liquidity</h3>
                <p className="text-gray-600 text-sm">Add ETH to the pool and receive DICE tokens representing your share</p>
              </div>
              <div className="p-4">
                <div className="text-4xl mb-3">🎲</div>
                <h3 className="font-semibold text-gray-800 mb-2">Earn from Losses</h3>
                <p className="text-gray-600 text-sm">When players lose their bets, the money gets added to the pool</p>
              </div>
              <div className="p-4">
                <div className="text-4xl mb-3">📈</div>
                <h3 className="font-semibold text-gray-800 mb-2">Automatic Rebase</h3>
                <p className="text-gray-600 text-sm">DICE tokens automatically rebase to reflect your growing share of the pool</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
