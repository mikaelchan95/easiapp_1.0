/**
 * Enhanced formatting utilities for numbers, currency, and text
 * Provides clean, minimalistic formatting for UI components
 */

/**
 * Format numbers with shorthand notation (30k, 1.2M, 2.5B)
 * @param num - Number to format
 * @param precision - Decimal places for shortened numbers (default: 1)
 * @param forceShorthand - Force shorthand even for smaller numbers
 */
export const formatNumberShort = (num: number, precision: number = 1, forceShorthand: boolean = false): string => {
  if (num === 0) return '0';
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 1000000000) {
    const formatted = (absNum / 1000000000).toFixed(precision);
    return `${sign}${removeTrailingZeros(formatted)}B`;
  }
  
  if (absNum >= 1000000) {
    const formatted = (absNum / 1000000).toFixed(precision);
    return `${sign}${removeTrailingZeros(formatted)}M`;
  }
  
  if (absNum >= 1000 || forceShorthand) {
    const formatted = (absNum / 1000).toFixed(precision);
    return `${sign}${removeTrailingZeros(formatted)}k`;
  }
  
  return num.toString();
};

/**
 * Format currency with smart shorthand
 * @param amount - Amount to format
 * @param currency - Currency symbol (default: '$')
 * @param showCents - Show cents for non-shortened amounts
 * @param forceShorthand - Force shorthand for amounts >= 1000
 */
export const formatCurrencyShort = (
  amount: number, 
  currency: string = '$', 
  showCents: boolean = false,
  forceShorthand: boolean = true
): string => {
  if (amount === 0) return `${currency}0`;
  
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  // For large amounts, always use shorthand
  if (absAmount >= 1000000) {
    const formatted = (absAmount / 1000000).toFixed(1);
    return `${sign}${currency}${removeTrailingZeros(formatted)}M`;
  }
  
  if (absAmount >= 1000 && forceShorthand) {
    const formatted = (absAmount / 1000).toFixed(1);
    return `${sign}${currency}${removeTrailingZeros(formatted)}k`;
  }
  
  // For smaller amounts, show normally
  if (showCents && absAmount < 1000) {
    return `${sign}${currency}${amount.toFixed(2)}`;
  }
  
  return `${sign}${currency}${Math.round(absAmount)}`;
};

/**
 * Format percentage with clean display
 */
export const formatPercentage = (value: number, precision: number = 0): string => {
  return `${value.toFixed(precision)}%`;
};

/**
 * Remove trailing zeros from decimal strings
 */
const removeTrailingZeros = (str: string): string => {
  return str.replace(/\.?0+$/, '');
};

/**
 * Format large numbers for stats display
 * Optimized for dashboard widgets and cards
 */
export const formatStatNumber = (num: number): string => {
  return formatNumberShort(num, 1, true);
};

/**
 * Format currency for stats (no cents, shorthand)
 */
export const formatStatCurrency = (amount: number, currency: string = '$'): string => {
  return formatCurrencyShort(amount, currency, false, true);
};

/**
 * Shorten text messages for UI components
 */
export const shortenMessage = (message: string, maxLength: number = 50): string => {
  if (message.length <= maxLength) return message;
  return `${message.substring(0, maxLength - 3)}...`;
};

/**
 * Clean and minimize common UI text patterns
 */
export const cleanText = {
  // Credit/Balance related
  creditUsed: 'Used',
  creditLimit: 'Limit', 
  creditAvailable: 'Available',
  accountBalance: 'Balance',
  
  // Order related
  orderTotal: 'Total',
  orderItems: (count: number) => `${count} item${count !== 1 ? 's' : ''}`,
  
  // Status related
  inStock: 'In Stock',
  outOfStock: 'Out of Stock',
  lowStock: (count: number) => `${count} left`,
  
  // Actions
  viewCart: 'View Cart',
  addToCart: 'Add',
  removeItem: 'Remove',
  saveForLater: 'Save',
  addToFavorites: 'Like',
  
  // Time related
  deliveryTime: (time: string) => time.replace(' delivery', ''),
  estimatedTime: (time: string) => `~${time}`,
};

/**
 * Format rating with one decimal place
 */
export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

/**
 * Format item quantity for display
 */
export const formatQuantity = (quantity: number): string => {
  if (quantity >= 1000) {
    return formatNumberShort(quantity, 0);
  }
  return quantity.toString();
};

/**
 * Format number with comma separators (e.g., 100,000.00)
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @param forceDecimals - Force showing decimals even for whole numbers
 */
export const formatNumberWithCommas = (
  num: number, 
  decimals: number = 0, 
  forceDecimals: boolean = false
): string => {
  if (num === 0) return forceDecimals ? '0.00' : '0';
  
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: forceDecimals ? decimals : 0,
    maximumFractionDigits: decimals,
    useGrouping: true,
  };
  
  return new Intl.NumberFormat('en-US', options).format(num);
};

/**
 * Format currency with comma separators (e.g., $100,000.00)
 * @param amount - Amount to format
 * @param currency - Currency symbol (default: '$')
 * @param showCents - Show cents (default: true)
 */
export const formatCurrencyWithCommas = (
  amount: number, 
  currency: string = '$', 
  showCents: boolean = true
): string => {
  if (amount === 0) return showCents ? `${currency}0.00` : `${currency}0`;
  
  const formatted = formatNumberWithCommas(amount, showCents ? 2 : 0, showCents);
  return `${currency}${formatted}`;
};

/**
 * Format large numbers for display with commas (e.g., 1,234,567 points)
 * @param num - Number to format
 * @param suffix - Optional suffix (e.g., 'points', 'items')
 */
export const formatLargeNumber = (num: number, suffix?: string): string => {
  const formatted = formatNumberWithCommas(num);
  return suffix ? `${formatted} ${suffix}` : formatted;
};

/**
 * Format currency for financial displays (always show cents with commas)
 * @param amount - Amount to format
 * @param currency - Currency symbol (default: '$')
 */
export const formatFinancialAmount = (amount: number, currency: string = '$'): string => {
  return formatCurrencyWithCommas(amount, currency, true);
};

/**
 * Format points with commas (e.g., 101,461 points)
 * @param points - Points to format
 * @param includeLabel - Whether to include 'points' label
 */
export const formatPoints = (points: number, includeLabel: boolean = false): string => {
  const formatted = formatNumberWithCommas(points);
  return includeLabel ? `${formatted} points` : formatted;
};

/**
 * Generic number formatter with commas (alias for formatNumberWithCommas)
 * @param num - Number to format
 */
export const formatNumber = (num: number): string => {
  return formatNumberWithCommas(num);
}; 