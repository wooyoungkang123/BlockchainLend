/**
 * Format a number as currency
 */
export const formatCurrency = (value: number | string, currency = 'USD', options = {}): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(numValue);
};

/**
 * Format a number as a percentage
 */
export const formatPercent = (value: number | string, options = {}): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0%';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(numValue / 100);
};

/**
 * Format a number with the given decimal places
 */
export const formatNumber = (value: number | string, decimals = 2): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0';
  }
  
  return numValue.toFixed(decimals);
}; 