import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { useLendingPool } from '../../hooks/useLendingPool';
import { addToast } from '../ToastCenter';
import { addTransaction } from '../../lib/transactionHistory';
import { LENDING_POOL_ADDRESS } from '../../contracts/config';
import LendingPoolABI from '../../contracts/LendingPoolABI.json';

interface BorrowModalProps {
  onClose: () => void;
}

const BorrowModal = ({ onClose }: BorrowModalProps) => {
  const { address } = useAccount();
  const { 
    borrow, 
    isBorrowPending,
    borrowHash
  } = useLendingPool();
  
  const [amount, setAmount] = useState('');
  const [currentHealthFactor, setCurrentHealthFactor] = useState<number>(0);
  const [projectedHealthFactor, setProjectedHealthFactor] = useState<number>(0);
  
  // Direct call to get user data
  const userData = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LendingPoolABI,
    functionName: 'getUserAccountData',
    args: address ? [address] : undefined,
  });
  
  // Load user data when the modal opens or userData changes
  useEffect(() => {
    if (userData.data) {
      const data = userData.data as any[];
      // Calculate health factor - collateral / borrowed * liquidation threshold
      // For simplicity, we'll use a placeholder calculation
      const collateral = Number(formatEther(data[0] || 0n)); // ETH
      const borrowed = Number(formatEther(data[1] || 0n)); // USDC
      
      // Simple health factor calculation
      const healthFactor = borrowed > 0 ? (collateral * 2000 * 0.8) / borrowed : 100;
      setCurrentHealthFactor(healthFactor);
    }
  }, [userData.data]);

  // Update projected health factor when amount changes
  useEffect(() => {
    calculateProjectedHealthFactor();
  }, [amount, userData.data]);

  const calculateProjectedHealthFactor = () => {
    if (!userData.data || !amount || isNaN(parseFloat(amount))) {
      setProjectedHealthFactor(currentHealthFactor);
      return;
    }
    
    try {
      const data = userData.data as any[];
      const collateral = Number(formatEther(data[0] || 0n)); // ETH
      const currentBorrowed = Number(formatEther(data[1] || 0n)); // USDC
      const newBorrowAmount = parseFloat(amount);
      const projectedBorrowed = currentBorrowed + newBorrowAmount;
      
      // Simple health factor calculation
      const healthFactor = projectedBorrowed > 0 ? (collateral * 2000 * 0.8) / projectedBorrowed : 100;
      setProjectedHealthFactor(healthFactor);
    } catch (error) {
      console.error('Failed to calculate projected health factor:', error);
    }
  };

  const handleBorrow = async () => {
    if (!address || !amount || isNaN(parseFloat(amount))) return;
    
    try {
      await borrow(amount);
      
      // Add transaction to history if we have a hash
      if (borrowHash && address) {
        addTransaction(address, borrowHash, 'borrow', amount);
      }
      
      addToast('Borrow transaction submitted', 'success');
      onClose();
    } catch (error) {
      console.error('Borrow failed:', error);
      addToast('Borrow failed: ' + (error as Error).message, 'error');
    }
  };

  return (
    <div className="modal-content">
      <h2>Borrow USDC</h2>
      
      <div className="modal-form">
        <div className="form-field">
          <label>Amount (USDC)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            min="0"
            step="0.1"
          />
        </div>
        
        <div className="health-factor-section">
          <p>Current Health Factor: {currentHealthFactor.toFixed(2)}</p>
          <div className="health-factor-bar">
            <div 
              className="health-factor-indicator" 
              style={{
                width: `${Math.min(currentHealthFactor * 20, 100)}%`,
                backgroundColor: currentHealthFactor < 1 ? 'red' : currentHealthFactor < 1.5 ? 'orange' : 'green'
              }}
            ></div>
          </div>
          
          {amount && projectedHealthFactor !== currentHealthFactor && (
            <>
              <p>Projected Health Factor: {projectedHealthFactor.toFixed(2)}</p>
              <div className="health-factor-bar">
                <div 
                  className="health-factor-indicator" 
                  style={{
                    width: `${Math.min(projectedHealthFactor * 20, 100)}%`,
                    backgroundColor: projectedHealthFactor < 1 ? 'red' : projectedHealthFactor < 1.5 ? 'orange' : 'green'
                  }}
                ></div>
              </div>
            </>
          )}
          
          {projectedHealthFactor < 1 && amount && (
            <p className="warning-text">
              Warning: Health factor below 1 will risk liquidation
            </p>
          )}
        </div>
        
        <div className="modal-actions">
          <button 
            className="primary-button"
            onClick={handleBorrow}
            disabled={isBorrowPending || !amount || projectedHealthFactor < 1}
          >
            {isBorrowPending ? 'Processing...' : 'Borrow'}
          </button>
          
          <button 
            className="secondary-button"
            onClick={onClose}
            disabled={isBorrowPending}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default BorrowModal; 