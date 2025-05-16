import { useState } from 'react';
import { useWalletData } from '../hooks/useWalletData';
import { DollarSign, RefreshCw } from 'lucide-react';

export const EthPriceAdjuster = () => {
  const { walletData, updateEthPrice } = useWalletData();
  const [priceInput, setPriceInput] = useState('2000');
  
  // Current ETH price in USD (from Chainlink format to regular USD)
  const currentPrice = walletData.ethPrice / 1e8;
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPriceInput(e.target.value);
  };
  
  const handleUpdatePrice = () => {
    const newPrice = parseFloat(priceInput);
    if (!isNaN(newPrice) && newPrice > 0) {
      // Convert to Chainlink price feed format (8 decimals)
      updateEthPrice(newPrice * 1e8);
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg text-white z-50 border border-gray-700">
      <h4 className="text-sm font-semibold mb-3 flex items-center">
        <DollarSign size={16} className="mr-1 text-blue-400" />
        ETH Price Simulator
      </h4>
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-xs text-gray-300">$</span>
        <input
          type="number"
          value={priceInput}
          onChange={handlePriceChange}
          className="bg-gray-700 text-white rounded px-3 py-1.5 w-24 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleUpdatePrice}
          className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1.5 rounded flex items-center transition-colors duration-200"
        >
          <RefreshCw size={12} className="mr-1" />
          Update
        </button>
      </div>
      <div className="text-xs text-gray-300 flex items-center">
        <span>Current: </span>
        <span className="ml-1 font-medium text-blue-300">${currentPrice.toFixed(2)}</span>
      </div>
    </div>
  );
}; 