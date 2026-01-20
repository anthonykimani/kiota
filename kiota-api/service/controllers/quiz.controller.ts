import { Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repo';
import { AIAdvisorSessionRepository } from '../repositories/advisor-session.repo';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from "openai";
import z from "zod";
import Controller from './controller';

const StrategySchema = z.object({
    allocation: z.object({
        stableYields: z.number(),
        tokenizedStocks: z.number(),
        tokenizedGold: z.number(),
    }),
    strategyName: z.string(),
    defaultAssets: z.object({
        stableYields: z.string(),
        tokenizedStocks: z.string(),
        tokenizedGold: z.string(),
    }),
    rationale: z.string(),
    expectedReturn: z.number(),
    riskLevel: z.string(),
});


/**
 * Quiz Controller
 * Handles investment strategy quiz for Phase 1 MVP
 * Screens: 5 (Investment Strategy Quiz), 6 (AI Strategy Result)
 */
class QuizController extends Controller {
    /**
     * Submit quiz answers and generate AI strategy (Screen 5)
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async submitQuiz(req: Request, res: Response) {
        try {
            const userRepo: UserRepository = new UserRepository();
            const aiSessionRepo: AIAdvisorSessionRepository = new AIAdvisorSessionRepository();

            // Comes from requireInternalAuth middleware
            const userId = (req as any).userId;

            if (!userId) {
                return res.send(super.response(super._401, null, ['Not authenticated']));
            }

            /**
             * Support BOTH payload styles:
             *  A) { answers: { primaryGoal, investmentTimeline, ... } }
             *  B) { goal, timeline, riskTolerance, ... }  (legacy)
             */
            const a = (req.body?.answers && typeof req.body.answers === 'object')
                ? req.body.answers
                : req.body;

            // Normalize field names
            const goal = a.primaryGoal ?? a.goal;
            const timeline = a.investmentTimeline ?? a.timeline;
            const riskTolerance = a.riskTolerance;
            const investmentExperience = a.investmentExperience;

            const currentSavings = a.currentSavingsRange ?? a.currentSavings;
            const monthlySavings = a.monthlySavingsRange ?? a.monthlySavings;

            const comfortableWithDollars =
                typeof a.comfortableWithDollars === 'boolean' ? a.comfortableWithDollars : true;

            const priorities = Array.isArray(a.investmentPriorities)
                ? a.investmentPriorities
                : Array.isArray(a.priorities)
                    ? a.priorities
                    : [];

            // Validate required quiz fields
            if (!goal || !timeline || !riskTolerance || !investmentExperience) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['All quiz questions must be answered']
                    )
                );
            }

            // Save quiz answers (DB)
            await userRepo.saveQuizAnswers(userId, {
                primaryGoal: goal,
                investmentTimeline: timeline,
                riskTolerance,
                investmentExperience,
                currentSavingsRange: currentSavings,
                monthlySavingsRange: monthlySavings,
                comfortableWithDollars,
                investmentPriorities: priorities
            });

            // Create AI session (DB)
            const aiSession = await aiSessionRepo.createQuizSession(userId, {
                goal,
                timeline,
                riskTolerance,
                investmentExperience,
                currentSavings,
                monthlySavings,
                comfortableWithDollars,
                priorities
            });

            // Generate strategy (Claude/OpenAI depending on your implementation)
            const strategy = await QuizController.generateStrategy({
                goal,
                timeline,
                riskTolerance,
                investmentExperience,
                currentSavings,
                monthlySavings,
                comfortableWithDollars,
                priorities
            });

            // Save AI response (DB)
            await aiSessionRepo.saveStrategyResponse(
                aiSession.id,
                {
                    allocation: strategy.allocation,
                    strategyName: strategy.strategyName,
                    rationale: strategy.rationale,
                    expectedReturn: strategy.expectedReturn,
                    riskLevel: strategy.riskLevel
                },
                {
                    modelUsed: strategy.modelUsed ?? 'unknown',
                    inputTokens: strategy.usage?.input_tokens ?? strategy.usage?.inputTokens,
                    outputTokens: strategy.usage?.output_tokens ?? strategy.usage?.outputTokens,
                    latencyMs: strategy.latencyMs
                }
            );

            // Save strategy targets to user (DB)
            await userRepo.saveStrategy(userId, {
                targetStableYieldsPercent: strategy.allocation.stableYields,
                targetTokenizedStocksPercent: strategy.allocation.tokenizedStocks,
                targetTokenizedGoldPercent: strategy.allocation.tokenizedGold,
                strategyName: strategy.strategyName
            });

            const quizData = {
                sessionId: aiSession.id,
                strategy: {
                    name: strategy.strategyName,
                    allocation: strategy.allocation,
                    rationale: strategy.rationale,
                    expectedReturn: strategy.expectedReturn,
                    riskLevel: strategy.riskLevel,
                    assets: strategy.defaultAssets
                }
            };

            return res.send(super.response(super._200, quizData));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }


    /**
     * Accept or customize strategy (Screen 6)
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async acceptStrategy(req: Request, res: Response) {
        try {
            const userRepo: UserRepository = new UserRepository();
            const aiSessionRepo: AIAdvisorSessionRepository = new AIAdvisorSessionRepository();

            const userId = (req as any).userId;
            const { sessionId, accepted, customAllocation } = req.body;

            if (!sessionId) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['Session ID is required']
                    )
                );
            }

            // Record user decision
            await aiSessionRepo.recordUserDecision(sessionId, accepted);

            if (customAllocation) {
                const total = customAllocation.stableYields +
                    customAllocation.tokenizedStocks +
                    customAllocation.tokenizedGold;

                if (Math.abs(total - 100) > 0.01) {
                    return res.send(
                        super.response(
                            super._400,
                            null,
                            ['Allocation must add up to 100%']
                        )
                    );
                }

                // Save custom strategy
                await userRepo.saveStrategy(userId, {
                    targetStableYieldsPercent: customAllocation.stableYields,
                    targetTokenizedStocksPercent: customAllocation.tokenizedStocks,
                    targetTokenizedGoldPercent: customAllocation.tokenizedGold,
                    strategyName: 'Custom Strategy'
                });
            }

            const strategyData = {
                accepted,
                nextStep: 'wallet_creation'
            };

            return res.send(super.response(super._200, strategyData));

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get latest quiz session
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async getLatestSession(req: Request, res: Response) {
        try {
            const aiSessionRepo: AIAdvisorSessionRepository = new AIAdvisorSessionRepository();
            const userId = (req as any).userId;

            // Get latest session
            const session = await aiSessionRepo.getLatestQuizSession(userId);

            if (!session) {
                return res.send(
                    super.response(
                        super._404,
                        null,
                        ['No quiz session found']
                    )
                );
            }

            const sessionData = {
                session: {
                    id: session.id,
                    createdAt: session.createdAt,
                    aiResponse: session.aiResponse,
                    userAccepted: session.userAccepted
                }
            };

            return res.send(super.response(super._200, sessionData));

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Generate investment strategy using Claude AI
     * @param profile User profile data
     * @returns Strategy object
     */
    private static async generateStrategy(profile: any): Promise<any> {
        const startTime = Date.now();

        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const prompt = `You are a Kenyan investment advisor. Analyze this user profile and recommend a category allocation.

        User Profile:
        - Goal: ${profile.goal}
        - Timeline: ${profile.timeline}
        - Risk tolerance: ${profile.riskTolerance}
        - Investment experience: ${profile.investmentExperience}
        - Current savings: ${profile.currentSavings || 'Not specified'}
        - Monthly savings: ${profile.monthlySavings || 'Not specified'}
        - Comfortable with dollars: ${profile.comfortableWithDollars ? 'Yes' : 'No'}
        - Priorities: ${profile.priorities?.join(', ') || 'Not specified'}

        Available Assets for Phase 1 MVP:
        1. USDM (Stable Yield) - 5.0% APY, no volatility, USD-backed
        2. bCSPX (S&P 500) - ~10% avg return, medium volatility, requires Tier 2 & KYC
        3. PAXG (Gold) - Tracks gold price, low volatility, hedge asset

        Return ONLY valid JSON matching the schema. Allocation must sum to 100.`;

        try {
            const response = await client.responses.create({
                model: "gpt-4.1-mini",
                input: prompt,
                // “Structured Outputs” style:
                text: {
                    format: {
                        type: "json_schema",
                        name: "investment_strategy",
                        schema: {
                            type: "object",
                            additionalProperties: false,
                            properties: {
                                allocation: {
                                    type: "object",
                                    additionalProperties: false,
                                    properties: {
                                        stableYields: { type: "number" },
                                        tokenizedStocks: { type: "number" },
                                        tokenizedGold: { type: "number" },
                                    },
                                    required: ["stableYields", "tokenizedStocks", "tokenizedGold"],
                                },
                                strategyName: { type: "string" },
                                defaultAssets: {
                                    type: "object",
                                    additionalProperties: false,
                                    properties: {
                                        stableYields: { type: "string" },
                                        tokenizedStocks: { type: "string" },
                                        tokenizedGold: { type: "string" },
                                    },
                                    required: ["stableYields", "tokenizedStocks", "tokenizedGold"],
                                },
                                rationale: { type: "string" },
                                expectedReturn: { type: "number" },
                                riskLevel: { type: "string" },
                            },
                            required: ["allocation", "strategyName", "defaultAssets", "rationale", "expectedReturn", "riskLevel"],
                        },
                    },
                },
            });

            const latencyMs = Date.now() - startTime;

            // Responses API returns JSON text in output_text
            const jsonText = response.output_text;
            const parsed = StrategySchema.parse(JSON.parse(jsonText));

            // attach basic usage if present
            return {
                ...parsed,
                usage: response.usage,
                latencyMs,
            };
        } catch (err) {
            console.error("OpenAI strategy error:", err);
            return QuizController.getFallbackStrategy();
        }
    }

    /**
     * Fallback strategy if Claude AI fails
     * @returns Default strategy
     */
    private static getFallbackStrategy(): any {
        return {
            allocation: {
                stableYields: 80,
                tokenizedStocks: 15,
                tokenizedGold: 5
            },
            strategyName: 'Conservative Grower',
            defaultAssets: {
                stableYields: 'USDM',
                tokenizedStocks: 'bCSPX',
                tokenizedGold: 'PAXG'
            },
            rationale: 'A balanced approach focusing on preservation with moderate growth.',
            expectedReturn: 6.25,
            riskLevel: 'Low-Medium',
            latencyMs: 0
        };
    }
}

export default QuizController;