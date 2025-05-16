import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, formatUnits } from 'viem';
import { LendingPoolABI } from '../../contracts/abis/LendingPoolABI';
import { getContractAddress } from '../../contracts/contracts';
import { useChainId } from 'wagmi';

// User account data interface
export interface UserAccountData {
  collateralEth: bigint;
  borrowAmount: bigint;
  healthFactor: bigint;
  formattedCollateral: string;
  formattedBorrow: string;
  formattedHealthFactor: string;
}

// Helper function to dispatch transaction events
const dispatchTransactionEvent = (eventName: string, detail?: any) => {
  window.dispatchEvent(
    new CustomEvent(eventName, {
      detail,
      bubbles: true,
    })
  );
};

// Hook for interacting with the lending pool
export function useLendingPool() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  
  // Get lending pool address for current chain
  const lendingPoolAddress = getContractAddress(chainId, 'LendingPool') as `0x${string}`;
  
  // Track the last transaction type and amount
  const [lastTxType, setLastTxType] = useState<string>('');
  const [lastTxAmount, setLastTxAmount] = useState<string>('');
  const [lastTxToken, setLastTxToken] = useState<string>('');
  
  // Read user account data
  const { data: accountData, refetch: refetchAccountData } = useReadContract({
    address: lendingPoolAddress,
    abi: LendingPoolABI,
    functionName: 'getUserAccountData',
    args: [address ?? '0x0000000000000000000000000000000000000000' as `0x${string}`],
    query: {
      enabled: isConnected && !!address,
    }
  });

  // Read ETH/USD price
  const { data: ethPrice, refetch: refetchEthPrice } = useReadContract({
    address: lendingPoolAddress,
    abi: LendingPoolABI,
    functionName: 'getLatestEthUsdPrice',
    query: {
      enabled: isConnected,
    }
  });

  // Read liquidation threshold
  const { data: liquidationThreshold } = useReadContract({
    address: lendingPoolAddress,
    abi: LendingPoolABI,
    functionName: 'LIQUIDATION_THRESHOLD',
    query: {
      enabled: isConnected,
    }
  });

  // Process user account data
  const [userData, setUserData] = useState<UserAccountData | null>(null);
  
  useEffect(() => {
    if (accountData) {
      const [collateralEth, borrowAmount, healthFactor] = accountData as [bigint, bigint, bigint];
      
      setUserData({
        collateralEth,
        borrowAmount,
        healthFactor,
        formattedCollateral: formatEther(collateralEth),
        formattedBorrow: formatUnits(borrowAmount, 6), // USDC has 6 decimals
        formattedHealthFactor: (Number(healthFactor) / 100).toFixed(2) + '%',
      });
    }
  }, [accountData]);

  // Dispatch transaction submitted event when a hash is received
  useEffect(() => {
    if (hash) {
      dispatchTransactionEvent('transaction:submitted', { hash });
    }
  }, [hash]);
  
  // Dispatch transaction completed event when a transaction is successful
  useEffect(() => {
    if (isSuccess && hash) {
      // Use the tracked transaction details
      const txDetails = {
        hash,
        type: lastTxType || 'borrow',
        amount: lastTxAmount || '100',
        token: lastTxToken || 'USDC',
        slippage: 0.5 // Default slippage
      };
      
      dispatchTransactionEvent('transaction:completed', txDetails);
    }
  }, [isSuccess, hash, lastTxType, lastTxAmount, lastTxToken]);

  // Deposit ETH
  const deposit = (amount: string) => {
    if (!amount || !isConnected) return;
    
    setLastTxType('deposit');
    setLastTxAmount(amount);
    setLastTxToken('ETH');
    
    writeContract({
      address: lendingPoolAddress,
      abi: LendingPoolABI,
      functionName: 'deposit',
      value: parseEther(amount),
    });
  };

  // Withdraw ETH
  const withdraw = (amount: string) => {
    if (!amount || !isConnected) return;
    
    setLastTxType('withdraw');
    setLastTxAmount(amount);
    setLastTxToken('ETH');
    
    writeContract({
      address: lendingPoolAddress,
      abi: LendingPoolABI,
      functionName: 'withdraw',
      args: [parseEther(amount)],
    });
  };

  // Borrow USDC
  const borrow = (amount: string) => {
    if (!amount || !isConnected) return;
    
    setLastTxType('borrow');
    setLastTxAmount(amount);
    setLastTxToken('USDC');
    
    // USDC has 6 decimals
    const amountInWei = BigInt(parseFloat(amount) * 1000000);
    
    writeContract({
      address: lendingPoolAddress,
      abi: LendingPoolABI,
      functionName: 'borrow',
      args: [amountInWei],
    });
  };

  // Repay USDC
  const repay = (amount: string) => {
    if (!amount || !isConnected) return;
    
    setLastTxType('repay');
    setLastTxAmount(amount);
    setLastTxToken('USDC');
    
    // USDC has 6 decimals
    const amountInWei = BigInt(parseFloat(amount) * 1000000);
    
    writeContract({
      address: lendingPoolAddress,
      abi: LendingPoolABI,
      functionName: 'repay',
      args: [amountInWei],
    });
  };

  // Refetch data after transaction confirmation
  useEffect(() => {
    if (isSuccess) {
      refetchAccountData();
      refetchEthPrice();
    }
  }, [isSuccess, refetchAccountData, refetchEthPrice]);

  return {
    userData,
    ethPrice: ethPrice ? ethPrice : null,
    liquidationThreshold: liquidationThreshold ? Number(liquidationThreshold) : 80,
    deposit,
    withdraw,
    borrow,
    repay,
    isPending,
    isConfirming,
    isSuccess,
    error,
    refetchAccountData,
    txHash: hash,
  };
} 