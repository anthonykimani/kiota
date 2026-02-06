import { Request, Response } from 'express';
import { PortfolioRepository } from '../repositories/portfolio.repo';
import { WalletRepository } from '../repositories/wallet.repo';
import { TransactionRepository } from '../repositories/transaction.repo';
import { TransactionType } from '../enums/Transaction';
import { MarketDataRepository } from '../repositories/market-data.repo';
import { UserRepository } from '../repositories/user.repo';
import { PortfolioHoldingRepository } from '../repositories/portfolio-holding.repo';
import Controller from './controller';
import { AuthenticatedRequest } from '../interfaces/IAuth';
import { assetRegistry } from '../services/asset-registry.service';

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
            const holdingRepo: PortfolioHoldingRepository = new PortfolioHoldingRepository();
            const marketDataRepo: MarketDataRepository = new MarketDataRepository();
            const userRepo: UserRepository = new UserRepository();
            
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

            const assetBreakdown = [
                {
                    classKey: 'stable_yields',
                    name: 'Stable Yields',
                    valueUsd: portfolio.stableYieldsValueUsd,
                    percentage: portfolio.stableYieldsPercent,
                    targetPercentage: user.targetStableYieldsPercent,
                    apy: 5.0,
                },
                {
                    classKey: 'defi_yield',
                    name: 'DeFi Yield',
                    valueUsd: portfolio.defiYieldValueUsd,
                    percentage: portfolio.defiYieldPercent,
                    targetPercentage: user.targetDefiYieldPercent,
                    apy: 6.0,
                },
                {
                    classKey: 'bluechip_crypto',
                    name: 'Blue Chip Crypto',
                    valueUsd: portfolio.bluechipCryptoValueUsd,
                    percentage: portfolio.bluechipCryptoPercent,
                    targetPercentage: user.targetBluechipCryptoPercent,
                    avgReturn: 15.0,
                },
                {
                    classKey: 'tokenized_gold',
                    name: 'Tokenized Gold',
                    valueUsd: portfolio.tokenizedGoldValueUsd,
                    percentage: portfolio.tokenizedGoldPercent,
                    targetPercentage: user.targetTokenizedGoldPercent,
                }
            ].filter(asset => asset.valueUsd > 0);

            const holdings = await holdingRepo.getByPortfolio(portfolio.id);
            const holdingsData = await Promise.all(
                holdings.map(async (holding) => {
                    const asset = await assetRegistry.getAssetBySymbol(holding.assetSymbol);
                    return {
                        symbol: holding.assetSymbol,
                        name: asset?.name || holding.assetSymbol,
                        assetClassKey: holding.assetCategory,
                        balance: Number(holding.balance),
                        valueUsd: Number(holding.valueUsd),
                        lastUpdated: holding.lastUpdated,
                    };
                })
            );

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
                holdings: holdingsData,
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
            const holdingRepo: PortfolioHoldingRepository = new PortfolioHoldingRepository();
            
            const userId = (req as AuthenticatedRequest).userId;
            const { symbol } = req.params;
            const assetSymbol = String(symbol).toUpperCase();

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

            const holding = await holdingRepo.getByPortfolioAndSymbol(portfolio.id, assetSymbol);

            if (!holding) {
                return res.send(
                    super.response(
                        super._404,
                        null,
                        ['Asset holding not found']
                    )
                );
            }

            const asset = await assetRegistry.getAssetBySymbol(assetSymbol);
            const assetData = {
                symbol: assetSymbol,
                name: asset?.name || assetSymbol,
                assetClassKey: holding.assetCategory,
                valueUsd: Number(holding.valueUsd),
                balance: Number(holding.balance),
                riskLevel: asset?.metadata?.riskLevel || null,
                description: asset?.metadata?.description || null,
                features: asset?.metadata?.features || [],
            };

            // Get asset transactions
            const assetTransactions = await transactionRepo.getByUserAndAsset(
                userId,
                assetSymbol,
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
            const walletRepo = new WalletRepository();

            const userId = (req as AuthenticatedRequest).userId;
            const { force = false } = req.body || {};

            if (!userId) {
                return res.send(
                    super.response(
                        super._401,
                        null,
                        ['Not authenticated']
                    )
                );
            }

            // Get portfolio and user
            const portfolio = await portfolioRepo.getByUserId(userId);
            const user = await userRepo.getById(userId);
            const wallet = await walletRepo.getByUserId(userId);

            if (!portfolio || !user || !wallet) {
                return res.send(
                    super.response(
                        super._404,
                        null,
                        ['Portfolio, user, or wallet not found']
                    )
                );
            }

            // Check if rebalance is needed (unless forced)
            if (!force && !PortfolioController.checkRebalanceNeeded(portfolio, user)) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['Portfolio does not need rebalancing (drift < 5%). Use force=true to rebalance anyway.']
                    )
                );
            }

            // Import rebalance service and token config
            const { rebalanceService } = await import('../services/rebalance.service');
            const { SwapRepository } = await import('../repositories/swap.repo');
            const { SWAP_EXECUTION_QUEUE } = await import('../configs/queue.config');
            const { v4: uuidv4 } = await import('uuid');

            // Prepare data for rebalance calculation
            const currentAllocation = {
                stableYields: Number(portfolio.stableYieldsPercent),
                defiYield: Number(portfolio.defiYieldPercent),
                tokenizedGold: Number(portfolio.tokenizedGoldPercent),
                bluechipCrypto: Number(portfolio.bluechipCryptoPercent),
            };

            const targetAllocation = {
                stableYields: Number(user.targetStableYieldsPercent),
                defiYield: Number(user.targetDefiYieldPercent),
                tokenizedGold: Number(user.targetTokenizedGoldPercent),
                bluechipCrypto: Number(user.targetBluechipCryptoPercent),
            };

            const currentBalances = {
                stableYields: Number(wallet.stableYieldBalance) || 0,
                defiYield: Number(wallet.defiYieldBalance) || 0,
                tokenizedGold: Number(wallet.tokenizedGoldBalance) || 0,
                bluechipCrypto: Number(wallet.bluechipCryptoBalance) || 0,
            };

            const totalValueUsd = Number(portfolio.totalValueUsd);

            // Calculate required swaps
            const rebalanceResult = await rebalanceService.calculateRebalance({
                currentAllocation,
                targetAllocation,
                totalValueUsd,
                currentBalances,
            });

            if (rebalanceResult.swaps.length === 0) {
                return res.send(
                    super.response(
                        super._400,
                        {
                            message: 'No swaps needed',
                            currentAllocation,
                            targetAllocation,
                            drift: rebalanceResult.drift,
                        },
                        ['Portfolio is already balanced or swaps would be < $1']
                    )
                );
            }

            // Create rebalance group ID (links all swaps in same rebalance operation)
            const rebalanceGroupId = uuidv4();

            // Create swap transactions and queue execution jobs
            const swapRepo = new SwapRepository();
            const createdSwaps = [];

            for (const swap of rebalanceResult.swaps) {
                // Get quote for estimated output (simplified - just use 1:1 for now)
                const estimatedToAmount = swap.fromAmount * 0.998; // Assume 0.2% slippage

                // Create swap transaction
                const transaction = await swapRepo.createSwap({
                    userId,
                    fromAsset: swap.fromAsset,
                    toAsset: swap.toAsset,
                    fromAmount: swap.fromAmount,
                    estimatedToAmount,
                    slippage: 1.0,
                    metadata: {
                        rebalanceGroupId,
                        initiatedVia: 'rebalance-endpoint',
                    },
                    type: 'rebalance' as any, // TransactionType.REBALANCE
                });

                // Queue swap execution job
                await SWAP_EXECUTION_QUEUE.add(
                    {
                        transactionId: transaction.id,
                        userId,
                        fromAsset: swap.fromAsset,
                        toAsset: swap.toAsset,
                        amount: swap.fromAmount,
                        slippage: 1.0,
                    },
                    {
                        attempts: 3,
                        backoff: {
                            type: 'exponential',
                            delay: 2000,
                        },
                        jobId: `swap-execute-${transaction.id}`,
                        removeOnComplete: true,
                        removeOnFail: false,
                    }
                );

                createdSwaps.push({
                    transactionId: transaction.id,
                    fromAsset: swap.fromAsset,
                    toAsset: swap.toAsset,
                    amount: swap.fromAmount,
                });
            }

            // Return rebalance plan
            const rebalanceData = {
                rebalanceGroupId,
                status: 'pending',
                estimatedCompletionTime: '5-10 minutes',
                currentAllocation,
                targetAllocation,
                drift: rebalanceResult.drift.toFixed(2),
                totalSwapValue: rebalanceResult.totalSwapValue.toFixed(2),
                requiredSwaps: createdSwaps,
                swapCount: createdSwaps.length,
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
        const data = [] as Array<{ date: string; value: number }>;

        let days = 365;
        if (period === '1D') days = 1;
        else if (period === '1W') days = 7;
        else if (period === '1M') days = 30;
        else if (period === '3M') days = 90;
        else if (period === '1Y') days = 365;

        const startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - days);

        const portfolio = await portfolioRepo.getByUserId(userId);
        const currentTotal = Number(portfolio?.totalValueUsd || 0);

        const txRepo = new TransactionRepository();
        const transactions = await txRepo.getCompletedForHistory(userId, startDate);

        // Aggregate daily net changes from transactions
        const dailyDeltas = new Map<string, number>();
        let totalDeltaInPeriod = 0;

        for (const tx of transactions) {
            const date = tx.completedAt || tx.createdAt;
            const dayKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
            const valueUsd = Number(tx.valueUsd || 0);

            let delta = 0;
            switch (tx.type) {
                case TransactionType.DEPOSIT:
                case TransactionType.YIELD:
                case TransactionType.SUBSIDY:
                case TransactionType.REBATE:
                    delta = valueUsd;
                    break;
                case TransactionType.WITHDRAWAL:
                case TransactionType.FEE:
                    delta = -valueUsd;
                    break;
                default:
                    delta = 0;
            }

            if (delta !== 0) {
                dailyDeltas.set(dayKey, (dailyDeltas.get(dayKey) || 0) + delta);
                totalDeltaInPeriod += delta;
            }
        }

        // Seed base value so the last point matches current total
        let runningValue = Math.max(0, currentTotal - totalDeltaInPeriod);

        for (let i = 0; i <= days; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dayKey = date.toISOString().slice(0, 10);

            const delta = dailyDeltas.get(dayKey) || 0;
            runningValue = Math.max(0, runningValue + delta);

            data.push({
                date: date.toISOString(),
                value: Math.round(runningValue * 100) / 100,
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
        const defiYieldDrift = Math.abs(portfolio.defiYieldPercent - user.targetDefiYieldPercent);
        const cryptoDrift = Math.abs(portfolio.bluechipCryptoPercent - user.targetBluechipCryptoPercent);
        const goldDrift = Math.abs(portfolio.tokenizedGoldPercent - user.targetTokenizedGoldPercent);

        const totalDrift = stableYieldDrift + defiYieldDrift + cryptoDrift + goldDrift;

        return totalDrift > 5;
    }

}

export default PortfolioController;
