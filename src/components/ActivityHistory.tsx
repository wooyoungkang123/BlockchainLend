import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

type TransactionType = 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'liquidate';

interface Transaction {
  type: TransactionType;
  amount: string;
  timestamp: number;
  hash: string;
}

const ActivityHistory = () => {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Load transactions from localStorage when component mounts
  useEffect(() => {
    if (address) {
      const savedTransactions = localStorage.getItem(`transactions_${address}`);
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      }
    }
  }, [address]);

  if (transactions.length === 0) {
    return (
      <div className="activity-history empty">
        <h3>Activity History</h3>
        <p className="empty-state">No transactions yet</p>
        <p className="hint-text">Your transactions will appear here</p>
      </div>
    );
  }

  return (
    <div className="activity-history">
      <h3>Activity History</h3>
      
      <div className="transaction-list">
        {transactions.map((tx, index) => (
          <div key={index} className="transaction-item">
            <div className="transaction-icon">
              {tx.type === 'deposit' && '📥'}
              {tx.type === 'withdraw' && '📤'}
              {tx.type === 'borrow' && '💸'}
              {tx.type === 'repay' && '💰'}
              {tx.type === 'liquidate' && '⚠️'}
            </div>
            
            <div className="transaction-details">
              <div className="transaction-type">
                {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
              </div>
              <div className="transaction-amount">{tx.amount} tokens</div>
              <div className="transaction-time">{new Date(tx.timestamp).toLocaleString()}</div>
            </div>
            
            <a 
              href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transaction-link"
            >
              View
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityHistory; 