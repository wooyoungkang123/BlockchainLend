import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { useLendingPool } from '../hooks/useLendingPool';
import { formatEther } from 'viem';

type TransactionType = 'deposit' | 'withdraw' | 'borrow' | 'repay';

interface Transaction {
  type: TransactionType;
  amount: string;
  timestamp: number;
  hash: string;
}

// Define the expected type for account data
interface AccountData {
  0: bigint;
  1: bigint;
  2: bigint;
  3: bigint;
}

export const UserAccount = () => {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState('deposit');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showHealthFactor, setShowHealthFactor] = useState(false);
  
  const {
    getUserAccountData,
    deposit,
    borrow,
    repay,
    withdraw,
    isDepositPending,
    isBorrowPending,
    isRepayPending,
    isWithdrawPending,
    depositHash,
    borrowHash,
    repayHash,
    withdrawHash
  } = useLendingPool();

  // Get user's account data if connected
  const { data: accountData } = getUserAccountData(address || '0x0000000000000000000000000000000000000000');

  // Load transactions from localStorage when component mounts
  useEffect(() => {
    if (isConnected && address) {
      const savedTransactions = localStorage.getItem(`transactions_${address}`);
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      }
    }
  }, [address, isConnected]);

  // Track transaction hashes
  useEffect(() => {
    if (depositHash && address) {
      addTransaction('deposit', amount, depositHash);
    }
  }, [depositHash]);

  useEffect(() => {
    if (borrowHash && address) {
      addTransaction('borrow', amount, borrowHash);
      // Show health factor after borrowing
      setShowHealthFactor(true);
    }
  }, [borrowHash]);

  useEffect(() => {
    if (repayHash && address) {
      addTransaction('repay', amount, repayHash);
    }
  }, [repayHash]);

  useEffect(() => {
    if (withdrawHash && address) {
      addTransaction('withdraw', amount, withdrawHash);
    }
  }, [withdrawHash]);

  const addTransaction = (type: TransactionType, amount: string, hash: string) => {
    const newTransaction = {
      type,
      amount,
      timestamp: Date.now(),
      hash
    };
    
    const updatedTransactions = [newTransaction, ...transactions].slice(0, 10);
    setTransactions(updatedTransactions);
    
    if (address) {
      localStorage.setItem(`transactions_${address}`, JSON.stringify(updatedTransactions));
    }
  };

  if (!isConnected) {
    return (
      <div className="user-account not-connected">
        <h2>Your Account</h2>
        <p>Connect your wallet to view your account and interact with the lending pool.</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) return;
    
    switch (activeTab) {
      case 'deposit':
        deposit(amount);
        break;
      case 'borrow':
        borrow(amount);
        // Show health factor after attempting to borrow
        setShowHealthFactor(true);
        break;
      case 'repay':
        repay(amount);
        break;
      case 'withdraw':
        withdraw(amount);
        break;
      default:
        break;
    }
    
    setAmount('');
  };
  
  const isPending = isDepositPending || isBorrowPending || isRepayPending || isWithdrawPending;
  
  const formatHealthFactor = (healthFactor?: bigint): ReactNode => {
    if (!healthFactor) return <span>0%</span>;
    const value = Number(healthFactor) / 100;
    const color = value < 150 ? 'red' : value < 200 ? 'orange' : 'green';
    return <span style={{ color }}>{value}%</span>;
  };

  // Type guard to check if accountData is defined and has the expected structure
  const isValidAccountData = (data: unknown): data is AccountData => {
    return !!data && typeof data === 'object' && '0' in data && '1' in data && '2' in data;
  };

  // Calculate health factor as a percentage for the progress bar
  const getHealthFactorPercentage = (): number => {
    if (!isValidAccountData(accountData)) return 0;
    
    const healthFactor = Number(accountData[2]) / 100;
    // Cap at 300% for the progress bar (values can be higher but we don't want the bar to be too long)
    return Math.min(healthFactor, 300);
  };

  const getHealthFactorColor = (): string => {
    if (!isValidAccountData(accountData)) return '#ccc';
    
    const healthFactor = Number(accountData[2]) / 100;
    if (healthFactor < 150) return '#ff4d4f'; // red
    if (healthFactor < 200) return '#faad14'; // orange
    return '#52c41a'; // green
  };

  return (
    <div className="user-account">
      <h2>Your Account</h2>
      
      {isValidAccountData(accountData) && (
        <div className="account-info">
          <div className="account-balance">
            <div className="stat-item">
              <span>Deposit Balance:</span>
              <span>{formatEther(accountData[0])} tokens</span>
            </div>
            <div className="stat-item">
              <span>Borrow Balance:</span>
              <span>{formatEther(accountData[1])} tokens</span>
            </div>
            <div className="stat-item">
              <span>Health Factor:</span>
              <span>{formatHealthFactor(accountData[2])}</span>
            </div>
          </div>
          
          {showHealthFactor && (
            <div className="health-factor-container">
              <h4>Health Factor</h4>
              <div className="health-factor-bar-container">
                <div 
                  className="health-factor-bar" 
                  style={{ 
                    width: `${getHealthFactorPercentage()}%`,
                    backgroundColor: getHealthFactorColor()
                  }}
                ></div>
              </div>
              <div className="health-factor-labels">
                <span className="danger">Liquidation Risk</span>
                <span>150%</span>
                <span>200%</span>
                <span className="safe">Safe</span>
              </div>
              <p className="health-factor-note">
                {Number(accountData[2]) / 100 < 150 ? 
                  "Warning: Your position is at risk of liquidation!" : 
                  "Your position is currently safe from liquidation."}
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="action-tabs">
        <div className="tab-buttons">
          <button 
            className={activeTab === 'deposit' ? 'active' : ''} 
            onClick={() => setActiveTab('deposit')}
          >
            Deposit
          </button>
          <button 
            className={activeTab === 'borrow' ? 'active' : ''} 
            onClick={() => {
              setActiveTab('borrow');
              setShowHealthFactor(true);
            }}
          >
            Borrow
          </button>
          <button 
            className={activeTab === 'repay' ? 'active' : ''} 
            onClick={() => setActiveTab('repay')}
          >
            Repay
          </button>
          <button 
            className={activeTab === 'withdraw' ? 'active' : ''} 
            onClick={() => setActiveTab('withdraw')}
          >
            Withdraw
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="action-form">
          <div className="input-group">
            <input
              type="number"
              step="0.0001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Enter amount to ${activeTab}`}
              disabled={isPending}
            />
            <button type="submit" disabled={isPending || !amount}>
              {isPending ? 'Processing...' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </button>
          </div>
          
          {activeTab === 'deposit' && (
            <p className="action-hint">Deposit tokens to earn interest and use as collateral.</p>
          )}
          {activeTab === 'borrow' && (
            <p className="action-hint">Borrow tokens against your deposits. Maintain a healthy factor above 150%.</p>
          )}
          {activeTab === 'repay' && (
            <p className="action-hint">Repay your borrowed tokens plus accrued interest.</p>
          )}
          {activeTab === 'withdraw' && (
            <p className="action-hint">Withdraw your deposited tokens, limited by your health factor.</p>
          )}
        </form>
      </div>
      
      {/* Render transaction history if we have transactions */}
      {transactions.length > 0 && (
        <div className="transaction-history">
          <h3>Recent Transactions</h3>
          
          <div className="transaction-list">
            {transactions.map((tx, index) => (
              <div key={index} className="transaction-item">
                <div className="transaction-type">
                  <span className={`transaction-badge ${tx.type}`}>
                    {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                  </span>
                </div>
                
                <div className="transaction-details">
                  <span className="amount">{tx.amount} tokens</span>
                  <span className="time">{new Date(tx.timestamp).toLocaleString()}</span>
                </div>
                
                <div className="transaction-link">
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${tx.hash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAccount; 