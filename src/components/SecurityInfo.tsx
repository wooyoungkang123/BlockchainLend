import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { LENDING_POOL_ADDRESS, LENDING_TOKEN_ADDRESS } from '../contracts/config';
import LendingPoolABI from '../contracts/LendingPoolABI.json';
import ERC20ABI from '../contracts/ERC20ABI.json';

interface SecurityInfoProps {
  transactionType: 'deposit' | 'borrow' | 'repay' | 'withdraw';
  amount: string;
}

export default function SecurityInfo({ transactionType, amount }: SecurityInfoProps) {
  const { address } = useAccount();
  const [gasEstimate, setGasEstimate] = useState<string>('');
  const [slippageImpact, setSlippageImpact] = useState<number>(0);
  const [approvalNeeded, setApprovalNeeded] = useState<boolean>(false);
  
  // Get allowance for ERC20 token (for deposit and repay operations)
  const { data: allowance } = useReadContract({
    address: LENDING_TOKEN_ADDRESS,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: address ? [address, LENDING_POOL_ADDRESS] : undefined,
    query: {
      enabled: !!address && (transactionType === 'deposit' || transactionType === 'repay'),
    }
  });

  // Read total deposits and borrows for slippage calculation
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

  // Check if approval is needed
  useEffect(() => {
    if (allowance && amount && (transactionType === 'deposit' || transactionType === 'repay')) {
      try {
        const amountBigInt = parseEther(amount || '0');
        setApprovalNeeded(amountBigInt > (allowance as bigint));
      } catch (error) {
        console.error('Error parsing amount:', error);
      }
    }
  }, [allowance, amount, transactionType]);

  // Calculate slippage impact
  useEffect(() => {
    if (totalDeposits && totalBorrows && amount) {
      try {
        const amountBigInt = parseEther(amount || '0');
        
        if (transactionType === 'deposit' || transactionType === 'withdraw') {
          const poolSize = totalDeposits as bigint;
          const impact = poolSize > 0n ? Number((amountBigInt * 10000n) / poolSize) / 100 : 0;
          setSlippageImpact(impact);
        } else {
          // borrow or repay
          const borrowSize = totalBorrows as bigint;
          const impact = borrowSize > 0n ? Number((amountBigInt * 10000n) / borrowSize) / 100 : 0;
          setSlippageImpact(impact);
        }
      } catch (error) {
        console.error('Error calculating slippage:', error);
      }
    }
  }, [totalDeposits, totalBorrows, amount, transactionType]);

  // Estimate gas costs for different operations
  useEffect(() => {
    const estimateGas = async () => {
      try {
        if (!amount || !address) return;
        
        let gasLimit;
        
        switch (transactionType) {
          case 'deposit':
            gasLimit = 200000n;
            break;
          case 'withdraw':
            gasLimit = 150000n;
            break;
          case 'borrow':
            gasLimit = 180000n;
            break;
          case 'repay':
            gasLimit = 160000n;
            break;
          default:
            gasLimit = 200000n;
        }
        
        // Add 10% buffer to gas estimate
        const gasWithBuffer = gasLimit * 110n / 100n;
        setGasEstimate(formatEther(gasWithBuffer * 5000000000n)); // 5 Gwei gas price
      } catch (error) {
        console.error('Error estimating gas:', error);
      }
    };
    
    estimateGas();
  }, [address, amount, transactionType]);

  return (
    <div className="security-info">
      <h4>Security Information</h4>
      
      {/* Approval Status */}
      {(transactionType === 'deposit' || transactionType === 'repay') && (
        <div className="security-item">
          <span className="security-label">Token Approval:</span>
          <span className={`security-value ${approvalNeeded ? 'warning' : 'success'}`}>
            {approvalNeeded ? 'Approval Required' : 'Already Approved'}
          </span>
          {approvalNeeded && (
            <div className="security-note">
              You'll need to approve the lending pool to use your tokens before this transaction.
            </div>
          )}
        </div>
      )}
      
      {/* Slippage Warning */}
      <div className="security-item">
        <span className="security-label">Slippage Impact:</span>
        <span className={`security-value ${slippageImpact > 1 ? 'warning' : 'normal'}`}>
          {slippageImpact.toFixed(2)}%
        </span>
        {slippageImpact > 1 && (
          <div className="security-note warning">
            This transaction will have a significant impact on the pool and may result in less favorable rates.
          </div>
        )}
      </div>
      
      {/* Gas Estimate */}
      <div className="security-item">
        <span className="security-label">Estimated Gas Fee:</span>
        <span className="security-value">
          {gasEstimate ? `${Number(gasEstimate).toFixed(6)} ETH` : 'Calculating...'}
        </span>
        <div className="security-note">
          Estimated maximum gas fee. Actual cost may be lower.
        </div>
      </div>
    </div>
  );
} 