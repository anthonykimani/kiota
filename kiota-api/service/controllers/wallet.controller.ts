import { Request, Response } from 'express';
import { WalletRepository } from '../repositories/wallet.repo';
import { PortfolioRepository } from '../repositories/portfolio.repo';
import { UserRepository } from '../repositories/user.repo';
import { TransactionRepository } from '../repositories/transaction.repo';
import Controller from './controller';
import { createPublicClient, formatUnits, http } from 'viem';
import { baseSepolia } from "viem/chains";
import { AuthenticatedRequest } from '../interfaces/IAuth';

// ---- MVP Config (Base + USDC only) ----
const BASE_RPC_URL = process.env.BASE_RPC_URL || '';
const BASE_USDC_ADDRESS = process.env.BASE_USDC_ADDRESS || '';

const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)'
];

// Viem public client
const baseClient = createPublicClient({
    chain: baseSepolia,
    transport: http(BASE_RPC_URL),
});


/**
 * Wallet Controller
 * Handles wallet creation for Phase 1 MVP
 * Screen: 8 (Wallet Creation)
 */
class WalletController extends Controller {
    /**
     * Get wallet info
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async getWallet(req: Request, res: Response) {
        try {
            const walletRepo: WalletRepository = new WalletRepository();
            const txRepo: TransactionRepository = new TransactionRepository();
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

            // --- Option A: show Unallocated USDC ---
            // Onchain truth: USDC balanceOf(userWallet)
            // Kiota allocation: sum of CONFIRMED USDC deposits credited to portfolio
            // Unallocated = onchain - allocated (>= 0)
            let usdcOnchain = null as null | string;
            let usdcAllocated = null as null | string;
            let usdcUnallocated = null as null | string;

            if (BASE_RPC_URL && BASE_USDC_ADDRESS && wallet.address) {
                try {
                    const raw = await baseClient.readContract({
                        address: BASE_USDC_ADDRESS as `0x${string}`,
                        abi: ERC20_ABI,
                        functionName: "balanceOf",
                        args: [wallet.address as `0x${string}`],
                    });

                    const onchainNum = Number(formatUnits(raw as bigint, 6));

                    // NOTE: Implement txRepo.getAllocatedUsdcUsd(userId) in your TransactionRepository.
                    // It should return the net allocated USDC (confirmed deposits - confirmed withdrawals) as a number.
                    const allocatedNum = Number(await txRepo.getAllocatedUsdcUsd(userId));

                    const unallocatedNum = Math.max(onchainNum - allocatedNum, 0);

                    usdcOnchain = onchainNum.toFixed(6);
                    usdcAllocated = allocatedNum.toFixed(6);
                    usdcUnallocated = unallocatedNum.toFixed(6);
                } catch (e) {
                    // If RPC is down, still return DB wallet info.
                }
            }

            const walletData = {
                wallet: {
                    id: wallet.id,
                    address: wallet.address,
                    provider: wallet.provider,
                    primaryChain: wallet.primaryChain,
                    balances: {
                        // Backward compatible field (DB)
                        usdc: wallet.usdcBalance,
                        // New fields (onchain + accounting)
                        usdcOnchain,
                        usdcAllocated,
                        usdcUnallocated,
                        stableYield: wallet.stableYieldBalance,
                        defiYield: wallet.defiYieldBalance,
                        bluechipCrypto: wallet.bluechipCryptoBalance,
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
                    bluechipCrypto: wallet.bluechipCryptoBalance,
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
