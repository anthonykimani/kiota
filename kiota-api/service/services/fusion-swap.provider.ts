/**
 * Fusion SDK Provider
 *
 * Uses @1inch/fusion-sdk for gasless mainnet swaps
 *
 * Features:
 * - Official SDK integration with FusionSDK
 * - EIP-712 order signing for intent-based swaps
 * - Order submission to Fusion orderbook
 * - Order status polling via SDK
 * - Works on Ethereum mainnet only (no testnet support)
 *
 * Trade-offs:
 * ✅ Gasless swaps (resolver pays gas)
 * ✅ MEV protection
 * ✅ Better pricing (DEX + CEX liquidity)
 * ✅ Official SDK with TypeScript support
 * ❌ NO testnet support (mainnet only)
 * ❌ Slower execution (1-5 minutes via auction)
 */

import { FusionSDK, NetworkEnum, PrivateKeyProviderConnector } from '@1inch/fusion-sdk';
import { EIP712TypedData } from '@1inch/limit-order-sdk';
import { JsonRpcProvider } from 'ethers';
import { ISwapProvider, QuoteParams, QuoteResult, SwapParams, SwapResult, SwapStatus } from '../interfaces/ISwapProvider';
import { createLogger } from '../utils/logger.util';
import { WalletRepository } from '../repositories/wallet.repo';
import { privyService } from '../utils/provider/privy';

type FusionSignerMode = 'private_key' | 'privy';

const logger = createLogger('fusion-swap-provider');

// Environment configuration
const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY??"";
const SWAP_WALLET_PRIVATE_KEY = process.env.SWAP_WALLET_PRIVATE_KEY || '';
const NODE_URL = process.env.NODE_URL || 'https://eth.llamarpc.com';
const FUSION_SIGNER_MODE = (process.env.ONEINCH_FUSION_SIGNER || 'private_key') as FusionSignerMode;

class PrivyProviderConnector {
  private rpcProvider: JsonRpcProvider;

  constructor() {
    this.rpcProvider = new JsonRpcProvider(NODE_URL);
  }

  async signTypedData(walletAddress: string, typedData: EIP712TypedData): Promise<string> {
    const walletRepo = new WalletRepository();
    const wallet = await walletRepo.getByAddress(walletAddress);

    if (!wallet) {
      throw new Error(`Wallet not found for address ${walletAddress}`);
    }

    const privyWalletId = wallet.privyWalletId || wallet.privyUserId;

    if (!privyWalletId) {
      throw new Error(`Privy wallet ID not found for address ${walletAddress}`);
    }

    const result = await privyService.signTypedData(privyWalletId, typedData);

    if (!result.success || !result.signature) {
      throw new Error(result.error || 'Privy typed data signing failed');
    }

    return result.signature;
  }

  async ethCall(contractAddress: string, callData: string): Promise<string> {
    return this.rpcProvider.call({ to: contractAddress, data: callData });
  }
}

/**
 * Fusion SDK Provider Implementation
 *
 * NOTE: Fusion SDK is mainnet-only and must be explicitly enabled.
 * Signer mode can be configured to use Privy typed-data signing or a server key.
 */
export class FusionSwapProvider implements ISwapProvider {
  private sdk: FusionSDK | null = null;
  private initialized: boolean = false;

  constructor(private signerMode: FusionSignerMode = FUSION_SIGNER_MODE) {
    this.initializeSDK();
  }

  /**
   * Initialize Fusion SDK with PrivateKeyProviderConnector
   */
  private initializeSDK(): void {
    if (!ONEINCH_API_KEY) {
      throw new Error('ONEINCH_API_KEY not configured');
    }

    // Create ethers provider for blockchain calls
    const provider = new JsonRpcProvider(NODE_URL);

    // Create ethers-compatible connector for SDK
    const ethersProviderConnector = {
      eth: {
        call: (transactionConfig: any) => {
          return provider.call(transactionConfig);
        }
      },
      extend: () => {}
    };

    let connector: any;

    if (this.signerMode === 'privy') {
      connector = new PrivyProviderConnector();
    } else {
      if (!SWAP_WALLET_PRIVATE_KEY) {
        throw new Error('SWAP_WALLET_PRIVATE_KEY not configured');
      }

      connector = new PrivateKeyProviderConnector(
        SWAP_WALLET_PRIVATE_KEY,
        ethersProviderConnector as any
      );
    }

    // Initialize Fusion SDK
    this.sdk = new FusionSDK({
      url: 'https://api.1inch.dev/fusion',
      network: NetworkEnum.ETHEREUM, // Ethereum mainnet = 1
      blockchainProvider: connector,
      authKey: ONEINCH_API_KEY
    });

    this.initialized = true;

    logger.info('Fusion SDK initialized', {
      network: 'ethereum (1)',
      url: 'https://api.1inch.dev/fusion',
      signerMode: this.signerMode,
    });
  }

