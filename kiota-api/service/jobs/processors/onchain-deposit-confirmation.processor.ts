import { Job } from 'bull';
import { DepositSessionRepository } from '../../repositories/deposit-session.repo';
import { TransactionRepository } from '../../repositories/transaction.repo';
import { PortfolioRepository } from '../../repositories/portfolio.repo';
import { UserRepository } from '../../repositories/user.repo';
import { WalletRepository } from '../../repositories/wallet.repo';
import { formatUnits, parseAbiItem } from 'viem';
import { createLogger } from '../../utils/logger.util';
import { ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE } from '../../configs/queue.config';
import {
  createChainClient,
  getUsdcAddress,
  getRequiredConfirmations,
  getCurrentNetwork,
} from '../../configs/chain.config';

/**
 * Job data structure for onchain deposit confirmation
 */
export interface OnchainDepositConfirmationJobData {
  depositSessionId: string;
  userId: string;
}

// Use chain config for network-aware settings
const baseClient = createChainClient();
const BASE_USDC_ADDRESS = getUsdcAddress();
const DEPOSIT_CONFIRMATIONS_REQUIRED = getRequiredConfirmations();

// USDC Transfer event ABI
const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)'
);

/**
 * ONCHAIN DEPOSIT CONFIRMATION PROCESSOR
 *
 * This function scans the blockchain for USDC Transfer events
 * and confirms deposits when they meet requirements
 *
 * Flow:
 * 1. Get deposit session from database
 * 2. Scan blockchain for Transfer events to user's wallet
 * 3. Match events based on amount and time window
 * 4. Wait for required confirmations (2 blocks)
 * 5. Credit portfolio once confirmed
 *
 * This job is scheduled to run multiple times (every 30s)
 * until the deposit is confirmed or session expires
 */
