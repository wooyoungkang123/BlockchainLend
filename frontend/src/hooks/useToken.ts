import { useState, useEffect } from 'react';
import { useAccount, useBalance, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { USDC_ABI } from '../contracts/abis/USDCABI';
import { getContractAddress } from '../contracts/contracts';
import { useWalletData } from './useWalletData';

export function useToken() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [allowance, setAllowance] = useState<bigint>(BigInt('0'));
  const [loading, setLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<`0x${string}` | null>(null);
  const tokenSymbol = 'USDC';

  // Get wallet-specific storage
  const { walletData } = useWalletData();
  
  // Get token balance from wallet data
  const tokenBalance = walletData.tokenBalance || '0';
  const balance = BigInt(parseFloat(tokenBalance) * 1e6); // Convert to USDC's 6 decimals
  
  // Get token contract address from our helper
  const tokenAddress = getContractAddress(chainId, 'USDC') as `0x${string}`;
  const poolAddress = getContractAddress(chainId, 'LendingPool') as `0x${string}`;

  // Get token balance
  const { data: balanceData, isError: balanceError, refetch: refetchBalance } = useBalance({
    address,
    token: tokenAddress,
    query: {
      enabled: !!address && !!tokenAddress,
    }
  });

  // Format balance to string
  const balanceFromWagmi = balanceData ? BigInt(balanceData.value) : 0n;

  // Write contract hooks for approvals
  const { writeContract, isPending: writeContractPending } = useWriteContract();

  // Mock refetch balance
  const refetchBalanceMock = () => {
    console.log('Refreshing token balance');
  };
  
  // Effect to simulate allowance check
  useEffect(() => {
    if (!address) {
      setAllowance(BigInt('0'));
      setLoading(false);
      return;
    }
    
    // Simulate API call to check allowance
    setLoading(true);
    
    const checkAllowance = async () => {
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Set a large allowance by default for local testing
        const mockAllowance = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');
        setAllowance(mockAllowance);
        setLoading(false);
      } catch (error) {
        console.error('Error checking allowance:', error);
        setAllowance(BigInt('0'));
        setLoading(false);
      }
    };
    
    checkAllowance();
  }, [address, isSuccess]);
  
  // Approve specific amount
  const approve = async (amount: bigint) => {
    if (!address) return;
    
    setIsPending(true);
    
    try {
      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a fake transaction hash
      const mockHash = `0x${Math.random().toString(16).substring(2, 42)}` as `0x${string}`;
      setHash(mockHash);
      
      // Simulate confirmation delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Set allowance
      setAllowance(amount);
      setIsPending(false);
      setIsSuccess(true);
      
      // Reset success after a delay
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
      
      return mockHash;
    } catch (error) {
      console.error('Error approving token:', error);
      setIsPending(false);
      throw error;
    }
  };
  
  // Approve max amount
  const approveMax = async () => {
    const maxUint256 = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');
    return approve(maxUint256);
  };

  // Refetch balance after successful transactions
  useEffect(() => {
    if (isSuccess) {
      refetchBalance();
    }
  }, [isSuccess, refetchBalance]);

  return {
    balance,
    allowance,
    approve,
    approveMax,
    tokenSymbol,
    loading,
    isPending,
    isSuccess,
  };
} 