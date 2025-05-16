import { useState } from 'react';
import { useAccount } from 'wagmi'; 
import { useWalletData } from './useWalletData';

interface UseBorrowReturn {
  borrow: (amount: number) => Promise<boolean>;
  isPending: boolean;
  error: Error | null;
}

export const useBorrow = (): UseBorrowReturn => {
  const { address } = useAccount();
  const { walletData, updateBorrow, updateTokenBalance } = useWalletData();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const borrow = async (amount: number): Promise<boolean> => {
    if (!address) {
      setError(new Error('Wallet not connected'));
      return false;
    }
    
    if (amount <= 0) {
      setError(new Error('Invalid amount'));
      return false;
    }
    
    setIsPending(true);
    setError(null);
    
    try {
      console.log('Starting borrow process for', amount, 'USDC');
      
      // Check if user has enough collateral
      const collateralValue = parseFloat(walletData.collateral || '0');
      const collateralValueInUsd = collateralValue * (walletData.ethPrice / 1e8);
      const liquidationThreshold = 80; // 80%
      const maxBorrowAmount = (collateralValueInUsd * liquidationThreshold) / 100;
      
      const currentBorrow = parseFloat(walletData.borrow || '0');
      
      if (currentBorrow + amount > maxBorrowAmount) {
        throw new Error('Insufficient collateral');
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update stored values
      const newBorrowAmount = (currentBorrow + amount).toString();
      console.log('Updating borrow amount to:', newBorrowAmount);
      updateBorrow(newBorrowAmount);
      
      // Update token balance
      const tokenBalance = parseFloat(walletData.tokenBalance || '0');
      const newTokenBalance = (tokenBalance + amount).toString();
      console.log('Updating token balance to:', newTokenBalance);
      updateTokenBalance(newTokenBalance);
      
      console.log(`Borrowed ${amount} USDC against ${collateralValue} ETH collateral`);
      
      // Force a short delay to allow state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during borrowing';
      console.error('Error borrowing:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
      return false;
    } finally {
      setIsPending(false);
    }
  };

  return { borrow, isPending, error };
};
