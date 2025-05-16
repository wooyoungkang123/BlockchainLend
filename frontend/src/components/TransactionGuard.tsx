import React from 'react';
import { SecurityPanel } from './SecurityPanel';
import { TransactionStatusDisplay } from './TransactionStatusDisplay';

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
  return (
    <div className="space-y-4">
      <SecurityPanel 
        approvalStatus="approved"
        transactionType="borrow"
        estimatedAmount="100"
        tokenSymbol="USDC"
        slippageTolerance={0.5}
      />
      
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
