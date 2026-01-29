import { Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repo';
import { PortfolioRepository } from '../repositories/portfolio.repo';
import { GoalRepository } from '../repositories/goal.repo';
import { MarketDataRepository } from '../repositories/market-data.repo';
import Controller from './controller';
import { AuthenticatedRequest } from '../interfaces/IAuth';
import { assetRegistry } from '../services/asset-registry.service';

/**
 * Dashboard Controller
 * Handles dashboard/home screen for Phase 1 MVP
 * Screen: 9 (Dashboard - Home Screen)
 */
class DashboardController extends Controller {
    /**
     * Get dashboard data (Screen 9)
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async getDashboard(req: Request, res: Response) {
        try {
            const userRepo: UserRepository = new UserRepository();
            const portfolioRepo: PortfolioRepository = new PortfolioRepository();
            const goalRepo: GoalRepository = new GoalRepository();
            const marketDataRepo: MarketDataRepository = new MarketDataRepository();
            
            const userId = (req as AuthenticatedRequest).userId;

            if (!userId) {
                return res.send(
                    super.response(
                        super._401,
                        null,
                        ['Not authenticated']
                    )
                );
            }

            // Get user with relations
            const user = await userRepo.getWithWalletAndPortfolio(userId);

            if (!user) {
                return res.send(
                    super.response(
                        super._404,
                        null,
                        ['User not found']
                    )
                );
            }

            // Get portfolio
            const portfolio = await portfolioRepo.getByUserId(userId);

            if (!portfolio) {
                return res.send(
                    super.response(
                        super._404,
                        null,
                        ['Portfolio not found']
                    )
                );
            }

            // Get active goals
            const goals = await goalRepo.getActiveByUser(userId, 3);

            // Get KES/USD rate
            const kesUsdRate = await marketDataRepo.getKesUsdRate();

            const totalKes = portfolio.totalValueUsd * kesUsdRate;
            const monthlyChange = portfolio.thisMonthYield || 0;
            const monthlyChangePercent = portfolio.totalValueUsd > 0 
                ? (monthlyChange / portfolio.totalValueUsd) * 100 
                : 0;

            const stablePrimary = await assetRegistry.getPrimaryAssetByClassKey('stable_yields');
            const stocksPrimary = await assetRegistry.getPrimaryAssetByClassKey('tokenized_stocks');
            const goldPrimary = await assetRegistry.getPrimaryAssetByClassKey('tokenized_gold');

            const assets = [
                {
                    classKey: 'stable_yields',
                    name: 'Stable Yields',
                    primaryAssetSymbol: stablePrimary?.symbol || null,
                    valueUsd: portfolio.stableYieldsValueUsd,
                    percentage: portfolio.stableYieldsPercent,
                    monthlyEarnings: portfolio.stableYieldsValueUsd * 0.05 / 12,
                    apy: 5.0
                },
                {
                    classKey: 'tokenized_stocks',
                    name: 'Tokenized Stocks',
                    primaryAssetSymbol: stocksPrimary?.symbol || null,
                    valueUsd: portfolio.tokenizedStocksValueUsd,
                    percentage: portfolio.tokenizedStocksPercent,
                    monthlyEarnings: portfolio.tokenizedStocksValueUsd * 0.10 / 12,
                    avgReturn: 10.0,
                    requiresTier2: true
                },
                {
                    classKey: 'tokenized_gold',
                    name: 'Tokenized Gold',
                    primaryAssetSymbol: goldPrimary?.symbol || null,
                    valueUsd: portfolio.tokenizedGoldValueUsd,
                    percentage: portfolio.tokenizedGoldPercent,
                    monthlyEarnings: portfolio.tokenizedGoldValueUsd * 0.05 / 12
                }
            ].filter(asset => asset.valueUsd > 0);

            const formattedGoals = goals.map(goal => ({
                id: goal.id,
                emoji: goal.emoji || '🏠',
                title: goal.title,
                currentAmount: goal.currentAmountUsd,
                targetAmount: goal.targetAmountUsd,
                progressPercent: goal.progressPercent,
                targetDate: goal.targetDate,
                onTrack: goal.onTrack,
                status: goal.status
            }));

            const dashboardData = {
                user: {
                    id: user.id,
                    firstName: user.firstName || 'there',
                    hasCompletedOnboarding: user.hasCompletedOnboarding,
                    totalPoints: user.totalPoints,
                    level: user.level
                },
                portfolio: {
                    totalValueUsd: portfolio.totalValueUsd,
                    totalValueKes: totalKes,
                    monthlyChange: monthlyChange,
                    monthlyChangePercent: monthlyChangePercent,
                    monthlyTrend: monthlyChangePercent > 0 ? 'up' : monthlyChangePercent < 0 ? 'down' : 'stable'
                },
                assets: assets,
                totalMonthlyEarnings: assets.reduce((sum, a) => sum + (a.monthlyEarnings || 0), 0),
                goals: formattedGoals,
                quickActions: {
                    canAddMoney: true,
                    canWithdraw: portfolio.totalValueUsd >= 10,
                    canRebalance: DashboardController.needsRebalance(portfolio, user),
                    canLearn: true
                },
                kesUsdRate: kesUsdRate
            };

            return res.send(super.response(super._200, dashboardData));

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get portfolio summary
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async getPortfolioSummary(req: Request, res: Response) {
        try {
            const portfolioRepo: PortfolioRepository = new PortfolioRepository();
            const marketDataRepo: MarketDataRepository = new MarketDataRepository();
            
            const userId = (req as AuthenticatedRequest).userId;

            if (!userId) {
                return res.send(
                    super.response(
                        super._401,
                        null,
                        ['Not authenticated']
                    )
                );
            }

            // Get portfolio
            const portfolio = await portfolioRepo.getByUserId(userId);

            if (!portfolio) {
                return res.send(
                    super.response(
                        super._404,
                        null,
                        ['Portfolio not found']
                    )
                );
            }

            // Get KES/USD rate
            const kesUsdRate = await marketDataRepo.getKesUsdRate();

            const summaryData = {
                totalValueUsd: portfolio.totalValueUsd,
                totalValueKes: portfolio.totalValueUsd * kesUsdRate,
                allTimeReturnPercent: portfolio.allTimeReturnPercent,
                totalGainsUsd: portfolio.totalGainsUsd,
                monthlyEarnings: portfolio.monthlyEarningsEstimate
            };

            return res.send(super.response(super._200, summaryData));

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get user statistics
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async getStats(req: Request, res: Response) {
        try {
            const userRepo: UserRepository = new UserRepository();
            const portfolioRepo: PortfolioRepository = new PortfolioRepository();
            
            const userId = (req as AuthenticatedRequest).userId;

            if (!userId) {
                return res.send(
                    super.response(
                        super._401,
                        null,
                        ['Not authenticated']
                    )
                );
            }

            // Get user
            const user = await userRepo.getById(userId);
            // Get portfolio
            const portfolio = await portfolioRepo.getByUserId(userId);

            if (!user || !portfolio) {
                return res.send(
                    super.response(
                        super._404,
                        null,
                        ['User or portfolio not found']
                    )
                );
            }

            const statsData = {
                totalPoints: user.totalPoints,
                level: user.level,
                levelTitle: user.levelTitle,
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                totalDeposited: portfolio.totalDeposited,
                totalWithdrawn: portfolio.totalWithdrawn,
                allTimeReturn: portfolio.allTimeReturnPercent,
                memberSince: user.createdAt
            };

            return res.send(super.response(super._200, statsData));

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Check if portfolio needs rebalancing
     * @param portfolio Portfolio entity
     * @param user User entity
     * @returns boolean
     */
    private static needsRebalance(portfolio: any, user: any): boolean {
        const drift = Math.abs(portfolio.stableYieldsPercent - user.targetStableYieldsPercent) +
                     Math.abs(portfolio.tokenizedStocksPercent - user.targetTokenizedStocksPercent) +
                     Math.abs(portfolio.tokenizedGoldPercent - user.targetTokenizedGoldPercent);

        return drift > 5;
    }
}

export default DashboardController;
