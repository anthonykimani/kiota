/**
 * Swap Provider Interface
 *
 * Common abstraction for different 1inch swap implementations:
 * - Classic Swap (REST API, testnet-friendly, user pays gas)
 * - Fusion SDK (Intent-based, mainnet-only, gasless)
 *
 * This interface allows switching between implementations based on network configuration
 * without changing controller or processor code.
 */

/**
 * Quote request parameters
 */
export interface QuoteParams {
  fromToken: string;        // Token contract address (0x...)
  toToken: string;          // Token contract address (0x...)
  amount: string;           // Amount in wei
  slippage?: number;        // Slippage tolerance in percent (default: 1)
}

/**
 * Quote response
 */
export interface QuoteResult {
  fromToken: string;        // Source token address
  toToken: string;          // Destination token address
  fromAmount: string;       // Input amount in wei
  toAmount: string;         // Estimated output amount in wei
  estimatedGas?: string;    // Estimated gas (Classic Swap only)
  priceImpact: number;      // Price impact in percent
  fees?: {                  // Fee breakdown
    network: number;
    protocol: number;
  };
  expiresAt?: string;       // Quote expiration timestamp (ISO 8601)
  raw?: Record<string, any>; // Provider-specific quote payload (full response)
}

/**
 * Swap execution parameters
 */
export interface SwapParams {
  fromToken: string;        // Token contract address (0x...)
  toToken: string;          // Token contract address (0x...)
  amount: string;           // Amount in wei
  userAddress: string;      // User's wallet address
  privyWalletId: string;    // User's Privy wallet ID (for transaction signing)
  slippage?: number;        // Slippage tolerance in percent (default: 1)
}

/**
 * Swap execution result
 */
export interface SwapResult {
  orderId: string;          // Transaction hash (Classic) or order hash (Fusion)
  status: 'pending' | 'processing' | 'completed' | 'failed';
  provider: 'classic' | 'fusion';  // Which provider executed this swap
  txHash?: string;          // Transaction hash (available immediately for Classic)
  estimatedOutput?: string; // Estimated output amount in wei
}

/**
 * Swap status response
 */
export interface SwapStatus {
  orderId: string;          // Transaction hash (Classic) or order hash (Fusion)
  status: 'pending' | 'processing' | 'completed' | 'failed';
  provider: 'classic' | 'fusion';
  txHash?: string;          // Blockchain transaction hash
  actualOutput?: string;    // Actual output amount in wei (when completed)
  reason?: string;          // Failure reason (if failed)
  fills?: Array<{           // Fill information (Fusion only)
    txHash: string;
    filledAmount: string;
    timestamp: number;
  }>;
}

/**
 * Swap Provider Interface
 *
 * Implementations:
 * - ClassicSwapProvider: Uses 1inch Classic Swap API v6.1 (testnet support)
 * - FusionSwapProvider: Uses @1inch/fusion-sdk (mainnet only, gasless)
 */
export interface ISwapProvider {
  /**
   * Get swap quote (pricing preview without execution)
   *
   * @param params Quote parameters
   * @returns Quote result with pricing and route information
   * @throws Error if API call fails or tokens not supported
   */
  getQuote(params: QuoteParams): Promise<QuoteResult>;

  /**
   * Execute swap
   *
   * - Classic Swap: Checks allowance, approves if needed, builds tx, broadcasts, returns txHash
   * - Fusion: Creates order, signs EIP-712, submits to orderbook, returns orderHash
   *
   * @param params Swap execution parameters
   * @returns Swap result with order ID and status
   * @throws Error if execution fails
   */
  executeSwap(params: SwapParams): Promise<SwapResult>;

  /**
   * Get swap status
   *
   * - Classic Swap: Polls RPC for transaction receipt
   * - Fusion: Polls 1inch API for order status
   *
   * @param orderId Transaction hash (Classic) or order hash (Fusion)
   * @returns Swap status with completion details
   * @throws Error if status check fails
   */
  getSwapStatus(orderId: string): Promise<SwapStatus>;

  /**
   * Check if provider is configured correctly
   *
   * Validates:
   * - API key exists
   * - Network configuration valid
   * - Wallet private key exists (if required)
   * - RPC endpoint configured (if required)
   *
   * @returns true if configured, false otherwise
   */
  isConfigured(): boolean;

  /**
   * Get provider name for logging/debugging
   */
  getProviderName(): string;
}

/**
 * Helper: Convert token amount from human-readable to wei
 *
 * @param amount Human-readable amount (e.g., "1.5")
 * @param decimals Token decimals (e.g., 6 for USDC, 18 for ETH)
 * @returns Amount in wei as string
 */
export function toWei(amount: number | string, decimals: number): string {
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  const multiplier = BigInt(10 ** decimals);
  const weiAmount = BigInt(Math.floor(amountNum * (10 ** decimals))) * multiplier / BigInt(10 ** decimals);
  return weiAmount.toString();
}

/**
 * Helper: Convert token amount from wei to human-readable
 *
 * @param weiAmount Amount in wei as string
 * @param decimals Token decimals (e.g., 6 for USDC, 18 for ETH)
 * @returns Human-readable amount as number
 */
export function fromWei(weiAmount: string, decimals: number): number {
  const divisor = BigInt(10 ** decimals);
  const wei = BigInt(weiAmount);
  return Number(wei) / Number(divisor);
}
