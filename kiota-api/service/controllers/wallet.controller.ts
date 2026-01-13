import { Request, Response } from 'express';
import { WalletRepository } from '../repositories/wallet.repo';
import { PortfolioRepository } from '../repositories/portfolio.repo';
import { UserRepository } from '../repositories/user.repo';
import Controller from './controller';

/**
 * Wallet Controller
 * Handles wallet creation for Phase 1 MVP
 * Screen: 8 (Wallet Creation)
 */
class WalletController extends Controller {
    /**
     * Create wallet (Screen 8)
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async createWallet(req: Request, res: Response) {
        try {
            const walletRepo: WalletRepository = new WalletRepository();
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

            // Check if wallet exists
            const existingWallet = await walletRepo.getByUserId(userId);
            if (existingWallet) {
                return res.send(
                    super.response(
                        super._400,
                        { address: existingWallet.address },
                        ['Wallet already exists for this user']
                    )
                );
            }

            const { privyUserId, address } = req.body;

            if (address && !WalletController.isValidAddress(address)) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['Invalid Ethereum address format']
                    )
                );
            }

            if (!address) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['Wallet address is required']
                    )
                );
            }

            // Create wallet
            const wallet = await walletRepo.createWallet({
                userId,
                address,
                privyUserId
            });

            // Create portfolio
            const portfolio = await portfolioRepo.createPortfolio(userId);

            // Mark onboarding complete
            await userRepo.completeOnboarding(userId);

            const walletData = {
                wallet: {
                    id: wallet.id,
                    address: wallet.address,
                    provider: wallet.provider,
                    primaryChain: wallet.primaryChain,
                    createdAt: wallet.createdAt
                },
                portfolio: {
                    id: portfolio.id,
                    totalValueUsd: portfolio.totalValueUsd
                }
            };

            return res.send(super.response(super._201, walletData));

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get wallet info
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async getWallet(req: Request, res: Response) {
        try {
            const walletRepo: WalletRepository = new WalletRepository();
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

            // Get wallet
            const wallet = await walletRepo.getByUserId(userId);

            if (!wallet) {
                return res.send(
                    super.response(
                        super._404,
                        null,
                        ['Wallet not found']
                    )
                );
            }

            const walletData = {
                wallet: {
                    id: wallet.id,
                    address: wallet.address,
                    provider: wallet.provider,
                    primaryChain: wallet.primaryChain,
                    balances: {
                        usdc: wallet.usdcBalance,
                        stableYield: wallet.stableYieldBalance,
                        tokenizedStocks: wallet.tokenizedStocksBalance,
                        tokenizedGold: wallet.tokenizedGoldBalance,
                        gas: wallet.gasBalance
                    },
                    lastUpdated: wallet.balancesLastUpdated,
                    createdAt: wallet.createdAt
                }
            };

            return res.send(super.response(super._200, walletData));

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Check if wallet exists
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async walletExists(req: Request, res: Response) {
        try {
            const walletRepo: WalletRepository = new WalletRepository();
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

            // Get wallet
            const wallet = await walletRepo.getByUserId(userId);

            const existsData = {
                exists: !!wallet,
                address: wallet?.address || null
            };

            return res.send(super.response(super._200, existsData));

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Update wallet balances
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async updateBalances(req: Request, res: Response) {
        try {
            const walletRepo: WalletRepository = new WalletRepository();
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

            const balances = req.body;

            for (const [key, value] of Object.entries(balances)) {
                if (typeof value !== 'number' || value < 0) {
                    return res.send(
                        super.response(
                            super._400,
                            null,
                            [`Invalid balance value for ${key}`]
                        )
                    );
                }
            }

            // Update balances
            const wallet = await walletRepo.updateBalances(userId, balances);

            if (!wallet) {
                return res.send(
                    super.response(
                        super._404,
                        null,
                        ['Wallet not found']
                    )
                );
            }

            const balanceData = {
                balances: {
                    usdc: wallet.usdcBalance,
                    stableYield: wallet.stableYieldBalance,
                    tokenizedStocks: wallet.tokenizedStocksBalance,
                    tokenizedGold: wallet.tokenizedGoldBalance,
                    gas: wallet.gasBalance
                },
                lastUpdated: wallet.balancesLastUpdated
            };

            return res.send(super.response(super._200, balanceData));

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Validate Ethereum address
     * @param address Address string
     * @returns boolean
     */
    private static isValidAddress(address: string): boolean {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
}

export default WalletController;