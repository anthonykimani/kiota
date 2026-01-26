/**
 * Classic Swap Provider
 *
 * Uses 1inch Classic Swap API v6.1 with Privy embedded wallets
 *
 * Features:
 * - REST API integration with /swap/v6.1/{chainId} endpoints
 * - Token allowance checking and approval
 * - Transaction signing via Privy SDK (per-user wallets)
 * - RPC-based transaction confirmation
 * - Works on Ethereum Sepolia testnet and Ethereum mainnet
 *
 * Trade-offs:
 * ✅ Testnet support (Ethereum Sepolia)
 * ✅ Instant execution (no auction delay)
 * ✅ Per-user Privy wallets (non-custodial)
 * ❌ User pays gas fees (not gasless)
 * ❌ No MEV protection
 */

import { createPublicClient, http, parseAbi, encodeFunctionData } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { ISwapProvider, QuoteParams, QuoteResult, SwapParams, SwapResult, SwapStatus } from '../interfaces/ISwapProvider';
import { createLogger } from '../utils/logger.util';
import { privyService } from '../utils/provider/privy';

const logger = createLogger('classic-swap-provider');

// Environment configuration
const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY ?? "";
const ONEINCH_NETWORK = process.env.ONEINCH_NETWORK || 'ethereum';
const NODE_URL = process.env.NODE_URL || '';

// Network mapping to 1inch chain IDs
const NETWORK_CHAIN_IDS: Record<string, number> = {
  'ethereum': 1,
  'ethereum-sepolia': 11155111,
  'sepolia': 11155111,
};

// Network mapping to viem chains
const VIEM_CHAINS: Record<string, any> = {
  'ethereum': mainnet,
  'ethereum-sepolia': sepolia,
  'sepolia': sepolia,
};

// ERC20 ABI for approve and allowance
const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
]);

/**
 * Classic Swap Provider Implementation (Privy Integration)
 */
export class ClassicSwapProvider implements ISwapProvider {
  private baseUrl: string;
  private chainId: number;
  private network: string;
  private publicClient: any;

  constructor() {
    this.network = ONEINCH_NETWORK;
    this.chainId = NETWORK_CHAIN_IDS[this.network];

    if (!this.chainId) {
      throw new Error(`Unknown network: ${this.network}. Supported: ethereum, ethereum-sepolia`);
    }

    this.baseUrl = `https://api.1inch.dev/swap/v6.1/${this.chainId}`;

    // Create public client for reading blockchain state (allowances, receipts)
    const chain = VIEM_CHAINS[this.network];
    const rpcUrl = NODE_URL || (this.network === 'ethereum' ? 'https://eth.llamarpc.com' : 'https://ethereum-sepolia-rpc.publicnode.com');

    this.publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    logger.info('ClassicSwapProvider initialized', {
      network: this.network,
      chainId: this.chainId,
      baseUrl: this.baseUrl,
      rpcUrl,
    });
  }

  /**
   * Get swap quote from 1inch Classic Swap API
   */
  async getQuote(params: QuoteParams): Promise<QuoteResult> {
    const { fromToken, toToken, amount, slippage = 1 } = params;

    logger.info('Fetching quote from 1inch Classic Swap', {
      fromToken: fromToken.substring(0, 10) + '...',
      toToken: toToken.substring(0, 10) + '...',
      amount,
      slippage,
    });

    try {
      const url = new URL(`${this.baseUrl}/quote?src=${fromToken}&dst=${toToken}&amount=${amount}`);

      url.searchParams.set("includeGas", "true");
      url.searchParams.set("includeProtocols", "true");
      url.searchParams.set("includeTokensInfo", "true");

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ONEINCH_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`1inch API error (${response.status}): ${errorText}`);
      }

      const data = await response.json() as Record<string, any>;

      const resolvedToAmount = data.toAmount ?? data.dstAmount;

      logger.info('Quote fetched successfully', {
        toAmount: resolvedToAmount,
        estimatedGas: data.gas,
      });

