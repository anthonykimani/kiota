import express from "express";
import DepositController from "../controllers/deposit.controller";
import { requireInternalAuth } from "../middleware/auth";

const router = express.Router();

// M-Pesa deposit flow
router.post('/initiate', requireInternalAuth, DepositController.initiateDeposit);
router.post('/trigger-mpesa', requireInternalAuth, DepositController.triggerMpesaPush);
router.post('/mpesa-callback', requireInternalAuth, DepositController.mpesaCallback);
router.get('/status/:transactionId', requireInternalAuth, DepositController.getTransactionStatus);

// Onchain USDC deposit flow
router.post('/intent/create', requireInternalAuth, DepositController.createDepositIntent);
router.post('/intent/confirm', requireInternalAuth, DepositController.confirmDeposit);

// Background job endpoint
router.post('/complete', requireInternalAuth, DepositController.completeDeposit);

// Catch-all route - must be last
router.use((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME });
});

export default router;