import React, { useState } from 'react';

interface SecurityPanelProps {
  approvalStatus?: 'required' | 'approved' | 'pending';
  transactionType: string;
  estimatedAmount: string;
  tokenSymbol?: string;
  slippageTolerance?: number;
  txData?: any;
  isHighRisk?: boolean;
  isLargeAmount?: boolean;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = ({
  approvalStatus = 'approved',
  transactionType,
  estimatedAmount,
  tokenSymbol = 'USDC',
  slippageTolerance = 0.5,
  txData,
  isHighRisk = false,
  isLargeAmount = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden">
      <div 
        className="px-4 py-3 bg-white hover:bg-blue-50 cursor-pointer flex justify-between items-center"
        onClick={toggleExpanded}
      >
        <div className="flex items-center">
          <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center">
            {approvalStatus === 'approved' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : approvalStatus === 'pending' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 animate-spin" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                <circle cx="10" cy="10" r="7" strokeWidth="2" stroke="currentColor" fill="none" />
                <path d="M10 3v2" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <h3 className="ml-2 text-sm font-medium text-gray-900">Transaction Security</h3>
        </div>
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-2">
            {approvalStatus === 'approved' ? 'Approved' : approvalStatus === 'pending' ? 'Pending Approval' : 'Approval Required'}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 py-3 bg-blue-50 border-t border-gray-200">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Transaction Type:</span>
              <span className="font-medium text-gray-900 capitalize">{transactionType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Estimated Amount:</span>
              <span className="font-medium text-gray-900">{estimatedAmount} {tokenSymbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Slippage Tolerance:</span>
              <span className="font-medium text-gray-900">{slippageTolerance}%</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  All transactions are verified with your wallet before execution
                </span>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-1 text-xs text-green-600">Secure</span>
                </div>
              </div>
            </div>
            {isHighRisk && (
              <div className="mt-2 border-t border-gray-200 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-red-500">
                    High Risk Transaction: This transaction may put your position at risk of liquidation. Please verify all details carefully.
                  </span>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            {isLargeAmount && (
              <div className="mt-2 border-t border-gray-200 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-yellow-500">
                    Large Transaction: This is a significant transaction amount. Double-check all values before confirming.
                  </span>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            {txData && (
              <div className="mt-2 border-t border-gray-200 pt-2 text-xs text-gray-500">
                <p className="font-medium text-gray-700 mb-1">Transaction data:</p>
                <div className="bg-gray-100 p-2 rounded overflow-x-auto">
                  <code className="break-all">{JSON.stringify(txData)}</code>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 