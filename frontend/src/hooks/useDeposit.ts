import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useWalletData } from './useWalletData';

interface UseDepositReturn {
  deposit: (amount: number) => Promise<void>;
  isPending: boolean;
  error: Error | null;
}

export const useDeposit = (): UseDepositReturn => {
  const { address } = useAccount();
  const { walletData, updateCollateral } = useWalletData();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deposit = async (amount: number): Promise<void> => {
    if (!address || amount <= 0) {
      setError(new Error('Invalid parameters'));
      return;
    }
    
    setIsPending(true);
    setError(null);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update collateral in storage
      const currentCollateral = parseFloat(walletData.collateral || '0');
      updateCollateral((currentCollateral + amount).toString());
      
      console.log(`Deposited ${amount} ETH as collateral. New total: ${currentCollateral + amount} ETH`);
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error during deposit'));
      console.error('Error depositing:', err);
    } finally {
      setIsPending(false);
    }
  };

  return { deposit, isPending, error };
}; 