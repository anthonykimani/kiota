/**
 * Swap Routes
 *
 * Routes for swap operations via 1inch Fusion API
 *
 * Endpoints:
 * - GET /api/swap/quote - Get swap pricing preview
 * - POST /api/swap/execute - Execute user-initiated swap
 * - GET /api/swap/status/:transactionId - Check swap status
 * - GET /api/swap/history - Get user's swap history
 */

import express from 'express';
import SwapController from '../controllers/swap.controller';
import { requireInternalAuth } from '../middleware/auth';

const router = express.Router();

// Get swap quote (pricing preview)
router.get('/quote', requireInternalAuth, SwapController.getSwapQuote);

// Execute swap
router.post('/execute', requireInternalAuth, SwapController.executeSwap);

// Get swap status
router.get('/status/:transactionId', requireInternalAuth, SwapController.getSwapStatus);

// Get swap history
router.get('/history', requireInternalAuth, SwapController.getSwapHistory);

// Catch-all route - must be last
router.use((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  return res.json({ service: process.env.SERVICE_NAME });
});

export default router;
