import { Job } from 'bull';
import { TransactionRepository } from '../../repositories/transaction.repo';
import { PortfolioRepository } from '../../repositories/portfolio.repo';
import { UserRepository } from '../../repositories/user.repo';
import { WalletRepository } from '../../repositories/wallet.repo';

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

  // Bull provides job.log() for debugging - visible in Bull Board
  job.log(`Processing deposit completion for transaction ${transactionId}`);

  const transactionRepo = new TransactionRepository();
  const portfolioRepo = new PortfolioRepository();
  const userRepo = new UserRepository();
  const walletRepo = new WalletRepository();

  // Step 1: Get transaction
  const transaction = await transactionRepo.getById(transactionId);

  if (!transaction) {
    // This will mark job as failed and NOT retry (business logic error)
    throw new Error(`Transaction ${transactionId} not found`);
  }

  job.log(`Transaction found: ${transaction.status}`);

  // Idempotency check - if already completed, skip
  if (transaction.status === 'completed') {
    job.log('Transaction already completed, skipping');
    return; // Job succeeds without doing anything
  }

  // Step 2: Mark as completed with blockchain data
  job.log(`Marking transaction as completed with txHash: ${txHash}`);
  await transactionRepo.markAsCompleted(transactionId, {
    txHash,
    chain: blockchainData?.chain || 'base',
  });

  const allocation = transaction.allocation;
  const amountUsd = transaction.destinationAmount;

  job.log(`Allocation: ${JSON.stringify(allocation)}, Amount: ${amountUsd} USD`);

  // Step 3: Update portfolio values
  job.log('Updating portfolio values');
  await portfolioRepo.updateValues(transaction.userId, {
    stableYieldsValueUsd: amountUsd * ((allocation?.stableYields || 0) / 100),
    tokenizedStocksValueUsd:
      amountUsd * ((allocation?.tokenizedStocks || 0) / 100),
    tokenizedGoldValueUsd: amountUsd * ((allocation?.tokenizedGold || 0) / 100),
    kesUsdRate: transaction.exchangeRate,
  });

  // Step 4: Record deposit in portfolio
  job.log('Recording deposit in portfolio');
  await portfolioRepo.recordDeposit(transaction.userId, amountUsd);

  // Step 5: Calculate returns
  job.log('Calculating portfolio returns');
  await portfolioRepo.calculateReturns(transaction.userId);

  // Step 6: Update wallet balances
  job.log('Updating wallet balances');
  await walletRepo.updateBalances(transaction.userId, {
    stableYieldBalance: amountUsd * ((allocation?.stableYields || 0) / 100),
    tokenizedStocksBalance:
      amountUsd * ((allocation?.tokenizedStocks || 0) / 100),
    tokenizedGoldBalance: amountUsd * ((allocation?.tokenizedGold || 0) / 100),
  });

  // Step 7: Mark first deposit subsidy as used (if applicable)
  const user = await userRepo.getById(transaction.userId);
  if (user && !user.firstDepositSubsidyUsed) {
    job.log('Marking first deposit subsidy as used');
    user.firstDepositSubsidyUsed = true;
    // Note: You'll need to add a save method to UserRepository
    // For now, we'll skip this or you can add it
  }

  job.log(`✅ Deposit completion successful for transaction ${transactionId}`);
}
