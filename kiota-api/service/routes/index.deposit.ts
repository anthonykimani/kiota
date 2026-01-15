import express from "express";
import DepositController from "../controllers/deposit.controller";
import { requireInternalAuth } from "../middleware/auth";

const router = express.Router();

// Deposit flow
router.post('/initiate', requireInternalAuth, DepositController.initiateDeposit);
router.post('/trigger-mpesa', requireInternalAuth, DepositController.triggerMpesaPush);
router.post('/mpesa-callback', requireInternalAuth, DepositController.mpesaCallback);
router.get('/status/:transactionId', requireInternalAuth, DepositController.getTransactionStatus);

// Background job endpoint
router.post('/complete', requireInternalAuth, DepositController.completeDeposit);

// Catch-all route - must be last
router.use((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME });
});

export default router;