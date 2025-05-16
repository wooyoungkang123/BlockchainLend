import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWalletData } from './useWalletData';
import { parseEther } from 'viem';

interface UserAccountData {
  collateralEth: bigint;
  borrowAmount: bigint;
  healthFactor: number;
  formattedCollateral: string;
  formattedBorrow: string;
  formattedHealthFactor: string;
}

export const useLendingPool = () => {
  const { address } = useAccount();
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Get wallet-specific storage
  const {
    walletData,
    updateCollateral,
    updateBorrow,
    updateEthPrice,
    updateTokenBalance
  } = useWalletData();
  
  // Calculate user account data
  const [userData, setUserData] = useState<UserAccountData | null>(null);
  
  // Liquidation threshold
  const liquidationThreshold = 80; // 80%
  
  useEffect(() => {
    if (!address) return;
    
    // Convert string values to numbers for calculations
    const collateralValue = parseFloat(walletData.collateral || '0');
    const borrowValue = parseFloat(walletData.borrow || '0');
    
    // Calculate health factor
    // Health factor = (collateral value in USD * liquidation threshold) / borrow value in USD
    const collateralValueInUsd = collateralValue * (walletData.ethPrice / 1e8);
    const healthFactor = borrowValue > 0 
      ? (collateralValueInUsd * liquidationThreshold / 100) / borrowValue 
      : 999; // If no borrow, health factor is very high
    
    setUserData({
      collateralEth: BigInt(Math.floor(collateralValue * 1e18)),
      borrowAmount: BigInt(Math.floor(borrowValue * 1e6)), // USDC has 6 decimals
      healthFactor,
      formattedCollateral: collateralValue.toString(),
      formattedBorrow: borrowValue.toString(),
      formattedHealthFactor: (healthFactor * 100).toFixed(2) + '%',
    });
  }, [address, walletData, liquidationThreshold]);
  
  // Get available liquidity - mock function
  const getAvailableLiquidity = () => {
    return 1000000; // $1M liquidity
  };
  
  // Mock transaction processing
  const processTx = async (type: string, action: () => void): Promise<boolean> => {
    if (!address) return false;
    
    setIsPending(true);
    setIsConfirming(false);
    setIsSuccess(false);
    setError(null);
    
    try {
      // Generate a fake transaction hash
      const hash = `0x${Math.random().toString(16).substring(2, 42)}`;
      setTxHash(hash);
      
      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsConfirming(true);
      
      // Simulate confirmation delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Execute the actual state change
      action();
      
      setIsConfirming(false);
      setIsSuccess(true);
      setIsPending(false);
      
      // Reset success after a delay
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
      
      return true;
    } catch (error) {
      console.error(`Error ${type}:`, error);
      setError(error instanceof Error ? error : new Error(`${type} failed`));
      setIsPending(false);
      setIsConfirming(false);
      return false;
    }
  };
  
  // Deposit ETH
  const deposit = async (amount: string) => {
    if (!amount || !address) return;
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    
    await processTx('deposit', () => {
      // Update collateral
      const currentCollateral = parseFloat(walletData.collateral || '0');
      updateCollateral((currentCollateral + amountNum).toString());
      
      // Update token balance (simulate gas cost)
      const tokenBalance = parseFloat(walletData.tokenBalance || '0');
      updateTokenBalance((tokenBalance - 0.01).toString());
    });
  };
  
  // Withdraw ETH
  const withdraw = async (amount: string) => {
    if (!amount || !address) return;
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    
    const currentCollateral = parseFloat(walletData.collateral || '0');
    if (amountNum > currentCollateral) return;
    
    // Check if withdrawal would put position at risk
    const borrowValue = parseFloat(walletData.borrow || '0');
    if (borrowValue > 0) {
      const remainingCollateral = currentCollateral - amountNum;
      const remainingCollateralValueInUsd = remainingCollateral * (walletData.ethPrice / 1e8);
      const requiredCollateral = (borrowValue * 100) / liquidationThreshold;
      
      if (remainingCollateralValueInUsd < requiredCollateral) {
        setError(new Error('Withdrawal would put position at risk'));
        return;
      }
    }
    
    await processTx('withdraw', () => {
      // Update collateral
      updateCollateral((currentCollateral - amountNum).toString());
    });
  };
  
  // Borrow USDC
  const borrow = async (amount: string) => {
    if (!amount || !address) return;
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    
    // Check if user has enough collateral
    const collateralValue = parseFloat(walletData.collateral || '0');
    const collateralValueInUsd = collateralValue * (walletData.ethPrice / 1e8);
    const maxBorrowAmount = (collateralValueInUsd * liquidationThreshold) / 100;
    
    const currentBorrow = parseFloat(walletData.borrow || '0');
    if (currentBorrow + amountNum > maxBorrowAmount) {
      setError(new Error('Insufficient collateral'));
      return;
    }
    
    await processTx('borrow', () => {
      // Update borrow amount
      updateBorrow((currentBorrow + amountNum).toString());
      
      // Update token balance
      const tokenBalance = parseFloat(walletData.tokenBalance || '0');
      updateTokenBalance((tokenBalance + amountNum).toString());
    });
  };
  
  // Repay USDC
  const repay = async (amount: string) => {
    if (!amount || !address) return;
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    
    const currentBorrow = parseFloat(walletData.borrow || '0');
    if (currentBorrow === 0) {
      setError(new Error('No outstanding borrow'));
      return;
    }
    
    const tokenBalance = parseFloat(walletData.tokenBalance || '0');
    if (amountNum > tokenBalance) {
      setError(new Error('Insufficient token balance'));
      return;
    }
    
    // Ensure repayment isn't more than what's borrowed
    const actualRepayment = Math.min(amountNum, currentBorrow);
    
    await processTx('repay', () => {
      // Update borrow amount
      updateBorrow((currentBorrow - actualRepayment).toString());
      
      // Update token balance
      updateTokenBalance((tokenBalance - actualRepayment).toString());
    });
  };
  
  // Refetch data (mock function)
  const refetchAccountData = () => {
    console.log('Refreshing account data');
  };
  
  return {
    userData,
    ethPrice: walletData.ethPrice,
    liquidationThreshold,
    deposit,
    withdraw,
    borrow,
    repay,
    isPending,
    isConfirming,
    isSuccess,
    error,
    refetchAccountData,
    txHash,
    
    // Additional data specific to this implementation
    getAvailableLiquidity
  };
}; 