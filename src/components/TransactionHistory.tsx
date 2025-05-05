import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';

// Define transaction types
type TransactionType = 'deposit' | 'withdraw' | 'borrow' | 'repay';

interface Transaction {
  type: TransactionType;
  amount: string;
  timestamp: number;
  hash: string;
}

export const TransactionHistory = () => {
  const { address, isConnected } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Load transactions from localStorage when component mounts
  useEffect(() => {
    if (isConnected && address) {
      const savedTransactions = localStorage.getItem(`transactions_${address}`);
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      }
    }
  }, [address, isConnected]);
  
  // We're keeping this function for internal usage
  // but it's not being used in this component directly
  // The UserAccount component handles transaction tracking
  
  if (!isConnected || transactions.length === 0) {
    return null;
  }
  
  return (
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
              <span className="amount">{formatEther(tx.amount as any)} tokens</span>
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
  );
};

export default TransactionHistory; 