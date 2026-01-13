import express from "express";
import AuthController from "../controllers/auth.controller";

const router = express.Router();

// Google Auth
router.post('/google-login', AuthController.googleSignIn);

// Session management
router.get('/me', AuthController.getCurrentUser);
// router.post('/logout', AuthController.logout);

// Catch-all route - must be last
router.use((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME });
});

export default router;