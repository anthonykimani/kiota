/**
 * Currency Utilities
 * KES/USD conversion and formatting
 */

// Current exchange rate (will be dynamic in production)
const KES_TO_USD_RATE = 130; // 1 USD = 130 KES

/**
 * Convert KES to USD
 */
export function kesToUsd(amountKES: number): number {
  return amountKES / KES_TO_USD_RATE;
}

/**
 * Convert USD to KES
 */
export function usdToKes(amountUSD: number): number {
  return amountUSD * KES_TO_USD_RATE;
}

/**
 * Format KES amount for display
 */
export function formatKES(amount: number, includeSymbol: boolean = true): string {
  const formatted = new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return includeSymbol ? `KES ${formatted}` : formatted;
}

/**
 * Format USD amount for display
 */
export function formatUSD(amount: number, includeSymbol: boolean = true): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return includeSymbol ? `$${formatted}` : formatted;
}

/**
 * Format amount with compact notation (e.g., 1.2K, 3.5M)
 */
export function formatCompact(amount: number, currency: 'KES' | 'USD' = 'USD'): string {
  const formatted = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount);

  const prefix = currency === 'USD' ? '$' : 'KES ';
  return `${prefix}${formatted}`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Parse KES string to number
 */
export function parseKES(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]/g, ''));
}

/**
 * Parse USD string to number
 */
export function parseUSD(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]/g, ''));
}

/**
 * Get exchange rate (mock for now, will fetch from API)
 */
export function getExchangeRate(): number {
  return KES_TO_USD_RATE;
}

/**
 * Calculate annual return in USD vs holding KES
 */
export function calculateVsKESReturn(
  initialAmountUSD: number,
  currentAmountUSD: number,
  kesDepreciationPercent: number = 7
): number {
  const directReturn = ((currentAmountUSD - initialAmountUSD) / initialAmountUSD) * 100;
  return directReturn + kesDepreciationPercent;
}

/**
 * Calculate vs MMF baseline (9.5% in KES net of tax)
 */
export function calculateVsMMFReturn(
  returnUSD: number,
  kesDepreciationPercent: number = 7
): number {
  const MMF_NET_RETURN_KES = 9.5;
  const MMF_REAL_USD_RETURN = MMF_NET_RETURN_KES - kesDepreciationPercent; // ~2.5%
  return returnUSD - MMF_REAL_USD_RETURN;
}
