import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { LendingPoolABI } from '../../contracts/abis/LendingPoolABI';
import { getContractAddress } from '../../contracts/contracts';
import { useChainId } from 'wagmi';

interface DepositCardProps {
  onSuccess?: () => void;
}

export const DepositCard = ({ onSuccess }: DepositCardProps) => {
  const [amount, setAmount] = useState('');
  const chainId = useChainId();
  const lendingPoolAddress = getContractAddress(chainId, 'LendingPool') as `0x${string}`;
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  
  // Handle success effect
  useEffect(() => {
    if (isSuccess && onSuccess) {
      setAmount('');
      onSuccess();
    }
  }, [isSuccess, onSuccess]);
  
  const handleDeposit = () => {
    if (!amount) return;
    
    writeContract({
      address: lendingPoolAddress,
      abi: LendingPoolABI,
      functionName: 'deposit',
      value: parseEther(amount),
    });
  };
  
  return (
    <div className="card p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Deposit ETH</h2>
      <div className="mb-4">
        <input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)}
          className="input w-full mb-2" 
          placeholder="Amount in ETH"
          min="0"
          step="0.01"
          disabled={isPending || isConfirming}
        />
        <p className="text-sm text-gray-500">
          Deposit ETH as collateral to borrow against.
        </p>
      </div>
      <button 
        onClick={handleDeposit} 
        disabled={isPending || isConfirming || !amount || parseFloat(amount) <= 0}
        className={`btn w-full ${
          isPending || isConfirming
            ? 'bg-gray-400 cursor-not-allowed'
            : 'btn-primary'
        }`}
      >
        {isPending 
          ? 'Waiting for approval...' 
          : isConfirming 
          ? 'Confirming...' 
          : 'Deposit ETH'}
      </button>
    </div>
  );
}; 