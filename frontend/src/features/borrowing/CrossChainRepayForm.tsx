import { useState, useEffect } from 'react';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { LendingPoolABI } from '../../contracts/abis/LendingPoolABI';
import { CCIPInterfaceABI } from '../../contracts/abis/CCIPInterfaceABI';
import { useToken } from '../../hooks/useToken';
import { getContractAddress } from '../../contracts/contracts';

// Mock CCIP Router addresses - in a real app, these would come from your contracts config
const CCIP_ROUTER_ADDRESSES: { [chainId: number]: string } = {
  31337: '0x70e0bA845a1A0F2DA3359C97E0285013525FFC49', // Example address for local development
  1: '0x0000000000000000000000000000000000000000',     // Placeholder for mainnet
  11155111: '0x0000000000000000000000000000000000000000', // Placeholder for Sepolia
};

interface CrossChainRepayFormProps {
  onSuccess?: () => void;
}

export const CrossChainRepayForm = ({ onSuccess }: CrossChainRepayFormProps) => {
  const [amount, setAmount] = useState('');
  const [isCrossChain, setIsCrossChain] = useState(false);
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  const { balance, allowance, approve, tokenSymbol } = useToken();
  const [needsApproval, setNeedsApproval] = useState(false);
  
  // Target chain is where our lending pool is deployed
  const targetChainId = 1; // Ethereum mainnet or your deployment chain
  
  // Check if user is on a different chain
  useEffect(() => {
    setIsCrossChain(chainId !== targetChainId);
  }, [chainId, targetChainId]);
  
  // Check if approval is needed
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      const amountValue = parseFloat(amount);
      const allowanceValue = parseFloat(allowance);
      
      setNeedsApproval(amountValue > allowanceValue);
    }
  }, [amount, allowance]);
  
  // Handle success
  useEffect(() => {
    if (isSuccess && onSuccess) {
      setAmount('');
      onSuccess();
    }
  }, [isSuccess, onSuccess]);
  
  // Handle approve
  const handleApprove = () => {
    if (needsApproval) {
      approve(amount);
    }
  };
  
  // Handle repay
  const handleRepay = () => {
    if (!amount || !address || parseFloat(amount) <= 0) return;
    
    const amountInWei = parseUnits(amount, 6); // USDC has 6 decimals
    
    if (isCrossChain) {
      // Cross-chain repayment using CCIP
      const ccipRouterAddress = CCIP_ROUTER_ADDRESSES[chainId] || CCIP_ROUTER_ADDRESSES[31337];
      const lendingPoolAddress = getContractAddress(targetChainId, 'LendingPool') as `0x${string}`;
      
      // Encode the function call to repay (simplified version)
      // In real implementation, you'd use abi.encode to properly format this
      const encodedFunctionData = '0x'; // This would be the encoded repay function call
      
      writeContract({
        address: ccipRouterAddress as `0x${string}`,
        abi: CCIPInterfaceABI,
        functionName: 'sendMessageToChain',
        args: [
          BigInt(targetChainId),                  // destination chain
          lendingPoolAddress,                     // recipient contract
          encodedFunctionData,                    // encoded function call
          BigInt(0)                               // gas limit
        ]
      });
    } else {
      // Same chain, direct repayment
      const lendingPoolAddress = getContractAddress(chainId, 'LendingPool') as `0x${string}`;
      
      writeContract({
        address: lendingPoolAddress,
        abi: LendingPoolABI,
        functionName: 'repay',
        args: [amountInWei]
      });
    }
  };
  
  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold mb-4">
        {isCrossChain ? 'Cross-Chain Repay' : 'Repay'} {tokenSymbol || 'USDC'}
      </h2>
      
      {isCrossChain && (
        <div className="bg-blue-50 p-3 rounded mb-4 text-sm">
          You're on a different chain than the lending pool. 
          We'll use Chainlink CCIP to execute your repayment cross-chain.
        </div>
      )}
      
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">Amount</label>
          <span className="text-sm text-gray-500">
            Balance: {balance} {tokenSymbol || 'USDC'}
          </span>
        </div>
        <div className="flex rounded-md shadow-sm">
          <input 
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input flex-1"
            placeholder="Enter amount to repay"
            min="0"
            step="0.01"
            disabled={isPending}
          />
          <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md">
            {tokenSymbol || 'USDC'}
          </span>
        </div>
      </div>
      
      {needsApproval ? (
        <button
          onClick={handleApprove}
          disabled={isPending || !amount || parseFloat(amount) <= 0}
          className="btn btn-primary w-full"
        >
          {isPending ? 'Processing...' : `Approve ${tokenSymbol || 'USDC'}`}
        </button>
      ) : (
        <button
          onClick={handleRepay}
          disabled={
            isPending || 
            !amount || 
            parseFloat(amount) <= 0 || 
            parseFloat(amount) > parseFloat(balance)
          }
          className="btn btn-primary w-full"
        >
          {isPending 
            ? 'Processing...' 
            : isCrossChain 
            ? 'Repay Cross-Chain' 
            : 'Repay'}
        </button>
      )}
    </div>
  );
};