export async function processOnchainDepositConfirmation(
  job: Job<OnchainDepositConfirmationJobData>
): Promise<void> {
  const { depositSessionId, userId } = job.data;

  // Create structured logger with context
  const logger = createLogger('onchain-deposit-confirmation-processor', {
    jobId: job.id.toString(),
    depositSessionId,
    userId,
  });

  logger.info('Starting blockchain scan for deposit confirmation');
  job.log(`Checking blockchain for deposit session ${depositSessionId}`);

  const sessionRepo = new DepositSessionRepository();
  const txRepo = new TransactionRepository();
  const portfolioRepo = new PortfolioRepository();
  const userRepo = new UserRepository();
  const walletRepo = new WalletRepository();

  const removeRepeatableJob = async (reason: string) => {
    const repeatKey = job.opts.repeat?.key;
    if (!repeatKey) return;

    try {
      await ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE.removeRepeatableByKey(repeatKey);
      job.log(`Removed repeatable job (${reason})`);
      logger.info('Repeatable job removed', { reason, repeatKey });
    } catch (error) {
      logger.warn('Failed to remove repeatable job', {
        reason,
        repeatKey,
        error: (error as Error).message,
      });
    }
  };

  try {
    // Step 1: Get deposit session
    logger.info('Fetching deposit session from database');
    const session = await sessionRepo.getById(depositSessionId);

    if (!session) {
      logger.error('Deposit session not found', undefined, { depositSessionId });
      throw new Error(`Deposit session ${depositSessionId} not found`);
    }

    if (session.userId !== userId) {
      logger.error('User ID mismatch', undefined, {
        sessionUserId: session.userId,
        jobUserId: userId,
      });
      throw new Error('User ID mismatch');
    }

    logger.info('Session retrieved', {
      status: session.status,
      walletAddress: session.walletAddress,
      expectedAmount: session.expectedAmount,
      expiresAt: session.expiresAt,
    });
    job.log(`Session status: ${session.status}`);

    // Idempotency check - if already confirmed, we're done
    if (session.status === 'CONFIRMED') {
      logger.info('Session already confirmed, skipping (idempotent)');
      job.log('Session already confirmed, skipping');
      await removeRepeatableJob('already-confirmed');
      return;
    }

    // Check if session expired
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    if (now > expiresAt) {
      logger.warn('Session expired, marking as EXPIRED', {
        now: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      });
      job.log('Session expired, marking as EXPIRED');
      await sessionRepo.updateStatus(session.id, 'EXPIRED');
      await removeRepeatableJob('expired');
      return; // Don't retry - session is expired
    }

    // Step 2: Scan blockchain for Transfer events
    logger.info('Fetching latest block number');
    const latestBlock = Number(await baseClient.getBlockNumber());
    const fromBlock = Number.isFinite(Number(session.createdAtBlockNumber))
      ? BigInt(session.createdAtBlockNumber)
      : BigInt(Math.max(latestBlock - 5000, 0));

    logger.info('Scanning blockchain for USDC Transfer events', {
      fromBlock: fromBlock.toString(),
      toBlock: latestBlock,
      tokenAddress: session.tokenAddress || BASE_USDC_ADDRESS,
      walletAddress: session.walletAddress,
    });
    job.log(
      `Scanning blocks ${fromBlock} to ${latestBlock} for USDC transfers`
    );

    const logs = await logger.withTiming('Fetch blockchain logs', async () => {
      return await baseClient.getLogs({
        address: (session.tokenAddress || BASE_USDC_ADDRESS) as `0x${string}`,
        event: TRANSFER_EVENT,
        args: {
          to: session.walletAddress as `0x${string}`,
        },
        fromBlock,
        toBlock: BigInt(latestBlock),
      });
    }, { fromBlock: fromBlock.toString(), toBlock: latestBlock });

    logger.info(`Found ${logs.length} Transfer events to scan`);
    job.log(`Found ${logs.length} Transfer events`);

  // Step 3: Find matching event
  const createdAtMs = new Date(session.createdAt).getTime();
  let matched: {
    txHash: string;
    logIndex: number;
    blockNumber: number;
    from: string;
    to: string;
    amount: number;
  } | null = null;

  for (const log of logs.slice().reverse()) {
    const block = await baseClient.getBlock({ blockNumber: log.blockNumber! });
    const blockMs = Number(block.timestamp) * 1000;

    // Skip events before session creation
    if (blockMs < createdAtMs) continue;

    const amount = Number(formatUnits(log.args.value!, 6)); // USDC has 6 decimals
    const from = (log.args.from || '').toLowerCase();
    const to = (log.args.to || '').toLowerCase();

    job.log(
      `Checking event: ${amount} USDC from ${from.substring(0, 8)}...`
    );

    // Check amount constraints
    if (
      session.minAmount != null &&
      amount < Number(session.minAmount)
    )
      continue;
    if (
      session.maxAmount != null &&
      amount > Number(session.maxAmount)
    )
      continue;

    // Check if already processed
    const alreadyProcessed = await sessionRepo.isEventProcessed({
      chain: 'base',
      txHash: log.transactionHash.toLowerCase(),
      logIndex: Number(log.logIndex),
    });

    if (alreadyProcessed) {
      job.log('Event already processed, skipping');
      continue;
    }

    matched = {
      txHash: log.transactionHash.toLowerCase(),
      logIndex: Number(log.logIndex),
      blockNumber: Number(log.blockNumber),
      from,
      to,
      amount,
    };

    job.log(`✅ Matched event: ${amount} USDC in tx ${matched.txHash}`);
    break;
  }

    // No matching transfer found yet
    if (!matched) {
      logger.info('No matching transfer found yet, will retry later');
      job.log('No matching transfer found yet, will retry later');
      throw new Error('No matching transfer found'); // Job will retry
    }

    const confirmations = latestBlock - matched.blockNumber + 1;
    logger.info('Matched transfer found', {
      txHash: matched.txHash,
      amount: matched.amount,
      confirmations,
      blockNumber: matched.blockNumber,
    });
    job.log(`Transaction has ${confirmations} confirmations`);

    // Step 4: Bind event to session
    logger.info('Binding blockchain event to deposit session');
    await sessionRepo.bindOnchainEvent(session.id, {
      txHash: matched.txHash,
      logIndex: matched.logIndex,
      fromAddress: matched.from,
      amount: matched.amount,
      blockNumber: matched.blockNumber,
    });

    // Wait for required confirmations
    if (confirmations < DEPOSIT_CONFIRMATIONS_REQUIRED) {
      const remaining = DEPOSIT_CONFIRMATIONS_REQUIRED - confirmations;
      logger.info(`Waiting for ${remaining} more confirmations`, {
        currentConfirmations: confirmations,
        requiredConfirmations: DEPOSIT_CONFIRMATIONS_REQUIRED,
      });
      job.log(
        `Waiting for ${remaining} more confirmations`
      );
      await sessionRepo.updateStatus(session.id, 'RECEIVED');
      throw new Error('Waiting for confirmations'); // Job will retry
    }

    logger.info('Required confirmations reached, proceeding to credit portfolio');
    job.log('Required confirmations reached, crediting portfolio');

    // Step 5: Mark event as processed (idempotency)
    logger.info('Marking event as processed for idempotency');
    await sessionRepo.markEventProcessed({
      chain: 'base',
      txHash: matched.txHash,
      logIndex: matched.logIndex,
    });

    // Step 6: Credit portfolio
    logger.info('Fetching user, wallet, and portfolio data');
    const user = await userRepo.getById(userId);
    const wallet = await walletRepo.getByUserId(userId);
    const portfolio = await portfolioRepo.getByUserId(userId);

    if (!user || !wallet || !portfolio) {
      logger.error('User, wallet, or portfolio not found', undefined, {
        userFound: !!user,
        walletFound: !!wallet,
        portfolioFound: !!portfolio,
      });
      throw new Error('User, wallet or portfolio not found');
    }

    const allocation = {
      stableYields: user.targetStableYieldsPercent || 80,
      defiYield: user.targetDefiYieldPercent || 0,
      tokenizedGold: user.targetTokenizedGoldPercent || 5,
      bluechipCrypto: user.targetBluechipCryptoPercent || 15,
    };

    logger.info('User allocation retrieved', { allocation });
    job.log(`Allocation: ${JSON.stringify(allocation)}`);

    // Create transaction record
    const transaction = await logger.withTiming('Create transaction record', async () => {
      return await txRepo.createOnchainDeposit({
        userId,
        chain: 'base',
        tokenSymbol: 'USDC',
        tokenAddress: session.tokenAddress || BASE_USDC_ADDRESS,
        walletAddress: wallet.address,
        amountUsd: matched.amount,
        txHash: matched.txHash,
        logIndex: matched.logIndex,
        allocation,
      });
    });

    logger.info('Transaction record created', { transactionId: transaction.id });
    job.log(`Created transaction record: ${transaction.id}`);

    // Treat deposit as cash until user confirms conversion
    await logger.withTiming('Update wallet balance', async () => {
      await walletRepo.incrementBalances(userId, {
        usdcBalance: matched.amount,
      });
    });

    await logger.withTiming('Record deposit', async () => {
      await portfolioRepo.recordDeposit(userId, matched.amount);
    }, { amountUsd: matched.amount });

    // Mark session as confirmed
    await sessionRepo.updateStatus(session.id, 'CONFIRMED');
    await removeRepeatableJob('confirmed');

    logger.info('Deposit confirmation complete', {
      amountUsd: matched.amount,
      txHash: matched.txHash,
      transactionId: transaction.id,
    });
    job.log(`✅ Deposit confirmed and credited: ${matched.amount} USDC`);
  } catch (error) {
    logger.error('Onchain deposit confirmation failed', error as Error);
    throw error; // Re-throw to let Bull handle retry
  }
}
