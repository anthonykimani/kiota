/**
 * Swap Provider Factory
 *
 * Creates the appropriate swap provider based on network configuration:
 * - Base Sepolia (testnet) → ClassicSwapProvider
 * - Base Mainnet (production) → FusionSwapProvider
 *
 * This allows seamless switching between implementations via environment variables
 * without changing any application code.
 */

import { ISwapProvider } from '../interfaces/ISwapProvider';
import { ClassicSwapProvider } from './classic-swap.provider';
import { FusionSwapProvider } from './fusion-swap.provider';
import { createLogger } from '../utils/logger.util';

const logger = createLogger('swap-provider-factory');

/**
 * Create swap provider based on network configuration
 *
 * Selection logic:
 * - If ONEINCH_NETWORK contains 'sepolia' or 'testnet' → Classic Swap
 * - Otherwise → Fusion SDK
 *
 * @returns ISwapProvider implementation
 */
export function createSwapProvider(): ISwapProvider {
  const network = process.env.ONEINCH_NETWORK??"";
  const isTestnet = network.includes('sepolia') || network.includes('testnet');

  let provider: ISwapProvider;

  if (isTestnet) {
    // Testnet: Use Classic Swap (user pays gas, but testnet works)
    logger.info('Creating Classic Swap provider for testnet', {
      network,
      reason: 'Fusion does not support testnets'
    });
    provider = new ClassicSwapProvider();
  } else {
    // Mainnet: Use Fusion SDK (gasless swaps, MEV protection)
    logger.info('Creating Fusion SDK provider for mainnet', {
      network,
      reason: 'Production deployment with gasless swaps'
    });
    provider = new FusionSwapProvider();
  }

  // Verify provider is configured
  if (!provider.isConfigured()) {
    logger.warn(`${provider.getProviderName()} is not properly configured`, {
      network,
      provider: provider.getProviderName(),
      message: 'Swap functionality may not work correctly'
    });
  } else {
    logger.info('Swap provider initialized successfully', {
      network,
      provider: provider.getProviderName(),
      configured: true
    });
  }

  return provider;
}

/**
 * Singleton swap provider instance
 *
 * Use this exported instance in controllers and processors:
 *
 * ```typescript
 * import { swapProvider } from './services/swap-provider.factory';
 *
 * const quote = await swapProvider.getQuote(params);
 * const swap = await swapProvider.executeSwap(params);
 * const status = await swapProvider.getSwapStatus(orderId);
 * ```
 */
export const swapProvider = createSwapProvider();
