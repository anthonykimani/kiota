/**
 * Token Configuration
 *
 * Token addresses for supported networks (Base and Base Sepolia)
 *
 * Asset Types:
 * - USDC: Circle USD Coin (deposit currency)
 * - USDM: USD Stablecoin (target for stableYields allocation)
 * - BCSPX: Backed CSP Index Token (target for tokenizedStocks allocation)
 * - PAXG: Paxos Gold Token (target for tokenizedGold allocation)
 */

export type AssetType = 'USDC' | 'USDM' | 'BCSPX' | 'PAXG';

export interface TokenInfo {
  symbol: AssetType;
  address: string;
  decimals: number;
  name: string;
}

/**
 * Token addresses by network
 */
export const TOKEN_ADDRESSES: Record<string, Record<AssetType, string>> = {
  /**
   * Base Mainnet (Chain ID: 8453)
   */
  'base': {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Circle USDC on Base
    USDM: '0x59D9356E565Ab3A36dD77763Fc0d87fEaf85508C', // Mountain Protocol USDM
    BCSPX: '0x4d49fcf93f415AdF54E9a62ab6e224f6d308D026', // Backed CSP Index Token
    PAXG: '0x6e53131F68a034873b6bFA15502aF094Ef0c5854', // Paxos Gold
  },

  /**
   * Base Sepolia Testnet (Chain ID: 84532)
   */
  'base-sepolia': {
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Circle USDC on Base Sepolia
    USDM: '0x0000000000000000000000000000000000000000', // TODO: Update with testnet address
    BCSPX: '0x0000000000000000000000000000000000000000', // TODO: Update with testnet address
    PAXG: '0x0000000000000000000000000000000000000000', // TODO: Update with testnet address
  },


  /**
   * Ethereum Sepolia Testnet (Chain ID: )
   */
  'ethereum-sepolia': {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Circle USDC on Base Sepolia
    USDM: '',
    BCSPX: '',
    PAXG: '0x45804880De22913dAFE09f4980848ECE6EcbAf78', 
  },

    /**
   * Ethereum Sepolia Testnet (Chain ID: )
   */
  'ethereum': {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Circle USDC on Base Sepolia
    USDM: '',
    BCSPX: '',
    PAXG: '0x45804880De22913dAFE09f4980848ECE6EcbAf78', 
  }
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
    name: 'USD Mountain',
  },
  BCSPX: {
    decimals: 18,
    name: 'Backed CSP Index Token',
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
      `Token ${asset} not deployed on ${network} testnet. Please update tokens.config.ts with testnet address.`
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
  return ['USDC', 'USDM', 'BCSPX', 'PAXG'];
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
    tokenizedStocks: 'BCSPX',
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
    BCSPX: 'tokenizedStocks',
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
