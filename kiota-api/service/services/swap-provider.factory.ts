/**
 * Swap Provider Factory
 *
 * Creates the appropriate swap provider based on configuration:
 * - SWAP_PROVIDER=zerox → ZeroXSwapProvider (0x Gasless, recommended)
 * - SWAP_PROVIDER=fusion → FusionSwapProvider (1inch Fusion, $30 min)
 * - SWAP_PROVIDER=classic → ClassicSwapProvider (1inch Classic, needs gas)
 * - Default → ZeroXSwapProvider
 *
 * This allows seamless switching between implementations via environment variables
 * without changing any application code.
 */

import { ISwapProvider } from '../interfaces/ISwapProvider';
import { ClassicSwapProvider } from './classic-swap.provider';
import { FusionSwapProvider } from './fusion-swap.provider';
import { ZeroXSwapProvider } from './zerox-swap.provider';
import { createLogger } from '../utils/logger.util';

const logger = createLogger('swap-provider-factory');

type SwapProviderType = 'zerox' | 'fusion' | 'classic';

/**
 * Create swap provider based on configuration
 *
 * Selection logic:
 * - SWAP_PROVIDER env var determines provider
 * - Default: 0x Gasless (lower minimums, gasless)
 *
 * @returns ISwapProvider implementation
 */
export function createSwapProvider(): ISwapProvider {
  const network = process.env.CHAIN_NETWORK || 'ethereum';
  const providerType = (process.env.SWAP_PROVIDER || 'zerox') as SwapProviderType;

  let provider: ISwapProvider;

  switch (providerType) {
    case 'zerox':
      logger.info('Creating 0x Gasless provider', { network });
      provider = new ZeroXSwapProvider(network);
      break;

    case 'fusion':
      if (network !== 'ethereum') {
        logger.warn('Fusion only supports Ethereum mainnet, falling back to 0x', { network });
        provider = new ZeroXSwapProvider(network);
      } else {
        logger.info('Creating Fusion Swap provider', {
          network,
          signerMode: process.env.ONEINCH_FUSION_SIGNER || 'privy',
        });
        provider = new FusionSwapProvider();
      }
      break;

    case 'classic':
      logger.info('Creating Classic Swap provider', { network });
      provider = new ClassicSwapProvider();
      break;

    default:
      logger.info('Unknown provider type, defaulting to 0x Gasless', {
        providerType,
        network,
      });
      provider = new ZeroXSwapProvider(network);
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
