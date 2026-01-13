import express from "express";
import DashboardController from "../controllers/dashboard.controller";

const router = express.Router();

// Dashboard data
router.get('/', DashboardController.getDashboard);
router.get('/portfolio-summary', DashboardController.getPortfolioSummary);
router.get('/stats', DashboardController.getStats);

// Catch-all route - must be last
router.use((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME });
});

export default router;