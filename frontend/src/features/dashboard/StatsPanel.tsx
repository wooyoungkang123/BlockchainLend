import React, { useEffect, useState } from 'react';
import { useUserStats } from '../../hooks/useUserStats';
import { useUserData } from '../../hooks/useUserData';
import { useWalletData } from '../../hooks/useWalletData';
import { formatCurrency } from '../../utils/formatters';
import { Shield, AlertTriangle, Wallet } from 'lucide-react';

export const StatsPanel: React.FC = () => {
  const { walletData } = useWalletData();
  const { 
    totalSupplied,
    totalBorrowed,
    netAPY,
    healthFactor,
    collateralRatio
  } = useUserStats();
  
  const { maxBorrowAmount } = useUserData();
  const [displayedBorrow, setDisplayedBorrow] = useState('0');

  useEffect(() => {
    // Update the displayed borrow amount from wallet data
    const borrowAmount = parseFloat(walletData.borrow || '0');
    setDisplayedBorrow(borrowAmount.toString());
    
    console.log('StatsPanel: Current borrow amount:', borrowAmount);
  }, [walletData]);

  const healthFactorValue = healthFactor || 0;
  
  // Function to determine health factor color
  const getHealthFactorColor = (factor: number) => {
    if (factor < 1.1) return 'bg-red-500';
    if (factor < 1.5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Function to determine health factor status text
  const getHealthStatus = (factor: number) => {
    if (factor < 1.1) return 'At Risk';
    if (factor < 1.5) return 'Moderate';
    return 'Safe';
  };

  // Calculate width for progress bar (cap at 100%)
  const progressWidth = Math.min(healthFactorValue * 50, 100);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Your Position</h2>
        <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
          Ethereum
        </div>
      </div>

      <div className="space-y-6">
        {/* Supplied */}
        <div className="flex items-center">
          <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mr-4">
            <Wallet size={20} className="text-green-600" />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Collateral Supplied</div>
            <div className="text-lg font-semibold text-gray-900">{totalSupplied} ETH</div>
          </div>
        </div>

        {/* Borrowed */}
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mr-4">
            <Shield size={20} className="text-blue-600" />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Borrowed Amount</div>
            <div className="text-lg font-semibold text-gray-900">{displayedBorrow} USDC</div>
          </div>
        </div>

        {/* Health Factor */}
        <div>
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mr-4">
              <AlertTriangle size={20} className={healthFactorValue < 1.1 ? 'text-red-600' : 'text-gray-600'} />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Health Factor</div>
              <div className="flex items-center">
                <span className="text-lg font-semibold text-gray-900 mr-2">{healthFactorValue.toFixed(2)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  healthFactorValue < 1.1 ? 'bg-red-100 text-red-700' : 
                  healthFactorValue < 1.5 ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-green-100 text-green-700'
                }`}>
                  {getHealthStatus(healthFactorValue)}
                </span>
              </div>
            </div>
          </div>

          {/* Health Factor Bar */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
            <div 
              className={`h-full ${getHealthFactorColor(healthFactorValue)}`} 
              style={{ width: `${progressWidth}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Liquidation</span>
            <span>Threshold: {collateralRatio}%</span>
            <span>Safe</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 