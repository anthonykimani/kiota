import { Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repo';
import { AIAdvisorSessionRepository } from '../repositories/advisor-session.repo';
import z from 'zod';
import Controller from './controller';
import { AuthenticatedRequest } from '../interfaces/IAuth';
import {
  calculateStrategy,
  QuizAnswers,
  applyAllocationConstraints,
  calculateExpectedReturn,
  Allocation,
} from '../services/risk-scoring.service';
import { createLogger } from '../utils/logger.util';

const logger = createLogger('quiz-controller');

/**
 * Zod schema for quiz answers validation
 */
const QuizAnswersSchema = z.object({
  age: z.enum(['18-25', '26-35', '36-45', '46-55', '56+']),
  timeline: z.enum(['10+', '5-10', '3-5', '1-3', '<1']),
  emergencyFund: z.enum(['6+', '3-6', '<3']),
  marketDrop: z.enum(['buy', 'hold', 'sell-some', 'sell-all']),
  volatility: z.enum(['high', 'moderate', 'low']),
  cryptoComfort: z.enum(['yes', 'small', 'none']),
});

/**
 * Zod schema for custom allocation
 */
const CustomAllocationSchema = z.object({
  stableYields: z.number().min(10).max(100),
  tokenizedGold: z.number().min(0).max(100),
  defiYield: z.number().min(0).max(100),
  bluechipCrypto: z.number().min(0).max(100),
});


/**
 * Quiz Controller
 *
 * Handles the robo-advisor quiz flow with deterministic scoring.
 *
 * Flow:
 * 1. User answers 6 questions about risk capacity and tolerance
 * 2. System calculates risk score (0-55) and maps to profile
 * 3. Profile determines recommended asset allocation
 * 4. User can accept or customize allocation
 *
 * Asset Classes:
 * - Stable Yields (USDM): Capital preservation
 * - Tokenized Gold (PAXG): Inflation hedge
 * - DeFi Yield (USDE): Variable yield
 * - Blue Chip Crypto (WETH): Growth exposure
 */
class QuizController extends Controller {
  /**
   * Submit quiz answers and generate strategy (deterministic scoring)
   *
   * POST /api/quiz/submit
   *
   * Body:
   * {
   *   age: '18-25' | '26-35' | '36-45' | '46-55' | '56+',
   *   timeline: '10+' | '5-10' | '3-5' | '1-3' | '<1',
   *   emergencyFund: '6+' | '3-6' | '<3',
   *   marketDrop: 'buy' | 'hold' | 'sell-some' | 'sell-all',
   *   volatility: 'high' | 'moderate' | 'low',
   *   cryptoComfort: 'yes' | 'small' | 'none'
   * }
   */
  public static async submitQuiz(req: Request, res: Response) {
    try {
      const userRepo: UserRepository = new UserRepository();
      const aiSessionRepo: AIAdvisorSessionRepository = new AIAdvisorSessionRepository();

      const userId = (req as AuthenticatedRequest).userId;

      if (!userId) {
        return res.send(super.response(super._401, null, ['Not authenticated']));
      }

      // Support both { answers: {...} } and flat body
      const rawAnswers = req.body?.answers ?? req.body;

      // Validate quiz answers
      const parseResult = QuizAnswersSchema.safeParse(rawAnswers);
      if (!parseResult.success) {
        logger.warn('Invalid quiz answers', {
          userId,
          errors: parseResult.error.issues,
        });
        return res.send(
          super.response(super._400, null, [
            'Invalid quiz answers. All 6 questions must be answered.',
            ...parseResult.error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`),
          ])
        );
      }

      const answers: QuizAnswers = parseResult.data;

      logger.info('Processing quiz submission', { userId, answers });

      // Calculate strategy using deterministic scoring
      const strategy = calculateStrategy(answers);

      // Save quiz answers to user profile
      await userRepo.saveQuizAnswers(userId, {
        primaryGoal: 'wealth_growth', // Default goal for new quiz format
        investmentTimeline: answers.timeline,
        riskTolerance: answers.volatility,
        investmentExperience: 'intermediate', // Derived from quiz implicitly
        currentSavingsRange: undefined,
        monthlySavingsRange: undefined,
        comfortableWithDollars: true,
        investmentPriorities: [],
      });

      // Create session for audit trail
      const aiSession = await aiSessionRepo.createQuizSession(userId, {
        // Store raw answers for reference
        age: answers.age,
        timeline: answers.timeline,
        emergencyFund: answers.emergencyFund,
        marketDrop: answers.marketDrop,
        volatility: answers.volatility,
        cryptoComfort: answers.cryptoComfort,
      });

      // Save strategy response (no AI, but keep structure for compatibility)
      await aiSessionRepo.saveStrategyResponse(
        aiSession.id,
        {
          allocation: strategy.allocation,
          strategyName: strategy.profileName,
          rationale: strategy.rationale,
          expectedReturn: strategy.expectedReturn,
          riskLevel: strategy.riskLevel,
        },
        {
          modelUsed: 'deterministic-scoring-v1',
          inputTokens: 0,
          outputTokens: 0,
          latencyMs: 0,
        }
      );

      // Save strategy targets to user
      await userRepo.saveStrategy(userId, {
        targetStableYieldsPercent: strategy.allocation.stableYields,
        targetTokenizedGoldPercent: strategy.allocation.tokenizedGold,
        targetDefiYieldPercent: strategy.allocation.defiYield,
        targetBluechipCryptoPercent: strategy.allocation.bluechipCrypto,
        strategyName: strategy.profileKey,
        riskScore: strategy.score,
      });

      const responseData = {
        sessionId: aiSession.id,
        score: strategy.score,
        maxScore: strategy.maxScore,
        strategy: {
          name: strategy.profileName,
          key: strategy.profileKey,
          allocation: strategy.allocation,
          rationale: strategy.rationale,
          expectedReturn: strategy.expectedReturn,
          riskLevel: strategy.riskLevel,
          assets: strategy.defaultAssets,
        },
      };

      logger.info('Quiz completed successfully', {
        userId,
        score: strategy.score,
        profile: strategy.profileKey,
      });

      return res.send(super.response(super._200, responseData));
    } catch (error) {
      logger.error('Quiz submission failed', error as Error);
      return res.send(super.response(super._500, null, super.ex(error)));
    }
  }


  /**
   * Accept or customize strategy
   *
   * POST /api/quiz/accept
   *
   * Body:
   * {
   *   sessionId: string,
   *   accepted: boolean,
   *   customAllocation?: {
   *     stableYields: number,
   *     tokenizedGold: number,
   *     defiYield: number,
   *     bluechipCrypto: number
   *   }
   * }
   *
   * Constraints:
   * - Minimum 10% stable yields
   * - All allocations must sum to 100%
   */
  public static async acceptStrategy(req: Request, res: Response) {
    try {
      const userRepo: UserRepository = new UserRepository();
      const aiSessionRepo: AIAdvisorSessionRepository = new AIAdvisorSessionRepository();

      const userId = (req as AuthenticatedRequest).userId;
      const { sessionId, accepted, customAllocation } = req.body;

      if (!sessionId) {
        return res.send(super.response(super._400, null, ['Session ID is required']));
      }

      // Record user decision
      await aiSessionRepo.recordUserDecision(sessionId, accepted);

      if (customAllocation) {
        // Validate custom allocation
        const parseResult = CustomAllocationSchema.safeParse(customAllocation);
        if (!parseResult.success) {
          return res.send(
            super.response(super._400, null, [
              'Invalid allocation. Stable yields must be at least 10%.',
              ...parseResult.error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`),
            ])
          );
        }

        const allocation = parseResult.data;

        // Check sum = 100
        const total =
          allocation.stableYields +
          allocation.tokenizedGold +
          allocation.defiYield +
          allocation.bluechipCrypto;

        if (Math.abs(total - 100) > 0.01) {
          return res.send(
            super.response(super._400, null, [
              `Allocation must add up to 100%. Current total: ${total}%`,
            ])
          );
        }

        // Apply constraints (ensures min 10% stable)
        const constrainedAllocation = applyAllocationConstraints(allocation as Allocation);
        const expectedReturn = calculateExpectedReturn(constrainedAllocation);

        // Save custom strategy
        await userRepo.saveStrategy(userId, {
          targetStableYieldsPercent: constrainedAllocation.stableYields,
          targetTokenizedGoldPercent: constrainedAllocation.tokenizedGold,
          targetDefiYieldPercent: constrainedAllocation.defiYield,
          targetBluechipCryptoPercent: constrainedAllocation.bluechipCrypto,
          strategyName: 'custom',
          // Keep existing risk score
        });

        logger.info('Custom allocation saved', {
          userId,
          allocation: constrainedAllocation,
          expectedReturn,
        });

        return res.send(
          super.response(super._200, {
            accepted,
            customized: true,
            allocation: constrainedAllocation,
            expectedReturn,
            nextStep: 'wallet_creation',
          })
        );
      }

      // Mark quiz as completed
      await userRepo.markQuizCompleted(userId);

      logger.info('Strategy accepted', { userId, sessionId, accepted });

      return res.send(
        super.response(super._200, {
          accepted,
          customized: false,
          nextStep: 'wallet_creation',
        })
      );
    } catch (error) {
      logger.error('Accept strategy failed', error as Error);
      return res.send(super.response(super._500, null, super.ex(error)));
    }
  }

  /**
   * Get latest quiz session
   *
   * GET /api/quiz/session
   */
  public static async getLatestSession(req: Request, res: Response) {
    try {
      const aiSessionRepo: AIAdvisorSessionRepository = new AIAdvisorSessionRepository();
      const userRepo: UserRepository = new UserRepository();
      const userId = (req as AuthenticatedRequest).userId;

      // Get latest session
      const session = await aiSessionRepo.getLatestQuizSession(userId);

      if (!session) {
        return res.send(super.response(super._404, null, ['No quiz session found']));
      }

      // Get user's current strategy for score
      const user = await userRepo.findById(userId);

      const sessionData = {
        session: {
          id: session.id,
          createdAt: session.createdAt,
          aiResponse: session.aiResponse,
          userAccepted: session.userAccepted,
          score: user?.riskScore,
          maxScore: 55,
        },
      };

      return res.send(super.response(super._200, sessionData));
    } catch (error) {
      logger.error('Get latest session failed', error as Error);
      return res.send(super.response(super._500, null, super.ex(error)));
    }
  }

  /**
   * Get user's current strategy
   *
   * GET /api/quiz/strategy
   */
  public static async getCurrentStrategy(req: Request, res: Response) {
    try {
      const userRepo: UserRepository = new UserRepository();
      const userId = (req as AuthenticatedRequest).userId;

      const user = await userRepo.findById(userId);

      if (!user) {
        return res.send(super.response(super._404, null, ['User not found']));
      }

      const allocation: Allocation = {
        stableYields: Number(user.targetStableYieldsPercent) || 40,
        tokenizedGold: Number(user.targetTokenizedGoldPercent) || 15,
        defiYield: Number(user.targetDefiYieldPercent) || 30,
        bluechipCrypto: Number(user.targetBluechipCryptoPercent) || 15,
      };

      const expectedReturn = calculateExpectedReturn(allocation);

      return res.send(
        super.response(super._200, {
          strategyName: user.strategyName || 'balanced',
          score: user.riskScore,
          maxScore: 55,
          allocation,
          expectedReturn,
          hasCompletedQuiz: user.hasCompletedQuiz,
        })
      );
    } catch (error) {
      logger.error('Get current strategy failed', error as Error);
      return res.send(super.response(super._500, null, super.ex(error)));
    }
  }
}

export default QuizController;
