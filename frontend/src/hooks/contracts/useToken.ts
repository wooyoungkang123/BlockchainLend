import { useState, useEffect } from 'react';
import { useAccount, useBalance, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { USDC_ABI } from '../contracts/abis/USDCABI';
import { getContractAddress } from '../contracts/contracts';

export function useToken() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [allowance, setAllowance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(true);
  const tokenSymbol = 'USDC';

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
  const balance = balanceData ? BigInt(balanceData.value) : 0n;

  // Write contract hooks for approvals
  const { writeContract, isPending } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | null>(null);
  const { isSuccess, isLoading } = useWaitForTransactionReceipt({ hash });

  // Effect to check allowance
  useEffect(() => {
    const checkAllowance = async () => {
      if (!address || !tokenAddress || !poolAddress) {
        setAllowance(0n);
        setLoading(false);
        return;
      }
      
      try {
        // Note: In a real app, this would use useReadContract or similar instead of direct fetch
        const response = await fetch(`/api/token/allowance?owner=${address}&spender=${poolAddress}&token=${tokenAddress}`);
        if (!response.ok) {
          throw new Error('Failed to fetch allowance');
        }
        
        const data = await response.json();
        setAllowance(BigInt(data.allowance));
        setLoading(false);
      } catch (error) {
        console.error('Error checking allowance:', error);
        setAllowance(0n);
        setLoading(false);
      }
    };
    
    checkAllowance();
  }, [address, tokenAddress, poolAddress, isSuccess]);

  // Approve specific amount
  const approve = async (amount: bigint) => {
    if (!address || !tokenAddress || !poolAddress) return;
    
    try {
      const hash = await writeContract({
        address: tokenAddress,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [poolAddress, amount],
      });
      
      setHash(hash);
      return hash;
    } catch (error) {
      console.error('Error approving token:', error);
      throw error;
    }
  };

  // Approve max amount
  const approveMax = async () => {
    const maxUint256 = 2n ** 256n - 1n;
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
    isPending: isPending || isLoading,
    isSuccess,
  };
} 