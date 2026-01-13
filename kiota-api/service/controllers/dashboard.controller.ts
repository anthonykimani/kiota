import { Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repo';
import { PortfolioRepository } from '../repositories/portfolio.repo';
import { GoalRepository } from '../repositories/goal.repo';
import { MarketDataRepository } from '../repositories/market-data.repo';
import Controller from './controller';

/**
 * Dashboard Controller
 * Handles dashboard/home screen for Phase 1 MVP
 * Screen: 9 (Dashboard - Home Screen)
 */
export class DashboardController extends Controller {
    private userRepo: UserRepository;
    private portfolioRepo: PortfolioRepository;
    private goalRepo: GoalRepository;
    private marketDataRepo: MarketDataRepository;

    constructor() {
        super();
        this.userRepo = new UserRepository();
        this.portfolioRepo = new PortfolioRepository();
        this.goalRepo = new GoalRepository();
        this.marketDataRepo = new MarketDataRepository();
    }

    /**
     * Get dashboard data (Screen 9)
     * @param req Express Request
     * @param res Express Response
     */
    async getDashboard(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;

            if (!userId) {
                return res.json(
                    DashboardController.response(
                        DashboardController._401,
                        null,
                        ['Not authenticated']
                    )
                );
            }

            // Get user with relations using user.repo.ts method
            const user = await this.userRepo.getWithWalletAndPortfolio(userId);

            if (!user) {
                return res.json(
                    DashboardController.response(
                        DashboardController._404,
                        null,
                        ['User not found']
                    )
                );
            }

            // Get portfolio using portfolio.repo.ts method
            const portfolio = await this.portfolioRepo.getByUserId(userId);

            if (!portfolio) {
                return res.json(
                    DashboardController.response(
                        DashboardController._404,
                        null,
                        ['Portfolio not found']
                    )
                );
            }

            // Get active goals using goal.repo.ts method
            const goals = await this.goalRepo.getActiveByUser(userId, 3);

            // Get KES/USD rate using market-data.repo.ts method
            const kesUsdRate = await this.marketDataRepo.getKesUsdRate();

            const totalKes = portfolio.totalValueUsd * kesUsdRate;
            const monthlyChange = portfolio.thisMonthYield || 0;
            const monthlyChangePercent = portfolio.totalValueUsd > 0 
                ? (monthlyChange / portfolio.totalValueUsd) * 100 
                : 0;

            const assets = [
                {
                    category: 'preservation',
                    emoji: '🛡️',
                    name: 'USDM',
                    description: 'Preservation',
                    valueUsd: portfolio.stableYieldsValueUsd,
                    percentage: portfolio.stableYieldsPercent,
                    monthlyEarnings: portfolio.stableYieldsValueUsd * 0.05 / 12,
                    apy: 5.0
                },
                {
                    category: 'growth',
                    emoji: '📈',
                    name: 'bCSPX',
                    description: 'Growth',
                    valueUsd: portfolio.tokenizedStocksValueUsd,
                    percentage: portfolio.tokenizedStocksPercent,
                    monthlyEarnings: portfolio.tokenizedStocksValueUsd * 0.10 / 12,
                    avgReturn: 10.0,
                    requiresTier2: true
                },
                {
                    category: 'hedge',
                    emoji: '🥇',
                    name: 'PAXG',
                    description: 'Hedge',
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

            return res.json(
                DashboardController.response(
                    DashboardController._200,
                    {
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
                            canRebalance: this.needsRebalance(portfolio, user),
                            canLearn: true
                        },
                        kesUsdRate: kesUsdRate
                    }
                )
            );

        } catch (error: any) {
            console.error('Get dashboard error:', error);
            return res.json(
                DashboardController.response(
                    DashboardController._500,
                    null,
                    DashboardController.ex(error)
                )
            );
        }
    }

    /**
     * Get portfolio summary
     * @param req Express Request
     * @param res Express Response
     */
    async getPortfolioSummary(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;

            if (!userId) {
                return res.json(
                    DashboardController.response(
                        DashboardController._401,
                        null,
                        ['Not authenticated']
                    )
                );
            }

            // Get portfolio using portfolio.repo.ts method
            const portfolio = await this.portfolioRepo.getByUserId(userId);

            if (!portfolio) {
                return res.json(
                    DashboardController.response(
                        DashboardController._404,
                        null,
                        ['Portfolio not found']
                    )
                );
            }

            // Get KES/USD rate using market-data.repo.ts method
            const kesUsdRate = await this.marketDataRepo.getKesUsdRate();

            return res.json(
                DashboardController.response(
                    DashboardController._200,
                    {
                        totalValueUsd: portfolio.totalValueUsd,
                        totalValueKes: portfolio.totalValueUsd * kesUsdRate,
                        allTimeReturnPercent: portfolio.allTimeReturnPercent,
                        totalGainsUsd: portfolio.totalGainsUsd,
                        monthlyEarnings: portfolio.monthlyEarningsEstimate
                    }
                )
            );

        } catch (error: any) {
            console.error('Get portfolio summary error:', error);
            return res.json(
                DashboardController.response(
                    DashboardController._500,
                    null,
                    DashboardController.ex(error)
                )
            );
        }
    }

    /**
     * Get user statistics
     * @param req Express Request
     * @param res Express Response
     */
    async getStats(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;

            if (!userId) {
                return res.json(
                    DashboardController.response(
                        DashboardController._401,
                        null,
                        ['Not authenticated']
                    )
                );
            }

            // Get user using user.repo.ts method
            const user = await this.userRepo.getById(userId);
            // Get portfolio using portfolio.repo.ts method
            const portfolio = await this.portfolioRepo.getByUserId(userId);

            if (!user || !portfolio) {
                return res.json(
                    DashboardController.response(
                        DashboardController._404,
                        null,
                        ['User or portfolio not found']
                    )
                );
            }

            return res.json(
                DashboardController.response(
                    DashboardController._200,
                    {
                        totalPoints: user.totalPoints,
                        level: user.level,
                        levelTitle: user.levelTitle,
                        currentStreak: user.currentStreak,
                        longestStreak: user.longestStreak,
                        totalDeposited: portfolio.totalDeposited,
                        totalWithdrawn: portfolio.totalWithdrawn,
                        allTimeReturn: portfolio.allTimeReturnPercent,
                        memberSince: user.createdAt
                    }
                )
            );

        } catch (error: any) {
            console.error('Get stats error:', error);
            return res.json(
                DashboardController.response(
                    DashboardController._500,
                    null,
                    DashboardController.ex(error)
                )
            );
        }
    }

    /**
     * Check if portfolio needs rebalancing
     * @param portfolio Portfolio entity
     * @param user User entity
     * @returns boolean
     */
    private needsRebalance(portfolio: any, user: any): boolean {
        const drift = Math.abs(portfolio.stableYieldsPercent - user.targetStableYieldsPercent) +
                     Math.abs(portfolio.tokenizedStocksPercent - user.targetTokenizedStocksPercent) +
                     Math.abs(portfolio.tokenizedGoldPercent - user.targetTokenizedGoldPercent);

        return drift > 5;
    }
}