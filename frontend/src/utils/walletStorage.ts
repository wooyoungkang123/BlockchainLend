/**
 * Wallet-specific local storage utility
 * Provides functionality to store and retrieve data per wallet address
 */

// Prefix for all storage keys to avoid conflicts
const STORAGE_PREFIX = 'defi_lending_';

/**
 * Get a storage key specific to a wallet address
 * @param address The wallet address
 * @param key The storage key
 * @returns A wallet-specific storage key
 */
const getStorageKey = (address: string, key: string): string => {
  return `${STORAGE_PREFIX}${address.toLowerCase()}_${key}`;
};

/**
 * Store data for a specific wallet
 * @param address The wallet address
 * @param key The storage key
 * @param data The data to store
 */
export const setWalletData = <T>(address: string, key: string, data: T): void => {
  if (!address) return;
  const storageKey = getStorageKey(address, key);
  localStorage.setItem(storageKey, JSON.stringify(data));
};

/**
 * Retrieve data for a specific wallet
 * @param address The wallet address
 * @param key The storage key
 * @param defaultValue The default value to return if no data exists
 * @returns The stored data or the default value
 */
export const getWalletData = <T>(address: string, key: string, defaultValue: T): T => {
  if (!address) return defaultValue;
  const storageKey = getStorageKey(address, key);
  const storedData = localStorage.getItem(storageKey);
  return storedData ? JSON.parse(storedData) : defaultValue;
};

/**
 * Clear all data for a specific wallet
 * @param address The wallet address
 */
export const clearWalletData = (address: string): void => {
  if (!address) return;
  
  // Find all keys in localStorage that match the wallet prefix
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`${STORAGE_PREFIX}${address.toLowerCase()}_`)) {
      keysToRemove.push(key);
    }
  }
  
  // Remove all matching keys
  keysToRemove.forEach(key => localStorage.removeItem(key));
};

/**
 * Storage keys for different types of data
 */
export const StorageKeys = {
  DEPOSITS: 'deposits',
  BORROWS: 'borrows',
  ETH_PRICE: 'eth_price',
  TOKEN_BALANCE: 'token_balance',
}; 