  /**
   * Get swap quote from Fusion SDK
   */
  async getQuote(params: QuoteParams): Promise<QuoteResult> {
    if (!this.initialized || !this.sdk) {
      throw new Error('Fusion SDK not initialized');
    }

    const { fromToken, toToken, amount } = params;

    logger.info('Fetching Fusion quote', {
      fromToken: fromToken.substring(0, 10) + '...',
      toToken: toToken.substring(0, 10) + '...',
      amount,
    });

    try {
      const quote = await this.sdk.getQuote({
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: amount,
      });

      logger.info('Fusion quote fetched successfully', {
        quoteId: (quote as any).quoteId,
        presets: quote.presets ? Object.keys(quote.presets).length : 0,
      });

      // Map SDK response to interface format
      // Note: Fusion SDK quote structure uses presets with recommended amounts
      const recommendedAmount = quote.presets?.fast?.auctionEndAmount || quote.presets?.medium?.auctionEndAmount || '0';

      return {
        fromToken: fromToken,
        toToken: toToken,
        fromAmount: amount,
        toAmount: String(recommendedAmount),
        estimatedGas: undefined, // Fusion is gasless
        priceImpact: 0, // SDK doesn't provide price impact in quote
        fees: {
          network: 0, // Gasless for user
          protocol: 0,
        },
        raw: quote as unknown as Record<string, any>,
      };
    } catch (error) {
      logger.error('Failed to fetch Fusion quote', error as Error);
      throw error;
    }
  }

  /**
   * Execute swap via Fusion SDK (creates and submits order)
   */
  async executeSwap(params: SwapParams): Promise<SwapResult> {
    if (!this.initialized || !this.sdk) {
      throw new Error('Fusion SDK not initialized');
    }

    const { fromToken, toToken, amount, userAddress } = params;

    logger.info('Executing Fusion swap', {
      fromToken: fromToken.substring(0, 10) + '...',
      toToken: toToken.substring(0, 10) + '...',
      amount,
      userAddress: userAddress.substring(0, 10) + '...',
    });

    try {
      // Place order (SDK handles quote + order creation + submission)
      const orderResult = await this.sdk.placeOrder({
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: amount,
        walletAddress: userAddress,
      });

      logger.info('Fusion order placed successfully', {
        orderHash: orderResult.orderHash,
      });

      return {
        orderId: orderResult.orderHash,
        status: 'pending',
        provider: 'fusion',
        txHash: undefined, // Transaction hash not available until order is filled
        estimatedOutput: orderResult.quoteId, // Store quoteId in estimatedOutput field
      };
    } catch (error) {
      logger.error('Fusion swap execution failed', error as Error);
      throw error;
    }
  }

  /**
   * Get swap status by polling Fusion order status
   */
  async getSwapStatus(orderId: string): Promise<SwapStatus> {
    if (!this.initialized || !this.sdk) {
      throw new Error('Fusion SDK not initialized');
    }

    logger.info('Checking Fusion order status', { orderHash: orderId });

    try {
      const orderStatus = await this.sdk.getOrderStatus(orderId);

      logger.info('Fusion order status retrieved', {
        orderHash: orderId,
        status: orderStatus.status,
      });

      // Map SDK status to interface status
      let mappedStatus: 'pending' | 'processing' | 'completed' | 'failed';
      let txHash: string | undefined;
      let actualOutput: string | undefined;
      let reason: string | undefined;

      // Map SDK status to interface status
      // Fusion SDK uses OrderStatus enum with values like OrderStatus.Filled, etc.
      const statusStr = String(orderStatus.status).toLowerCase();

      if (statusStr.includes('filled') || statusStr.includes('executed')) {
        mappedStatus = 'completed';
        // Extract transaction hash from fills
        if (orderStatus.fills && orderStatus.fills.length > 0) {
          txHash = orderStatus.fills[0].txHash;
          // Sum up all fills to get actual output
          actualOutput = orderStatus.fills
            .reduce((sum, fill) => sum + BigInt(fill.filledMakerAmount || '0'), BigInt(0))
            .toString();
        }
      } else if (statusStr.includes('expired') || statusStr.includes('cancelled')) {
        mappedStatus = 'failed';
        reason = `Order ${orderStatus.status}`;
      } else if (statusStr.includes('partial')) {
        mappedStatus = 'processing';
        if (orderStatus.fills && orderStatus.fills.length > 0) {
          txHash = orderStatus.fills[0].txHash;
        }
      } else {
        mappedStatus = 'pending';
      }

      return {
        orderId,
        status: mappedStatus,
        provider: 'fusion',
        txHash,
        actualOutput,
        reason,
        fills: orderStatus.fills?.map(fill => ({
          txHash: fill.txHash,
          filledAmount: fill.filledMakerAmount || '0',
          timestamp: Date.now(), // SDK doesn't provide timestamp
        })),
      };
    } catch (error) {
      logger.error('Failed to get Fusion order status', error as Error);

      // If order not found, it might be too new or invalid
      if ((error as Error).message.includes('not found') || (error as Error).message.includes('404')) {
        return {
          orderId,
          status: 'pending',
          provider: 'fusion',
        };
      }

      throw error;
    }
  }

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    const hasApiKey = !!ONEINCH_API_KEY;
    const hasPrivateKey = !!SWAP_WALLET_PRIVATE_KEY;
    const hasRpcUrl = !!NODE_URL;
    const hasPrivyCreds = !!process.env.PRIVY_APP_ID && !!process.env.PRIVY_APP_SECRET;

    if (!hasApiKey) {
      logger.warn('ONEINCH_API_KEY not configured');
    }
    if (this.signerMode === 'private_key' && !hasPrivateKey) {
      logger.warn('SWAP_WALLET_PRIVATE_KEY not configured');
    }
    if (this.signerMode === 'privy' && !hasPrivyCreds) {
      logger.warn('Privy credentials not configured');
    }
    if (!hasRpcUrl) {
      logger.warn('NODE_URL not configured');
    }

    if (this.signerMode === 'privy') {
      return hasApiKey && hasPrivyCreds && hasRpcUrl && this.initialized;
    }

    return hasApiKey && hasPrivateKey && hasRpcUrl && this.initialized;
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'Fusion SDK';
  }
}
