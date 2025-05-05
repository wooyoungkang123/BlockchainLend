import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useLendingPool } from '../../hooks/useLendingPool';
import { addToast } from '../ToastCenter';
import { addTransaction } from '../../lib/transactionHistory';

interface DepositModalProps {
  onClose: () => void;
}

const DepositModal = ({ onClose }: DepositModalProps) => {
  const { address } = useAccount();
  const { deposit, isDepositPending, depositHash } = useLendingPool();
  const [amount, setAmount] = useState('');
  
  const handleDeposit = async () => {
    if (!address || !amount || isNaN(parseFloat(amount))) return;
    
    try {
      await deposit(amount);
      
      // Add transaction to history if hash is available
      if (depositHash && address) {
        addTransaction(address, depositHash, 'deposit', amount);
      }
      
      addToast('Deposit transaction submitted', 'success');
      onClose();
    } catch (error) {
      console.error('Deposit failed:', error);
      addToast('Deposit failed: ' + (error as Error).message, 'error');
    }
  };

  return (
    <div className="modal-content">
      <h2>Deposit ETH as Collateral</h2>
      
      <div className="modal-form">
        <div className="form-field">
          <label>Amount (ETH)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            min="0"
            step="0.01"
          />
        </div>
        
        <div className="info-box">
          <p>ETH will be used as collateral to enable borrowing.</p>
          <p>Current collateral ratio: 80%</p>
          <p>Your ETH will be securely held in the lending pool contract.</p>
        </div>
        
        <div className="modal-actions">
          <button 
            className="primary-button"
            onClick={handleDeposit}
            disabled={isDepositPending || !amount || parseFloat(amount) <= 0}
          >
            {isDepositPending ? 'Processing...' : 'Deposit'}
          </button>
          
          <button 
            className="secondary-button"
            onClick={onClose}
            disabled={isDepositPending}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default DepositModal; 