import { Job } from 'bull';
import { DepositSessionRepository } from '../../repositories/deposit-session.repo';
import { TransactionRepository } from '../../repositories/transaction.repo';
import { PortfolioRepository } from '../../repositories/portfolio.repo';
import { UserRepository } from '../../repositories/user.repo';
import { WalletRepository } from '../../repositories/wallet.repo';
import { createPublicClient, formatUnits, http, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';

/**
 * Job data structure for onchain deposit confirmation
 */
export interface OnchainDepositConfirmationJobData {
  depositSessionId: string;
  userId: string;
}

const BASE_RPC_URL = process.env.BASE_RPC_URL || '';
const BASE_USDC_ADDRESS = process.env.BASE_USDC_ADDRESS || '';
const DEPOSIT_CONFIRMATIONS_REQUIRED = Number(
  process.env.DEPOSIT_CONFIRMATIONS_REQUIRED || 2
);

// Viem public client for blockchain queries
const baseClient = createPublicClient({
  chain: baseSepolia,
  transport: http(BASE_RPC_URL),
});

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

  job.log(`Checking blockchain for deposit session ${depositSessionId}`);

  const sessionRepo = new DepositSessionRepository();
  const txRepo = new TransactionRepository();
  const portfolioRepo = new PortfolioRepository();
  const userRepo = new UserRepository();
  const walletRepo = new WalletRepository();

  // Step 1: Get deposit session
  const session = await sessionRepo.getById(depositSessionId);

  if (!session) {
    throw new Error(`Deposit session ${depositSessionId} not found`);
  }

  if (session.userId !== userId) {
    throw new Error('User ID mismatch');
  }

  job.log(`Session status: ${session.status}`);

  // Idempotency check - if already confirmed, we're done
  if (session.status === 'CONFIRMED') {
    job.log('Session already confirmed, skipping');
    return;
  }

  // Check if session expired
  if (new Date() > new Date(session.expiresAt)) {
    job.log('Session expired, marking as EXPIRED');
    await sessionRepo.updateStatus(session.id, 'EXPIRED');
    return; // Don't retry - session is expired
  }

  // Step 2: Scan blockchain for Transfer events
  const latestBlock = Number(await baseClient.getBlockNumber());
  const fromBlock = Number.isFinite(Number(session.createdAtBlockNumber))
    ? BigInt(session.createdAtBlockNumber)
    : BigInt(Math.max(latestBlock - 5000, 0));

  job.log(
    `Scanning blocks ${fromBlock} to ${latestBlock} for USDC transfers`
  );

  const logs = await baseClient.getLogs({
    address: (session.tokenAddress || BASE_USDC_ADDRESS) as `0x${string}`,
    event: TRANSFER_EVENT,
    args: {
      to: session.walletAddress as `0x${string}`,
    },
    fromBlock,
    toBlock: BigInt(latestBlock),
  });

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
    job.log('No matching transfer found yet, will retry later');
    throw new Error('No matching transfer found'); // Job will retry
  }

  const confirmations = latestBlock - matched.blockNumber + 1;
  job.log(`Transaction has ${confirmations} confirmations`);

  // Step 4: Bind event to session
  await sessionRepo.bindOnchainEvent(session.id, {
    txHash: matched.txHash,
    logIndex: matched.logIndex,
    fromAddress: matched.from,
    amount: matched.amount,
    blockNumber: matched.blockNumber,
  });

  // Wait for required confirmations
  if (confirmations < DEPOSIT_CONFIRMATIONS_REQUIRED) {
    job.log(
      `Waiting for ${DEPOSIT_CONFIRMATIONS_REQUIRED - confirmations} more confirmations`
    );
    await sessionRepo.updateStatus(session.id, 'RECEIVED');
    throw new Error('Waiting for confirmations'); // Job will retry
  }

  job.log('Required confirmations reached, crediting portfolio');

  // Step 5: Mark event as processed (idempotency)
  await sessionRepo.markEventProcessed({
    chain: 'base',
    txHash: matched.txHash,
    logIndex: matched.logIndex,
  });

  // Step 6: Credit portfolio
  const user = await userRepo.getById(userId);
  const wallet = await walletRepo.getByUserId(userId);
  const portfolio = await portfolioRepo.getByUserId(userId);

  if (!user || !wallet || !portfolio) {
    throw new Error('User, wallet or portfolio not found');
  }

  const allocation = {
    stableYields: user.targetStableYieldsPercent || 80,
    tokenizedStocks: user.targetTokenizedStocksPercent || 15,
    tokenizedGold: user.targetTokenizedGoldPercent || 5,
  };

  job.log(`Allocation: ${JSON.stringify(allocation)}`);

  // Create transaction record
  const transaction = await txRepo.createOnchainDeposit({
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

  job.log(`Created transaction record: ${transaction.id}`);

  // Update portfolio
  await portfolioRepo.updateValues(userId, {
    stableYieldsValueUsd: matched.amount * ((allocation.stableYields || 0) / 100),
    tokenizedStocksValueUsd:
      matched.amount * ((allocation.tokenizedStocks || 0) / 100),
    tokenizedGoldValueUsd:
      matched.amount * ((allocation.tokenizedGold || 0) / 100),
    kesUsdRate: 0,
  });

  await portfolioRepo.recordDeposit(userId, matched.amount);
  await portfolioRepo.calculateReturns(userId);

  // Update wallet balances
  await walletRepo.updateBalances(userId, {
    stableYieldBalance: matched.amount * ((allocation.stableYields || 0) / 100),
    tokenizedStocksBalance:
      matched.amount * ((allocation.tokenizedStocks || 0) / 100),
    tokenizedGoldBalance:
      matched.amount * ((allocation.tokenizedGold || 0) / 100),
  });

  // Mark session as confirmed
  await sessionRepo.updateStatus(session.id, 'CONFIRMED');

  job.log(`✅ Deposit confirmed and credited: ${matched.amount} USDC`);
}
