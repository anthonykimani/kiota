/**
 * Classic Swap Provider
 *
 * Uses 1inch Classic Swap API v6.1 for testnet support
 *
 * Features:
 * - REST API integration with /swap/v6.1/{chainId} endpoints
 * - Token allowance checking and approval
 * - Transaction signing and broadcasting via viem
 * - RPC-based transaction confirmation
 * - Works on Base Sepolia testnet and Base mainnet
 *
 * Trade-offs:
 * ✅ Testnet support (Base Sepolia)
 * ✅ Instant execution (no auction delay)
 * ❌ User pays gas fees (not gasless)
 * ❌ No MEV protection
 */

import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { ISwapProvider, QuoteParams, QuoteResult, SwapParams, SwapResult, SwapStatus } from '../interfaces/ISwapProvider';
import { createLogger } from '../utils/logger.util';

const logger = createLogger('classic-swap-provider');

// Environment configuration
const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY || '';
const ONEINCH_NETWORK = process.env.ONEINCH_NETWORK || 'base';
const SWAP_WALLET_PRIVATE_KEY = process.env.SWAP_WALLET_PRIVATE_KEY || '';
const NODE_URL = process.env.NODE_URL || '';

// Network mapping to 1inch chain IDs
const NETWORK_CHAIN_IDS: Record<string, number> = {
  'base': 8453,
  'base-sepolia': 84532,
};

// Network mapping to viem chains
const VIEM_CHAINS: Record<string, any> = {
  'base': base,
  'base-sepolia': baseSepolia,
};

// ERC20 ABI for approve and allowance
const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
]);

/**
 * Classic Swap Provider Implementation
 */
export class ClassicSwapProvider implements ISwapProvider {
  private apiKey: string;
  private network: string;
  private chainId: number;
  private baseUrl: string;
  private walletClient: any;
  private publicClient: any;
  private account: any;

  constructor() {
    this.apiKey = ONEINCH_API_KEY;
    this.network = ONEINCH_NETWORK;
    this.chainId = NETWORK_CHAIN_IDS[this.network];

    if (!this.chainId) {
      throw new Error(`Invalid ONEINCH_NETWORK: ${this.network}. Must be 'base' or 'base-sepolia'`);
    }

    // 1inch Classic Swap API base URL
    this.baseUrl = `https://api.1inch.dev/swap/v6.1/${this.chainId}`;

    // Initialize viem clients
    const chain = VIEM_CHAINS[this.network];
    const rpcUrl = NODE_URL || (this.network === 'base' ? 'https://base.llamarpc.com' : 'https://sepolia.base.org');

    // Create account from private key
    if (SWAP_WALLET_PRIVATE_KEY) {
      this.account = privateKeyToAccount(SWAP_WALLET_PRIVATE_KEY as `0x${string}`);

      this.walletClient = createWalletClient({
        account: this.account,
        chain,
        transport: http(rpcUrl),
      });

      this.publicClient = createPublicClient({
        chain,
        transport: http(rpcUrl),
      });

      logger.info('ClassicSwapProvider initialized with wallet', {
        network: this.network,
        chainId: this.chainId,
        baseUrl: this.baseUrl,
        walletAddress: this.account.address.substring(0, 10) + '...',
      });
    } else {
      logger.warn('ClassicSwapProvider initialized without wallet (read-only mode)', {
        network: this.network,
        chainId: this.chainId,
        baseUrl: this.baseUrl,
      });
    }
  }

