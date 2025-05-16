/**
 * Format a number as a currency string
 * @param value The number to format
 * @param currency The currency symbol to use (defaults to USD)
 * @param decimals The number of decimal places to show (defaults to 2)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number, currency = 'USD', decimals = 2): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format a number as a percentage string
 * @param value The number to format (0.1 = 10%)
 * @param decimals The number of decimal places to show (defaults to 2)
 * @returns Formatted percentage string
 */
export const formatPercent = (value: number, decimals = 2): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Truncate a string to a certain length, adding an ellipsis if necessary
 * @param str The string to truncate
 * @param length The maximum length (defaults to 10)
 * @returns Truncated string
 */
export const truncateString = (str: string, length = 10): string => {
  if (!str) return '';
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
};

/**
 * Format an Ethereum address for display (0x1234...5678)
 * @param address The address to format
 * @returns Formatted address
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}; 