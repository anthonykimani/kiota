import express from "express";
import { DashboardController } from "../controllers/dashboard.controller";

const router = express.Router();
const dashboardController = new DashboardController();

// Dashboard data
router.get('/', (req, res) => dashboardController.getDashboard(req, res));
router.get('/portfolio-summary', (req, res) => dashboardController.getPortfolioSummary(req, res));
router.get('/stats', (req, res) => dashboardController.getStats(req, res));

router.get("*", function (req, res) {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME, module: "dashboard" });
});

export default router;