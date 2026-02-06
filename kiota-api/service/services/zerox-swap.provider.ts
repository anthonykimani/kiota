/**
 * 0x Gasless Swap Provider
 *
 * Uses 0x Gasless API for gasless swaps on multiple chains
 *
 * Features:
 * - Gasless swaps (gas deducted from sell token)
 * - EIP-712 order signing via Permit2
 * - Multi-chain support (Ethereum, Base, Arbitrum, etc.)
 * - Lower minimum amounts (~$1-10 vs 1inch Fusion's $30)
 *
 * Trade-offs:
 * ✅ Gasless swaps
 * ✅ Lower minimum amounts
 * ✅ Multi-chain support
 * ✅ Simple REST API (no SDK required)
 * ❌ Blocks tokenized securities (IVVON, etc.) due to legal restrictions
 * ❌ NO testnet support (mainnet only)
 *
 * Flow:
 * 1. Get quote from /gasless/quote (returns EIP-712 typed data for approval + trade)
 * 2. Sign approval (if needed) - Permit for token allowance
 * 3. Sign trade - Permit2 witness transfer
 * 4. Submit to /gasless/submit with signatures
 * 5. Poll /gasless/status/{tradeHash} for completion
 */

import axios, { AxiosInstance } from 'axios';
import { ISwapProvider, QuoteParams, QuoteResult, SwapParams, SwapResult, SwapStatus } from '../interfaces/ISwapProvider';
import { createLogger } from '../utils/logger.util';
import { WalletRepository } from '../repositories/wallet.repo';
import { privyService } from '../utils/provider/privy';

const logger = createLogger('zerox-swap-provider');

/**
 * Transform 0x EIP-712 data to Privy format
 * 0x uses camelCase (primaryType), Privy expects snake_case (primary_type)
 */
function transformEip712ForPrivy(eip712: any): any {
  return {
    domain: eip712.domain,
    types: eip712.types,
    primary_type: eip712.primaryType,
    message: eip712.message,
  };
}

function toSignatureObject(signature: string) {
  const clean = signature.startsWith('0x') ? signature.slice(2) : signature;
  const r = '0x' + clean.slice(0, 64);
  const s = '0x' + clean.slice(64, 128);
  let v = parseInt(clean.slice(128, 130), 16);
  if (v < 27) {
    v += 27;
  }
  return {
    signatureType: 2,
    r,
    s,
    v,
  };
}

// Environment configuration
const ZEROX_API_KEY = process.env.ZEROX_API_KEY || '';
const ZEROX_API_URL = 'https://api.0x.org';
const NODE_URL = process.env.NODE_URL || 'https://eth-mainnet.public.blastapi.io';

// Chain ID mapping
const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  base: 8453,
  arbitrum: 42161,
  optimism: 10,
  polygon: 137,
  bsc: 56,
  avalanche: 43114,
};

/**
 * 0x Gasless Quote Response
 */
interface ZeroXQuoteResponse {
  allowanceTarget: string;
  approval?: {
    type: string;
    hash: string;
    eip712: {
      types: Record<string, any>;
      domain: Record<string, any>;
      message: Record<string, any>;
      primaryType: string;
    };
  };
  trade: {
    type: string;
    hash: string;
    eip712: {
      types: Record<string, any>;
      domain: Record<string, any>;
      message: Record<string, any>;
      primaryType: string;
    };
  };
  liquidityAvailable: boolean;
  buyAmount: string;
  buyToken: string;
  sellAmount: string;
  sellToken: string;
  fees: {
    zeroExFee?: { amount: string; token: string };
    gasFee?: { amount: string; token: string };
    integratorFee?: { amount: string; token: string } | null;
  };
  issues: {
    allowance?: { actual: string; spender: string } | null;
    balance?: any;
  };
  route: {
    fills: Array<{ from: string; to: string; source: string; proportionBps: string }>;
    tokens: Array<{ address: string; symbol: string }>;
  };
  minBuyAmount: string;
  zid: string;
}

/**
 * 0x Gasless Submit Response
 */
interface ZeroXSubmitResponse {
  type: string;
  tradeHash: string;
  zid: string;
}

/**
 * 0x Gasless Status Response
 */
interface ZeroXStatusResponse {
  status: 'pending' | 'submitted' | 'succeeded' | 'confirmed' | 'failed';
  transactions?: Array<{
    hash: string;
    timestamp: number;
    blockNumber?: number;
  }>;
  zid: string;
}

/**
 * 0x Gasless Swap Provider Implementation
 */
export class ZeroXSwapProvider implements ISwapProvider {
  private client: AxiosInstance;
  private chainId: number;
  private network: string;

