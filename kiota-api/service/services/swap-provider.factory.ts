/**
 * Swap Provider Factory
 *
 * Creates the appropriate swap provider based on network configuration:
 * - Ethereum Sepolia (testnet) → ClassicSwapProvider
 * - Ethereum Mainnet (production) → FusionSwapProvider
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
 * - Always uses Classic Swap when using Privy wallets
 * - Fusion SDK requires EIP-712 signing which is not yet implemented in Privy integration
 *
 * @returns ISwapProvider implementation
 */
export function createSwapProvider(): ISwapProvider {
  const network = process.env.ONEINCH_NETWORK || 'ethereum';

  let provider: ISwapProvider;

  // NOTE: Always use Classic Swap with Privy wallets
  // Fusion SDK requires EIP-712 typed data signing which needs
  // additional Privy service integration
  logger.info('Creating Classic Swap provider for Privy wallets', {
    network,
    reason: 'Privy embedded wallets use Classic Swap (Fusion requires EIP-712 signing support)'
  });
  provider = new ClassicSwapProvider();

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
