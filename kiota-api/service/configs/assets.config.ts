export type AssetClassKey =
  | 'stable_yields'
  | 'tokenized_stocks'
  | 'tokenized_gold'
  | 'blue_chip_crypto'
  | 'cash';

export const DEFAULT_ASSET_CLASSES: Array<{
  key: AssetClassKey;
  name: string;
  description: string;
  displayOrder: number;
}> = [
  {
    key: 'stable_yields',
    name: 'Stable Yields',
    description: 'USD-denominated yield products with low volatility',
    displayOrder: 1,
  },
  {
    key: 'tokenized_stocks',
    name: 'Tokenized Stocks',
    description: 'Equity exposure via tokenized instruments',
    displayOrder: 2,
  },
  {
    key: 'tokenized_gold',
    name: 'Tokenized Gold',
    description: 'Gold-backed tokens for inflation hedging',
    displayOrder: 3,
  },
  {
    key: 'blue_chip_crypto',
    name: 'Blue Chip Crypto',
    description: 'High-liquidity crypto assets (optional)',
    displayOrder: 4,
  },
  {
    key: 'cash',
    name: 'Cash',
    description: 'Deposit currency and unallocated balances',
    displayOrder: 5,
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
  { symbol: 'USDM', name: 'USD Mountain', classKey: 'stable_yields', decimals: 18, isPrimary: true },
  { symbol: 'BCSPX', name: 'Backed CSP Index Token', classKey: 'tokenized_stocks', decimals: 18, isPrimary: true },
  { symbol: 'PAXG', name: 'Paxos Gold', classKey: 'tokenized_gold', decimals: 18, isPrimary: true },
];
