import express from "express";
import PortfolioController from "../controllers/portfolio.controller";
import { requireInternalAuth } from "../middleware/auth";

const router = express.Router();

// Portfolio details
router.get('/detail', requireInternalAuth, PortfolioController.getPortfolioDetail);
router.get('/asset/:symbol', requireInternalAuth, PortfolioController.getAssetDetail);

// Portfolio actions
router.post('/rebalance', requireInternalAuth, PortfolioController.rebalancePortfolio);

// Catch-all route - must be last
router.use((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME });
});

export default router;