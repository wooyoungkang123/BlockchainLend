import { useState } from 'react';
import { useLendingPool } from '../../hooks/useLendingPool';

interface DepositFormProps {
  onSuccess?: () => void;
}

export const DepositForm = ({ onSuccess }: DepositFormProps) => {
  const [amount, setAmount] = useState('');
  const { deposit, isPending, isConfirming, isSuccess, error } = useLendingPool();

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    
    deposit(amount);
    
    // Reset form on successful transaction
    if (isSuccess && onSuccess) {
      setAmount('');
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-xl font-semibold">Deposit ETH</h2>
      
      <div className="space-y-2">
        <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700">
          Amount (ETH)
        </label>
        <div className="flex rounded-md shadow-sm">
          <input
            type="number"
            id="depositAmount"
            name="depositAmount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.01"
            min="0"
            disabled={isPending || isConfirming}
            className="input flex-1"
          />
          <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md">
            ETH
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Deposit ETH as collateral to borrow assets.
        </p>
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error.message || 'An error occurred'}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || isConfirming || !amount || parseFloat(amount) <= 0}
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
          : 'Deposit'}
      </button>
    </form>
  );
}; 