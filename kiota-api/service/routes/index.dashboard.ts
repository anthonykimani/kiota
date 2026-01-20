import express from "express";
import DashboardController from "../controllers/dashboard.controller";
import { requireInternalAuth } from "../middleware/auth";

const router = express.Router();

// Dashboard data
router.get('/', requireInternalAuth, DashboardController.getDashboard);
router.get('/portfolio-summary', requireInternalAuth, DashboardController.getPortfolioSummary);
router.get('/stats', requireInternalAuth, DashboardController.getStats);

// Catch-all route - must be last
router.use((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME });
});

export default router;