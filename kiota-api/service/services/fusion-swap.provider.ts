/**
 * Fusion SDK Provider (STUB - TO BE IMPLEMENTED IN PHASE 3)
 *
 * Uses @1inch/fusion-sdk for gasless mainnet swaps
 *
 * Implementation will include:
 * - FusionSDK initialization with PrivateKeyProviderConnector
 * - EIP-712 order signing
 * - Order submission to Fusion orderbook
 * - Order status polling via SDK
 */

import { ISwapProvider, QuoteParams, QuoteResult, SwapParams, SwapResult, SwapStatus } from '../interfaces/ISwapProvider';
import { createLogger } from '../utils/logger.util';

const logger = createLogger('fusion-swap-provider');

export class FusionSwapProvider implements ISwapProvider {
  constructor() {
    logger.info('FusionSwapProvider initialized (STUB)');
  }

  async getQuote(params: QuoteParams): Promise<QuoteResult> {
    throw new Error('FusionSwapProvider.getQuote() - Not yet implemented. Will be completed in Phase 3.');
  }

  async executeSwap(params: SwapParams): Promise<SwapResult> {
    throw new Error('FusionSwapProvider.executeSwap() - Not yet implemented. Will be completed in Phase 3.');
  }

  async getSwapStatus(orderId: string): Promise<SwapStatus> {
    throw new Error('FusionSwapProvider.getSwapStatus() - Not yet implemented. Will be completed in Phase 3.');
  }

  isConfigured(): boolean {
    // TODO Phase 3: Check API key, wallet private key, RPC URL
    const apiKey = process.env.ONEINCH_API_KEY;
    const hasApiKey = !!apiKey;

    if (!hasApiKey) {
      logger.warn('ONEINCH_API_KEY not configured');
    }

    return hasApiKey;
  }

  getProviderName(): string {
    return 'Fusion SDK';
  }
}
