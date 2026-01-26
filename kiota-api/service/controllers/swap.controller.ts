/**
 * Swap Controller
 *
 * Handles swap operations via 1inch Fusion API
 *
 * Endpoints:
 * - GET /api/swap/quote - Get swap pricing preview
 * - POST /api/swap/execute - Execute user-initiated swap
 * - GET /api/swap/status/:transactionId - Check swap status
 * - GET /api/swap/history - Get user's swap history
 */

import { Request, Response } from 'express';
import { createPublicClient, http, parseAbi } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import Controller from './controller';
import { SwapRepository } from '../repositories/swap.repo';
import { WalletRepository } from '../repositories/wallet.repo';
import { swapProvider } from '../services/swap-provider.factory';
import { getTokenAddress, getTokenInfo, toWei, fromWei, AssetType as TokenAssetType } from '../configs/tokens.config';
import { createLogger } from '../utils/logger.util';

import { SWAP_EXECUTION_QUEUE } from '../configs/queue.config';

const logger = createLogger('swap-controller');

type PublicClientLike = {
  readContract: (args: any) => Promise<any>;
};

const ERC20_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
]);

const VIEM_CHAINS: Record<string, any> = {
  ethereum: mainnet,
  'ethereum-sepolia': sepolia,
  sepolia: sepolia,
};

const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

function toWeiByDecimals(amount: number | string, decimals: number): string {
  const [whole, fraction = ''] = String(amount).split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  const combined = `${whole}${paddedFraction}`.replace(/^0+(?=\d)/, '');
  return (combined === '' ? 0n : BigInt(combined)).toString();
}

function fromWeiByDecimals(amountWei: string, decimals: number): number {
  const divisor = 10 ** decimals;
  return Number(amountWei) / divisor;
}

function createPublicClientForNetwork(network: string): PublicClientLike | null {
  const chain = VIEM_CHAINS[network];

  if (!chain) {
    return null;
  }

  const rpcUrl = process.env.NODE_URL ||
    (network === 'ethereum'
      ? 'https://eth.llamarpc.com'
      : 'https://ethereum-sepolia-rpc.publicnode.com');

  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  }) as unknown as PublicClientLike;
}

async function getTokenDecimals(address: string, client: PublicClientLike): Promise<number> {
  if (address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
    return 18;
  }

  const decimals = await client.readContract({
    address: address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });

  return Number(decimals);
}

/**
 * Swap Controller
 */
class SwapController extends Controller {
  /**
   * GET /api/swap/quote
   *
   * Get swap pricing preview without executing
   *
   * Query params:
   * - fromAsset: 'USDC' | 'USDM' | 'BCSPX' | 'PAXG'
   * - toAsset: 'USDC' | 'USDM' | 'BCSPX' | 'PAXG'
   * - amount: number (in token units, not wei)
   */
  public static async getSwapQuote(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.send(super.response(super._401, null, ['Not authenticated']));
      }

      const { fromAsset, toAsset, fromToken, toToken, amount } = req.query;

      // Validation is handled by validator middleware, but add runtime checks
      if (((!fromAsset || !toAsset) && (!fromToken || !toToken)) || !amount) {
        return res.send(
          super.response(super._400, null, ['Missing required parameters: fromAsset/toAsset or fromToken/toToken, and amount'])
        );
      }

      const amountNum = Number(amount);

      // Check if 1inch service is configured
      if (!swapProvider.isConfigured()) {
        return res.send(
          super.response(super._503, null, ['1inch API not configured. Please set ONEINCH_API_KEY'])
        );
      }

      const network = process.env.ONEINCH_NETWORK || 'ethereum';
      const publicClient = createPublicClientForNetwork(network);

      if (!publicClient) {
        return res.send(super.response(super._400, null, [`Unsupported network: ${network}`]));
      }

      if (fromToken && toToken) {
        const fromTokenAddress = String(fromToken);
        const toTokenAddress = String(toToken);

        const fromDecimals = await getTokenDecimals(fromTokenAddress, publicClient);
        const toDecimals = await getTokenDecimals(toTokenAddress, publicClient);
        const amountWei = toWeiByDecimals(amountNum, fromDecimals);

        logger.info('Fetching swap quote (custom token addresses)', {
          userId,
          fromToken: fromTokenAddress,
          toToken: toTokenAddress,
          amount: amountNum,
        });

        const quote = await swapProvider.getQuote({
          fromToken: fromTokenAddress,
          toToken: toTokenAddress,
          amount: amountWei,
        });

        const estimatedToAmount = fromWeiByDecimals(quote.toAmount, toDecimals);

        return res.send(
          super.response(super._200, {
            fromToken: fromTokenAddress,
            toToken: toTokenAddress,
            fromAmount: amountNum,
            estimatedToAmount,
            slippage: 1.0,
            priceImpact: quote.priceImpact,
            fees: quote.fees,
            expiresAt: quote.expiresAt,
            provider: swapProvider.getProviderName(),
            quote: quote.raw ?? null,
          })
        );
      }

