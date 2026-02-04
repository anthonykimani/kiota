import { Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repo';
import { PortfolioRepository } from '../repositories/portfolio.repo';
import { WalletRepository } from '../repositories/wallet.repo';
import { GoalRepository } from '../repositories/goal.repo';
import { MarketDataRepository } from '../repositories/market-data.repo';
import { AssetSymbol } from '../enums/MarketData';
import { formatUnits, parseAbi } from 'viem';
import Controller from './controller';
import { AuthenticatedRequest } from '../interfaces/IAuth';
import { assetRegistry } from '../services/asset-registry.service';
import { createChainClient, getChainConfig, getCurrentNetwork } from '../configs/chain.config';
import { TOKEN_METADATA, getTokenAddress } from '../configs/tokens.config';

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
            const walletRepo: WalletRepository = new WalletRepository();
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
            const wallet = await walletRepo.getByUserId(userId);

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

            const monthlyChange = portfolio.thisMonthYield || 0;

            const stablePrimary = await assetRegistry.getPrimaryAssetByClassKey('stable_yields');
            const stocksPrimary = await assetRegistry.getPrimaryAssetByClassKey('tokenized_stocks');
            const goldPrimary = await assetRegistry.getPrimaryAssetByClassKey('tokenized_gold');

            const chainNetwork = getCurrentNetwork();
            const chainConfig = getChainConfig();
            const publicClient = createChainClient();
            const erc20Abi = parseAbi([
                'function balanceOf(address owner) view returns (uint256)'
            ]);

            const getOnchainBalance = async (symbol: keyof typeof TOKEN_METADATA): Promise<number | null> => {
                try {
                    const address = getTokenAddress(symbol, chainNetwork);
                    const rawBalance = await publicClient.readContract({
                        address: address as `0x${string}`,
                        abi: erc20Abi,
                        functionName: 'balanceOf',
                        args: [wallet?.address as `0x${string}`],
                    });
                    const decimals = TOKEN_METADATA[symbol].decimals;
                    return Number(formatUnits(rawBalance as bigint, decimals));
                } catch {
                    return null;
                }
            };

            const [onchainUsdc, onchainUsdm, onchainIvvon, onchainPaxg] = wallet?.address
                ? await Promise.all([
                    getOnchainBalance('USDC'),
                    getOnchainBalance('USDM'),
                    getOnchainBalance('IVVON'),
                    getOnchainBalance('PAXG'),
                ])
                : [null, null, null, null];

            let stableMarket = null;
            let stocksMarket = null;
            let goldMarket = null;

            const normalizeSymbol = (symbol?: string | null): AssetSymbol | null => {
                if (!symbol) return null;
                return symbol.toLowerCase() as AssetSymbol;
            };

            try {
                const stableSymbol = normalizeSymbol(stablePrimary?.symbol);
                const stocksSymbol = normalizeSymbol(stocksPrimary?.symbol);
                const goldSymbol = normalizeSymbol(goldPrimary?.symbol);

                stableMarket = stableSymbol
                    ? await marketDataRepo.getAssetData(stableSymbol)
                    : null;
                stocksMarket = stocksSymbol
                    ? await marketDataRepo.getAssetData(stocksSymbol)
                    : null;
                goldMarket = goldSymbol
                    ? await marketDataRepo.getAssetData(goldSymbol)
                    : null;
            } catch (error) {
                // Gracefully degrade if market data isn't available yet
                stableMarket = null;
                stocksMarket = null;
                goldMarket = null;
            }

            const getMonthlyEarnings = (valueUsd: number, apy?: number, avgReturn?: number) => {
                const rate = apy ?? avgReturn ?? 0;
                return valueUsd * (Number(rate) / 100) / 12;
            };

            const stableBalance = onchainUsdm ?? (wallet?.stableYieldBalance ?? 0);
            const stocksBalance = onchainIvvon ?? (wallet?.tokenizedStocksBalance ?? 0);
            const goldBalance = onchainPaxg ?? (wallet?.tokenizedGoldBalance ?? 0);
            const onchainHoldingsPresent = [stableBalance, stocksBalance, goldBalance].some(amount => amount > 0);

            const stablePrice = stableMarket?.price != null ? Number(stableMarket.price) : 1;
            const stocksPrice = stocksMarket?.price != null ? Number(stocksMarket.price) : 0;
            const goldPrice = goldMarket?.price != null ? Number(goldMarket.price) : 0;

            const stableValueUsd = stableBalance * stablePrice;
            const stocksValueUsd = stocksBalance * stocksPrice;
            const goldValueUsd = goldBalance * goldPrice;

            const onchainTotalValueUsd = stableValueUsd + stocksValueUsd + goldValueUsd;
            const portfolioTotalValueUsd = onchainHoldingsPresent ? onchainTotalValueUsd : 0;
            const monthlyChangePercent = portfolioTotalValueUsd > 0
                ? (monthlyChange / portfolioTotalValueUsd) * 100
                : 0;

            const assets = [
                {
                    classKey: 'stable_yields',
                    name: 'Stable Yields',
                    primaryAssetSymbol: stablePrimary?.symbol || null,
                    valueUsd: onchainHoldingsPresent ? stableValueUsd : 0,
                    percentage: onchainHoldingsPresent && portfolioTotalValueUsd > 0
                        ? (stableValueUsd / portfolioTotalValueUsd) * 100
                        : 0,
                    monthlyEarnings: getMonthlyEarnings(
                        onchainHoldingsPresent ? stableValueUsd : 0,
                        stableMarket?.currentApy != null ? Number(stableMarket.currentApy) : undefined
                    ),
                    apy: stableMarket?.currentApy != null ? Number(stableMarket.currentApy) : undefined,
                    price: stableMarket?.price != null ? Number(stableMarket.price) : undefined,
                    change: stableMarket?.change24h != null ? Number(stableMarket.change24h) : undefined,
                    changePercent: stableMarket?.changePercent24h != null ? Number(stableMarket.changePercent24h) : undefined,
                },
                {
                    classKey: 'tokenized_stocks',
                    name: 'Tokenized Stocks',
                    primaryAssetSymbol: stocksPrimary?.symbol || null,
                    valueUsd: onchainHoldingsPresent ? stocksValueUsd : 0,
                    percentage: onchainHoldingsPresent && portfolioTotalValueUsd > 0
                        ? (stocksValueUsd / portfolioTotalValueUsd) * 100
                        : 0,
                    monthlyEarnings: getMonthlyEarnings(
                        onchainHoldingsPresent ? stocksValueUsd : 0,
                        undefined,
                        stocksMarket?.currentApy != null ? Number(stocksMarket.currentApy) : undefined
                    ),
                    avgReturn: stocksMarket?.currentApy != null ? Number(stocksMarket.currentApy) : undefined,
                    requiresTier2: true,
                    price: stocksMarket?.price != null ? Number(stocksMarket.price) : undefined,
                    change: stocksMarket?.change24h != null ? Number(stocksMarket.change24h) : undefined,
                    changePercent: stocksMarket?.changePercent24h != null ? Number(stocksMarket.changePercent24h) : undefined,
                },
                {
                    classKey: 'tokenized_gold',
                    name: 'Tokenized Gold',
                    primaryAssetSymbol: goldPrimary?.symbol || null,
                    valueUsd: onchainHoldingsPresent ? goldValueUsd : 0,
                    percentage: onchainHoldingsPresent && portfolioTotalValueUsd > 0
                        ? (goldValueUsd / portfolioTotalValueUsd) * 100
                        : 0,
                    monthlyEarnings: getMonthlyEarnings(
                        onchainHoldingsPresent ? goldValueUsd : 0,
                        goldMarket?.currentApy != null ? Number(goldMarket.currentApy) : undefined
                    ),
                    apy: goldMarket?.currentApy != null ? Number(goldMarket.currentApy) : undefined,
                    price: goldMarket?.price != null ? Number(goldMarket.price) : undefined,
                    change: goldMarket?.change24h != null ? Number(goldMarket.change24h) : undefined,
                    changePercent: goldMarket?.changePercent24h != null ? Number(goldMarket.changePercent24h) : undefined,
                }
            ].filter(asset => asset.valueUsd > 0);

            const marketPerformance = [
                stablePrimary?.symbol ? {
                    symbol: stablePrimary.symbol,
                    name: stablePrimary.name,
                    price: stableMarket?.price != null ? Number(stableMarket.price) : 1,
                    change: stableMarket?.change24h != null ? Number(stableMarket.change24h) : 0,
                    changePercent: stableMarket?.changePercent24h != null ? Number(stableMarket.changePercent24h) : 0,
                } : null,
                stocksPrimary?.symbol ? {
                    symbol: stocksPrimary.symbol,
                    name: stocksPrimary.name,
                    price: stocksMarket?.price != null ? Number(stocksMarket.price) : 0,
                    change: stocksMarket?.change24h != null ? Number(stocksMarket.change24h) : 0,
                    changePercent: stocksMarket?.changePercent24h != null ? Number(stocksMarket.changePercent24h) : 0,
                } : null,
                goldPrimary?.symbol ? {
                    symbol: goldPrimary.symbol,
                    name: goldPrimary.name,
                    price: goldMarket?.price != null ? Number(goldMarket.price) : 0,
                    change: goldMarket?.change24h != null ? Number(goldMarket.change24h) : 0,
                    changePercent: goldMarket?.changePercent24h != null ? Number(goldMarket.changePercent24h) : 0,
                } : null,
            ].filter(Boolean);

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
                chain: {
                    id: chainNetwork,
                    name: chainConfig.name,
                    isTestnet: chainConfig.isTestnet
                },
                onchain: {
                    hasHoldings: onchainHoldingsPresent,
                    totalValueUsd: onchainTotalValueUsd
                },
                wallet: {
                    usdcBalance: onchainUsdc ?? (wallet?.usdcBalance ?? 0),
                    stableYieldBalance: stableBalance,
                    tokenizedStocksBalance: stocksBalance,
                    tokenizedGoldBalance: goldBalance,
                },
                portfolio: {
                    totalValueUsd: portfolioTotalValueUsd,
                    totalValueKes: portfolioTotalValueUsd * kesUsdRate,
                    monthlyChange: monthlyChange,
                    monthlyChangePercent: monthlyChangePercent,
                    monthlyTrend: monthlyChangePercent > 0 ? 'up' : monthlyChangePercent < 0 ? 'down' : 'stable'
                },
                assets: assets,
                marketPerformance,
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
