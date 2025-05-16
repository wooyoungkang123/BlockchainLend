import React, { useState, useEffect } from 'react';
import { SecurityPanel } from './SecurityPanel';

interface TransactionGuardProps {
  children: React.ReactNode;
  isHighRisk?: boolean;
  isLargeAmount?: boolean;
}

export const TransactionGuard: React.FC<TransactionGuardProps> = ({ 
  children,
  isHighRisk = false,
  isLargeAmount = false
}) => {
  const [showApproval, setShowApproval] = useState(false);
  const [transactionInfo, setTransactionInfo] = useState({
    type: 'borrow',
    amount: '100',
    token: 'USDC',
    slippage: 0.5
  });
  
  // Listen for transaction events from useLendingPool
  useEffect(() => {
    const handleTransactionSubmitted = (e: Event) => {
      // Reset approval state when transaction is submitted
      setShowApproval(false);
      
      // Get transaction details if available
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        // Could update transaction info here if detail contains it
        console.log('Transaction submitted:', customEvent.detail);
      }
    };
    
    const handleTransactionCompleted = (e: Event) => {
      // Show approval when transaction is completed
      setShowApproval(true);
      
      // Get transaction details if available
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { type, amount, token, slippage } = customEvent.detail;
        if (type && amount && token) {
          setTransactionInfo({
            type: type || 'borrow',
            amount: amount || '100',
            token: token || 'USDC',
            slippage: slippage || 0.5
          });
        }
      }
    };
    
    // Add event listeners
    window.addEventListener('transaction:submitted', handleTransactionSubmitted);
    window.addEventListener('transaction:completed', handleTransactionCompleted);
    
    // Clean up
    return () => {
      window.removeEventListener('transaction:submitted', handleTransactionSubmitted);
      window.removeEventListener('transaction:completed', handleTransactionCompleted);
    };
  }, []);
  
  return (
    <div className="space-y-4">
      {/* Only show security panel when a transaction has completed */}
      {showApproval && (
        <SecurityPanel 
          approvalStatus="approved"
          transactionType={transactionInfo.type as any}
          estimatedAmount={transactionInfo.amount}
          tokenSymbol={transactionInfo.token}
          slippageTolerance={transactionInfo.slippage}
        />
      )}
      
      {isHighRisk && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            Warning: This transaction puts your position at high risk of liquidation!
          </p>
        </div>
      )}
      
      {isLargeAmount && !isHighRisk && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">
            Notice: You're about to submit a large transaction relative to your balance.
          </p>
        </div>
      )}
      
      {children}
    </div>
  );
};
