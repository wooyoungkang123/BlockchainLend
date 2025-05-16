import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { useBorrow } from '../../../hooks/useBorrow';
import { usePoolData } from '../../../hooks/usePoolData';
import { useUserData } from '../../../hooks/useUserData';

interface BorrowFormProps {
  onSuccess?: () => void;
  className?: string;
}

export const BorrowForm: React.FC<BorrowFormProps> = ({ onSuccess, className = '' }) => {
  const [borrowAmount, setBorrowAmount] = useState<number>(0);
  const [collateralRatio, setCollateralRatio] = useState<number>(150);
  const { maxBorrowAmount } = usePoolData();
  const { collateralBalance, healthFactor } = useUserData();
  const { borrow, isPending } = useBorrow();

  // Calculate adjusted health factor based on LTV
  const [adjustedHealthFactor, setAdjustedHealthFactor] = useState(healthFactor);
  
  useEffect(() => {
    // Simple calculation that decreases health factor as LTV increases
    const newHealthFactor = Math.max(1.1, healthFactor * (1 - (collateralRatio / 100) * 0.5));
    setAdjustedHealthFactor(parseFloat(newHealthFactor.toFixed(2)));
  }, [collateralRatio, healthFactor]);

  const handleBorrowAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBorrowAmount(Number(e.target.value) || 0);
  };

  const handleSliderChange = (value: number) => {
    setCollateralRatio(value);
  };

  const requiredCollateral = (borrowAmount * collateralRatio) / 100;
  const canBorrow = borrowAmount > 0 && borrowAmount <= maxBorrowAmount && requiredCollateral <= collateralBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (canBorrow) {
      console.log('Borrowing amount:', borrowAmount);
      try {
        const result = await borrow(borrowAmount);
        if (result && onSuccess) {
          console.log('Borrow successful, calling onSuccess');
          onSuccess();
        }
      } catch (error) {
        console.error('Error during borrow:', error);
      }
      setBorrowAmount(0);
    }
  };

  // Determine health factor color
  const getHealthFactorColor = (factor: number) => {
    if (factor >= 1.5) return 'text-green-600';
    if (factor >= 1.2) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Determine health factor bar color
  const getHealthFactorBarColor = (factor: number) => {
    if (factor >= 1.5) return 'bg-green-500';
    if (factor >= 1.2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-medium text-gray-900">Borrow USDC</h3>
        <p className="text-sm text-gray-500 mt-1">Borrow against your ETH collateral at competitive rates.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="borrowAmount" className="form-label">
                Amount to Borrow (USDC)
              </Label>
              <span className="text-xs text-gray">
                Available: <span className="stats-value">{maxBorrowAmount}</span> USDC
              </span>
            </div>
            <div className="mt-1 relative rounded-md shadow-sm">
              <Input
                id="borrowAmount"
                type="number"
                min={0}
                max={maxBorrowAmount}
                step={0.01}
                value={borrowAmount || ''}
                onChange={handleBorrowAmountChange}
                placeholder="0.00"
                className="input"
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <div className="token-badge">
                  USDC
                </div>
              </div>
            </div>
          </div>
          
          <div className="slider-container">
            <div className="flex-between mb-2">
              <Label htmlFor="collateralRatio" className="form-label">
                Collateral Ratio: <span className="stats-value">{collateralRatio}%</span>
              </Label>
            </div>
            <Slider
              id="collateralRatio"
              min={110}
              max={300}
              step={5}
              value={collateralRatio}
              onChange={handleSliderChange}
              className="w-full"
            />
            <div className="slider-labels">
              <span>Safer</span>
              <span>Riskier</span>
            </div>
          </div>
          
          <div className="info-box">
            <h4 className="text-sm font-medium mb-3">Borrow Details</h4>
            <div className="space-y-3">
              <div className="flex-between">
                <span className="text-sm text-gray">Borrow APY</span>
                <span className="text-sm font-medium">4.5%</span>
              </div>
              <div className="flex-between">
                <span className="text-sm text-gray">Collateral</span>
                <span className="text-sm font-medium stats-value">{collateralBalance} ETH</span>
              </div>
              <div className="flex-between">
                <span className="text-sm text-gray">Health Factor After</span>
                <span className={`text-sm font-medium ${getHealthFactorColor(adjustedHealthFactor)}`}>
                  {adjustedHealthFactor}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={!canBorrow || isPending}
          className={`w-full py-3 px-4 rounded-lg font-medium ${
            !canBorrow || isPending
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isPending ? 'Processing...' : 'Borrow USDC'}
        </button>
      </form>
    </div>
  );
};