  /**
   * Get swap quote from 1inch Classic Swap API
   */
  async getQuote(params: QuoteParams): Promise<QuoteResult> {
    const { fromToken, toToken, amount, slippage = 1 } = params;

    logger.info('Fetching Classic Swap quote', {
      fromToken: fromToken.substring(0, 10) + '...',
      toToken: toToken.substring(0, 10) + '...',
      amount,
      slippage,
    });

    try {
      const url = new URL(`${this.baseUrl}/quote`);
      url.searchParams.append('src', fromToken);
      url.searchParams.append('dst', toToken);
      url.searchParams.append('amount', amount);
      url.searchParams.append('includeGas', 'true');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Quote request failed', new Error(errorText), {
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error(`1inch Classic Swap quote failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      logger.info('Quote fetched successfully', {
        toAmount: data.toAmount,
        estimatedGas: data.gas,
      });

      // Map to interface format
      return {
        fromToken: data.fromToken.address,
        toToken: data.toToken.address,
        fromAmount: data.fromAmount,
        toAmount: data.toAmount,
        estimatedGas: data.gas?.toString(),
        priceImpact: 0, // Classic Swap doesn't return price impact in quote
        route: data.protocols?.[0]?.map((p: any) => p[0]?.name || 'Unknown') || [],
        fees: {
          network: 0,
          protocol: 0,
        },
      };
    } catch (error) {
      logger.error('Failed to fetch quote', error as Error);
      throw error;
    }
  }

  /**
   * Execute swap (check allowance, approve if needed, build tx, broadcast)
   */
  async executeSwap(params: SwapParams): Promise<SwapResult> {
    const { fromToken, toToken, amount, userAddress, slippage = 1 } = params;

    logger.info('Executing Classic Swap', {
      fromToken: fromToken.substring(0, 10) + '...',
      toToken: toToken.substring(0, 10) + '...',
      amount,
      userAddress: userAddress.substring(0, 10) + '...',
      slippage,
    });

    try {
      // Step 1: Check if approval is needed
      const needsApproval = await this.checkAndApprove(fromToken, amount);

      if (needsApproval) {
        logger.info('Token approval completed');
      }

      // Step 2: Build swap transaction
      const url = new URL(`${this.baseUrl}/swap`);
      url.searchParams.append('src', fromToken);
      url.searchParams.append('dst', toToken);
      url.searchParams.append('amount', amount);
      url.searchParams.append('from', userAddress);
      url.searchParams.append('slippage', slippage.toString());
      url.searchParams.append('disableEstimate', 'false');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Swap request failed', new Error(errorText), {
          status: response.status,
          statusText: response.statusText,
          slippage,
        });
        throw new Error(`1inch Classic Swap failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      // Step 3: Broadcast transaction
      logger.info('Broadcasting swap transaction', {
        to: data.tx.to.substring(0, 10) + '...',
        value: data.tx.value,
        gas: data.tx.gas,
      });

      const txHash = await this.walletClient.sendTransaction({
        to: data.tx.to as `0x${string}`,
        data: data.tx.data as `0x${string}`,
        value: BigInt(data.tx.value),
        gas: BigInt(data.tx.gas),
      });

      logger.info('Swap transaction broadcasted', {
        txHash,
      });

      return {
        orderId: txHash,
        status: 'pending',
        provider: 'classic',
        txHash,
        estimatedOutput: data.toAmount,
      };
    } catch (error) {
      logger.error('Swap execution failed', error as Error);
      throw error;
    }
  }

  /**
   * Get swap status by checking transaction receipt
   */
  async getSwapStatus(orderId: string): Promise<SwapStatus> {
    logger.info('Checking swap status via RPC', { txHash: orderId });

    try {
      const receipt = await this.publicClient.getTransactionReceipt({
        hash: orderId as `0x${string}`,
      });

      if (!receipt) {
        // Transaction not yet mined
        return {
          orderId,
          status: 'pending',
          provider: 'classic',
          txHash: orderId,
        };
      }

      if (receipt.status === 'success') {
        logger.info('Transaction confirmed successfully', {
          txHash: orderId,
          blockNumber: receipt.blockNumber,
        });

        return {
          orderId,
          status: 'completed',
          provider: 'classic',
          txHash: orderId,
        };
      } else {
        logger.error('Transaction failed on-chain', new Error('Transaction reverted'), {
          txHash: orderId,
          blockNumber: receipt.blockNumber,
        });

        return {
          orderId,
          status: 'failed',
          provider: 'classic',
          txHash: orderId,
          reason: 'Transaction reverted on-chain',
        };
      }
    } catch (error) {
      logger.error('Failed to get transaction status', error as Error);

      // If transaction not found, it's still pending
      if ((error as Error).message.includes('not found')) {
        return {
          orderId,
          status: 'pending',
          provider: 'classic',
          txHash: orderId,
        };
      }

      throw error;
    }
  }

  /**
   * Check token allowance and approve if needed
   */
  private async checkAndApprove(tokenAddress: string, amount: string): Promise<boolean> {
    // Get 1inch router address
    const spenderUrl = `${this.baseUrl}/approve/spender`;
    const spenderResponse = await fetch(spenderUrl, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!spenderResponse.ok) {
      throw new Error('Failed to get 1inch router address');
    }

    const spenderData = await spenderResponse.json();
    const spenderAddress = spenderData.address;

    // Check current allowance
    const allowance = await this.publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [this.account.address, spenderAddress],
    });

    logger.info('Current token allowance', {
      token: tokenAddress.substring(0, 10) + '...',
      allowance: allowance.toString(),
      required: amount,
    });

    if (BigInt(allowance as string) < BigInt(amount)) {
      // Need approval
      logger.info('Insufficient allowance, approving token', {
        token: tokenAddress.substring(0, 10) + '...',
        spender: spenderAddress.substring(0, 10) + '...',
        amount,
      });

      // Get approval transaction data
      const approveUrl = new URL(`${this.baseUrl}/approve/transaction`);
      approveUrl.searchParams.append('tokenAddress', tokenAddress);
      approveUrl.searchParams.append('amount', amount);

      const approveResponse = await fetch(approveUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!approveResponse.ok) {
        throw new Error('Failed to get approval transaction');
      }

      const approveData = await approveResponse.json();

      // Broadcast approval transaction
      const approveTxHash = await this.walletClient.sendTransaction({
        to: approveData.to as `0x${string}`,
        data: approveData.data as `0x${string}`,
        gas: BigInt(approveData.gas || 100000),
      });

      logger.info('Approval transaction broadcasted', { txHash: approveTxHash });

      // Wait for approval confirmation
      await this.publicClient.waitForTransactionReceipt({
        hash: approveTxHash,
      });

      logger.info('Approval confirmed', { txHash: approveTxHash });

      return true;
    }

    return false;
  }

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    const hasApiKey = !!this.apiKey;
    const hasPrivateKey = !!SWAP_WALLET_PRIVATE_KEY;
    const hasRpcUrl = !!NODE_URL;

    if (!hasApiKey) {
      logger.warn('ONEINCH_API_KEY not configured');
    }
    if (!hasPrivateKey) {
      logger.warn('SWAP_WALLET_PRIVATE_KEY not configured');
    }

    return hasApiKey && hasPrivateKey;
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'Classic Swap (v6.1)';
  }
}
