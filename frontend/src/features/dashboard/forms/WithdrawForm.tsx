import { useState } from 'react';
import { useLendingPool } from '../../../hooks/useLendingPool';
import { useUserData } from '../../../hooks/useUserData';

interface WithdrawFormProps {
  onSuccess?: () => void;
}

export const WithdrawForm = ({ onSuccess }: WithdrawFormProps) => {
  const [amount, setAmount] = useState('');
  const { withdraw, isPending, maxWithdrawAmount } = useLendingPool();
  const { availableToWithdraw } = useUserData();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    
    try {
      const success = await withdraw(parseFloat(amount));
      if (success && onSuccess) {
        setIsSuccess(true);
        setAmount('');
        onSuccess();
      } else {
        setError(new Error("Transaction failed"));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"));
    }
  };

  const maxWithdrawable = maxWithdrawAmount.toString();

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
            disabled={isPending}
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
            disabled={isPending}
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
          !amount || 
          parseFloat(amount) <= 0 || 
          parseFloat(amount) > parseFloat(maxWithdrawable)
        }
        className={`btn w-full ${
          isPending
            ? 'bg-gray-400 cursor-not-allowed'
            : 'btn-primary'
        }`}
      >
        {isPending
          ? 'Processing...'
          : 'Withdraw'}
      </button>
    </form>
  );
}; 