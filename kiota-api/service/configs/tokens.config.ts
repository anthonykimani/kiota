/**
 * Token Configuration
 *
 * Token addresses for supported networks (Ethereum Mainnet)
 *
 * Portfolio Asset Types:
 * - USDC: Circle USD Coin (deposit currency)
 * - USDM: Mountain Protocol USD (stable yields allocation)
 * - PAXG: Paxos Gold Token (tokenized gold allocation)
 * - USDE: Ethena USDe (DeFi yield allocation)
 * - WETH: Wrapped Ether (blue chip crypto allocation)
 *
 * Note: IVVON (tokenized stocks) removed - blocked by 0x Gasless API
 */

export type AssetType =
  | 'USDC'
  | 'USDT'
  | 'USDE'
  | 'PYUSD'
  | 'USDM'
  | 'PAXG'
  | 'XAUT'
  | 'WETH'
  | 'WBTC';

export interface TokenInfo {
  symbol: AssetType;
  address: string;
  decimals: number;
  name: string;
}

/**
 * Token addresses by network
 *
 * IMPORTANT: Only Ethereum mainnet has liquidity for all tokens via 0x Gasless
 */
export const TOKEN_ADDRESSES: Record<string, Record<AssetType, string>> = {
  /**
   * Ethereum Mainnet (Chain ID: 1) - PRIMARY NETWORK
   * All tokens verified to work with 0x Gasless API
   */
  ethereum: {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Circle USDC
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Tether USD
    USDE: '0x4c9edd5852cd905f086c759e8383e09bff1e68b3', // Ethena USDe
    PYUSD: '0x6c3ea9036406852006290770bedfcaba0e23a0e8', // PayPal USD
    USDM: '0x59D9356E565Ab3A36dD77763Fc0d87fEaf85508C', // Mountain Protocol USD (yield-bearing)
    PAXG: '0x45804880De22913dAFE09f4980848ECE6EcbAf78', // Paxos Gold
    XAUT: '0x68749665ff8d2d112fa859aa293f07a622782f38', // Tether Gold
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Wrapped ETH
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // Wrapped BTC
  },
  /**
   * Base Mainnet (Chain ID: 8453)
   * Note: Limited token support on Base
   */
  base: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Circle USDC on Base
    USDT: '0x0000000000000000000000000000000000000000', // Not available
    USDE: '0x0000000000000000000000000000000000000000', // Not available
    PYUSD: '0x0000000000000000000000000000000000000000', // Not available
    USDM: '0x0000000000000000000000000000000000000000', // Not available
    PAXG: '0x0000000000000000000000000000000000000000', // Not available
    XAUT: '0x0000000000000000000000000000000000000000', // Not available
    WETH: '0x4200000000000000000000000000000000000006', // Wrapped ETH on Base
    WBTC: '0x0000000000000000000000000000000000000000', // Not available
  },
};

/**
 * Token metadata (decimals, full names)
 */
export const TOKEN_METADATA: Record<AssetType, { decimals: number; name: string }> = {
  USDC: {
    decimals: 6,
    name: 'USD Coin',
  },
  USDT: {
    decimals: 6,
    name: 'Tether USD',
  },
  USDE: {
    decimals: 18,
    name: 'Ethena USDe',
  },
  PYUSD: {
    decimals: 6,
    name: 'PayPal USD',
  },
  USDM: {
    decimals: 18,
    name: 'Mountain Protocol USD',
  },
  PAXG: {
    decimals: 18,
    name: 'Paxos Gold',
  },
  XAUT: {
    decimals: 6,
    name: 'Tether Gold',
  },
  WETH: {
    decimals: 18,
    name: 'Wrapped Ether',
  },
  WBTC: {
    decimals: 8,
    name: 'Wrapped Bitcoin',
  },
};

/**
 * Get token address for a given asset on current network
 */
export function getTokenAddress(asset: AssetType, network: string): string {
  const address = TOKEN_ADDRESSES[network]?.[asset];

  if (!address) {
    throw new Error(`Token address not found for ${asset} on network ${network}`);
  }

  if (address === '0x0000000000000000000000000000000000000000') {
    throw new Error(
      `Token ${asset} is not available on ${network}. Please update tokens.config.ts with a supported address.`
    );
  }

  return address;
}

/**
 * Get token info (address + metadata)
 */
export function getTokenInfo(asset: AssetType, network: string): TokenInfo {
  const address = getTokenAddress(asset, network);
  const metadata = TOKEN_METADATA[asset];

  return {
    symbol: asset,
    address,
    decimals: metadata.decimals,
    name: metadata.name,
  };
}

/**
 * Get all supported assets
 */
export function getSupportedAssets(): AssetType[] {
  return ['USDC', 'USDT', 'USDE', 'PYUSD', 'USDM', 'PAXG', 'XAUT', 'WETH', 'WBTC'];
}

/**
 * Check if asset is supported
 */
export function isAssetSupported(asset: string): asset is AssetType {
  return getSupportedAssets().includes(asset as AssetType);
}

/**
 * Portfolio category type
 */
export type PortfolioCategory =
  | 'stableYields'
  | 'tokenizedGold'
  | 'defiYield'
  | 'bluechipCrypto';

/**
 * Map portfolio category to primary asset
 */
export function getCategoryAsset(category: PortfolioCategory): AssetType {
  const mapping: Record<PortfolioCategory, AssetType> = {
    stableYields: 'USDM',
    tokenizedGold: 'PAXG',
    defiYield: 'USDE',
    bluechipCrypto: 'WETH',
  };

  return mapping[category];
}

/**
 * Map asset to portfolio category
 */
export function getAssetCategory(asset: AssetType): PortfolioCategory | null {
  const mapping: Record<AssetType, PortfolioCategory | null> = {
    USDC: null, // USDC is deposit currency, not held long-term
    USDT: null,
    USDE: 'defiYield',
    PYUSD: null,
    USDM: 'stableYields',
    PAXG: 'tokenizedGold',
    XAUT: 'tokenizedGold', // Alternative gold token
    WETH: 'bluechipCrypto',
    WBTC: 'bluechipCrypto', // Alternative crypto
  };

  return mapping[asset];
}

/**
 * Get all portfolio categories
 */
export function getAllCategories(): PortfolioCategory[] {
  return ['stableYields', 'tokenizedGold', 'defiYield', 'bluechipCrypto'];
}

/**
 * Convert amount to wei (based on token decimals)
 */
export function toWei(amount: number, asset: AssetType): string {
  const decimals = TOKEN_METADATA[asset].decimals;
  const multiplier = BigInt(10 ** decimals);
  const amountBigInt = BigInt(Math.floor(amount * 10 ** decimals));

  return amountBigInt.toString();
}

/**
 * Convert wei to decimal amount (based on token decimals)
 */
export function fromWei(amountWei: string, asset: AssetType): number {
  const decimals = TOKEN_METADATA[asset].decimals;
  const divisor = 10 ** decimals;

  return Number(amountWei) / divisor;
}