      const fromAssetType = fromAsset as TokenAssetType;
      const toAssetType = toAsset as TokenAssetType;

      if (fromAssetType === toAssetType) {
        return res.send(super.response(super._400, null, ['Cannot swap same asset']));
      }

      const fromTokenInfo = getTokenInfo(fromAssetType, process.env.ONEINCH_NETWORK ?? "");
      const toTokenInfo = getTokenInfo(toAssetType, process.env.ONEINCH_NETWORK ?? "");
      const amountWei = toWei(amountNum, fromAssetType);

      logger.info('Fetching swap quote', {
        userId,
        fromAsset: fromAssetType,
        toAsset: toAssetType,
        amount: amountNum,
      });

      const quote = await swapProvider.getQuote({
        fromToken: fromTokenInfo.address,
        toToken: toTokenInfo.address,
        amount: amountWei,
      });

      const estimatedToAmount = fromWei(quote.toAmount, toAssetType);

      return res.send(
        super.response(super._200, {
          fromAsset: fromAssetType,
          toAsset: toAssetType,
          fromToken: fromTokenInfo.address,
          toToken: toTokenInfo.address,
          fromAmount: amountNum,
          estimatedToAmount,
          slippage: 1.0,
          priceImpact: quote.priceImpact,
          fees: quote.fees,
          expiresAt: quote.expiresAt,
          provider: swapProvider.getProviderName(),
          quote: quote.raw ?? null,
        })
      );
    } catch (error) {
      logger.error('Failed to get swap quote', error as Error);
      return res.send(super.response(super._500, null, super.ex(error)));
    }
  }

  /**
   * POST /api/swap/execute
   *
   * Execute user-initiated swap
   *
   * Body:
   * - fromAsset: 'USDC' | 'USDM' | 'BCSPX' | 'PAXG'
   * - toAsset: 'USDC' | 'USDM' | 'BCSPX' | 'PAXG'
   * - amount: number
   * - slippage?: number (optional, defaults to 1%)
   */
  public static async executeSwap(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.send(super.response(super._401, null, ['Not authenticated']));
      }

      const { fromAsset, toAsset, amount, slippage = 1.0 } = req.body;

      if (!fromAsset || !toAsset || !amount) {
        return res.send(
          super.response(super._400, null, ['Missing required parameters: fromAsset, toAsset, amount'])
        );
      }

      const fromAssetType = fromAsset as TokenAssetType;
      const toAssetType = toAsset as TokenAssetType;
      const amountNum = Number(amount);
      const slippageNum = Number(slippage);

      if (fromAssetType === toAssetType) {
        return res.send(super.response(super._400, null, ['Cannot swap same asset']));
      }

      // Check if 1inch service is configured
      if (!swapProvider.isConfigured()) {
        return res.send(
          super.response(super._503, null, ['1inch API not configured. Please set ONEINCH_API_KEY'])
        );
      }

      // Get quote for estimated output
      const fromTokenInfo = getTokenInfo(fromAssetType, process.env.ONEINCH_NETWORK ?? "");
      const toTokenInfo = getTokenInfo(toAssetType, process.env.ONEINCH_NETWORK ?? "");
      const amountWei = toWei(amountNum, fromAssetType);

      // Pre-swap on-chain balance check
      const walletRepo = new WalletRepository();
      const wallet = await walletRepo.getByUserId(userId);

      if (!wallet || !wallet.address) {
        return res.send(super.response(super._404, null, ['Wallet not found']));
      }

      const network = process.env.ONEINCH_NETWORK || 'ethereum';
      const publicClient = createPublicClientForNetwork(network);

      if (!publicClient) {
        return res.send(super.response(super._400, null, [`Unsupported network: ${network}`]));
      }

      const fromTokenAddress = getTokenAddress(fromAssetType, network);
      const onchainBalance = await publicClient.readContract({
        address: fromTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [wallet.address as `0x${string}`],
      });

      if (BigInt(onchainBalance) < BigInt(amountWei)) {
        return res.send(
          super.response(super._400, null, [`Insufficient ${fromAssetType} balance`])
        );
      }

      logger.info('Getting quote for swap execution', {
        userId,
        fromAsset: fromAssetType,
        toAsset: toAssetType,
        amount: amountNum,
        slippage: slippageNum,
      });

      const quote = await swapProvider.getQuote({
        fromToken: fromTokenInfo.address,
        toToken: toTokenInfo.address,
        amount: amountWei,
        slippage: slippageNum,
      });

      const estimatedToAmount = fromWei(quote.toAmount, toAssetType);

      // Create swap transaction record
      const swapRepo = new SwapRepository();
      const transaction = await swapRepo.createSwap({
        userId,
        fromAsset: fromAssetType,
        toAsset: toAssetType,
        fromAmount: amountNum,
        estimatedToAmount,
        slippage: slippageNum,
        metadata: {
          quote,
          priceImpact: quote.priceImpact,
        },
      });

      logger.info('Swap transaction created', {
        transactionId: transaction.id,
        userId,
      });

      // Queue swap execution job
      await SWAP_EXECUTION_QUEUE.add(
        {
          transactionId: transaction.id,
          userId,
          fromAsset: fromAssetType,
          toAsset: toAssetType,
          amount: amountNum,
          slippage: slippageNum,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          jobId: `swap-execute-${transaction.id}`,
          removeOnComplete: true,
          removeOnFail: false,
        }
      );

      logger.info('Swap execution job queued', { transactionId: transaction.id });

      return res.send(
        super.response(super._201, {
          transactionId: transaction.id,
          status: 'pending',
          fromAsset: fromAssetType,
          toAsset: toAssetType,
          fromAmount: amountNum,
          estimatedToAmount,
          estimatedCompletionTime: '2-5 minutes',
        })
      );
    } catch (error) {
      logger.error('Failed to execute swap', error as Error);
      return res.send(super.response(super._500, null, super.ex(error)));
    }
  }

  /**
   * GET /api/swap/status/:transactionId
   *
   * Check swap status
   */
  public static async getSwapStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.send(super.response(super._401, null, ['Not authenticated']));
      }

      const { transactionId } = req.params;

      if (!transactionId) {
        return res.send(super.response(super._400, null, ['Transaction ID is required']));
      }

      const swapRepo = new SwapRepository();
      const transaction = await swapRepo.getById(transactionId);

      if (!transaction) {
        return res.send(super.response(super._404, null, ['Transaction not found']));
      }

      // Verify transaction belongs to user
      if (transaction.userId !== userId) {
        return res.send(super.response(super._403, null, ['Access denied']));
      }

      logger.info('Swap status retrieved', {
        transactionId,
        status: transaction.status,
      });

      return res.send(
        super.response(super._200, {
          transactionId: transaction.id,
          status: transaction.status,
          type: transaction.type,
          fromAsset: transaction.sourceAsset,
          toAsset: transaction.destinationAsset,
          fromAmount: transaction.sourceAmount,
          toAmount: transaction.destinationAmount,
          txHash: transaction.txHash,
          chain: transaction.chain,
          createdAt: transaction.createdAt,
          completedAt: transaction.completedAt,
          failedAt: transaction.failedAt,
          failureReason: transaction.failureReason,
          metadata: transaction.metadata,
        })
      );
    } catch (error) {
      logger.error('Failed to get swap status', error as Error);
      return res.send(super.response(super._500, null, super.ex(error)));
    }
  }

  /**
   * GET /api/swap/history
   *
   * Get user's swap history
   *
   * Query params:
   * - limit?: number (default 20, max 100)
   */
  public static async getSwapHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.send(super.response(super._401, null, ['Not authenticated']));
      }

      const { limit = 20 } = req.query;
      const limitNum = Math.min(Number(limit), 100);

      const swapRepo = new SwapRepository();
      const transactions = await swapRepo.getSwapHistory(userId, limitNum);

      logger.info('Swap history retrieved', {
        userId,
        count: transactions.length,
      });

      const swaps = transactions.map((tx) => ({
        transactionId: tx.id,
        type: tx.type,
        status: tx.status,
        fromAsset: tx.sourceAsset,
        toAsset: tx.destinationAsset,
        fromAmount: tx.sourceAmount,
        toAmount: tx.destinationAmount,
        valueUsd: tx.valueUsd,
        txHash: tx.txHash,
        createdAt: tx.createdAt,
        completedAt: tx.completedAt,
        failedAt: tx.failedAt,
        failureReason: tx.failureReason,
      }));

      return res.send(
        super.response(super._200, {
          swaps,
          count: swaps.length,
        })
      );
    } catch (error) {
      logger.error('Failed to get swap history', error as Error);
      return res.send(super.response(super._500, null, super.ex(error)));
    }
  }
}

export default SwapController;
