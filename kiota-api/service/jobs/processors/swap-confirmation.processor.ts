/**
 * SWAP CONFIRMATION PROCESSOR
 *
 * Polls 1inch order status and performs atomic balance updates on completion
 *
 * Flow:
 * 1. Get swap transaction from database
 * 2. Idempotency check (skip if already completed)
 * 3. Poll 1inch order status
 * 4. Handle status:
 *    - filled: Update balances atomically, mark transaction as COMPLETED
 *    - failed: Mark transaction as FAILED, notify user
 *    - pending/partial: Continue polling (job will retry)
 *
 * This processor is called repeatedly (every 30s) by Bull until:
 * - Order is filled (success - remove from queue)
 * - Order fails (failure - remove from queue)
 * - Max attempts reached (timeout - remove from queue)
 */

import { Job } from 'bull';
import { SwapRepository } from '../../repositories/swap.repo';
import { swapProvider } from '../../services/swap-provider.factory';
import { fromWei, getAssetCategory, AssetType as TokenAssetType } from '../../configs/tokens.config';
import { createLogger } from '../../utils/logger.util';
import { TransactionStatus } from '../../enums/Transaction';

import { balanceUpdaterService } from '../../services/balance-updater.service';

/**
 * Job data structure for swap confirmation
 */
export interface SwapConfirmationJobData {
  transactionId: string;
  orderHash: string;
}

/**
 * Process swap confirmation job
 */
export async function processSwapConfirmation(
  job: Job<SwapConfirmationJobData>
): Promise<void> {
  const { transactionId, orderHash } = job.data;

  // Create structured logger with context
  const logger = createLogger('swap-confirmation-processor', {
    jobId: job.id.toString(),
    transactionId,
    orderHash,
  });

  logger.info('Starting swap confirmation polling');
  job.log(`Checking order status for ${orderHash.substring(0, 10)}...`);

  const swapRepo = new SwapRepository();

  try {
    // Step 1: Get transaction from database
    logger.info('Fetching swap transaction from database');
    const transaction = await swapRepo.getSwapByOrderHash(orderHash);

    if (!transaction) {
      logger.error('Transaction not found for order hash', undefined, { orderHash });
      throw new Error(`Transaction not found for order hash ${orderHash}`);
    }

    const contextLogger = logger.child({
      userId: transaction.userId,
      fromAsset: transaction.sourceAsset,
      toAsset: transaction.destinationAsset,
    });

    contextLogger.info('Transaction retrieved', {
      status: transaction.status,
      transactionId: transaction.id,
    });
    job.log(`Transaction status: ${transaction.status}`);

    // Step 2: Idempotency check
    if (transaction.status === TransactionStatus.COMPLETED) {
      contextLogger.info('Swap already confirmed, skipping (idempotent)');
      job.log('Swap already confirmed, removing from queue');
      return; // Remove from queue
    }

    if (transaction.status === TransactionStatus.FAILED) {
      contextLogger.info('Swap already marked as failed, skipping');
      job.log('Swap already failed, removing from queue');
      return; // Remove from queue
    }

    // Step 3: Poll order status
    contextLogger.info('Polling order status');
    const orderStatus = await contextLogger.withTiming('Poll order status', async () => {
      return await swapProvider.getSwapStatus(orderHash);
    });

    contextLogger.info('Order status retrieved', {
      status: orderStatus.status,
      txHash: orderStatus.txHash,
    });
    job.log(`Order status: ${orderStatus.status}`);

    // Step 4: Handle status
    if (orderStatus.status === 'completed') {
      contextLogger.info('Swap filled, proceeding to credit balances');
      job.log('✅ Order filled! Updating balances...');

      // Calculate actual output amount
      const actualToAmountStr = orderStatus.actualOutput
        ? orderStatus.actualOutput
        : transaction.destinationAmount;
      const actualToAmount = Number(actualToAmountStr);

      contextLogger.info('Calculated actual output', {
        estimatedAmount: transaction.destinationAmount,
        actualAmount: actualToAmount,
      });

      // ATOMIC BALANCE UPDATE
      contextLogger.info('Performing atomic balance update');
      await contextLogger.withTiming('Update balances atomically', async () => {
        await balanceUpdaterService.updateAfterSwap({
          userId: transaction.userId,
          fromAsset: transaction.sourceAsset as unknown as TokenAssetType,
          toAsset: transaction.destinationAsset as unknown as TokenAssetType,
          fromAmount: Number(transaction.sourceAmount),
          toAmount: actualToAmount,
          transactionId: transaction.id,
        });
      });
      contextLogger.info('Balance update complete');
      job.log('Balances updated successfully');

      // Update transaction status to COMPLETED
      await contextLogger.withTiming('Mark transaction as completed', async () => {
        await swapRepo.updateSwapStatus({
          orderHash,
          status: TransactionStatus.COMPLETED,
          actualToAmount: actualToAmount,
          txHash: orderStatus.txHash,
        });
      });

      contextLogger.info('Swap confirmation complete', {
        transactionId: transaction.id,
        actualToAmount,
        txHash: orderStatus.txHash,
      });
      job.log(`✅ Swap completed: ${actualToAmount} ${transaction.destinationAsset}`);

      return; // Remove from queue - success!
    } else if (orderStatus.status === 'failed') {
      contextLogger.error('Swap failed on 1inch', new Error(orderStatus.reason || 'Unknown reason'));
      job.log(`❌ Order failed: ${orderStatus.reason || 'Unknown reason'}`);

      // Mark transaction as FAILED
      await swapRepo.updateSwapStatus({
        orderHash,
        status: TransactionStatus.FAILED,
        failureReason: orderStatus.reason || '1inch order failed',
      });

      // TODO: Notify user via notification service
      /*
      await notificationService.notifySwapFailed(
        transaction.userId,
        transaction.id,
        orderStatus.reason || 'Swap failed on 1inch'
      );
      */

      contextLogger.info('Transaction marked as FAILED');
      return; // Remove from queue - failure handled
    } else {
      // Status is 'pending' or 'processing' - continue polling
      contextLogger.info('Swap still pending, will retry later', {
        status: orderStatus.status,
        fills: orderStatus.fills?.length || 0,
      });
      job.log(`Swap pending (${orderStatus.status}), will check again in 30s`);

      // Update metadata with latest status
      await swapRepo.updateSwapMetadata(transaction.id, {
        lastPolledAt: new Date().toISOString(),
        orderStatus: orderStatus.status,
        fills: orderStatus.fills,
      });

      // Throw to trigger retry (job will be picked up again in 30s)
      throw new Error('Swap still pending');
    }
  } catch (error) {
    logger.error('Swap confirmation check failed', error as Error);
    job.log(`⚠️ Status check failed: ${(error as Error).message}`);

    // If error is "Swap still pending", let it retry
    if ((error as Error).message === 'Swap still pending') {
      throw error; // Job will retry in 30s
    }

    // For other errors (network issues, API errors), also retry
    // Bull will handle retry logic with exponential backoff
    throw error;
  }
}