  constructor(network: string = process.env.CHAIN_NETWORK || 'ethereum') {
    this.network = network;
    this.chainId = CHAIN_IDS[network] || 1;

    this.client = axios.create({
      baseURL: ZEROX_API_URL,
      headers: {
        '0x-api-key': ZEROX_API_KEY,
        '0x-version': 'v2',
        'Content-Type': 'application/json',
      },
    });

    logger.info('0x Gasless provider initialized', {
      network: this.network,
      chainId: this.chainId,
    });
  }

  /**
   * Get swap quote from 0x Gasless API
   */
  async getQuote(params: QuoteParams): Promise<QuoteResult> {
    const { fromToken, toToken, amount, walletAddress } = params;

    logger.info('Fetching 0x Gasless quote', {
      fromToken: fromToken.substring(0, 10) + '...',
      toToken: toToken.substring(0, 10) + '...',
      amount,
      chainId: this.chainId,
    });

    try {
      const response = await this.client.get<ZeroXQuoteResponse>('/gasless/quote', {
        params: {
          chainId: this.chainId,
          sellToken: fromToken,
          buyToken: toToken,
          sellAmount: amount,
          taker: walletAddress,
        },
      });

      const quote = response.data;

      if (!quote.liquidityAvailable) {
        throw new Error('No liquidity available for this swap');
      }

      logger.info('0x Gasless quote fetched successfully', {
        buyAmount: quote.buyAmount,
        zid: quote.zid,
        source: quote.route?.fills?.[0]?.source,
      });

      // Calculate fees in USD (approximation)
      const gasFeeAmount = quote.fees?.gasFee?.amount || '0';
      const zeroExFeeAmount = quote.fees?.zeroExFee?.amount || '0';

      return {
        fromToken: fromToken,
        toToken: toToken,
        fromAmount: amount,
        toAmount: quote.buyAmount,
        estimatedGas: undefined, // Gasless - no gas estimate needed
        priceImpact: 0, // Not provided by 0x
        fees: {
          network: parseFloat(gasFeeAmount) / 1e6, // Assuming USDC decimals
          protocol: parseFloat(zeroExFeeAmount) / 1e6,
        },
        raw: quote as unknown as Record<string, any>,
      };
    } catch (error: any) {
      const errorDetails = {
        message: error?.message,
        status: error?.response?.status,
        responseData: error?.response?.data,
        fromToken: fromToken.substring(0, 10) + '...',
        toToken: toToken.substring(0, 10) + '...',
        amount,
      };

      logger.error('Failed to fetch 0x Gasless quote', error?.message, errorDetails);

      // Check for specific error types
      if (error?.response?.data?.name === 'BUY_TOKEN_NOT_AUTHORIZED_FOR_TRADE') {
        throw new Error(`Token not authorized for trade (likely a tokenized security): ${toToken}`);
      }

      if (error?.response?.data?.name === 'INSUFFICIENT_BALANCE') {
        throw new Error(`Insufficient balance: have ${error?.response?.data?.data?.balance}, need ${amount}`);
      }

      throw new Error(
        `0x quote failed: ${error?.response?.data?.message || error?.message}`
      );
    }
  }

