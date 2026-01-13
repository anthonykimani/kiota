import express from "express";
import { PortfolioController } from "../controllers/portfolio.controller";

const router = express.Router();
const portfolioController = new PortfolioController();

// Portfolio details
router.get('/detail', (req, res) => portfolioController.getPortfolioDetail(req, res));
router.get('/asset/:symbol', (req, res) => portfolioController.getAssetDetail(req, res));

// Portfolio actions
router.post('/rebalance', (req, res) => portfolioController.rebalancePortfolio(req, res));

router.get("*", function (req, res) {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME, module: "portfolio" });
});

export default router;