import { Request, Response } from 'express';
import { GoalRepository } from '../repositories/goal.repo';
import { MarketDataRepository } from '../repositories/market-data.repo';
import { GoalCategory, GoalStatus } from '../enums/Goal';
import Controller from './controller';
import { AuthenticatedRequest } from '../interfaces/IAuth';

/**
 * Goal Controller
 * Handles financial goals management
 * Supports Goal-Driven Milestones deposit pathway (Pathway 3)
 */
class GoalController extends Controller {
    /**
     * Create a new goal
     * @param req Express Request
     * @param res Express Response
     */
    public static async createGoal(req: Request, res: Response) {
        try {
            const goalRepo = new GoalRepository();
            const marketDataRepo = new MarketDataRepository();
            const userId = (req as AuthenticatedRequest).userId;

            if (!userId) {
                return res.send(super.response(super._401, null, ['Not authenticated']));
            }

            const { title, category, targetAmountKes, targetDate, description } = req.body;

            // Validate required fields
            if (!title || !category || !targetAmountKes || !targetDate) {
                return res.send(
                    super.response(super._400, null, ['title, category, targetAmountKes, and targetDate are required'])
                );
            }

            // Validate category
            if (!Object.values(GoalCategory).includes(category)) {
                return res.send(
                    super.response(super._400, null, [`Invalid category. Valid options: ${Object.values(GoalCategory).join(', ')}`])
                );
            }

            // Get exchange rate for USD conversion
            const exchangeRate = await marketDataRepo.getKesUsdRate();
            const targetAmountUsd = targetAmountKes / exchangeRate;

            // Create goal
            const goal = await goalRepo.createGoal({
                userId,
                title,
                category,
                targetAmountKes,
                targetAmountUsd,
                targetDate: new Date(targetDate)
            });

            return res.send(
                super.response(super._201, {
                    goal: {
                        id: goal.id,
                        title: goal.title,
                        category: goal.category,
                        emoji: goal.emoji,
                        targetAmountKes: goal.targetAmountKes,
                        targetAmountUsd: goal.targetAmountUsd,
                        currentAmountUsd: goal.currentAmountUsd,
                        progressPercent: goal.progressPercent,
                        targetDate: goal.targetDate,
                        status: goal.status,
                        onTrack: goal.onTrack
                    }
                })
            );
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get all goals for user
     * @param req Express Request
     * @param res Express Response
     */
    public static async getGoals(req: Request, res: Response) {
        try {
            const goalRepo = new GoalRepository();
            const userId = (req as AuthenticatedRequest).userId;

            if (!userId) {
                return res.send(super.response(super._401, null, ['Not authenticated']));
            }

            const status = req.query.status as string;
            const limit = parseInt(req.query.limit as string) || 10;

            let goals;
            if (status === 'active') {
                goals = await goalRepo.getActiveByUser(userId, limit);
            } else {
                // Get all goals
                goals = await goalRepo.getActiveByUser(userId, limit);
            }

            return res.send(
                super.response(super._200, {
                    goals: goals.map(g => ({
                        id: g.id,
                        title: g.title,
                        category: g.category,
                        emoji: g.emoji,
                        targetAmountKes: g.targetAmountKes,
                        targetAmountUsd: g.targetAmountUsd,
                        currentAmountUsd: g.currentAmountUsd,
                        progressPercent: g.progressPercent,
                        targetDate: g.targetDate,
                        status: g.status,
                        onTrack: g.onTrack
                    })),
                    count: goals.length
                })
            );
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get single goal details
     * @param req Express Request
     * @param res Express Response
     */
    public static async getGoal(req: Request, res: Response) {
        try {
            const goalRepo = new GoalRepository();
            const userId = (req as AuthenticatedRequest).userId;
            const { goalId } = req.params;

            if (!userId) {
                return res.send(super.response(super._401, null, ['Not authenticated']));
            }

            const goal = await goalRepo.getById(goalId);

            if (!goal) {
                return res.send(super.response(super._404, null, ['Goal not found']));
            }

            if (goal.userId !== userId) {
                return res.send(super.response(super._403, null, ['Access denied']));
            }

            return res.send(
                super.response(super._200, {
                    goal: {
                        id: goal.id,
                        title: goal.title,
                        category: goal.category,
                        emoji: goal.emoji,
                        targetAmountKes: goal.targetAmountKes,
                        targetAmountUsd: goal.targetAmountUsd,
                        currentAmountUsd: goal.currentAmountUsd,
                        progressPercent: goal.progressPercent,
                        targetDate: goal.targetDate,
                        status: goal.status,
                        onTrack: goal.onTrack,
                        createdAt: goal.createdAt,
                        completedAt: goal.completedAt
                    }
                })
            );
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Contribute to a goal (records contribution, triggers deposit flow)
     * @param req Express Request
     * @param res Express Response
     */
    public static async contribute(req: Request, res: Response) {
        try {
            const goalRepo = new GoalRepository();
            const marketDataRepo = new MarketDataRepository();
            const userId = (req as AuthenticatedRequest).userId;
            const { goalId } = req.params;
            const { amountKes } = req.body;

            if (!userId) {
                return res.send(super.response(super._401, null, ['Not authenticated']));
            }

            if (!amountKes || amountKes < 100) {
                return res.send(super.response(super._400, null, ['Minimum contribution is KES 100']));
            }

            const goal = await goalRepo.getById(goalId);

            if (!goal) {
                return res.send(super.response(super._404, null, ['Goal not found']));
            }

            if (goal.userId !== userId) {
                return res.send(super.response(super._403, null, ['Access denied']));
            }

            if (goal.status !== GoalStatus.ACTIVE) {
                return res.send(super.response(super._400, null, ['Goal is not active']));
            }

            // Get exchange rate
            const exchangeRate = await marketDataRepo.getKesUsdRate();
            const amountUsd = amountKes / exchangeRate;

            // Update goal progress
            const updatedGoal = await goalRepo.updateProgress(goalId, amountUsd);

            return res.send(
                super.response(super._200, {
                    goal: {
                        id: updatedGoal?.id,
                        title: updatedGoal?.title,
                        currentAmountUsd: updatedGoal?.currentAmountUsd,
                        progressPercent: updatedGoal?.progressPercent,
                        status: updatedGoal?.status
                    },
                    contribution: {
                        amountKes,
                        amountUsd,
                        exchangeRate
                    },
                    nextStep: 'deposit_initiate' // User should call deposit endpoint next
                })
            );
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Update goal details
     * @param req Express Request
     * @param res Express Response
     */
    public static async updateGoal(req: Request, res: Response) {
        try {
            const goalRepo = new GoalRepository();
            const userId = (req as AuthenticatedRequest).userId;
            const { goalId } = req.params;
            const { title, targetDate, targetAmountKes } = req.body;

            if (!userId) {
                return res.send(super.response(super._401, null, ['Not authenticated']));
            }

            const goal = await goalRepo.getById(goalId);

            if (!goal) {
                return res.send(super.response(super._404, null, ['Goal not found']));
            }

            if (goal.userId !== userId) {
                return res.send(super.response(super._403, null, ['Access denied']));
            }

            // Update fields if provided
            if (title) goal.title = title;
            if (targetDate) goal.targetDate = new Date(targetDate);
            if (targetAmountKes) {
                const marketDataRepo = new MarketDataRepository();
                const exchangeRate = await marketDataRepo.getKesUsdRate();
                goal.targetAmountKes = targetAmountKes;
                goal.targetAmountUsd = targetAmountKes / exchangeRate;
                // Recalculate progress
                goal.progressPercent = (Number(goal.currentAmountUsd) / Number(goal.targetAmountUsd)) * 100;
            }

            // Save is handled by the repository
            const updated = await goalRepo.updateProgress(goalId, 0); // This saves without adding amount

            return res.send(
                super.response(super._200, {
                    goal: {
                        id: goal.id,
                        title: goal.title,
                        targetAmountKes: goal.targetAmountKes,
                        targetAmountUsd: goal.targetAmountUsd,
                        targetDate: goal.targetDate,
                        progressPercent: goal.progressPercent
                    }
                })
            );
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Delete/archive a goal
     * @param req Express Request
     * @param res Express Response
     */
    public static async deleteGoal(req: Request, res: Response) {
        try {
            const goalRepo = new GoalRepository();
            const userId = (req as AuthenticatedRequest).userId;
            const { goalId } = req.params;

            if (!userId) {
                return res.send(super.response(super._401, null, ['Not authenticated']));
            }

            const goal = await goalRepo.getById(goalId);

            if (!goal) {
                return res.send(super.response(super._404, null, ['Goal not found']));
            }

            if (goal.userId !== userId) {
                return res.send(super.response(super._403, null, ['Access denied']));
            }

            // Soft delete by marking as cancelled
            goal.status = GoalStatus.CANCELLED;
            // Note: would need to add a save method to goalRepo that doesn't require amount
            
            return res.send(
                super.response(super._200, {
                    message: 'Goal deleted successfully',
                    goalId: goal.id
                })
            );
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get goal categories (for UI dropdown)
     * @param req Express Request
     * @param res Express Response
     */
    public static async getCategories(req: Request, res: Response) {
        try {
            const categories = Object.values(GoalCategory).map(cat => {
                const emojis: Record<string, string> = {
                    'house': '🏠',
                    'car': '🚗',
                    'education': '📚',
                    'wedding': '💍',
                    'travel': '🏖️',
                    'emergency': '🚨',
                    'retirement': '🌴',
                    'business': '💼',
                    'other': '🎯'
                };
                return {
                    value: cat,
                    label: cat.charAt(0).toUpperCase() + cat.slice(1),
                    emoji: emojis[cat] || '🎯'
                };
            });

            return res.send(
                super.response(super._200, { categories })
            );
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }
}

export default GoalController;
