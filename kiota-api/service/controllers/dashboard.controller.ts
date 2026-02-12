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
            const defiYieldPrimary = await assetRegistry.getPrimaryAssetByClassKey('defi_yield');
            const cryptoPrimary = await assetRegistry.getPrimaryAssetByClassKey('bluechip_crypto');
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

            const [onchainUsdc, onchainUsdm, onchainUsde, onchainWeth, onchainPaxg] = wallet?.address
                ? await Promise.all([
                    getOnchainBalance('USDC'),
                    getOnchainBalance('USDM'),
                    getOnchainBalance('USDE'),
                    getOnchainBalance('WETH'),
                    getOnchainBalance('PAXG'),
                ])
                : [null, null, null, null, null];

            let stableMarket = null;
            let defiYieldMarket = null;
            let cryptoMarket = null;
            let goldMarket = null;

            const normalizeSymbol = (symbol?: string | null): AssetSymbol | null => {
                if (!symbol) return null;
                return symbol.toLowerCase() as AssetSymbol;
            };

            try {
                const stableSymbol = normalizeSymbol(stablePrimary?.symbol);
                const defiYieldSymbol = normalizeSymbol(defiYieldPrimary?.symbol);
                const cryptoSymbol = normalizeSymbol(cryptoPrimary?.symbol);
                const goldSymbol = normalizeSymbol(goldPrimary?.symbol);

                stableMarket = stableSymbol
                    ? await marketDataRepo.getAssetData(stableSymbol)
                    : null;
                defiYieldMarket = defiYieldSymbol
                    ? await marketDataRepo.getAssetData(defiYieldSymbol)
                    : null;
                cryptoMarket = cryptoSymbol
                    ? await marketDataRepo.getAssetData(cryptoSymbol)
                    : null;
                goldMarket = goldSymbol
                    ? await marketDataRepo.getAssetData(goldSymbol)
                    : null;
            } catch (error) {
                // Gracefully degrade if market data isn't available yet
                stableMarket = null;
                cryptoMarket = null;
                goldMarket = null;
            }

            const getMonthlyEarnings = (valueUsd: number, apy?: number, avgReturn?: number) => {
                const rate = apy ?? avgReturn ?? 0;
                return valueUsd * (Number(rate) / 100) / 12;
            };

            const stableBalance = onchainUsdm ?? (wallet?.stableYieldBalance ?? 0);
            const defiYieldBalance = onchainUsde ?? (wallet?.defiYieldBalance ?? 0);
            const cryptoBalance = onchainWeth ?? (wallet?.bluechipCryptoBalance ?? 0);
            const goldBalance = onchainPaxg ?? (wallet?.tokenizedGoldBalance ?? 0);
            const onchainHoldingsPresent = [stableBalance, defiYieldBalance, cryptoBalance, goldBalance].some(amount => amount > 0);

            const stablePrice = stableMarket?.price != null ? Number(stableMarket.price) : 1;
            const defiYieldPrice = defiYieldMarket?.price != null ? Number(defiYieldMarket.price) : 1;
            const cryptoPrice = cryptoMarket?.price != null ? Number(cryptoMarket.price) : 0;
            const goldPrice = goldMarket?.price != null ? Number(goldMarket.price) : 0;

            const stableValueUsd = stableBalance * stablePrice;
            const defiYieldValueUsd = defiYieldBalance * defiYieldPrice;
            const cryptoValueUsd = cryptoBalance * cryptoPrice;
            const goldValueUsd = goldBalance * goldPrice;

            const onchainTotalValueUsd = stableValueUsd + defiYieldValueUsd + cryptoValueUsd + goldValueUsd;
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
                    classKey: 'defi_yield',
                    name: 'DeFi Yield',
                    primaryAssetSymbol: defiYieldPrimary?.symbol || null,
                    valueUsd: onchainHoldingsPresent ? defiYieldValueUsd : 0,
                    percentage: onchainHoldingsPresent && portfolioTotalValueUsd > 0
                        ? (defiYieldValueUsd / portfolioTotalValueUsd) * 100
                        : 0,
                    monthlyEarnings: getMonthlyEarnings(
                        onchainHoldingsPresent ? defiYieldValueUsd : 0,
                        defiYieldMarket?.currentApy != null ? Number(defiYieldMarket.currentApy) : undefined
                    ),
                    apy: defiYieldMarket?.currentApy != null ? Number(defiYieldMarket.currentApy) : undefined,
                    price: defiYieldMarket?.price != null ? Number(defiYieldMarket.price) : undefined,
                    change: defiYieldMarket?.change24h != null ? Number(defiYieldMarket.change24h) : undefined,
                    changePercent: defiYieldMarket?.changePercent24h != null ? Number(defiYieldMarket.changePercent24h) : undefined,
                },
                {
                    classKey: 'bluechip_crypto',
                    name: 'Blue Chip Crypto',
                    primaryAssetSymbol: cryptoPrimary?.symbol || null,
                    valueUsd: onchainHoldingsPresent ? cryptoValueUsd : 0,
                    percentage: onchainHoldingsPresent && portfolioTotalValueUsd > 0
                        ? (cryptoValueUsd / portfolioTotalValueUsd) * 100
                        : 0,
                    monthlyEarnings: getMonthlyEarnings(
                        onchainHoldingsPresent ? cryptoValueUsd : 0,
                        undefined,
                        cryptoMarket?.currentApy != null ? Number(cryptoMarket.currentApy) : undefined
                    ),
                    avgReturn: cryptoMarket?.currentApy != null ? Number(cryptoMarket.currentApy) : undefined,
                    price: cryptoMarket?.price != null ? Number(cryptoMarket.price) : undefined,
                    change: cryptoMarket?.change24h != null ? Number(cryptoMarket.change24h) : undefined,
                    changePercent: cryptoMarket?.changePercent24h != null ? Number(cryptoMarket.changePercent24h) : undefined,
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
                defiYieldPrimary?.symbol ? {
                    symbol: defiYieldPrimary.symbol,
                    name: defiYieldPrimary.name,
                    price: defiYieldMarket?.price != null ? Number(defiYieldMarket.price) : 1,
                    change: defiYieldMarket?.change24h != null ? Number(defiYieldMarket.change24h) : 0,
                    changePercent: defiYieldMarket?.changePercent24h != null ? Number(defiYieldMarket.changePercent24h) : 0,
                } : null,
                cryptoPrimary?.symbol ? {
                    symbol: cryptoPrimary.symbol,
                    name: cryptoPrimary.name,
                    price: cryptoMarket?.price != null ? Number(cryptoMarket.price) : 0,
                    change: cryptoMarket?.change24h != null ? Number(cryptoMarket.change24h) : 0,
                    changePercent: cryptoMarket?.changePercent24h != null ? Number(cryptoMarket.changePercent24h) : 0,
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
                    defiYieldBalance: defiYieldBalance,
                    bluechipCryptoBalance: cryptoBalance,
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
                     Math.abs(portfolio.bluechipCryptoPercent - user.targetBluechipCryptoPercent) +
                     Math.abs(portfolio.tokenizedGoldPercent - user.targetTokenizedGoldPercent);

        return drift > 5;
    }
}

export default DashboardController;
