import express from "express";
import { QuizController } from "../controllers/quiz.controller";

const router = express.Router();
const quizController = new QuizController();

// Quiz submission and strategy generation
router.post('/submit', (req, res) => quizController.submitQuiz(req, res));
router.post('/accept-strategy', (req, res) => quizController.acceptStrategy(req, res));

// Get quiz session
router.get('/latest-session', (req, res) => quizController.getLatestSession(req, res));

router.get("*", function (req, res) {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME, module: "quiz" });
});

export default router;