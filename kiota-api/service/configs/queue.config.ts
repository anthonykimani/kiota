import Queue from 'bull';
import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

/**
 * Redis connection configuration
 *
 * REDIS_URL format: redis://[username]:[password]@[host]:[port]
 *
 * For local development: redis://localhost:6379
 * For production (e.g., Render, Railway): redis://:password@host:port
 */
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Bull queue options
 * These settings ensure reliability and performance
 */
const queueOptions: Queue.QueueOptions = {
  redis: REDIS_URL,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential', // Wait longer between each retry (1s, 2s, 4s)
      delay: 2000, // Start with 2 second delay
    },
    removeOnComplete: 100, // Keep last 100 completed jobs for debugging
    removeOnFail: 500, // Keep last 500 failed jobs for analysis
  },
};

/**
 * DEPOSIT_COMPLETION_QUEUE
 *
 * Processes M-Pesa deposits that need blockchain confirmation
 *
 * Flow:
 * 1. M-Pesa callback marks transaction as PROCESSING
 * 2. Job added to this queue with transaction ID
 * 3. Worker picks up job and calls completeDeposit
 * 4. If blockchain RPC fails, job retries automatically
 */
export const DEPOSIT_COMPLETION_QUEUE = new Queue(
  'deposit-completion',
  queueOptions
);

/**
 * ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE
 *
 * Scans blockchain for USDC deposits and confirms them
 *
 * Flow:
 * 1. User creates deposit intent (session)
 * 2. User sends USDC to their wallet address
 * 3. Job added to queue to scan blockchain every 30s
 * 4. Once confirmed, credits portfolio
 */
export const ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE = new Queue(
  'onchain-deposit-confirmation',
  queueOptions
);

/**
 * SWAP_EXECUTION_QUEUE
 *
 * Executes swaps by placing orders with 1inch Fusion API
 *
 * Flow:
 * 1. User initiates swap via API or deposit conversion
 * 2. Job added to queue with swap details
 * 3. Worker picks up job and places order with 1inch
 * 4. Order hash saved to transaction metadata
 * 5. Confirmation job queued to poll order status
 */
export const SWAP_EXECUTION_QUEUE = new Queue('swap-execution', queueOptions);

/**
 * SWAP_CONFIRMATION_QUEUE
 *
 * Polls 1inch order status and confirms swaps
 *
 * Flow:
 * 1. Swap order placed with 1inch
 * 2. Job added to queue to poll order status every 30s
 * 3. Once order filled, credits balances atomically
 * 4. If order fails, marks transaction as failed
 */
export const SWAP_CONFIRMATION_QUEUE = new Queue('swap-confirmation', queueOptions);

/**
 * Health check for queue system
 * Call this on app startup to ensure Redis is connected
 */
export async function checkQueueHealth(): Promise<boolean> {
  try {
    await DEPOSIT_COMPLETION_QUEUE.isReady();
    await ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE.isReady();
    await SWAP_EXECUTION_QUEUE.isReady();
    await SWAP_CONFIRMATION_QUEUE.isReady();
    console.log('✅ Queue system connected to Redis');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    return false;
  }
}

/**
 * Graceful shutdown
 * Close all queue connections when app shuts down
 */
export async function closeQueues(): Promise<void> {
  await DEPOSIT_COMPLETION_QUEUE.close();
  await ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE.close();
  await SWAP_EXECUTION_QUEUE.close();
  await SWAP_CONFIRMATION_QUEUE.close();
  console.log('🔌 Queue connections closed');
}
