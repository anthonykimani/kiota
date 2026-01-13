import express from "express";
import WalletController from "../controllers/wallet.controller";

const router = express.Router();

// Wallet management
router.get('/info', WalletController.getWallet);
router.get('/exists', WalletController.walletExists);

// Wallet balances
router.put('/balances', WalletController.updateBalances);

// Catch-all route - must be last
router.use((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME });
});

export default router;