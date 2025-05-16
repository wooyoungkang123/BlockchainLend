import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWalletData } from './useWalletData';

interface UserData {
  depositedAmount: number;
  borrowedAmount: number;
  healthFactor: number;
  maxBorrowAmount: number;
  availableToWithdraw: number;
  collateralBalance: number;
}

export const useUserData = (): UserData => {
  const { address } = useAccount();
  const { walletData } = useWalletData();
  const [userData, setUserData] = useState<UserData>({
    depositedAmount: 0,
    borrowedAmount: 0,
    healthFactor: 999,
    maxBorrowAmount: 0,
    availableToWithdraw: 0,
    collateralBalance: 0
  });

  useEffect(() => {
    if (!address) return;
    
    // Convert string values to numbers for calculations
    const collateralValue = parseFloat(walletData.collateral || '0');
    const borrowValue = parseFloat(walletData.borrow || '0');
    
    // Calculate health factor
    const liquidationThreshold = 80; // 80%
    const collateralValueInUsd = collateralValue * (walletData.ethPrice / 1e8);
    const healthFactor = borrowValue > 0 
      ? (collateralValueInUsd * liquidationThreshold / 100) / borrowValue 
      : 999; // If no borrow, health factor is very high
    
    // Calculate max borrow amount
    const maxBorrowAmount = (collateralValueInUsd * liquidationThreshold) / 100;
    
    // Calculate available to withdraw based on health factor and borrow
    const availableToWithdraw = borrowValue > 0
      ? Math.max(0, collateralValue - (borrowValue / (walletData.ethPrice / 1e8) * 100 / liquidationThreshold))
      : collateralValue;
    
    setUserData({
      depositedAmount: collateralValue,
      borrowedAmount: borrowValue,
      healthFactor: healthFactor,
      maxBorrowAmount: maxBorrowAmount,
      availableToWithdraw: availableToWithdraw,
      collateralBalance: collateralValue
    });
  }, [address, walletData]);

  return userData;
};
