import dotenv from 'dotenv';
import AppDataSource from '../configs/ormconfig';
import {
  DEPOSIT_COMPLETION_QUEUE,
  ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE,
  SWAP_EXECUTION_QUEUE,
  SWAP_CONFIRMATION_QUEUE,
  checkQueueHealth,
  closeQueues,
} from '../configs/queue.config';
import { processDepositCompletion } from './processors/deposit-completion.processor';
import { processOnchainDepositConfirmation } from './processors/onchain-deposit-confirmation.processor';
import { processSwapExecution } from './processors/swap-execution.processor';
import { processSwapConfirmation } from './processors/swap-confirmation.processor';
import { monitoringService } from '../services/monitoring.service';

// Load environment variables
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

/**
 * WORKER PROCESS
 *
 * This is a separate Node.js process that:
 * 1. Connects to Redis
 * 2. Connects to Database
 * 3. Listens for jobs in queues
 * 4. Processes jobs using the processor functions
 * 5. Handles retries automatically
 *
 * How to run:
 * - Development: npm run worker
 * - Production: pm2 start worker.js --name kiota-worker
 *
 * You can run multiple workers for high availability:
 * - pm2 start worker.js -i 4 (runs 4 worker instances)
 */

async function startWorker() {
  console.log('═'.repeat(50));
  console.log('🔧 Starting Kiota Worker Process');
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('═'.repeat(50));

  try {
    // Step 1: Initialize database connection
    console.log('\n📊 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Step 2: Check Redis/Queue connection
    console.log('\n🔌 Connecting to Redis...');
    const queueHealthy = await checkQueueHealth();
    if (!queueHealthy) {
      throw new Error('Failed to connect to Redis');
    }

    console.log('🔁 Resuming queues (if paused)...');
    await Promise.all([
      DEPOSIT_COMPLETION_QUEUE.resume(),
      ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE.resume(),
      SWAP_EXECUTION_QUEUE.resume(),
      SWAP_CONFIRMATION_QUEUE.resume(),
    ]);

    // Step 3: Register job processors
    console.log('\n📝 Registering job processors...');

    /**
     * DEPOSIT COMPLETION QUEUE
     *
     * Concurrency: 5
     * - Process up to 5 M-Pesa deposits simultaneously
     * - Adjust based on your blockchain RPC rate limits
     */
    DEPOSIT_COMPLETION_QUEUE.process(5, async (job) => {
      console.log(`\n[${new Date().toISOString()}] Processing job ${job.id}`);
      await processDepositCompletion(job);
    });

    /**
     * ONCHAIN DEPOSIT CONFIRMATION QUEUE
     *
     * Concurrency: 3
     * - Scan up to 3 deposit sessions simultaneously
     * - Lower concurrency to avoid hitting RPC rate limits
     */
    ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE.process(3, async (job) => {
      console.log(`\n[${new Date().toISOString()}] Processing job ${job.id}`);
      await processOnchainDepositConfirmation(job);
    });

    /**
     * SWAP EXECUTION QUEUE
     *
     * Concurrency: 5
     * - Execute up to 5 swaps simultaneously
     * - Places orders with 1inch Fusion API
     */
    SWAP_EXECUTION_QUEUE.process(5, async (job) => {
      console.log(`\n[${new Date().toISOString()}] Processing job ${job.id}`);
      await processSwapExecution(job);
    });

    /**
     * SWAP CONFIRMATION QUEUE
     *
     * Concurrency: 3
     * - Poll up to 3 swap confirmations simultaneously
     * - Polls 1inch order status every 30s
     */
    SWAP_CONFIRMATION_QUEUE.process(3, async (job) => {
      console.log(`\n[${new Date().toISOString()}] Processing job ${job.id}`);
      await processSwapConfirmation(job);
    });

    console.log('✅ Job processors registered');

    // Step 4: Set up event listeners for monitoring
    console.log('\n👂 Setting up event listeners...');

    // Initialize monitoring for queues
    monitoringService.initQueue('deposit-completion');
    monitoringService.initQueue('onchain-deposit-confirmation');
    monitoringService.initQueue('swap-execution');
    monitoringService.initQueue('swap-confirmation');

    // Deposit completion queue events
    DEPOSIT_COMPLETION_QUEUE.on('completed', (job, result) => {
      console.log(`✅ [deposit-completion] Job ${job.id} completed successfully`);
      monitoringService.recordSuccess('deposit-completion', job.id.toString());
    });

    DEPOSIT_COMPLETION_QUEUE.on('failed', (job, err) => {
      console.error(`❌ [deposit-completion] Job ${job?.id} failed:`, err.message);
      if (job) {
        monitoringService.recordFailure('deposit-completion', job.id.toString(), err);
      }
    });

    DEPOSIT_COMPLETION_QUEUE.on('stalled', (job) => {
      console.warn(`⚠️  [deposit-completion] Job ${job.id} stalled (worker crashed?)`);
      monitoringService.recordStalled('deposit-completion', job.id.toString());
    });

    // Onchain confirmation queue events
    ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE.on('completed', (job, result) => {
      console.log(`✅ [onchain-deposit-confirmation] Job ${job.id} completed successfully`);
      monitoringService.recordSuccess('onchain-deposit-confirmation', job.id.toString());
    });

    ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE.on('failed', (job, err) => {
      console.error(`❌ [onchain-deposit-confirmation] Job ${job?.id} failed:`, err.message);
      if (job) {
        monitoringService.recordFailure('onchain-deposit-confirmation', job.id.toString(), err);
      }
    });

    ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE.on('stalled', (job) => {
      console.warn(`⚠️  [onchain-deposit-confirmation] Job ${job.id} stalled (worker crashed?)`);
      monitoringService.recordStalled('onchain-deposit-confirmation', job.id.toString());
    });

    // Swap execution queue events
    SWAP_EXECUTION_QUEUE.on('completed', (job, result) => {
      console.log(`✅ [swap-execution] Job ${job.id} completed successfully`);
      monitoringService.recordSuccess('swap-execution', job.id.toString());
    });

    SWAP_EXECUTION_QUEUE.on('failed', (job, err) => {
      console.error(`❌ [swap-execution] Job ${job?.id} failed:`, err.message);
      if (job) {
        monitoringService.recordFailure('swap-execution', job.id.toString(), err);
      }
    });

    SWAP_EXECUTION_QUEUE.on('stalled', (job) => {
      console.warn(`⚠️  [swap-execution] Job ${job.id} stalled (worker crashed?)`);
      monitoringService.recordStalled('swap-execution', job.id.toString());
    });

    // Swap confirmation queue events
    SWAP_CONFIRMATION_QUEUE.on('completed', (job, result) => {
      console.log(`✅ [swap-confirmation] Job ${job.id} completed successfully`);
      monitoringService.recordSuccess('swap-confirmation', job.id.toString());
    });

    SWAP_CONFIRMATION_QUEUE.on('failed', (job, err) => {
      console.error(`❌ [swap-confirmation] Job ${job?.id} failed:`, err.message);
      if (job) {
        monitoringService.recordFailure('swap-confirmation', job.id.toString(), err);
      }
    });

    SWAP_CONFIRMATION_QUEUE.on('stalled', (job) => {
      console.warn(`⚠️  [swap-confirmation] Job ${job.id} stalled (worker crashed?)`);
      monitoringService.recordStalled('swap-confirmation', job.id.toString());
    });

    console.log('✅ Event listeners registered with monitoring');

    // Step 5: Worker is ready!
    console.log('\n' + '═'.repeat(50));
    console.log('🚀 Worker is ready and processing jobs!');
    console.log('═'.repeat(50));
    console.log('\nQueues:');
    console.log('  • deposit-completion (concurrency: 5)');
    console.log('  • onchain-deposit-confirmation (concurrency: 3)');
    console.log('  • swap-execution (concurrency: 5)');
    console.log('  • swap-confirmation (concurrency: 3)');
    console.log('\nPress Ctrl+C to stop worker\n');
  } catch (error) {
    console.error('\n❌ Failed to start worker:', error);
    process.exit(1);
  }
}

/**
 * GRACEFUL SHUTDOWN
 *
 * When you stop the worker (Ctrl+C or pm2 stop):
 * 1. Stop accepting new jobs
 * 2. Wait for current jobs to finish (up to 30 seconds)
 * 3. Close database connection
 * 4. Close Redis connection
 * 5. Exit process
 */
async function gracefulShutdown(signal: string) {
  console.log(`\n\n⚠️  Received ${signal}, shutting down gracefully...`);

  try {
    // Stop accepting new jobs
    console.log('🛑 Pausing queues...');
    await DEPOSIT_COMPLETION_QUEUE.pause();
    await ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE.pause();
    await SWAP_EXECUTION_QUEUE.pause();
    await SWAP_CONFIRMATION_QUEUE.pause();

    // Wait for active jobs to finish (timeout: 30s)
    console.log('⏳ Waiting for active jobs to finish (30s timeout)...');
    await Promise.race([
      Promise.all([
        DEPOSIT_COMPLETION_QUEUE.whenCurrentJobsFinished(),
        ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE.whenCurrentJobsFinished(),
        SWAP_EXECUTION_QUEUE.whenCurrentJobsFinished(),
        SWAP_CONFIRMATION_QUEUE.whenCurrentJobsFinished(),
      ]),
      new Promise((resolve) => setTimeout(resolve, 30000)),
    ]);

    // Close connections
    console.log('🔌 Closing database connection...');
    await AppDataSource.destroy();

    console.log('🔌 Closing queue connections...');
    await closeQueues();

    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the worker!
startWorker();
