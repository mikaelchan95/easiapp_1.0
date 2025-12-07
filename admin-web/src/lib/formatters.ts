/**
 * Number and currency formatting utilities
 * Ensures consistent formatting across the application
 */

/**
 * Format currency with commas and 2 decimal places
 * @param value - The numeric value to format
 * @param currency - Currency symbol (default: '$')
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export const formatCurrency = (
  value: number | null | undefined,
  currency: string = '$'
): string => {
  if (value === null || value === undefined) return `${currency}0.00`;

  return `${currency}${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format number with commas (no decimals)
 * @param value - The numeric value to format
 * @returns Formatted number string (e.g., "1,234")
 */
export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  return value.toLocaleString('en-US');
};

/**
 * Format percentage with 1 decimal place
 * @param value - The percentage value (e.g., 45.5)
 * @returns Formatted percentage string (e.g., "45.5%")
 */
export const formatPercentage = (
  value: number | null | undefined,
  decimals: number = 1
): string => {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format points with commas
 * @param value - The points value to format
 * @returns Formatted points string (e.g., "1,234 pts")
 */
export const formatPoints = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0 pts';
  return `${value.toLocaleString('en-US')} pts`;
};

/**
 * Format date to localized string
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format time to localized string
 * @param date - Date string or Date object
 * @returns Formatted time string
 */
export const formatTime = (date: string | Date): string => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format date and time together
 * @param date - Date string or Date object
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: string | Date): string => {
  return `${formatDate(date)} at ${formatTime(date)}`;
};
