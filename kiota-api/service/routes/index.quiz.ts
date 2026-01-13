import express from "express";
import QuizController from "../controllers/quiz.controller";

const router = express.Router();

// Quiz submission and strategy generation
router.post('/submit', QuizController.submitQuiz);
router.post('/accept-strategy', QuizController.acceptStrategy);

// Get quiz session
router.get('/latest-session', QuizController.getLatestSession);

// Catch-all route - must be last
router.use((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME });
});

export default router;