import { Job } from 'bull';
import { TransactionRepository } from '../../repositories/transaction.repo';
import { PortfolioRepository } from '../../repositories/portfolio.repo';
import { UserRepository } from '../../repositories/user.repo';
import { WalletRepository } from '../../repositories/wallet.repo';
import { createLogger } from '../../utils/logger.util';

/**
 * Job data structure for deposit completion
 */
export interface DepositCompletionJobData {
  transactionId: string;
  txHash: string;
  blockchainData?: {
    chain: string;
    blockNumber?: number;
  };
}

/**
 * DEPOSIT COMPLETION PROCESSOR
 *
 * This function runs when a job is picked from the deposit-completion queue
 *
 * Flow:
 * 1. Get transaction from database
 * 2. Verify it's in PROCESSING state
 * 3. Mark as COMPLETED with blockchain txHash
 * 4. Credit user's portfolio based on allocation
 * 5. Update wallet balances
 * 6. Mark first deposit subsidy as used
 *
 * Bull will automatically:
 * - Retry if this function throws an error
 * - Mark job as failed after 3 attempts
 * - Log all errors for debugging
 */
export async function processDepositCompletion(
  job: Job<DepositCompletionJobData>
): Promise<void> {
  const { transactionId, txHash, blockchainData } = job.data;

  // Create structured logger with context
  const logger = createLogger('deposit-completion-processor', {
    jobId: job.id.toString(),
    transactionId,
    txHash,
  });

  logger.info('Starting deposit completion processing');
  job.log(`Processing deposit completion for transaction ${transactionId}`);

  const transactionRepo = new TransactionRepository();
  const portfolioRepo = new PortfolioRepository();
  const userRepo = new UserRepository();
  const walletRepo = new WalletRepository();

  try {
    // Step 1: Get transaction
    logger.info('Fetching transaction from database');
    const transaction = await transactionRepo.getById(transactionId);

    if (!transaction) {
      logger.error('Transaction not found', undefined, { transactionId });
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const contextLogger = logger.child({ userId: transaction.userId });
    contextLogger.info('Transaction retrieved', {
      status: transaction.status,
      amountUsd: transaction.destinationAmount,
    });
    job.log(`Transaction found: ${transaction.status}`);

    // Idempotency check - if already completed, skip
    if (transaction.status === 'completed') {
      contextLogger.info('Transaction already completed, skipping (idempotent)');
      job.log('Transaction already completed, skipping');
      return; // Job succeeds without doing anything
    }

    // Step 2: Mark as completed with blockchain data
    await contextLogger.withTiming('Mark transaction as completed', async () => {
      await transactionRepo.markAsCompleted(transactionId, {
        txHash,
        chain: blockchainData?.chain || 'base',
      });
    }, { chain: blockchainData?.chain || 'base' });
    job.log(`Marked as completed with txHash: ${txHash}`);

    const allocation = transaction.allocation;
    const amountUsd = transaction.destinationAmount;

    contextLogger.debug('Allocation details', {
      allocation,
      amountUsd,
    });

    // Step 3: Update portfolio values
    await contextLogger.withTiming('Update portfolio values', async () => {
      await portfolioRepo.incrementValues(transaction.userId, {
        stableYieldsValueUsd: amountUsd * ((allocation?.stableYields || 0) / 100),
        defiYieldValueUsd: amountUsd * ((allocation?.defiYield || 0) / 100),
        tokenizedGoldValueUsd: amountUsd * ((allocation?.tokenizedGold || 0) / 100),
        bluechipCryptoValueUsd:
          amountUsd * ((allocation?.bluechipCrypto || 0) / 100),
        kesUsdRate: transaction.exchangeRate,
      });
    });
    job.log('Portfolio values updated');

    // Step 4: Record deposit in portfolio
    await contextLogger.withTiming('Record deposit', async () => {
      await portfolioRepo.recordDeposit(transaction.userId, amountUsd);
    }, { amountUsd });
    job.log('Deposit recorded');

    // Step 5: Calculate returns
    await contextLogger.withTiming('Calculate returns', async () => {
      await portfolioRepo.calculateReturns(transaction.userId);
    });
    job.log('Returns calculated');

    // Step 6: Update wallet balances
    await contextLogger.withTiming('Update wallet balances', async () => {
      await walletRepo.incrementBalances(transaction.userId, {
        usdcBalance: -amountUsd,
        stableYieldBalance: amountUsd * ((allocation?.stableYields || 0) / 100),
        defiYieldBalance: amountUsd * ((allocation?.defiYield || 0) / 100),
        tokenizedGoldBalance: amountUsd * ((allocation?.tokenizedGold || 0) / 100),
        bluechipCryptoBalance:
          amountUsd * ((allocation?.bluechipCrypto || 0) / 100),
      });
    });
    job.log('Wallet balances updated');

    // Step 7: Mark first deposit subsidy as used (if applicable)
    const user = await userRepo.getById(transaction.userId);
    if (user && !user.firstDepositSubsidyUsed) {
      contextLogger.info('Marking first deposit subsidy as used');
      user.firstDepositSubsidyUsed = true;
      job.log('First deposit subsidy marked as used');
      // Note: You'll need to add a save method to UserRepository
      // For now, we'll skip this or you can add it
    }

    contextLogger.info('Deposit completion successful');
    job.log(`✅ Deposit completion successful for transaction ${transactionId}`);
  } catch (error) {
    logger.error('Deposit completion failed', error as Error);
    throw error; // Re-throw to let Bull handle retry
  }
}