      return {
        fromToken: data.fromToken?.address ?? data.srcToken?.address ?? fromToken,
        toToken: data.toToken?.address ?? data.dstToken?.address ?? toToken,
        fromAmount: amount,
        toAmount: resolvedToAmount,
        estimatedGas: data.gas?.toString(),
        priceImpact: typeof data.priceImpact === 'number' ? data.priceImpact : 0,
        fees: {
          network: Number(data.gas || 0) * Number(data.gasPrice || 0),
          protocol: 0,
        },
        expiresAt: new Date(Date.now() + 30000).toISOString(), // Quote valid for 30 seconds
        raw: data,
      };
    } catch (error) {
      logger.error('Failed to fetch quote', error as Error);
      throw error;
    }
  }

  /**
   * Execute swap using Privy wallet
   */
  async executeSwap(params: SwapParams): Promise<SwapResult> {
    const { fromToken, toToken, amount, userAddress, privyWalletId, slippage = 1 } = params;

    logger.info('Executing Classic Swap with Privy', {
      fromToken: fromToken.substring(0, 10) + '...',
      toToken: toToken.substring(0, 10) + '...',
      amount,
      userAddress: userAddress.substring(0, 10) + '...',
      privyWalletId,
      slippage,
    });

    try {
      // Step 1: Check token allowance
      const spenderAddress = await this.getSpenderAddress();
      const currentAllowance = await this.checkAllowance(fromToken, userAddress, spenderAddress);

      logger.info('Current allowance checked', {
        currentAllowance: currentAllowance.toString(),
        requiredAmount: amount,
      });

      // Step 2: Approve token if needed (skip for native ETH)
      const isNativeETH = fromToken.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

      if (!isNativeETH && BigInt(currentAllowance) < BigInt(amount)) {
        logger.info('Insufficient allowance, approving token', {
          current: currentAllowance.toString(),
          required: amount,
        });

        await this.approveToken(fromToken, spenderAddress, amount, privyWalletId);

        logger.info('Token approved successfully');
      } else {
        logger.info('Sufficient allowance, skipping approval');
      }

      // Step 3: Build swap transaction from 1inch API
      const swapUrl = `${this.baseUrl}/swap?src=${fromToken}&dst=${toToken}&amount=${amount}&from=${userAddress}&slippage=${slippage}`;

      const swapResponse = await fetch(swapUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ONEINCH_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!swapResponse.ok) {
        const errorText = await swapResponse.text();
        throw new Error(`1inch swap API error (${swapResponse.status}): ${errorText}`);
      }

      const swapData = await swapResponse.json() as Record<string, any>;

      logger.info('Swap transaction built', {
        to: swapData.tx.to,
        value: swapData.tx.value,
        gasLimit: swapData.tx.gas,
      });

      // Step 4: Send transaction using Privy
      const txResult = await privyService.sendTransaction(privyWalletId, {
        to: swapData.tx.to,
        value: swapData.tx.value || '0x0',
        data: swapData.tx.data,
        chainId: this.chainId,
      });

      if (!txResult.success) {
        throw new Error(`Privy transaction failed: ${txResult.error}`);
      }

      const txHash = txResult.hash!;

      logger.info('Swap transaction sent via Privy', {
        txHash,
        explorer: this.network === 'ethereum-sepolia'
          ? `https://sepolia.etherscan.io/tx/${txHash}`
          : `https://etherscan.io/tx/${txHash}`
      });

      return {
        orderId: txHash,
        status: 'pending',
        provider: 'classic',
        txHash: txHash,
        estimatedOutput: swapData.toAmount,
      };
    } catch (error) {
      logger.error('Classic Swap execution failed', error as Error);
      throw error;
    }
  }

  /**
   * Get swap status by checking transaction receipt
   */
  async getSwapStatus(orderId: string): Promise<SwapStatus> {
    logger.info('Checking transaction status', { txHash: orderId });

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

      // Check if transaction was successful
      const status = receipt.status === 'success' ? 'completed' : 'failed';

      logger.info('Transaction status retrieved', {
        txHash: orderId,
        status,
        blockNumber: receipt.blockNumber,
      });

      return {
        orderId,
        status,
        provider: 'classic',
        txHash: orderId,
        actualOutput: undefined, // Would need to parse logs to get actual output
        reason: status === 'failed' ? 'Transaction reverted' : undefined,
      };
    } catch (error) {
      logger.error('Failed to get transaction status', error as Error);

      // If transaction not found, still pending
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
   * Check if provider is configured
   */
  isConfigured(): boolean {
    const hasApiKey = !!ONEINCH_API_KEY;

    if (!hasApiKey) {
      logger.warn('ONEINCH_API_KEY not configured');
    }

    return hasApiKey;
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'Classic Swap (Privy)';
  }

  /**
   * Get 1inch router address (spender for approvals)
   */
  private async getSpenderAddress(): Promise<string> {
    try {
      const url = `${this.baseUrl}/approve/spender`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ONEINCH_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get spender address: ${response.status}`);
      }

      const data = await response.json() as Record<string, any>;
      return data.address;
    } catch (error) {
      logger.error('Failed to get spender address', error as Error);
      throw error;
    }
  }

  /**
   * Check token allowance
   */
  private async checkAllowance(tokenAddress: string, ownerAddress: string, spenderAddress: string): Promise<string> {
    try {
      const allowance = await this.publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [ownerAddress as `0x${string}`, spenderAddress as `0x${string}`],
      });

      return allowance.toString();
    } catch (error) {
      logger.error('Failed to check allowance', error as Error);
      throw error;
    }
  }

  /**
   * Approve token using Privy wallet
   */
  private async approveToken(tokenAddress: string, spenderAddress: string, amount: string, privyWalletId: string): Promise<void> {
    try {
      // Encode approve function call
      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spenderAddress as `0x${string}`, BigInt(amount)],
      });

      // Send approve transaction via Privy
      const txResult = await privyService.sendTransaction(privyWalletId, {
        to: tokenAddress,
        value: '0x0',
        data,
        chainId: this.chainId,
      });

      if (!txResult.success) {
        throw new Error(`Privy approval transaction failed: ${txResult.error}`);
      }

      const txHash = txResult.hash!;

      logger.info('Approval transaction sent', {
        txHash,
        token: tokenAddress,
        spender: spenderAddress,
        amount,
      });

      // Wait for approval transaction to be mined
      await this.waitForTransaction(txHash);

      logger.info('Approval transaction confirmed', { txHash });
    } catch (error) {
      logger.error('Token approval failed', error as Error);
      throw error;
    }
  }

  /**
   * Wait for transaction to be mined
   */
  private async waitForTransaction(txHash: string): Promise<void> {
    const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const receipt = await this.publicClient.getTransactionReceipt({
          hash: txHash as `0x${string}`,
        });

        if (receipt) {
          if (receipt.status === 'success') {
            return;
          } else {
            throw new Error('Transaction reverted');
          }
        }
      } catch (error) {
        // Transaction not found yet, continue waiting
      }

      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      attempts++;
    }

    throw new Error('Transaction confirmation timeout');
  }
}
