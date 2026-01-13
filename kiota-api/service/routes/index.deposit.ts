import express from "express";
import { DepositController } from "../controllers/deposit.controller";

const router = express.Router();
const depositController = new DepositController();

// Deposit flow
router.post('/initiate', (req, res) => depositController.initiateDeposit(req, res));
router.post('/trigger-mpesa', (req, res) => depositController.triggerMpesaPush(req, res));
router.post('/mpesa-callback', (req, res) => depositController.mpesaCallback(req, res));
router.get('/status/:transactionId', (req, res) => depositController.getTransactionStatus(req, res));

// Background job endpoint
router.post('/complete', (req, res) => depositController.completeDeposit(req, res));

router.get("*", function (req, res) {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME, module: "deposit" });
});

export default router;