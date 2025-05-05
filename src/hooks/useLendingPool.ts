import { useReadContract, useWriteContract } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { LENDING_POOL_ADDRESS } from '../contracts/config';
import LendingPoolABI from '../contracts/LendingPoolABI.json';

export function useLendingPool() {
  // Read contract functions
  const { data: interestRate } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LendingPoolABI,
    functionName: 'borrowInterestRate',
  });

  const { data: liquidationThreshold } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LendingPoolABI,
    functionName: 'liquidationThreshold',
  });

  const { data: ethUsdPrice } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LendingPoolABI,
    functionName: 'getLatestEthUsdPrice',
  });

  const { data: lendingToken } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LendingPoolABI,
    functionName: 'lendingToken',
  });

  const { data: totalDeposits } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LendingPoolABI,
    functionName: 'totalDeposits',
  });

  const { data: totalBorrows } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LendingPoolABI,
    functionName: 'totalBorrows',
  });

  // Read user data - updated to make address optional with a default value
  const getUserAccountData = (address?: string) => {
    return useReadContract({
      address: LENDING_POOL_ADDRESS,
      abi: LendingPoolABI,
      functionName: 'getUserAccountData',
      args: address ? [address] : undefined,
    });
  };

  // Write contract functions with transaction hash tracking
  const { writeContract: writeDeposit, isPending: isDepositPending, data: depositHash } = useWriteContract();

  const deposit = (amount: string) => {
    return writeDeposit({
      address: LENDING_POOL_ADDRESS,
      abi: LendingPoolABI,
      functionName: 'deposit',
      args: [parseEther(amount)],
    });
  };

  const { writeContract: writeBorrow, isPending: isBorrowPending, data: borrowHash } = useWriteContract();

  const borrow = (amount: string) => {
    return writeBorrow({
      address: LENDING_POOL_ADDRESS,
      abi: LendingPoolABI,
      functionName: 'borrow',
      args: [parseEther(amount)],
    });
  };

  const { writeContract: writeRepay, isPending: isRepayPending, data: repayHash } = useWriteContract();

  const repay = (amount: string) => {
    return writeRepay({
      address: LENDING_POOL_ADDRESS,
      abi: LendingPoolABI,
      functionName: 'repay',
      args: [parseEther(amount)],
    });
  };
  
  // Add liquidate function
  const { writeContract: writeLiquidate, isPending: isLiquidatePending, data: liquidateHash } = useWriteContract();
  
  const liquidate = (borrowerAddress: string, amount: string) => {
    return writeLiquidate({
      address: LENDING_POOL_ADDRESS,
      abi: LendingPoolABI,
      functionName: 'liquidate',
      args: [borrowerAddress, parseEther(amount)],
    });
  };

  const { writeContract: writeWithdraw, isPending: isWithdrawPending, data: withdrawHash } = useWriteContract();

  const withdraw = (amount: string) => {
    return writeWithdraw({
      address: LENDING_POOL_ADDRESS,
      abi: LendingPoolABI,
      functionName: 'withdraw',
      args: [parseEther(amount)],
    });
  };

  // Format contract data for UI
  const formatInterestRate = () => {
    if (!interestRate) return '0';
    return `${Number(interestRate) / 100}%`;
  };

  const formatEthPrice = () => {
    if (!ethUsdPrice) return '$0.00';
    return `$${Number(ethUsdPrice) / 100000000}`;
  };

  // Safe formatting of bigint values
  const safeFormatEther = (value: any): string => {
    if (!value) return '0';
    try {
      return formatEther(value as bigint);
    } catch (e) {
      console.error('Error formatting value:', e);
      return '0';
    }
  };

  return {
    // Contract data
    interestRate,
    liquidationThreshold,
    ethUsdPrice,
    lendingToken,
    totalDeposits: safeFormatEther(totalDeposits),
    totalBorrows: safeFormatEther(totalBorrows),
    
    // Formatted values
    formattedInterestRate: formatInterestRate(),
    formattedEthPrice: formatEthPrice(),
    
    // User data function
    getUserAccountData,
    
    // Contract write functions
    deposit,
    borrow,
    repay,
    withdraw,
    liquidate,
    
    // Transaction states
    isDepositPending,
    isBorrowPending,
    isRepayPending,
    isWithdrawPending,
    isLiquidatePending,
    
    // Transaction hashes (can be undefined)
    depositHash,
    borrowHash,
    repayHash,
    withdrawHash,
    liquidateHash,
  };
} 