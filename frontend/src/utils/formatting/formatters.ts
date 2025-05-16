/**
 * Formats a number as currency with 2 decimal places
 */
export const formatCurrency = (value: string | number, decimals = 2): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0.00';
  }
  
  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Shortens an Ethereum address
 */
export const shortenAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Formats a percentage value
 */
export const formatPercent = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0%';
  }
  
  return `${numValue.toFixed(2)}%`;
};

/**
 * Converts Wei to Ether
 */
export const weiToEth = (wei: bigint): string => {
  if (!wei) return '0';
  return (Number(wei) / 1e18).toFixed(4);
};

/**
 * Converts Wei to USDC (6 decimals)
 */
export const weiToUsdc = (wei: bigint): string => {
  if (!wei) return '0';
  return (Number(wei) / 1e6).toFixed(2);
}; 