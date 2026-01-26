/**
 * SWAP EXECUTION PROCESSOR
 *
 * Executes swap by placing order with 1inch Fusion API
 *
 * Flow:
 * 1. Get swap transaction from database
 * 2. Idempotency check (skip if already processing/completed)
 * 3. Get user's wallet address
 * 4. Place order with 1inch (with 3-attempt retry: 1%, 2%, 3% slippage)
 * 5. Save order hash to transaction metadata
 * 6. Queue SWAP_CONFIRMATION_QUEUE job to poll order status
 *
 * This processor is called by Bull when a swap-execution job is picked from the queue.
 * It runs asynchronously in the background, allowing the API to return immediately.
 */

import { Job } from 'bull';
import { SwapRepository } from '../../repositories/swap.repo';
import { WalletRepository } from '../../repositories/wallet.repo';
import { swapProvider } from '../../services/swap-provider.factory';
import { getTokenAddress, AssetType as TokenAssetType, toWei } from '../../configs/tokens.config';
import { createLogger } from '../../utils/logger.util';
import { TransactionStatus } from '../../enums/Transaction';

import { SWAP_CONFIRMATION_QUEUE } from '../../configs/queue.config';

/**
 * Job data structure for swap execution
 */
export interface SwapExecutionJobData {
  transactionId: string;
  userId: string;
  fromAsset: TokenAssetType;
  toAsset: TokenAssetType;
  amount: number;
  slippage?: number; // Default 1%
}

/**
 * Process swap execution job
 */
export async function processSwapExecution(
  job: Job<SwapExecutionJobData>
): Promise<void> {
  const { transactionId, userId, fromAsset, toAsset, amount, slippage = 1.0 } = job.data;

  // Create structured logger with context
  const logger = createLogger('swap-execution-processor', {
    jobId: job.id.toString(),
    transactionId,
    userId,
  });

  logger.info('Starting swap execution processing');
  job.log(`Processing swap execution for transaction ${transactionId}`);

  const swapRepo = new SwapRepository();
  const walletRepo = new WalletRepository();

  try {
    // Step 1: Get transaction from database
    logger.info('Fetching swap transaction from database');
    const transaction = await swapRepo.getById(transactionId);

    if (!transaction) {
      logger.error('Transaction not found', undefined, { transactionId });
      throw new Error(`Transaction ${transactionId} not found`);
    }

    logger.info('Transaction retrieved', {
      status: transaction.status,
      fromAsset: transaction.sourceAsset,
      toAsset: transaction.destinationAsset,
      amount: transaction.sourceAmount,
    });
    job.log(`Transaction status: ${transaction.status}`);

    // Step 2: Idempotency check
    if (transaction.status === TransactionStatus.COMPLETED) {
      logger.info('Swap already completed, skipping (idempotent)');
      job.log('Swap already completed, skipping');
      return;
    }

    if (transaction.status === TransactionStatus.PROCESSING) {
      logger.info('Swap already processing (order already placed)');
      job.log('Swap already processing, skipping order placement');
      // If orderHash exists, queue confirmation job
      if (transaction.metadata?.orderHash) {
        logger.info('Order hash found, queueing confirmation job', {
          orderHash: transaction.metadata.orderHash,
        });
        await SWAP_CONFIRMATION_QUEUE.add(
          { transactionId, orderHash: transaction.metadata.orderHash },
          {
            repeat: { every: 30000, limit: 60 },
            jobId: `swap-confirm-${transactionId}`,
            removeOnComplete: true
          }
        );
      }
      return;
    }

    // Step 3: Get user's wallet address and Privy wallet ID
    logger.info('Fetching user wallet');
    const wallet = await walletRepo.getByUserId(userId);

    if (!wallet || !wallet.address) {
      logger.error('Wallet not found', undefined, { userId });
      throw new Error(`Wallet not found for user ${userId}`);
    }

    if (!wallet.privyUserId) {
      logger.error('Privy wallet ID not found', undefined, { userId, walletId: wallet.id });
      throw new Error(`Privy wallet ID not found for user ${userId}`);
    }

    logger.info('Wallet retrieved', {
      walletAddress: wallet.address.substring(0, 10) + '...',
      privyWalletId: wallet.privyUserId,
    });
    job.log(`User wallet: ${wallet.address.substring(0, 10)}... (Privy: ${wallet.privyUserId})`);

    // Step 4: Get token addresses
    const network = process.env.ONEINCH_NETWORK || 'ethereum';
    const fromTokenAddress = getTokenAddress(fromAsset, network);
    const toTokenAddress = getTokenAddress(toAsset, network);
    const amountWei = toWei(amount, fromAsset);

    logger.info('Executing swap via swap provider', {
      fromToken: fromTokenAddress.substring(0, 10) + '...',
      toToken: toTokenAddress.substring(0, 10) + '...',
      amountWei,
      userAddress: wallet.address.substring(0, 10) + '...',
      provider: swapProvider.getProviderName(),
    });
    job.log('Executing swap via swap provider');

    // Step 5: Execute swap via provider with Privy wallet
    const swapResult = await logger.withTiming('Execute swap', async () => {
      return await swapProvider.executeSwap({
        fromToken: fromTokenAddress,
        toToken: toTokenAddress,
        amount: amountWei,
        userAddress: wallet.address,
        privyWalletId: wallet.privyUserId,
      });
    });

    logger.info('Swap executed successfully', {
      orderId: swapResult.orderId,
      provider: swapResult.provider,
      status: swapResult.status,
    });
    job.log(`✅ Swap executed: ${swapResult.orderId.substring(0, 10)}... (${swapResult.provider})`);

    // Step 6: Save order ID to transaction metadata
    logger.info('Saving order ID to transaction metadata');
    await swapRepo.updateSwapMetadata(transactionId, {
      orderHash: swapResult.orderId,
      provider: swapResult.provider,
      orderStatus: swapResult.status,
      orderPlacedAt: new Date().toISOString(),
    });

    // Mark transaction as PROCESSING
    await swapRepo.updateSwapStatus({
      orderHash: swapResult.orderId,
      status: TransactionStatus.PROCESSING,
    });

    logger.info('Transaction marked as PROCESSING');
    job.log('Transaction status updated to PROCESSING');

    // Step 7: Queue confirmation job (polls order status)
    logger.info('Queueing swap confirmation job');
    await SWAP_CONFIRMATION_QUEUE.add(
      {
        transactionId,
        orderHash: swapResult.orderId,
      },
      {
        repeat: {
          every: 30000, // Poll every 30 seconds
          limit: 60, // Max 60 attempts (30 minutes total)
        },
        attempts: 3, // Retry each poll attempt 3 times if it fails
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        jobId: `swap-confirm-${transactionId}`, // Prevents duplicate jobs
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    logger.info('Swap confirmation job queued', {
      orderId: swapResult.orderId,
      jobId: `swap-confirm-${transactionId}`,
    });
    job.log('Queued confirmation job to poll order status');

    logger.info('Swap execution complete', {
      transactionId,
      orderId: swapResult.orderId,
      provider: swapResult.provider,
    });
    job.log(`✅ Swap execution complete. Confirmation job will poll order status.`);
  } catch (error) {
    logger.error('Swap execution failed', error as Error);
    job.log(`❌ Swap execution failed: ${(error as Error).message}`);

    // Mark transaction as failed
    try {
      await swapRepo.markAsFailed(transactionId, (error as Error).message);
      logger.info('Transaction marked as FAILED');
    } catch (updateError) {
      logger.error('Failed to mark transaction as failed', updateError as Error);
    }

    throw error; // Re-throw to let Bull handle retry
  }
}
