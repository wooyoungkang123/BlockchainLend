import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { useLendingPool } from '../../hooks/useLendingPool';
import { addToast } from '../ToastCenter';
import { addTransaction } from '../../lib/transactionHistory';
import { LENDING_POOL_ADDRESS } from '../../contracts/config';
import LendingPoolABI from '../../contracts/LendingPoolABI.json';

interface RepayModalProps {
  onClose: () => void;
  isLiquidation?: boolean;
}

const RepayModal = ({ onClose, isLiquidation = false }: RepayModalProps) => {
  const { address } = useAccount();
  const { 
    repay, 
    isRepayPending,
    repayHash,
    liquidate,
    isLiquidatePending,
    liquidateHash
  } = useLendingPool();
  
  const [amount, setAmount] = useState('');
  const [currentHealthFactor, setCurrentHealthFactor] = useState<number>(0);
  const [maxRepayAmount, setMaxRepayAmount] = useState<string>('0');
  const [useCrossChain, setUseCrossChain] = useState(false);
  
  // Direct call to get user data
  const userData = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LendingPoolABI,
    functionName: 'getUserAccountData',
    args: address ? [address] : undefined,
  });
  
  // Load user data when the modal opens
  useEffect(() => {
    if (userData.data) {
      const data = userData.data as any[];
      // Calculate health factor
      const collateral = Number(formatEther(data[0] || 0n)); // ETH
      const borrowed = Number(formatEther(data[1] || 0n)); // USDC
      
      // Simple health factor calculation
      const healthFactor = borrowed > 0 ? (collateral * 2000 * 0.8) / borrowed : 100;
      setCurrentHealthFactor(healthFactor);
      
      // Set max repay amount to borrowed amount
      setMaxRepayAmount(borrowed.toString());
    }
  }, [userData.data]);

  const handleRepayOrLiquidate = async () => {
    if (!address || !amount || isNaN(parseFloat(amount))) return;
    
    try {
      let txHash;
      if (isLiquidation) {
        // For liquidation we need the borrower's address
        // In a real app, you would allow selecting the borrower to liquidate
        if (!address) return;
        
        await liquidate(address, amount);
        txHash = liquidateHash;
      } else {
        await repay(amount);
        txHash = repayHash;
      }
      
      // Add transaction to history
      if (txHash && address) {
        const txType = isLiquidation ? 'liquidate' : 'repay';
        addTransaction(address, txHash, txType, amount);
      }
      
      addToast(isLiquidation ? 'Liquidation transaction submitted' : 'Repay transaction submitted', 'success');
      onClose();
    } catch (error) {
      console.error('Repay failed:', error);
      addToast(`${isLiquidation ? 'Liquidation' : 'Repay'} failed: ` + (error as Error).message, 'error');
    }
  };

  const isPending = isLiquidation ? isLiquidatePending : isRepayPending;

  return (
    <div className="modal-content">
      <h2>{isLiquidation ? 'Liquidate Position' : 'Repay Loan'}</h2>
      
      <div className="modal-form">
        <div className="form-field">
          <label>Amount (USDC)</label>
          <div className="input-with-max">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              min="0"
              step="0.1"
              max={maxRepayAmount}
            />
            <button 
              className="max-button" 
              onClick={() => setAmount(maxRepayAmount)}
              type="button"
            >
              MAX
            </button>
          </div>
        </div>
        
        {isLiquidation && (
          <div className="form-field">
            <label>Health Factor</label>
            <div className="health-factor-bar">
              <div 
                className="health-factor-indicator" 
                style={{
                  width: `${Math.min(currentHealthFactor * 20, 100)}%`,
                  backgroundColor: currentHealthFactor < 1 ? 'red' : currentHealthFactor < 1.5 ? 'orange' : 'green'
                }}
              ></div>
            </div>
            <p className="note">
              {currentHealthFactor < 1 
                ? 'This position is eligible for liquidation' 
                : 'This position is not eligible for liquidation yet'}
            </p>
          </div>
        )}
        
        {!isLiquidation && (
          <div className="form-field checkbox-field">
            <label>
              <input
                type="checkbox"
                checked={useCrossChain}
                onChange={(e) => setUseCrossChain(e.target.checked)}
              />
              Use Cross-Chain Payment (CCIP)
            </label>
            {useCrossChain && (
              <p className="note">
                Your repayment will use Chainlink CCIP to process the transaction across chains
              </p>
            )}
          </div>
        )}
        
        <div className="modal-actions">
          <button 
            className="primary-button"
            onClick={handleRepayOrLiquidate}
            disabled={
              isPending || 
              !amount || 
              parseFloat(amount) <= 0 || 
              (isLiquidation && currentHealthFactor >= 1)
            }
          >
            {isPending 
              ? 'Processing...' 
              : isLiquidation 
                ? 'Liquidate' 
                : 'Repay'
            }
          </button>
          
          <button 
            className="secondary-button"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default RepayModal; 