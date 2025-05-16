import React, { useState } from 'react';
import { ArrowRight, ChevronDown, Wallet, AlertCircle, Info } from 'lucide-react';

export const TransactionForm: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('ETH');
  
  const tokens = [
    { symbol: 'ETH', name: 'Ethereum', balance: '5.43', icon: '🔷' },
    { symbol: 'USDC', name: 'USD Coin', balance: '10,432.51', icon: '💲' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: '0.1245', icon: '🔶' },
  ];
  
  const currentToken = tokens.find(t => t.symbol === selectedToken) || tokens[0];
  
  const handleMaxClick = () => {
    setAmount(currentToken.balance);
  };
  
  const [showTokenSelect, setShowTokenSelect] = useState(false);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Swap Assets</h2>
      
      {/* Amount Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          You Pay
        </label>
        <div className="relative rounded-lg border border-gray-200 hover:border-gray-300 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="block w-full pl-4 pr-32 py-3 border-0 rounded-lg focus:ring-0 focus:outline-none text-gray-900"
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              type="button"
              onClick={() => setShowTokenSelect(!showTokenSelect)}
              className="inline-flex items-center px-3 py-2 mr-1 border border-gray-200 rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100"
            >
              <span className="mr-1">{currentToken.icon}</span>
              <span className="font-medium">{currentToken.symbol}</span>
              <ChevronDown size={16} className="ml-1" />
            </button>
          </div>
          
          {/* MAX button */}
          <button
            onClick={handleMaxClick}
            className="absolute left-4 bottom-0 transform translate-y-full text-xs text-blue-600 font-medium p-1"
          >
            MAX: {currentToken.balance}
          </button>
        </div>
        
        {/* Token Selection Dropdown */}
        {showTokenSelect && (
          <div className="absolute mt-1 w-full max-w-xs bg-white rounded-lg shadow-lg z-10 border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">Select Token</h3>
            </div>
            <div className="max-h-60 overflow-y-auto py-2">
              {tokens.map((token) => (
                <button
                  key={token.symbol}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between"
                  onClick={() => {
                    setSelectedToken(token.symbol);
                    setShowTokenSelect(false);
                  }}
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{token.icon}</span>
                    <div>
                      <div className="font-medium text-gray-800">{token.symbol}</div>
                      <div className="text-xs text-gray-500">{token.name}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {token.balance}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Arrow */}
      <div className="flex justify-center mb-6">
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
          <ArrowRight size={20} className="text-gray-400" />
        </div>
      </div>
      
      {/* Receive Amount */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          You Receive (Estimated)
        </label>
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">0.00</span>
            <div className="flex items-center">
              <span className="text-lg mr-1">💲</span>
              <span className="font-medium">USDC</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Transaction Details */}
      <div className="mb-6 rounded-lg border border-gray-200">
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700">Transaction Details</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          <div className="p-3 flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-600">
              <span>Rate</span>
              <Info size={14} className="ml-1 text-gray-400" />
            </div>
            <span className="text-sm font-medium">1 ETH = 1,955.67 USDC</span>
          </div>
          
          <div className="p-3 flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-600">
              <span>Price Impact</span>
              <Info size={14} className="ml-1 text-gray-400" />
            </div>
            <span className="text-sm font-medium text-green-600">0.05%</span>
          </div>
          
          <div className="p-3 flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-600">
              <span>Network Fee</span>
              <Info size={14} className="ml-1 text-gray-400" />
            </div>
            <span className="text-sm font-medium">~0.002 ETH ($4.52)</span>
          </div>
        </div>
      </div>
      
      {/* Warning */}
      <div className="mb-6 p-3 bg-yellow-50 rounded-lg flex items-start">
        <AlertCircle size={18} className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
        <p className="text-sm text-yellow-700">
          Prices can change rapidly. Your transaction will revert if the price changes by more than 1%.
        </p>
      </div>
      
      {/* Action Button */}
      <button
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center"
      >
        <Wallet size={18} className="mr-2" />
        Review Transaction
      </button>
    </div>
  );
}; 