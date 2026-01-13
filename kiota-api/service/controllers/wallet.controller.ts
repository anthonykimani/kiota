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
export class WalletController extends Controller {
    private walletRepo: WalletRepository;
    private portfolioRepo: PortfolioRepository;
    private userRepo: UserRepository;

    constructor() {
        super();
        this.walletRepo = new WalletRepository();
        this.portfolioRepo = new PortfolioRepository();
        this.userRepo = new UserRepository();
    }

    /**
     * Create wallet (Screen 8)
     * @param req Express Request
     * @param res Express Response
     */
    async createWallet(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;

            if (!userId) {
                return res.json(
                    WalletController.response(
                        WalletController._401,
                        null,
                        ['Not authenticated']
                    )
                );
            }

            // Check if wallet exists using wallet.repo.ts method
            const existingWallet = await this.walletRepo.getByUserId(userId);
            if (existingWallet) {
                return res.json(
                    WalletController.response(
                        WalletController._400,
                        { address: existingWallet.address },
                        ['Wallet already exists for this user']
                    )
                );
            }

            const { privyUserId, address } = req.body;

            if (address && !this.isValidAddress(address)) {
                return res.json(
                    WalletController.response(
                        WalletController._400,
                        null,
                        ['Invalid Ethereum address format']
                    )
                );
            }

            if (!address) {
                return res.json(
                    WalletController.response(
                        WalletController._400,
                        null,
                        ['Wallet address is required']
                    )
                );
            }

            // Create wallet using wallet.repo.ts method
            const wallet = await this.walletRepo.createWallet({
                userId,
                address,
                privyUserId
            });

            // Create portfolio using portfolio.repo.ts method
            const portfolio = await this.portfolioRepo.createPortfolio(userId);

            // Mark onboarding complete using user.repo.ts method
            await this.userRepo.completeOnboarding(userId);

            return res.json(
                WalletController.response(
                    WalletController._201,
                    {
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
                    }
                )
            );

        } catch (error: any) {
            console.error('Create wallet error:', error);
            return res.json(
                WalletController.response(
                    WalletController._500,
                    null,
                    WalletController.ex(error)
                )
            );
        }
    }

    /**
     * Get wallet info
     * @param req Express Request
     * @param res Express Response
     */
    async getWallet(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;

            if (!userId) {
                return res.json(
                    WalletController.response(
                        WalletController._401,
                        null,
                        ['Not authenticated']
                    )
                );
            }

            // Get wallet using wallet.repo.ts method
            const wallet = await this.walletRepo.getByUserId(userId);

            if (!wallet) {
                return res.json(
                    WalletController.response(
                        WalletController._404,
                        null,
                        ['Wallet not found']
                    )
                );
            }

            return res.json(
                WalletController.response(
                    WalletController._200,
                    {
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
                    }
                )
            );

        } catch (error: any) {
            console.error('Get wallet error:', error);
            return res.json(
                WalletController.response(
                    WalletController._500,
                    null,
                    WalletController.ex(error)
                )
            );
        }
    }

    /**
     * Check if wallet exists
     * @param req Express Request
     * @param res Express Response
     */
    async walletExists(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;

            if (!userId) {
                return res.json(
                    WalletController.response(
                        WalletController._401,
                        null,
                        ['Not authenticated']
                    )
                );
            }

            // Get wallet using wallet.repo.ts method
            const wallet = await this.walletRepo.getByUserId(userId);

            return res.json(
                WalletController.response(
                    WalletController._200,
                    {
                        exists: !!wallet,
                        address: wallet?.address || null
                    }
                )
            );

        } catch (error: any) {
            console.error('Check wallet exists error:', error);
            return res.json(
                WalletController.response(
                    WalletController._500,
                    null,
                    WalletController.ex(error)
                )
            );
        }
    }

    /**
     * Update wallet balances
     * @param req Express Request
     * @param res Express Response
     */
    async updateBalances(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;

            if (!userId) {
                return res.json(
                    WalletController.response(
                        WalletController._401,
                        null,
                        ['Not authenticated']
                    )
                );
            }

            const balances = req.body;

            for (const [key, value] of Object.entries(balances)) {
                if (typeof value !== 'number' || value < 0) {
                    return res.json(
                        WalletController.response(
                            WalletController._400,
                            null,
                            [`Invalid balance value for ${key}`]
                        )
                    );
                }
            }

            // Update balances using wallet.repo.ts method
            const wallet = await this.walletRepo.updateBalances(userId, balances);

            if (!wallet) {
                return res.json(
                    WalletController.response(
                        WalletController._404,
                        null,
                        ['Wallet not found']
                    )
                );
            }

            return res.json(
                WalletController.response(
                    WalletController._200,
                    {
                        balances: {
                            usdc: wallet.usdcBalance,
                            stableYield: wallet.stableYieldBalance,
                            tokenizedStocks: wallet.tokenizedStocksBalance,
                            tokenizedGold: wallet.tokenizedGoldBalance,
                            gas: wallet.gasBalance
                        },
                        lastUpdated: wallet.balancesLastUpdated
                    }
                )
            );

        } catch (error: any) {
            console.error('Update balances error:', error);
            return res.json(
                WalletController.response(
                    WalletController._500,
                    null,
                    WalletController.ex(error)
                )
            );
        }
    }

    /**
     * Validate Ethereum address
     * @param address Address string
     * @returns boolean
     */
    private isValidAddress(address: string): boolean {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
}