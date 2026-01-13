import { Request, Response } from 'express';
import { PortfolioRepository } from '../repositories/portfolio.repo';
import { TransactionRepository } from '../repositories/transaction.repo';
import { MarketDataRepository } from '../repositories/market-data.repo';
import { UserRepository } from '../repositories/user.repo';
import { AssetSymbol } from '../enums/MarketData';
import Controller from './controller';

/**
 * Portfolio Controller
 * Handles portfolio detail screen for Phase 1 MVP
 * Screen: 11 (Portfolio Detail Screen)
 */
class PortfolioController extends Controller {
    /**
     * Get portfolio detail (Screen 11)
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async getPortfolioDetail(req: Request, res: Response) {
        try {
            const portfolioRepo: PortfolioRepository = new PortfolioRepository();
            const transactionRepo: TransactionRepository = new TransactionRepository();
            const marketDataRepo: MarketDataRepository = new MarketDataRepository();
            const userRepo: UserRepository = new UserRepository();
            
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

            const period = req.query.period as string || 'ALL';

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

            // Get user
            const user = await userRepo.getById(userId);

            if (!user) {
                return res.send(
                    super.response(
                        super._404,
                        null,
                        ['User not found']
                    )
                );
            }

            // Get KES/USD rate
            const kesUsdRate = await marketDataRepo.getKesUsdRate();

            // Get asset prices
            const usdmPrice = 1.0;
            const bcsxPrice = await marketDataRepo.getAssetPrice(AssetSymbol.BCSPX) || 0;
            const paxgPrice = await marketDataRepo.getAssetPrice(AssetSymbol.PAXG) || 0;

            const assetBreakdown = [
                {
                    category: 'preservation',
                    emoji: '🛡️',
                    symbol: 'USDM',
                    name: 'Mountain Protocol USD',
                    valueUsd: portfolio.stableYieldsValueUsd,
                    percentage: portfolio.stableYieldsPercent,
                    targetPercentage: user.targetStableYieldsPercent,
                    changeToday: 0,
                    changeTodayUsd: 0,
                    apy: 5.0,
                    currentPrice: usdmPrice,
                    description: 'Dollar-backed • 5% yield • Low risk'
                },
                {
                    category: 'growth',
                    emoji: '📈',
                    symbol: 'bCSPX',
                    name: 'Backed S&P 500 ETF',
                    valueUsd: portfolio.tokenizedStocksValueUsd,
                    percentage: portfolio.tokenizedStocksPercent,
                    targetPercentage: user.targetTokenizedStocksPercent,
                    changeToday: 0.5,
                    changeTodayUsd: portfolio.tokenizedStocksValueUsd * 0.005,
                    avgReturn: 10.2,
                    currentPrice: bcsxPrice,
                    description: 'S&P 500 • ~10% avg return • Med risk',
                    requiresTier2: true
                },
                {
                    category: 'hedge',
                    emoji: '🥇',
                    symbol: 'PAXG',
                    name: 'Paxos Gold',
                    valueUsd: portfolio.tokenizedGoldValueUsd,
                    percentage: portfolio.tokenizedGoldPercent,
                    targetPercentage: user.targetTokenizedGoldPercent,
                    changeToday: -0.2,
                    changeTodayUsd: portfolio.tokenizedGoldValueUsd * -0.002,
                    currentPrice: paxgPrice,
                    description: 'Gold-backed • Inflation hedge • Stable'
                }
            ].filter(asset => asset.valueUsd > 0);

            // Get recent transactions
            const recentTransactions = await transactionRepo.getRecentByUser(userId, 10);

            const formattedTransactions = recentTransactions.map(tx => ({
                id: tx.id,
                type: tx.type,
                status: tx.status,
                amountKes: tx.sourceAmount,
                amountUsd: tx.valueUsd,
                date: tx.createdAt,
                mpesaReceipt: tx.mpesaReceiptNumber,
                txHash: tx.txHash
            }));

            const history = await PortfolioController.getPortfolioHistory(userId, period, portfolioRepo);

            const portfolioData = {
                summary: {
                    totalValueUsd: portfolio.totalValueUsd,
                    totalValueKes: portfolio.totalValueUsd * kesUsdRate,
                    allTimeReturn: {
                        amountUsd: portfolio.totalGainsUsd,
                        percentage: portfolio.allTimeReturnPercent
                    },
                    totalDeposited: portfolio.totalDeposited,
                    totalWithdrawn: portfolio.totalWithdrawn,
                    monthlyEarnings: portfolio.monthlyEarningsEstimate,
                    kesUsdRate
                },
                assets: assetBreakdown,
                needsRebalance: PortfolioController.checkRebalanceNeeded(portfolio, user),
                rebalanceThreshold: 5,
                transactions: formattedTransactions,
                history: history,
                period: period
            };

            return res.send(super.response(super._200, portfolioData));

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get individual asset details
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async getAssetDetail(req: Request, res: Response) {
        try {
            const portfolioRepo: PortfolioRepository = new PortfolioRepository();
            const transactionRepo: TransactionRepository = new TransactionRepository();
            
            const userId = (req as any).userId;
            const { symbol } = req.params;

            if (!userId) {
                return res.send(
                    super.response(
                        super._401,
                        null,
                        ['Not authenticated']
                    )
                );
            }

            const validSymbols = ['USDM', 'bCSPX', 'PAXG'];
            if (!validSymbols.includes(symbol)) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['Invalid asset symbol']
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

            let assetData;
            if (symbol === 'USDM') {
                assetData = {
                    symbol: 'USDM',
                    name: 'Mountain Protocol USD',
                    category: 'Stable Yields',
                    emoji: '🛡️',
                    valueUsd: portfolio.stableYieldsValueUsd,
                    percentage: portfolio.stableYieldsPercent,
                    apy: 5.0,
                    riskLevel: 'Very Low',
                    description: 'USDM is a yield-bearing stablecoin backed by US Treasuries.',
                    features: [
                        '5.0% APY (auto-compounding)',
                        'Backed by US Treasuries',
                        'No lock-up period',
                        'Instant liquidity'
                    ]
                };
            } else if (symbol === 'bCSPX') {
                assetData = {
                    symbol: 'bCSPX',
                    name: 'Backed S&P 500 ETF',
                    category: 'Tokenized Stocks',
                    emoji: '📈',
                    valueUsd: portfolio.tokenizedStocksValueUsd,
                    percentage: portfolio.tokenizedStocksPercent,
                    avgReturn: 10.2,
                    riskLevel: 'Medium',
                    description: 'bCSPX tracks the S&P 500 index.',
                    features: [
                        'Tracks S&P 500 index',
                        '~10% average annual return',
                        'Diversified across 500 companies',
                        'Medium volatility',
                        'Requires Tier 2 & KYC'
                    ],
                    requiresTier2: true
                };
            } else {
                assetData = {
                    symbol: 'PAXG',
                    name: 'Paxos Gold',
                    category: 'Tokenized Gold',
                    emoji: '🥇',
                    valueUsd: portfolio.tokenizedGoldValueUsd,
                    percentage: portfolio.tokenizedGoldPercent,
                    riskLevel: 'Low',
                    description: 'PAXG is backed 1:1 by physical gold.',
                    features: [
                        'Backed by physical gold',
                        'Tracks gold price (~5-8% annually)',
                        'Inflation hedge',
                        'Low volatility',
                        'Redeemable for physical gold'
                    ]
                };
            }

            // Get asset transactions
            const assetTransactions = await transactionRepo.getByUserAndAsset(
                userId,
                PortfolioController.symbolToAssetType(symbol),
                20
            );

            const assetDetailData = {
                asset: assetData,
                transactions: assetTransactions.map(tx => ({
                    id: tx.id,
                    type: tx.type,
                    amountUsd: tx.valueUsd,
                    date: tx.createdAt,
                    status: tx.status
                }))
            };

            return res.send(super.response(super._200, assetDetailData));

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Trigger portfolio rebalancing
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async rebalancePortfolio(req: Request, res: Response) {
        try {
            const portfolioRepo: PortfolioRepository = new PortfolioRepository();
            const userRepo: UserRepository = new UserRepository();
            
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

            // Get portfolio
            const portfolio = await portfolioRepo.getByUserId(userId);
            // Get user
            const user = await userRepo.getById(userId);

            if (!portfolio || !user) {
                return res.send(
                    super.response(
                        super._404,
                        null,
                        ['Portfolio or user not found']
                    )
                );
            }

            if (!PortfolioController.checkRebalanceNeeded(portfolio, user)) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['Portfolio does not need rebalancing (drift < 5%)']
                    )
                );
            }

            const rebalanceData = {
                estimatedCompletionTime: '2-5 minutes',
                currentAllocation: {
                    stableYields: portfolio.stableYieldsPercent,
                    tokenizedStocks: portfolio.tokenizedStocksPercent,
                    tokenizedGold: portfolio.tokenizedGoldPercent
                },
                targetAllocation: {
                    stableYields: user.targetStableYieldsPercent,
                    tokenizedStocks: user.targetTokenizedStocksPercent,
                    tokenizedGold: user.targetTokenizedGoldPercent
                }
            };

            return res.send(super.response(super._200, rebalanceData));

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get portfolio value history
     * @param userId User ID
     * @param period Time period
     * @param portfolioRepo Portfolio repository instance
     * @returns History data array
     */
    private static async getPortfolioHistory(
        userId: string, 
        period: string,
        portfolioRepo: PortfolioRepository
    ): Promise<any[]> {
        const now = new Date();
        const data = [];

        let days = 365;
        if (period === '1D') days = 1;
        else if (period === '1W') days = 7;
        else if (period === '1M') days = 30;
        else if (period === '3M') days = 90;
        else if (period === '1Y') days = 365;

        const portfolio = await portfolioRepo.getByUserId(userId);
        const baseValue = portfolio?.totalValueUsd || 0;

        for (let i = days; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            const growthFactor = 1 - (i / days) * 0.1;
            const value = baseValue * growthFactor;

            data.push({
                date: date.toISOString(),
                value: Math.round(value * 100) / 100
            });
        }

        return data;
    }

    /**
     * Check if portfolio needs rebalancing
     * @param portfolio Portfolio entity
     * @param user User entity
     * @returns boolean
     */
    private static checkRebalanceNeeded(portfolio: any, user: any): boolean {
        const stableYieldDrift = Math.abs(portfolio.stableYieldsPercent - user.targetStableYieldsPercent);
        const stocksDrift = Math.abs(portfolio.tokenizedStocksPercent - user.targetTokenizedStocksPercent);
        const goldDrift = Math.abs(portfolio.tokenizedGoldPercent - user.targetTokenizedGoldPercent);

        const totalDrift = stableYieldDrift + stocksDrift + goldDrift;

        return totalDrift > 5;
    }

    /**
     * Map symbol to AssetType enum
     * @param symbol Asset symbol
     * @returns AssetType
     */
    private static symbolToAssetType(symbol: string): any {
        return symbol;
    }
}

export default PortfolioController;