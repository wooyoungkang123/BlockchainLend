import { useState } from 'react';
import { useLendingPool } from '../../hooks/useLendingPool';

interface WithdrawFormProps {
  onSuccess?: () => void;
}

export const WithdrawForm = ({ onSuccess }: WithdrawFormProps) => {
  const [amount, setAmount] = useState('');
  const { withdraw, userData, isPending, isConfirming, isSuccess, error } = useLendingPool();

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    
    withdraw(amount);
    
    // Reset form on successful transaction
    if (isSuccess && onSuccess) {
      setAmount('');
      onSuccess();
    }
  };

  const maxWithdrawable = userData ? userData.formattedCollateral : '0';

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-xl font-semibold">Withdraw ETH</h2>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <label htmlFor="withdrawAmount" className="block text-sm font-medium text-gray-700">
            Amount (ETH)
          </label>
          <span className="text-sm text-gray-500">
            Available: {maxWithdrawable} ETH
          </span>
        </div>
        <div className="flex rounded-md shadow-sm">
          <input
            type="number"
            id="withdrawAmount"
            name="withdrawAmount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.01"
            min="0"
            max={maxWithdrawable}
            disabled={isPending || isConfirming}
            className="input flex-1"
          />
          <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md">
            ETH
          </span>
        </div>
        <div className="flex justify-between">
          <p className="text-xs text-gray-500">
            Withdraw your ETH collateral.
          </p>
          <button
            type="button"
            className="text-xs text-blue-600 hover:text-blue-800"
            onClick={() => setAmount(maxWithdrawable)}
            disabled={isPending || isConfirming}
          >
            Max
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error.message || 'An error occurred. You may not be able to withdraw this amount if it would put your health factor below the liquidation threshold.'}
        </div>
      )}

      <button
        type="submit"
        disabled={
          isPending || 
          isConfirming || 
          !amount || 
          parseFloat(amount) <= 0 || 
          parseFloat(amount) > parseFloat(maxWithdrawable)
        }
        className={`btn w-full ${
          isPending || isConfirming
            ? 'bg-gray-400 cursor-not-allowed'
            : 'btn-primary'
        }`}
      >
        {isPending
          ? 'Waiting for approval...'
          : isConfirming
          ? 'Confirming...'
          : 'Withdraw'}
      </button>
    </form>
  );
}; 