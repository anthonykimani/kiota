import { Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repo';
import { AIAdvisorSessionRepository } from '../repositories/advisor-session.repo';
import Anthropic from '@anthropic-ai/sdk';
import Controller from './controller';

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
            
            const userId = (req as any).userId;

            if (!userId) {
                return res.send(
                    super.response(
                        super._401,
                        null,
                        ['Not authenticated']
                    )
                );
            }

            const {
                goal,
                timeline,
                riskTolerance,
                investmentExperience,
                currentSavings,
                monthlySavings,
                comfortableWithDollars,
                priorities
            } = req.body;

            if (!goal || !timeline || !riskTolerance || !investmentExperience) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['All quiz questions must be answered']
                    )
                );
            }

            // Save quiz answers
            await userRepo.saveQuizAnswers(userId, {
                primaryGoal: goal,
                investmentTimeline: timeline,
                riskTolerance: riskTolerance,
                investmentExperience: investmentExperience,
                currentSavingsRange: currentSavings,
                monthlySavingsRange: monthlySavings,
                comfortableWithDollars: comfortableWithDollars !== false,
                investmentPriorities: priorities || []
            });

            // Create AI session
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

            // Generate strategy using Claude AI
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

            // Save AI response
            await aiSessionRepo.saveStrategyResponse(aiSession.id, {
                allocation: strategy.allocation,
                strategyName: strategy.strategyName,
                rationale: strategy.rationale,
                expectedReturn: strategy.expectedReturn,
                riskLevel: strategy.riskLevel
            }, {
                modelUsed: 'claude-sonnet-4-20250514',
                inputTokens: strategy.usage?.input_tokens,
                outputTokens: strategy.usage?.output_tokens,
                latencyMs: strategy.latencyMs
            });

            // Save strategy
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

Generate a strategy with allocation percentages and return as JSON:
{
  "allocation": {
    "stableYields": 80,
    "tokenizedStocks": 15,
    "tokenizedGold": 5
  },
  "strategyName": "Conservative Grower",
  "defaultAssets": {
    "stableYields": "USDM",
    "tokenizedStocks": "bCSPX",
    "tokenizedGold": "PAXG"
  },
  "rationale": "Your 3-5 year timeline and moderate risk tolerance suggest...",
  "expectedReturn": 6.25,
  "riskLevel": "Low-Medium"
}`;

        try {
            const anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY
            });

            const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1500,
                messages: [{ role: 'user', content: prompt }]
            });

            const latencyMs = Date.now() - startTime;

            const content = response.content[0];
            if (content.type !== 'text') {
                throw new Error('Unexpected response type from Claude');
            }

            let jsonText = content.text;
            const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/) || jsonText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonText = jsonMatch[1] || jsonMatch[0];
            }

            const strategy = JSON.parse(jsonText);

            return {
                ...strategy,
                usage: response.usage,
                latencyMs
            };

        } catch (error: any) {
            console.error('Claude AI error:', error);
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