/**
 * Swap Provider Factory
 *
 * Creates the appropriate swap provider based on network configuration:
 * - Fusion enabled + Ethereum mainnet → FusionSwapProvider
 * - Otherwise → ClassicSwapProvider
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
 * - Fusion is mainnet-only and must be explicitly enabled
 *
 * @returns ISwapProvider implementation
 */
export function createSwapProvider(): ISwapProvider {
  const network = process.env.ONEINCH_NETWORK || 'ethereum';
  const fusionEnabled = process.env.ONEINCH_FUSION_ENABLED === 'true';

  let provider: ISwapProvider;

  if (fusionEnabled && network === 'ethereum') {
    logger.info('Creating Fusion Swap provider', {
      network,
      signerMode: process.env.ONEINCH_FUSION_SIGNER || 'private_key',
    });
    provider = new FusionSwapProvider();
  } else {
    logger.info('Creating Classic Swap provider', {
      network,
      reason: fusionEnabled ? 'Fusion only supported on Ethereum mainnet' : 'Fusion disabled'
    });
    provider = new ClassicSwapProvider();
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
