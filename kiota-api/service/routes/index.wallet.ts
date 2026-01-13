import express from "express";
import { WalletController } from "../controllers/wallet.controller";

const router = express.Router();
const walletController = new WalletController();

// Wallet management
router.post('/create', (req, res) => walletController.createWallet(req, res));
router.get('/info', (req, res) => walletController.getWallet(req, res));
router.get('/exists', (req, res) => walletController.walletExists(req, res));

// Wallet balances
router.put('/balances', (req, res) => walletController.updateBalances(req, res));

router.get("*", function (req, res) {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME, module: "wallet" });
});

export default router;