  /**
   * Execute swap via 0x Gasless API
   *
   * Flow:
   * 1. Get quote with EIP-712 data
   * 2. Sign approval (if needed)
   * 3. Sign trade
   * 4. Submit both signatures
   */
  async executeSwap(params: SwapParams): Promise<SwapResult> {
    const { fromToken, toToken, amount, userAddress, privyWalletId } = params;

    logger.info('Executing 0x Gasless swap', {
      fromToken: fromToken.substring(0, 10) + '...',
      toToken: toToken.substring(0, 10) + '...',
      amount,
      userAddress: userAddress.substring(0, 10) + '...',
    });

    try {
      // Step 1: Get quote with EIP-712 data
      const quoteResponse = await this.client.get<ZeroXQuoteResponse>('/gasless/quote', {
        params: {
          chainId: this.chainId,
          sellToken: fromToken,
          buyToken: toToken,
          sellAmount: amount,
          taker: userAddress,
        },
      });

      const quote = quoteResponse.data;

      if (!quote.liquidityAvailable) {
        throw new Error('No liquidity available for this swap');
      }

      logger.info('Quote received, signing order', {
        zid: quote.zid,
        needsApproval: !!quote.approval,
      });

      // Step 2: Sign approval if needed (Permit for token allowance)
      let approvalSignature: string | undefined;

      if (quote.approval && quote.issues?.allowance) {
        logger.info('Signing approval permit', {
          type: quote.approval.type,
          spender: quote.issues.allowance.spender,
        });

        const approvalResult = await privyService.signTypedData(
          privyWalletId,
          transformEip712ForPrivy(quote.approval.eip712)
        );

        if (!approvalResult.success || !approvalResult.signature) {
          throw new Error(`Failed to sign approval: ${approvalResult.error}`);
        }

        approvalSignature = approvalResult.signature;
        logger.info('Approval signed successfully');
      }

      // Step 3: Sign trade (Permit2 witness transfer)
      logger.info('Signing trade order', {
        type: quote.trade.type,
      });

      const tradeResult = await privyService.signTypedData(
        privyWalletId,
        transformEip712ForPrivy(quote.trade.eip712)
      );

      if (!tradeResult.success || !tradeResult.signature) {
        throw new Error(`Failed to sign trade: ${tradeResult.error}`);
      }

      logger.info('Trade signed successfully');

      // Step 4: Submit to 0x Gasless
      // Signature format: object with r, s, v, signatureType
      const submitPayload: any = {
        trade: {
          type: quote.trade.type,
          eip712: quote.trade.eip712,
          signature: toSignatureObject(tradeResult.signature),
        },
        chainId: this.chainId,
      };

      // Add approval if we signed one
      if (approvalSignature && quote.approval) {
        submitPayload.approval = {
          type: quote.approval.type,
          eip712: quote.approval.eip712,
          signature: toSignatureObject(approvalSignature),
        };
      }

      logger.info('Submitting to 0x Gasless API');

      const submitResponse = await this.client.post<ZeroXSubmitResponse>(
        '/gasless/submit',
        submitPayload
      );

      const result = submitResponse.data;

      logger.info('0x Gasless order submitted successfully', {
        tradeHash: result.tradeHash,
        zid: result.zid,
      });

      return {
        orderId: result.tradeHash,
        status: 'pending',
        provider: 'zerox' as any,
        txHash: undefined,
        estimatedOutput: quote.buyAmount,
      };
    } catch (error: any) {
      const responseData = error?.response?.data;
      const errorDetails = {
        status: error?.response?.status,
        responseData,
        fromToken: fromToken.substring(0, 10) + '...',
        toToken: toToken.substring(0, 10) + '...',
        amount,
      };

      logger.error('0x Gasless swap execution failed', error?.message, errorDetails);

      const responseDetail = responseData ? `; response=${JSON.stringify(responseData)}` : '';
      throw new Error(
        `0x swap failed: ${responseData?.message || error?.message}${responseDetail}`
      );
    }
  }

  /**
   * Get swap status from 0x Gasless API
   */
  async getSwapStatus(tradeHash: string): Promise<SwapStatus> {
    logger.info('Checking 0x Gasless order status', { tradeHash });

    try {
      const response = await this.client.get<ZeroXStatusResponse>(
        `/gasless/status/${tradeHash}`,
        {
          params: { chainId: this.chainId },
        }
      );

      const status = response.data;

      logger.info('0x order status retrieved', {
        tradeHash,
        status: status.status,
      });

      // Map 0x status to our interface
      let mappedStatus: 'pending' | 'processing' | 'completed' | 'failed';
      let txHash: string | undefined;

      switch (status.status) {
        case 'succeeded':
        case 'confirmed':
          mappedStatus = 'completed';
          txHash = status.transactions?.[0]?.hash;
          break;
        case 'failed':
          mappedStatus = 'failed';
          break;
        case 'submitted':
          mappedStatus = 'processing';
          txHash = status.transactions?.[0]?.hash;
          break;
        case 'pending':
        default:
          mappedStatus = 'pending';
      }

      return {
        orderId: tradeHash,
        status: mappedStatus,
        provider: 'zerox' as any,
        txHash,
        fills: status.transactions?.map((tx) => ({
          txHash: tx.hash,
          filledAmount: '0', // Not provided by 0x status API
          timestamp: tx.timestamp,
        })),
      };
    } catch (error: any) {
      logger.error('Failed to get 0x order status', error?.message, {
        tradeHash,
        status: error?.response?.status,
        responseData: error?.response?.data,
      });

      // If not found, assume still pending
      if (error?.response?.status === 404) {
        return {
          orderId: tradeHash,
          status: 'pending',
          provider: 'zerox' as any,
        };
      }

      throw error;
    }
  }

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    const hasApiKey = !!ZEROX_API_KEY;
    const hasPrivyCreds = !!process.env.PRIVY_APP_ID && !!process.env.PRIVY_APP_SECRET;

    if (!hasApiKey) {
      logger.warn('ZEROX_API_KEY not configured');
    }
    if (!hasPrivyCreds) {
      logger.warn('Privy credentials not configured');
    }

    return hasApiKey && hasPrivyCreds;
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return '0x Gasless';
  }
}
