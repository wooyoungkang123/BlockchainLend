import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWalletData } from './useWalletData';

interface UserStats {
  totalSupplied: number;
  totalBorrowed: number;
  netAPY: number;
  healthFactor: number;
  collateralRatio: number;
  availableToWithdraw: number;
  totalCollateral: number;
}

export const useUserStats = (): UserStats => {
  const { address } = useAccount();
  const { walletData } = useWalletData();
  const [stats, setStats] = useState<UserStats>({
    totalSupplied: 5,
    totalBorrowed: 1000,
    netAPY: 1.8,
    healthFactor: 1.8,
    collateralRatio: 80, // Changed to match liquidation threshold
    availableToWithdraw: 2.5,
    totalCollateral: 5
  });
  
  useEffect(() => {
    if (!address) return;
    
    // Convert string values to numbers for calculations
    const collateralValue = parseFloat(walletData.collateral || '0');
    const borrowValue = parseFloat(walletData.borrow || '0');
    
    // Calculate health factor (same calculation as in useLendingPool)
    const liquidationThreshold = 80; // 80%
    const collateralValueInUsd = collateralValue * (walletData.ethPrice / 1e8);
    const healthFactor = borrowValue > 0 
      ? (collateralValueInUsd * liquidationThreshold / 100) / borrowValue 
      : 999; // If no borrow, health factor is very high
    
    // Calculate available to withdraw based on health factor and borrow
    const availableToWithdraw = borrowValue > 0
      ? Math.max(0, collateralValue - (borrowValue / (walletData.ethPrice / 1e8) * 100 / liquidationThreshold))
      : collateralValue;
    
    setStats({
      totalSupplied: collateralValue,
      totalBorrowed: borrowValue,
      netAPY: 1.8, // Static for now
      healthFactor: healthFactor,
      collateralRatio: liquidationThreshold,
      availableToWithdraw: availableToWithdraw,
      totalCollateral: collateralValue
    });
  }, [address, walletData]);
  
  return stats;
}; 