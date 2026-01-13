import { Repository } from "typeorm";
import dotenv from "dotenv";
import { AIAdvisorSession } from "../models/ai-advisor-session.entity";
import AppDataSource from "../configs/ormconfig";
import { AISessionType } from "../enums/RoboAdvisor";


export class AIAdvisorSessionRepository {
    private repo: Repository<AIAdvisorSession>;

    constructor() {
        this.repo = AppDataSource.getRepository(AIAdvisorSession);
        dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
    }

    // Screen 5: Save quiz submission before AI call
    async createQuizSession(userId: string, quizAnswers: Record<string, any>): Promise<AIAdvisorSession> {
        try {
            const session = this.repo.create({
                userId,
                sessionType: AISessionType.ONBOARDING_QUIZ,
                inputContext: { quizAnswers },
                hadError: false
            });

            return await this.repo.save(session);
        } catch (error) {
            throw error;
        }
    }

    // Screen 6: Save AI strategy response
    async saveStrategyResponse(sessionId: string, response: {
        allocation: {
            usdm: number;
            bcspx: number;
            paxg: number;
        };
        strategyName: string;
        rationale: string;
        expectedReturn: number;
        riskLevel: string;
    }, metrics?: {
        modelUsed?: string;
        inputTokens?: number;
        outputTokens?: number;
        latencyMs?: number;
    }): Promise<AIAdvisorSession | null> {
        try {
            const session = await this.repo.findOne({ where: { id: sessionId } });
            if (!session) return null;

            session.aiResponse = {
                allocation: response.allocation,
                rationale: response.rationale,
                rawText: JSON.stringify(response)
            };

            if (metrics) {
                session.modelUsed = metrics.modelUsed;
                session.inputTokens = metrics.inputTokens;
                session.outputTokens = metrics.outputTokens;
                session.latencyMs = metrics.latencyMs;
            }

            return await this.repo.save(session);
        } catch (error) {
            throw error;
        }
    }

    // Screen 6: Record user accepted/rejected strategy
    async recordUserDecision(sessionId: string, accepted: boolean): Promise<AIAdvisorSession | null> {
        try {
            const session = await this.repo.findOne({ where: { id: sessionId } });
            if (!session) return null;

            session.userAccepted = accepted;
            return await this.repo.save(session);
        } catch (error) {
            throw error;
        }
    }

    // Screen 6: Record error if AI call failed
    async recordError(sessionId: string, errorMessage: string): Promise<AIAdvisorSession | null> {
        try {
            const session = await this.repo.findOne({ where: { id: sessionId } });
            if (!session) return null;

            session.hadError = true;
            session.errorMessage = errorMessage;
            return await this.repo.save(session);
        } catch (error) {
            throw error;
        }
    }

    // General: Get session by ID
    async getById(id: string): Promise<AIAdvisorSession | null> {
        try {
            return await this.repo.findOne({ where: { id } });
        } catch (error) {
            throw error;
        }
    }

    // Get latest quiz session for user
    async getLatestQuizSession(userId: string): Promise<AIAdvisorSession | null> {
        try {
            return await this.repo.findOne({
                where: { userId, sessionType: AISessionType.ONBOARDING_QUIZ },
                order: { createdAt: 'DESC' }
            });
        } catch (error) {
            throw error;
        }
    }
}