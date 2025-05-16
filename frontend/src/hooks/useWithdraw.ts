import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useWalletData } from './useWalletData';

interface UseWithdrawReturn {
  withdraw: (amount: number) => Promise<void>;
  isPending: boolean;
  error: Error | null;
}

export const useWithdraw = (): UseWithdrawReturn => {
  const { address } = useAccount();
  const { walletData, updateCollateral } = useWalletData();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const withdraw = async (amount: number): Promise<void> => {
    if (!address || amount <= 0) {
      setError(new Error('Invalid parameters'));
      return;
    }
    
    setIsPending(true);
    setError(null);
    
    try {
      const currentCollateral = parseFloat(walletData.collateral || '0');
      
      // Check if user has enough collateral
      if (amount > currentCollateral) {
        throw new Error('Insufficient collateral balance');
      }
      
      // Check if withdrawal would put position at risk
      const borrowValue = parseFloat(walletData.borrow || '0');
      if (borrowValue > 0) {
        const liquidationThreshold = 80; // 80%
        const remainingCollateral = currentCollateral - amount;
        const remainingCollateralValueInUsd = remainingCollateral * (walletData.ethPrice / 1e8);
        const requiredCollateral = (borrowValue * 100) / liquidationThreshold;
        
        if (remainingCollateralValueInUsd < requiredCollateral) {
          throw new Error('Withdrawal would put position at risk');
        }
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update collateral in storage
      updateCollateral((currentCollateral - amount).toString());
      
      console.log(`Withdrawn ${amount} ETH. Remaining collateral: ${currentCollateral - amount} ETH`);
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error during withdrawal'));
      console.error('Error withdrawing:', err);
    } finally {
      setIsPending(false);
    }
  };

  return { withdraw, isPending, error };
}; 