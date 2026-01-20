import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import {
  DEPOSIT_COMPLETION_QUEUE,
  ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE,
} from './queue.config';

/**
 * BULL BOARD CONFIGURATION
 *
 * Bull Board is a visual dashboard for monitoring Bull queues
 *
 * Features:
 * - See all jobs (waiting, active, completed, failed)
 * - View job data and logs
 * - Retry failed jobs manually
 * - Clean up old jobs
 * - Monitor queue health
 *
 * Access:
 * - Development: http://localhost:3000/admin/queues
 * - Production: https://your-domain.com/admin/queues (protect with auth!)
 *
 * IMPORTANT SECURITY NOTE:
 * In production, you MUST protect this route with authentication!
 * Anyone with access can see sensitive job data and control your queues.
 */

// Create Express adapter for Bull Board
export const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

// Register all your queues with Bull Board
createBullBoard({
  queues: [
    new BullAdapter(DEPOSIT_COMPLETION_QUEUE),
    new BullAdapter(ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE),
  ],
  serverAdapter,
});

/**
 * How to use in your Express app:
 *
 * import { serverAdapter } from './configs/bull-board.config';
 *
 * // Add this route BEFORE your other routes
 * app.use('/admin/queues', serverAdapter.getRouter());
 *
 * // In production, add authentication:
 * app.use('/admin/queues', requireAdmin, serverAdapter.getRouter());
 */
