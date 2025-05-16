import { useState } from 'react';
import { useBorrow } from '../../../hooks/useBorrow';
import { Slider } from '../../ui/slider';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { useUserData } from '../../../hooks/useUserData';
import { useWalletData } from '../../../hooks/useWalletData';

interface BorrowFormProps {
  onSuccess?: () => void;
}

export const BorrowForm = ({ onSuccess }: BorrowFormProps) => {
  const { maxBorrowAmount, depositedAmount: collateralBalance, borrowedAmount } = useUserData();
  const { walletData } = useWalletData();
  const [amount, setAmount] = useState<string>('0');
  const [borrowPercent, setBorrowPercent] = useState<number>(50);
  const { borrow, isPending, error } = useBorrow();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    // Update percent slider based on amount
    const numAmount = parseFloat(e.target.value) || 0;
    const newPercent = Math.min(100, Math.max(0, (numAmount / maxBorrowAmount) * 100));
    setBorrowPercent(isNaN(newPercent) ? 0 : newPercent);
  };

  const handleSliderChange = (value: number) => {
    setBorrowPercent(value);
    // Update amount based on percent
    const newAmount = ((value / 100) * maxBorrowAmount).toFixed(2);
    setAmount(newAmount);
  };

  const handleMaxClick = () => {
    const safeMax = (maxBorrowAmount * 0.95).toFixed(2);
    setAmount(safeMax);
    setBorrowPercent(95);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    console.log('Attempting to borrow:', amountNum);
    
    try {
      await borrow(amountNum);
      console.log('Borrow successful, amount:', amountNum);
      
      // Only call onSuccess if we have a callback and borrow was successful
      if (onSuccess) {
        console.log('Calling onSuccess callback');
        onSuccess();
      }
      
      // Reset amount after successful borrow
      setAmount('0');
      setBorrowPercent(0);
    } catch (err) {
      console.error('Error in borrow submission:', err);
    }
  };

  // Calculate new health factor after borrowing
  const calculateHealthFactor = () => {
    const ethPrice = walletData.ethPrice / 1e8; // Convert Chainlink format to USD
    const liquidationThreshold = 80; // 80%
    const collateralValueInUsd = collateralBalance * ethPrice;
    const adjustedCollateral = (collateralValueInUsd * liquidationThreshold) / 100;
    
    // Total borrowed would be current borrowed amount + new amount
    const currentBorrowed = borrowedAmount;
    const newBorrowed = currentBorrowed + parseFloat(amount || '0');
    
    // Health factor = adjusted collateral / total borrowed
    return newBorrowed > 0 ? adjustedCollateral / newBorrowed : 999;
  };
  
  const estimatedHealthFactor = calculateHealthFactor();
  
  // Format the max borrow amount for display
  const formattedMaxBorrow = maxBorrowAmount.toFixed(2);
  
  // Determine health factor color
  const getHealthFactorColor = (factor: number) => {
    if (factor >= 1.5) return 'text-green';
    if (factor >= 1.2) return 'text-yellow-600';
    return 'text-red';
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="amount" className="form-label">
                Amount to Borrow (USDC)
              </Label>
              <span className="text-xs text-gray">
                Collateral: <span className="stats-value">{collateralBalance.toFixed(2)}</span> ETH
              </span>
            </div>
            <div className="mt-1 relative rounded-md shadow-sm">
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="input"
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <div className="token-badge">
                  USDC
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <button 
                type="button" 
                onClick={handleMaxClick}
                className="text-primary-600 hover:text-primary-700 text-xs font-medium"
              >
                Safe Max
              </button>
            </div>
          </div>
          
          <div className="slider-container">
            <div className="flex-between mb-2">
              <Label htmlFor="borrowPercent" className="form-label">
                Borrow Amount: <span className="stats-value">{borrowPercent}%</span>
              </Label>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={borrowPercent}
              onValueChange={handleSliderChange}
              className="w-full"
            />
            <div className="slider-labels">
              <span>Safe</span>
              <span>Maximum</span>
            </div>
          </div>
          
          <div className="info-box">
            <h4 className="text-sm font-medium mb-3">Borrow Details</h4>
            <div className="space-y-3">
              <div className="flex-between">
                <span className="text-sm text-gray">Available</span>
                <span className="text-sm font-medium stats-value">{formattedMaxBorrow} USDC</span>
              </div>
              <div className="flex-between">
                <span className="text-sm text-gray">You Borrow</span>
                <span className="text-sm font-medium stats-value">{amount} USDC</span>
              </div>
              <div className="flex-between">
                <span className="text-sm text-gray">Health Factor After</span>
                <span className={`text-sm font-medium ${getHealthFactorColor(estimatedHealthFactor)}`}>
                  {estimatedHealthFactor > 100 ? "∞" : estimatedHealthFactor.toFixed(2)}
                </span>
              </div>
              <div>
                <div className="health-bar-container mt-2">
                  <div 
                    className={`health-bar ${getHealthFactorColor(estimatedHealthFactor)}`} 
                    style={{ width: `${Math.min(estimatedHealthFactor * 30, 100)}%` }}
                  />
                </div>
                <div className="flex-between text-xs mt-1">
                  <span className="text-red">Liquidation</span>
                  <span className="text-green">Safe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="text-red text-sm mt-2">
            {error.message}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isPending || parseFloat(amount) <= 0 || estimatedHealthFactor < 1.05 || parseFloat(amount) > maxBorrowAmount}
          className="button button-primary w-full"
        >
          {isPending ? 'Processing...' : 'Borrow USDC'}
        </button>
      </form>
    </div>
  );
}; 