type TransactionType = 'deposit' | 'borrow' | 'repay' | 'liquidate' | 'approval';

interface Transaction {
  id: string;
  hash: string;
  type: TransactionType;
  amount?: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

// User address -> transactions
const STORAGE_KEY = 'transaction_history';

export const getTransactions = (address?: string): Transaction[] => {
  if (!address) return [];
  
  try {
    const storageData = localStorage.getItem(STORAGE_KEY);
    if (!storageData) return [];
    
    const allTransactions = JSON.parse(storageData);
    return allTransactions[address.toLowerCase()] || [];
  } catch (error) {
    console.error('Failed to get transactions:', error);
    return [];
  }
}

export const addTransaction = (
  address: string,
  hash: string,
  type: TransactionType,
  amount?: string
): void => {
  try {
    if (!address || !hash) return;
    
    const transaction: Transaction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      hash,
      type,
      amount,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    const storageData = localStorage.getItem(STORAGE_KEY);
    const allTransactions = storageData ? JSON.parse(storageData) : {};
    
    const userTransactions = allTransactions[address.toLowerCase()] || [];
    userTransactions.unshift(transaction);
    
    // Limit to 20 most recent transactions
    if (userTransactions.length > 20) {
      userTransactions.pop();
    }
    
    allTransactions[address.toLowerCase()] = userTransactions;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allTransactions));
  } catch (error) {
    console.error('Failed to add transaction:', error);
  }
}

export const updateTransactionStatus = (
  address: string,
  hash: string,
  status: 'confirmed' | 'failed'
): void => {
  try {
    if (!address || !hash) return;
    
    const storageData = localStorage.getItem(STORAGE_KEY);
    if (!storageData) return;
    
    const allTransactions = JSON.parse(storageData);
    const userTransactions = allTransactions[address.toLowerCase()];
    
    if (!userTransactions) return;
    
    const updatedTransactions = userTransactions.map((tx: Transaction) => {
      if (tx.hash.toLowerCase() === hash.toLowerCase()) {
        return { ...tx, status };
      }
      return tx;
    });
    
    allTransactions[address.toLowerCase()] = updatedTransactions;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allTransactions));
  } catch (error) {
    console.error('Failed to update transaction:', error);
  }
} 