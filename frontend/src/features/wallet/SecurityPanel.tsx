import React from 'react';

interface SecurityPanelProps {
  approvalStatus: 'pending' | 'approved' | 'rejected';
  transactionType: 'deposit' | 'withdraw' | 'borrow' | 'repay';
  estimatedAmount: string;
  tokenSymbol: string;
  slippageTolerance?: number;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = ({
  approvalStatus,
  transactionType,
  estimatedAmount,
  tokenSymbol,
  slippageTolerance = 0.5,
}) => {
  const getStatusColor = () => {
    switch (approvalStatus) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getActionVerb = () => {
    switch (transactionType) {
      case 'deposit':
        return 'Deposit';
      case 'withdraw':
        return 'Withdraw';
      case 'borrow':
        return 'Borrow';
      case 'repay':
        return 'Repay';
      default:
        return 'Transact';
    }
  };

  const getStatusIcon = () => {
    switch (approvalStatus) {
      case 'approved':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
        );
      case 'rejected':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
        );
    }
  };
  
  return (
    <div className={`p-4 rounded-md border ${getStatusColor()}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          {getStatusIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">
            {approvalStatus === 'approved' ? 'Transaction Approved' : 
             approvalStatus === 'rejected' ? 'Transaction Rejected' : 'Awaiting Approval'}
          </h3>
          <div className="mt-2 text-sm">
            <p>
              {getActionVerb()} {estimatedAmount} {tokenSymbol}
              {slippageTolerance > 0 && 
                <span className="text-xs text-gray-500 ml-1">
                  (Slippage tolerance: {slippageTolerance}%)
                </span>
              }
            </p>
          </div>
          {approvalStatus === 'pending' && (
            <div className="mt-2">
              <button 
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Approve
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 