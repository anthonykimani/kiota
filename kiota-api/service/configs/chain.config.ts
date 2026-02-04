/**
 * Chain Configuration
 * 
 * Supports both testnet and mainnet for Base and Ethereum networks.
 * Network is determined by environment variables.
 */

import { createPublicClient, http, Chain } from 'viem';
import { base, baseSepolia, mainnet, sepolia } from 'viem/chains';

export type SupportedNetwork = 'base' | 'base-sepolia' | 'ethereum' | 'ethereum-sepolia';

/**
 * Chain definitions with metadata
 */
export const CHAIN_CONFIG: Record<SupportedNetwork, {
  chain: Chain;
  name: string;
  isTestnet: boolean;
  blockExplorer: string;
  usdc: string;
}> = {
  'base': {
    chain: base,
    name: 'Base Mainnet',
    isTestnet: false,
    blockExplorer: 'https://basescan.org',
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  'base-sepolia': {
    chain: baseSepolia,
    name: 'Base Sepolia',
    isTestnet: true,
    blockExplorer: 'https://sepolia.basescan.org',
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },
  'ethereum': {
    chain: mainnet,
    name: 'Ethereum Mainnet',
    isTestnet: false,
    blockExplorer: 'https://etherscan.io',
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
  'ethereum-sepolia': {
    chain: sepolia,
    name: 'Ethereum Sepolia',
    isTestnet: true,
    blockExplorer: 'https://sepolia.etherscan.io',
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  },
};

/**
 * Get the current network from environment
 * Defaults to 'base-sepolia' for development
 */
export function getCurrentNetwork(): SupportedNetwork {
  const network = process.env.CHAIN_NETWORK || 'base-sepolia';
  
  if (!isValidNetwork(network)) {
    console.warn(`Invalid CHAIN_NETWORK "${network}", defaulting to base-sepolia`);
    return 'base-sepolia';
  }
  
  return network;
}

/**
 * Check if a network string is valid
 */
export function isValidNetwork(network: string): network is SupportedNetwork {
  return network in CHAIN_CONFIG;
}

/**
 * Get chain config for current network
 */
export function getChainConfig() {
  const network = getCurrentNetwork();
  return CHAIN_CONFIG[network];
}

/**
 * Get the viem Chain object for current network
 */
export function getChain(): Chain {
  return getChainConfig().chain;
}

/**
 * Get RPC URL for current network
 * Uses environment variable or falls back to public RPC
 */
export function getRpcUrl(): string {
  const network = getCurrentNetwork();
  
  // Check for network-specific RPC URL first
  const envKey = `${network.toUpperCase().replace('-', '_')}_RPC_URL`;
  if (process.env[envKey]) {
    return process.env[envKey]!;
  }
  
  // Fall back to generic BASE_RPC_URL for backwards compatibility
  if (process.env.BASE_RPC_URL) {
    return process.env.BASE_RPC_URL;
  }
  
  // Public RPC fallbacks
  const publicRpcs: Record<SupportedNetwork, string> = {
    'base': 'https://mainnet.base.org',
    'base-sepolia': 'https://sepolia.base.org',
    'ethereum': 'https://eth.llamarpc.com',
    'ethereum-sepolia': 'https://ethereum-sepolia-rpc.publicnode.com',
  };
  
  return publicRpcs[network];
}

/**
 * Get USDC address for current network
 * Uses environment variable or falls back to config
 */
export function getUsdcAddress(): string {
  // Allow override via environment
  if (process.env.BASE_USDC_ADDRESS) {
    return process.env.BASE_USDC_ADDRESS;
  }
  
  return getChainConfig().usdc;
}

/**
 * Get required confirmations for deposits
 * Testnets typically need fewer confirmations
 */
export function getRequiredConfirmations(): number {
  const envValue = process.env.DEPOSIT_CONFIRMATIONS_REQUIRED;
  if (envValue) {
    return Number(envValue);
  }
  
  // Default: 2 for testnet, 3 for mainnet
  const config = getChainConfig();
  return config.isTestnet ? 2 : 3;
}

/**
 * Create a viem public client for the current network
 */
export function createChainClient() {
  const chain = getChain();
  const rpcUrl = getRpcUrl();
  
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

/**
 * Check if current network is a testnet
 */
export function isTestnet(): boolean {
  return getChainConfig().isTestnet;
}

/**
 * Get block explorer URL for a transaction
 */
export function getTxExplorerUrl(txHash: string): string {
  const config = getChainConfig();
  return `${config.blockExplorer}/tx/${txHash}`;
}

/**
 * Get block explorer URL for an address
 */
export function getAddressExplorerUrl(address: string): string {
  const config = getChainConfig();
  return `${config.blockExplorer}/address/${address}`;
}

/**
 * Log current chain configuration (for debugging)
 */
export function logChainConfig(): void {
  const network = getCurrentNetwork();
  const config = getChainConfig();
  const rpcUrl = getRpcUrl();
  const usdc = getUsdcAddress();
  const confirmations = getRequiredConfirmations();
  
  console.log('=== Chain Configuration ===');
  console.log(`Network: ${network} (${config.name})`);
  console.log(`Testnet: ${config.isTestnet}`);
  console.log(`RPC URL: ${rpcUrl}`);
  console.log(`USDC Address: ${usdc}`);
  console.log(`Required Confirmations: ${confirmations}`);
  console.log(`Block Explorer: ${config.blockExplorer}`);
  console.log('===========================');
}
