import express from "express";
import WalletController from "../controllers/wallet.controller";
import { requireInternalAuth } from "../middleware/auth";

const router = express.Router();

// Wallet management
router.get('/info', requireInternalAuth, WalletController.getWallet);
router.get('/exists', requireInternalAuth, WalletController.walletExists);

// Wallet balances
router.put('/balances', requireInternalAuth, WalletController.updateBalances);

// Catch-all route - must be last
router.use((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME });
});

export default router;