import express from "express";
import { AuthController } from "../controllers/auth.controller";

const router = express.Router();
const authController = new AuthController();

// Authentication
router.post('/request-otp', (req, res) => authController.requestOTP(req, res));
router.post('/verify-otp', (req, res) => authController.verifyOTP(req, res));

// Google Auth
router.post('/google-login', (req, res) => authController.googleSignIn(req, res));

// Session management
router.get('/me', (req, res) => authController.getCurrentUser(req, res));
// router.post('/logout', (req, res) => authController.logout(req, res));

router.get("*", function (req, res) {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME, module: "auth" });
});

export default router;