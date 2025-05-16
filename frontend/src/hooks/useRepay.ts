import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useWalletData } from './useWalletData';

interface UseRepayReturn {
  repay: (amount: number) => Promise<void>;
  isPending: boolean;
  error: Error | null;
}

export const useRepay = (): UseRepayReturn => {
  const { address } = useAccount();
  const { walletData, updateBorrow, updateTokenBalance } = useWalletData();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const repay = async (amount: number): Promise<void> => {
    if (!address || amount <= 0) {
      setError(new Error('Invalid parameters'));
      return;
    }
    
    setIsPending(true);
    setError(null);
    
    try {
      const currentBorrow = parseFloat(walletData.borrow || '0');
      const tokenBalance = parseFloat(walletData.tokenBalance || '0');
      
      // Check if there's anything to repay
      if (currentBorrow === 0) {
        throw new Error('No outstanding debt to repay');
      }
      
      // Check if user has enough tokens
      if (amount > tokenBalance) {
        throw new Error('Insufficient token balance');
      }
      
      // Calculate actual repayment (can't repay more than owed)
      const actualRepayment = Math.min(amount, currentBorrow);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update stored values
      updateBorrow((currentBorrow - actualRepayment).toString());
      updateTokenBalance((tokenBalance - actualRepayment).toString());
      
      console.log(`Repaid ${actualRepayment} USDC. Remaining debt: ${currentBorrow - actualRepayment} USDC`);
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error during repayment'));
      console.error('Error repaying loan:', err);
    } finally {
      setIsPending(false);
    }
  };

  return { repay, isPending, error };
};
