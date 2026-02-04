/**
 * Token Configuration
 *
 * Token addresses for supported networks (Ethereum Mainnet)
 *
 * Asset Types:
 * - USDC: Circle USD Coin (deposit currency)
 * - USDM: Mountain Protocol USD (target for stableYields allocation)
 * - IVVON: iShares S&P 500 ETF - Ondo Tokenized (target for tokenizedStocks allocation)
 * - PAXG: Paxos Gold Token (target for tokenizedGold allocation)
 * 
 * Note: 1inch only supports mainnet. Testnets have no liquidity for swaps.
 */

export type AssetType = 'USDC' | 'USDM' | 'IVVON' | 'PAXG';

export interface TokenInfo {
  symbol: AssetType;
  address: string;
  decimals: number;
  name: string;
}

/**
 * Token addresses by network
 * 
 * IMPORTANT: Only Ethereum mainnet has liquidity for all tokens via 1inch
 */
export const TOKEN_ADDRESSES: Record<string, Record<AssetType, string>> = {
  /**
   * Ethereum Mainnet (Chain ID: 1) - PRIMARY NETWORK
   * All tokens verified to have liquidity on 1inch
   */
  'ethereum': {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Circle USDC
    USDM: '0x59D9356E565Ab3A36dD77763Fc0d87fEaf85508C', // Mountain Protocol USD (yield-bearing)
    IVVON: '0x62ca254a363dc3c748e7e955c20447ab5bf06ff7', // iShares S&P 500 ETF (Ondo Tokenized)
    PAXG: '0x45804880De22913dAFE09f4980848ECE6EcbAf78', // Paxos Gold
  },
  /**
   * Base Mainnet (Chain ID: 8453)
   * Note: Tokenized stocks and gold are not currently available on Base.
   */
  'base': {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Circle USDC on Base
    USDM: '0x59D9356E565Ab3A36dD77763Fc0d87fEaf85508C', // Mountain Protocol USD (if supported)
    IVVON: '0x0000000000000000000000000000000000000000', // Not available on Base
    PAXG: '0x0000000000000000000000000000000000000000', // Not available on Base
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
  USDM: {
    decimals: 18,
    name: 'Mountain Protocol USD',
  },
  IVVON: {
    decimals: 18,
    name: 'iShares S&P 500 ETF (Ondo)',
  },
  PAXG: {
    decimals: 18,
    name: 'Paxos Gold',
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
  return ['USDC', 'USDM', 'IVVON', 'PAXG'];
}

/**
 * Check if asset is supported
 */
export function isAssetSupported(asset: string): asset is AssetType {
  return getSupportedAssets().includes(asset as AssetType);
}

/**
 * Map portfolio category to primary asset
 */
export function getCategoryAsset(category: 'stableYields' | 'tokenizedStocks' | 'tokenizedGold'): AssetType {
  const mapping: Record<string, AssetType> = {
    stableYields: 'USDM',
    tokenizedStocks: 'IVVON',
    tokenizedGold: 'PAXG',
  };

  return mapping[category];
}

/**
 * Map asset to portfolio category
 */
export function getAssetCategory(asset: AssetType): 'stableYields' | 'tokenizedStocks' | 'tokenizedGold' | null {
  const mapping: Record<AssetType, 'stableYields' | 'tokenizedStocks' | 'tokenizedGold' | null> = {
    USDC: null, // USDC is deposit currency, not held long-term
    USDM: 'stableYields',
    IVVON: 'tokenizedStocks',
    PAXG: 'tokenizedGold',
  };

  return mapping[asset];
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
