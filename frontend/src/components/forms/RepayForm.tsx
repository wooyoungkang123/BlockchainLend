import { useState } from 'react';
import { useRepay } from '../../hooks/useRepay';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

interface RepayFormProps {
  onSuccess?: () => void;
  currentDebt?: string;
  tokenBalance?: string;
}

export const RepayForm = ({ onSuccess, currentDebt = '0', tokenBalance = '0' }: RepayFormProps) => {
  const [amount, setAmount] = useState<string>('0');
  const [repayPercent, setRepayPercent] = useState<number>(50);
  const { repay, isPending } = useRepay();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    // Update percent slider based on amount
    const numAmount = parseFloat(e.target.value) || 0;
    const numDebt = parseFloat(currentDebt.replace(/,/g, '')) || 1;
    const newPercent = Math.min(100, Math.max(0, (numAmount / numDebt) * 100));
    setRepayPercent(isNaN(newPercent) ? 0 : newPercent);
  };

  const handleSliderChange = (value: number) => {
    setRepayPercent(value);
    // Update amount based on percent
    const numDebt = parseFloat(currentDebt.replace(/,/g, '')) || 1;
    const newAmount = ((value / 100) * numDebt).toFixed(2);
    setAmount(newAmount);
  };

  const handleMaxClick = () => {
    const maxRepayable = Math.min(
      parseFloat(currentDebt.replace(/,/g, '')),
      parseFloat(tokenBalance.replace(/,/g, ''))
    );
    setAmount(maxRepayable.toString());
    setRepayPercent(100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    repay(parseFloat(amount));
    if (onSuccess) {
      onSuccess();
    }
  };

  // Calculate new health factor after repayment (simplified estimate)
  const estimatedHealthFactor = 1.75 + (repayPercent / 100) * 0.5;
  
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
                Amount to Repay (USDC)
              </Label>
              <span className="text-xs text-gray">
                Balance: <span className="stats-value">{tokenBalance}</span> USDC
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
              <Label htmlFor="repayPercent" className="form-label">
                Repay Amount: <span className="stats-value">{repayPercent}%</span>
              </Label>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={repayPercent}
              onValueChange={handleSliderChange}
              className="w-full"
            />
            <div className="slider-labels">
              <span>Partial</span>
              <span>Full</span>
            </div>
          </div>
          
          <div className="info-box">
            <h4 className="text-sm font-medium mb-3">Repayment Details</h4>
            <div className="space-y-3">
              <div className="flex-between">
                <span className="text-sm text-gray">Current Debt</span>
                <span className="text-sm font-medium stats-value">{currentDebt} USDC</span>
              </div>
              <div className="flex-between">
                <span className="text-sm text-gray">Remaining Debt</span>
                <span className="text-sm font-medium stats-value">
                  {(parseFloat(currentDebt) - parseFloat(amount)).toFixed(2)} USDC
                </span>
              </div>
              <div className="flex-between">
                <span className="text-sm text-gray">Health Factor After</span>
                <span className={`text-sm font-medium ${getHealthFactorColor(estimatedHealthFactor)}`}>
                  {estimatedHealthFactor.toFixed(2)}
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
        
        <button
          type="submit"
          disabled={isPending || parseFloat(amount) <= 0}
          className="button button-primary w-full"
        >
          {isPending ? 'Processing...' : 'Repay USDC'}
        </button>
      </form>
    </div>
  );
}; 