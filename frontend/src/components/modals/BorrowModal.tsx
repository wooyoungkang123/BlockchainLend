import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { createPublicClient, http, parseUnits } from 'viem';
import { useAccount, useConnect } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { getLendingPoolContract } from '../../contracts/LendingPool';

export interface BorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBorrow: (amount: bigint) => Promise<void>;
  userData?: [bigint, bigint, bigint]; // collateral, borrowed, health
  maxBorrowable?: string;
}

export function BorrowModal({
  isOpen,
  onClose,
  onBorrow,
  userData,
  maxBorrowable = '0',
}: BorrowModalProps) {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  // Create a public client for mainnet
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(),
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleMaxAmount = () => {
    setAmount(maxBorrowable);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > parseFloat(maxBorrowable)) {
      setError('Amount exceeds maximum borrowable amount');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      
      // Parse amount to correct decimals (USDC has 6 decimals)
      const parsedAmount = parseUnits(amount, 6);
      
      // Call the onBorrow callback
      await onBorrow(parsedAmount);
      
      // Reset form and close modal on success
      setAmount('');
      onClose();
    } catch (err) {
      console.error('Borrow error:', err);
      setError('Failed to borrow. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getFormattedUserData = () => {
    if (!userData) return { collateral: '0', borrowed: '0' };
    
    const [collateral, currentBorrowed] = userData;
    
    return {
      collateral: (Number(collateral) / 1e18).toFixed(4), // ETH has 18 decimals
      borrowed: (Number(currentBorrowed) / 1e6).toFixed(2), // USDC has 6 decimals
    };
  };

  const { collateral, borrowed } = getFormattedUserData();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Borrow USDC
                </Dialog.Title>
                
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Borrow USDC against your ETH collateral. Make sure to maintain a healthy position to avoid liquidation.
                  </p>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="bg-gray-100 p-3 rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ETH Collateral:</span>
                      <span className="text-sm font-semibold">{collateral} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Borrowed:</span>
                      <span className="text-sm font-semibold">{borrowed} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Max Borrowable:</span>
                      <span className="text-sm font-semibold">{maxBorrowable} USDC</span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                        Amount to Borrow
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="number"
                          name="amount"
                          id="amount"
                          className="block w-full pr-16 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          max={maxBorrowable}
                          value={amount}
                          onChange={handleAmountChange}
                          disabled={isProcessing}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 sm:text-sm px-2">
                              USDC
                            </span>
                            <button
                              type="button"
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2"
                              onClick={handleMaxAmount}
                              disabled={isProcessing}
                            >
                              MAX
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {error && (
                      <div className="text-red-500 text-sm">{error}</div>
                    )}

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                        onClick={onClose}
                        disabled={isProcessing}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${
                          isProcessing ? 'opacity-75 cursor-not-allowed' : ''
                        }`}
                        disabled={isProcessing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(maxBorrowable)}
                      >
                        {isProcessing ? 'Processing...' : 'Borrow'}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 