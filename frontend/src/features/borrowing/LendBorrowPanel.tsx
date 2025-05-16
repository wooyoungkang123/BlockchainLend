import React, { useState } from 'react';
import { BorrowForm } from './forms/BorrowForm';
import { RepayForm } from './forms/RepayForm';
import { useUserData } from '../../hooks/useUserData';
import { Wallet, Info, AlertCircle } from 'lucide-react';
import { useLendingPool } from '../../hooks/useLendingPool';

export const LendBorrowPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('borrow');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('ETH');
  const userData = useUserData();
  const { deposit, borrow, isPending, isSuccess } = useLendingPool();
  
  const availableTokens = [
    { symbol: 'ETH', name: 'Ethereum', balance: userData.depositedAmount.toString(), apy: activeTab === 'lend' ? 2.4 : 3.8 },
    { symbol: 'USDC', name: 'USD Coin', balance: userData.borrowedAmount.toString(), apy: activeTab === 'lend' ? 4.1 : 5.2 },
  ];
  
  const selectedToken = availableTokens.find(t => t.symbol === token) || availableTokens[0];
  
  const handleMaxClick = () => {
    setAmount(selectedToken.balance);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleSuccess = () => {
    // In a real implementation, we might want to refresh data here
    console.log('Transaction successful - refreshing data');
    // Force refresh any components that need to be updated
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Handle supply or borrow action
  const handleAction = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    console.log(`Handling ${activeTab === 'lend' ? 'supply' : 'borrow'} of ${amount} ${token}`);
    
    try {
      if (activeTab === 'lend') {
        // Only ETH can be supplied
        if (token === 'ETH') {
          await deposit(amount);
          console.log(`Supplied ${amount} ETH`);
          setAmount('');
          handleSuccess();
        }
      } else {
        // Only USDC can be borrowed
        if (token === 'USDC') {
          await borrow(amount);
          console.log(`Borrowed ${amount} USDC`);
          setAmount('');
          handleSuccess();
        }
      }
    } catch (err) {
      console.error('Transaction failed:', err);
    }
  };

  // Custom form content based on the selected tab
  const renderFormContent = () => {
    if (activeTab === 'borrow') {
      return <BorrowForm onSuccess={handleSuccess} />;
    } else if (activeTab === 'repay') {
      return (
        <RepayForm 
          onSuccess={handleSuccess}
          currentDebt={userData.borrowedAmount.toString()}
          tokenBalance="1000" // Mock USDC balance for now
        />
      );
    } else {
      // For the custom interface view
      return (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {activeTab === 'lend' ? 'Supply Amount' : 'Borrow Amount'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleMaxClick}
                className="absolute right-24 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                MAX
              </button>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <select
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-700 sm:text-sm rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {availableTokens.map((token) => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>Balance: {selectedToken.balance} {selectedToken.symbol}</span>
              <span>{activeTab === 'lend' ? 'Supply' : 'Borrow'} APY: {selectedToken.apy}%</span>
            </div>
          </div>
          
          {activeTab === 'borrow' && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg flex items-start">
              <Info size={18} className="text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Collateral Required</h4>
                <p className="text-sm text-blue-700">
                  You need to supply at least 150% of your borrowed value as collateral to avoid liquidation.
                </p>
              </div>
            </div>
          )}
          
          <div className="mb-6 rounded-lg border border-gray-200 divide-y divide-gray-200">
            <div className="p-4 flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm text-gray-600">
                  {activeTab === 'lend' ? 'Deposit APY' : 'Borrow APY'}
                </span>
                <Info size={14} className="text-gray-400 ml-1" />
              </div>
              <span className="text-sm font-medium">{selectedToken.apy}%</span>
            </div>
            
            {activeTab === 'lend' && (
              <div className="p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Collateral Factor</span>
                  <Info size={14} className="text-gray-400 ml-1" />
                </div>
                <span className="text-sm font-medium">75%</span>
              </div>
            )}
            
            {activeTab === 'borrow' && (
              <div className="p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Health Factor After</span>
                  <Info size={14} className="text-gray-400 ml-1" />
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">{userData.healthFactor.toFixed(2)}</span>
                  <AlertCircle size={14} className={userData.healthFactor >= 1.5 ? "text-green-500" : userData.healthFactor >= 1.2 ? "text-yellow-500" : "text-red-500"} />
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={handleAction}
            disabled={isPending || !amount || parseFloat(amount) <= 0}
            className={`w-full py-3 px-4 ${
              isPending 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white font-medium rounded-lg flex items-center justify-center`}
          >
            <Wallet size={18} className="mr-2" />
            {isPending 
              ? (activeTab === 'lend' ? 'Supplying...' : 'Borrowing...') 
              : (activeTab === 'lend' ? 'Supply' : 'Borrow')} {token}
          </button>
        </>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`pb-4 px-6 font-medium text-sm ${
            activeTab === 'lend'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => handleTabChange('lend')}
        >
          Supply
        </button>
        <button
          className={`pb-4 px-6 font-medium text-sm ${
            activeTab === 'borrow'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => handleTabChange('borrow')}
        >
          Borrow
        </button>
        <button
          className={`pb-4 px-6 font-medium text-sm ${
            activeTab === 'repay'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => handleTabChange('repay')}
        >
          Repay
        </button>
      </div>
      
      {renderFormContent()}
    </div>
  );
}; 