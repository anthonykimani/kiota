/**
 * Asset Class Configuration
 *
 * Defines the available asset classes for portfolio allocation.
 *
 * Asset Classes (4 total):
 * - Stable Yields: Capital preservation, ~5% APY (USDM)
 * - Tokenized Gold: Inflation hedge, tracks gold price (PAXG)
 * - DeFi Yield: On-chain yield strategies, ~8% variable (USDE)
 * - Blue Chip Crypto: Growth exposure, high volatility (WETH)
 *
 * Note: Tokenized stocks (IVVON) removed due to 0x Gasless restrictions
 */

export type AssetClassKey =
  | 'stable_yields'
  | 'tokenized_gold'
  | 'defi_yield'
  | 'bluechip_crypto'
  | 'cash';

export const DEFAULT_ASSET_CLASSES: Array<{
  key: AssetClassKey;
  name: string;
  description: string;
  displayOrder: number;
  color: string;
  expectedReturn: number; // Annual expected return as decimal
}> = [
  {
    key: 'stable_yields',
    name: 'Stable Yields',
    description: 'USD-denominated yield products with low volatility',
    displayOrder: 1,
    color: '#22C55E', // Green
    expectedReturn: 0.05,
  },
  {
    key: 'tokenized_gold',
    name: 'Tokenized Gold',
    description: 'Gold-backed tokens for inflation hedging',
    displayOrder: 2,
    color: '#EAB308', // Gold/Yellow
    expectedReturn: 0.03,
  },
  {
    key: 'defi_yield',
    name: 'DeFi Yield',
    description: 'On-chain yield strategies with variable returns',
    displayOrder: 3,
    color: '#8B5CF6', // Purple
    expectedReturn: 0.08,
  },
  {
    key: 'bluechip_crypto',
    name: 'Blue Chip Crypto',
    description: 'High-liquidity crypto assets for growth',
    displayOrder: 4,
    color: '#3B82F6', // Blue
    expectedReturn: 0.15,
  },
  {
    key: 'cash',
    name: 'Cash',
    description: 'Deposit currency and unallocated balances',
    displayOrder: 5,
    color: '#6B7280', // Gray
    expectedReturn: 0,
  },
];

export const DEFAULT_ASSETS: Array<{
  symbol: string;
  name: string;
  classKey: AssetClassKey;
  decimals: number;
  isPrimary: boolean;
}> = [
  { symbol: 'USDC', name: 'USD Coin', classKey: 'cash', decimals: 6, isPrimary: true },
  { symbol: 'USDM', name: 'Mountain Protocol USD', classKey: 'stable_yields', decimals: 18, isPrimary: true },
  { symbol: 'PAXG', name: 'Paxos Gold', classKey: 'tokenized_gold', decimals: 18, isPrimary: true },
  { symbol: 'USDE', name: 'Ethena USDe', classKey: 'defi_yield', decimals: 18, isPrimary: true },
  { symbol: 'WETH', name: 'Wrapped Ether', classKey: 'bluechip_crypto', decimals: 18, isPrimary: true },
];

/**
 * Get asset class by key
 */
export function getAssetClass(key: AssetClassKey) {
  return DEFAULT_ASSET_CLASSES.find((c) => c.key === key);
}

/**
 * Get primary asset for a given class
 */
export function getPrimaryAssetForClass(classKey: AssetClassKey) {
  return DEFAULT_ASSETS.find((a) => a.classKey === classKey && a.isPrimary);
}
