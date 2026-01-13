import express from "express";
import DepositController from "../controllers/deposit.controller";

const router = express.Router();

// Deposit flow
router.post('/initiate', DepositController.initiateDeposit);
router.post('/trigger-mpesa', DepositController.triggerMpesaPush);
router.post('/mpesa-callback', DepositController.mpesaCallback);
router.get('/status/:transactionId', DepositController.getTransactionStatus);

// Background job endpoint
router.post('/complete', DepositController.completeDeposit);

// Catch-all route - must be last
router.use((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME });
});

export default router;