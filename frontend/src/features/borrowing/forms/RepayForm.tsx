import { useState } from 'react';
import { useRepay } from '../../../hooks/useRepay';
import { useUserData } from '../../../hooks/useUserData';
import { useWalletData } from '../../../hooks/useWalletData';

interface RepayFormProps {
  onSuccess?: () => void;
}

export const RepayForm = ({ onSuccess }: RepayFormProps) => {
  const { borrowedAmount: currentDebt, healthFactor } = useUserData();
  const { walletData } = useWalletData();
  const [amount, setAmount] = useState('');
  const { repay, isPending, error } = useRepay();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    if (parseFloat(amount) > currentDebt) {
      setAmount(currentDebt.toString());
    }
    
    try {
      await repay(parseFloat(amount));
      setAmount('');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error in repay submission:', err);
    }
  };

  // Maximum amount that can be repaid is the current debt
  const maxRepayable = currentDebt;
  
  // Token balance is mocked - in a real app we would get this from a token balance hook
  const tokenBalance = parseFloat(walletData.tokenBalance || '1000');
  
  // Calculate new health factor after repayment
  const calculateNewHealthFactor = () => {
    if (currentDebt === 0) return 999;
    const repayAmount = parseFloat(amount) || 0;
    const remainingDebt = Math.max(0, currentDebt - repayAmount);
    
    if (remainingDebt === 0) return 999;
    
    const ethPrice = walletData.ethPrice / 1e8;
    const collateralValue = parseFloat(walletData.collateral || '0');
    const collateralValueInUsd = collateralValue * ethPrice;
    const liquidationThreshold = 80; // 80%
    const adjustedCollateral = (collateralValueInUsd * liquidationThreshold) / 100;
    
    return adjustedCollateral / remainingDebt;
  };
  
  const newHealthFactor = calculateNewHealthFactor();
  
  const handleMaxClick = () => {
    // Set to the minimum of current debt or token balance
    const maxAmount = Math.min(currentDebt, tokenBalance);
    setAmount(maxAmount.toString());
  };
  
  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="repayAmount" className="block text-sm font-medium text-gray-700">
              Repay Amount (USDC)
            </label>
            <span className="text-xs text-gray-500">
              Debt: {currentDebt.toFixed(2)} USDC
            </span>
          </div>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              id="repayAmount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <div className="text-gray-500 text-sm">USDC</div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              Balance: {tokenBalance.toFixed(2)} USDC
            </span>
            <button
              type="button"
              onClick={handleMaxClick}
              className="text-blue-600 hover:text-blue-700 text-xs font-medium"
            >
              MAX
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <h4 className="text-sm font-medium text-gray-800 mb-3">Repayment Details</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Current Debt</span>
              <span className="text-sm font-medium">{currentDebt.toFixed(2)} USDC</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">After Repayment</span>
              <span className="text-sm font-medium">
                {Math.max(0, currentDebt - parseFloat(amount || '0')).toFixed(2)} USDC
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Health Factor</span>
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">{healthFactor.toFixed(2)}</span>
                <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-gray-100">Current</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Health Factor After</span>
              <div className="flex items-center">
                <span className={`text-sm font-medium mr-2 ${
                  newHealthFactor > 100 ? 'text-green-600' : 
                  newHealthFactor >= 1.5 ? 'text-green-600' : 
                  newHealthFactor >= 1.2 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {newHealthFactor > 100 ? '∞' : newHealthFactor.toFixed(2)}
                </span>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  newHealthFactor > 100 ? 'bg-green-100 text-green-800' : 
                  newHealthFactor >= 1.5 ? 'bg-green-100 text-green-800' : 
                  newHealthFactor >= 1.2 ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {newHealthFactor > 100 ? 'No Debt' : 
                   newHealthFactor >= 1.5 ? 'Safe' : 
                   newHealthFactor >= 1.2 ? 'Caution' : 
                   'At Risk'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="text-red-600 text-sm">
            {error.message || 'An error occurred during repayment'}
          </div>
        )}
        
        <button
          type="submit"
          disabled={
            isPending || 
            !amount || 
            parseFloat(amount) <= 0 || 
            parseFloat(amount) > Math.min(currentDebt, tokenBalance)
          }
          className={`w-full py-3 px-4 ${
            isPending || !amount || parseFloat(amount) <= 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-medium rounded-lg flex items-center justify-center`}
        >
          {isPending ? 'Processing...' : 'Repay USDC'}
        </button>
      </form>
    </div>
  );
}; 