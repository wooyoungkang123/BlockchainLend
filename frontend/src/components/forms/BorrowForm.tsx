import { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { useBorrow } from '../../hooks/useBorrow';
import { usePoolData } from '../../hooks/usePoolData';
import { useUserData } from '../../hooks/useUserData';

interface BorrowFormProps {
  onSuccess?: () => void;
}

export const BorrowForm = ({ onSuccess }: BorrowFormProps) => {
  const [amount, setAmount] = useState<string>('0');
  const [ltv, setLtv] = useState<number>(50);
  
  const { maxBorrowAmount, borrowAPY } = usePoolData();
  const { collateralBalance, healthFactor } = useUserData();
  const { borrow, isPending } = useBorrow();

  // Calculate adjusted health factor based on LTV
  const [adjustedHealthFactor, setAdjustedHealthFactor] = useState(healthFactor);
  
  useEffect(() => {
    // Simple calculation that decreases health factor as LTV increases
    const newHealthFactor = Math.max(1.1, healthFactor * (1 - (ltv / 100) * 0.5));
    setAdjustedHealthFactor(parseFloat(newHealthFactor.toFixed(2)));
  }, [ltv, healthFactor]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleLtvChange = (value: number) => {
    setLtv(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    borrow(parseFloat(amount));
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleMaxClick = () => {
    setAmount(maxBorrowAmount.toString());
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Borrow USDC</h3>
        <p className="text-sm text-gray-500 mt-1">Borrow against your ETH collateral at competitive rates.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="amount" className="form-label">
                Amount to Borrow (USDC)
              </Label>
              <span className="text-xs text-gray">
                Available: <span className="stats-value">{maxBorrowAmount}</span> USDC
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
                Max
              </button>
            </div>
          </div>
          
          <div className="slider-container">
            <div className="flex-between mb-2">
              <Label htmlFor="ltv" className="form-label">
                Loan to Value (LTV): <span className="stats-value">{ltv}%</span>
              </Label>
            </div>
            <Slider
              min={0}
              max={80}
              step={1}
              value={ltv}
              onValueChange={handleLtvChange}
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
                <span className="text-sm font-medium">{borrowAPY}%</span>
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
              <div>
                <div className="health-bar-container mt-2">
                  <div 
                    className={`health-bar ${getHealthFactorBarColor(adjustedHealthFactor)}`} 
                    style={{ width: `${Math.min(adjustedHealthFactor * 30, 100)}%` }}
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
        
        <button
          type="submit"
          disabled={isPending || parseFloat(amount) <= 0}
          className="button button-primary w-full"
        >
          {isPending ? 'Processing...' : 'Borrow USDC'}
        </button>
      </form>
    </div>
  );
};