import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getWalletData, setWalletData, StorageKeys } from '../utils/walletStorage';

// Initial wallet data values
const DEFAULT_ETH_PRICE = 2000 * 1e8; // $2000 with 8 decimals (Chainlink format)
const DEFAULT_COLLATERAL = '0';
const DEFAULT_BORROW = '0';
const DEFAULT_TOKEN_BALANCE = '1000'; // Default token balance for testing

/**
 * Data structure for wallet information
 */
export interface WalletData {
  collateral: string;
  borrow: string;
  ethPrice: number;
  tokenBalance: string;
}

/**
 * Hook to manage wallet-specific data with persistence
 * @returns Functions and data for wallet-specific operations
 */
export const useWalletData = () => {
  const { address } = useAccount();
  const [walletData, setStateWalletData] = useState<WalletData>({
    collateral: DEFAULT_COLLATERAL,
    borrow: DEFAULT_BORROW,
    ethPrice: DEFAULT_ETH_PRICE,
    tokenBalance: DEFAULT_TOKEN_BALANCE,
  });

  // Load saved data on mount or when address changes
  useEffect(() => {
    if (!address) return;

    const savedCollateral = getWalletData<string>(address, StorageKeys.DEPOSITS, DEFAULT_COLLATERAL);
    const savedBorrow = getWalletData<string>(address, StorageKeys.BORROWS, DEFAULT_BORROW);
    const savedEthPrice = getWalletData<number>(address, StorageKeys.ETH_PRICE, DEFAULT_ETH_PRICE);
    const savedTokenBalance = getWalletData<string>(address, StorageKeys.TOKEN_BALANCE, DEFAULT_TOKEN_BALANCE);

    setStateWalletData({
      collateral: savedCollateral,
      borrow: savedBorrow,
      ethPrice: savedEthPrice,
      tokenBalance: savedTokenBalance,
    });
  }, [address]);

  // Update collateral amount
  const updateCollateral = (amount: string) => {
    if (!address) return;
    
    setStateWalletData(prev => ({ ...prev, collateral: amount }));
    setWalletData(address, StorageKeys.DEPOSITS, amount);
  };

  // Update borrow amount
  const updateBorrow = (amount: string) => {
    if (!address) return;
    
    setStateWalletData(prev => ({ ...prev, borrow: amount }));
    setWalletData(address, StorageKeys.BORROWS, amount);
  };

  // Update ETH price
  const updateEthPrice = (price: number) => {
    if (!address) return;
    
    setStateWalletData(prev => ({ ...prev, ethPrice: price }));
    setWalletData(address, StorageKeys.ETH_PRICE, price);
  };

  // Update token balance
  const updateTokenBalance = (balance: string) => {
    if (!address) return;
    
    setStateWalletData(prev => ({ ...prev, tokenBalance: balance }));
    setWalletData(address, StorageKeys.TOKEN_BALANCE, balance);
  };

  return {
    walletData,
    updateCollateral,
    updateBorrow,
    updateEthPrice,
    updateTokenBalance,
  };
}; 