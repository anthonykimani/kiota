import { Request, Response } from 'express';
import { TransactionRepository } from '../repositories/transaction.repo';
import { PortfolioRepository } from '../repositories/portfolio.repo';
import { UserRepository } from '../repositories/user.repo';
import { MarketDataRepository } from '../repositories/market-data.repo';
import { WalletRepository } from '../repositories/wallet.repo';
import Controller from './controller';
import { formatUnits, parseAbi, parseAbiItem } from 'viem';
import { AuthenticatedRequest } from '../interfaces/IAuth';

import { DepositSessionRepository } from '../repositories/deposit-session.repo';
import { DEPOSIT_COMPLETION_QUEUE, ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE } from '../configs/queue.config';
import { assetRegistry } from '../services/asset-registry.service';
import { AssetSymbol } from '../enums/MarketData';
import { 
    createChainClient, 
    getUsdcAddress, 
    getRequiredConfirmations,
    getCurrentNetwork,
    logChainConfig 
} from '../configs/chain.config';

// Log chain config on module load (helpful for debugging)
logChainConfig();

// Use chain config for network-aware client
const baseClient = createChainClient();
const BASE_USDC_ADDRESS = getUsdcAddress();
const DEPOSIT_CONFIRMATIONS_REQUIRED = getRequiredConfirmations();

// Viem ABI (minimal)
const ERC20_ABI = parseAbi([
    "function balanceOf(address owner) view returns (uint256)",
]);

const TRANSFER_EVENT = parseAbiItem(
    "event Transfer(address indexed from, address indexed to, uint256 value)"
);
/**
 * Deposit Controller
 * Handles deposit/add money flow for Phase 1 MVP
 * Screen: 10 (Add Money Flow - 10a through 10e)
 */
class DepositController extends Controller {
    /**
     * Create a deposit session ("intent")
     * Frontend calls this when user taps "Add Funds" and you display the address.
     * This does NOT move money; it creates an auditable session to match an onchain USDC transfer.
     */
    public static async createDepositIntent(req: Request, res: Response) {
        try {
            const userId = (req as AuthenticatedRequest).userId;
            if (!userId) {
                return res.send(super.response(super._401, null, ['Not authenticated']));
            }

            const { expectedAmount, token } = req.body || {};
            const currentNetwork = getCurrentNetwork();
            const normalizedToken = (token || 'USDC').toUpperCase();

            if (normalizedToken !== 'USDC') {
                return res.send(super.response(super._400, null, ['Only USDC is supported in MVP']));
            }
            if (!BASE_USDC_ADDRESS) {
                return res.send(
                    super.response(super._500, null, [
                        'Chain configuration error: USDC address not set'
                    ])
                );
            }

            const walletRepo = new WalletRepository();
            const sessionRepo = new DepositSessionRepository();

            const wallet = await walletRepo.getByUserId(userId);
            if (!wallet?.address) {
                return res.send(super.response(super._404, null, ['Wallet not found']));
            }

            // Create session time window
            const createdAt = new Date();
            const expiresAt = new Date(createdAt.getTime() + 60 * 60 * 1000); // 60 minutes

            // Capture a block boundary so confirm() can scan deterministically.
            const createdAtBlockNumber = Number(await baseClient.getBlockNumber());

            // Matching constraints:
            // - If expectedAmount provided, accept +/-5%
            // - Else accept any amount >= 0.1 USDC
            let minAmount: number | undefined;
            let maxAmount: number | undefined;

            if (expectedAmount != null) {
                const amt = Number(expectedAmount);
                if (!Number.isFinite(amt) || amt <= 0) {
                    return res.send(super.response(super._400, null, ['expectedAmount must be a positive number']));
                }
                minAmount = amt * 0.95;
                maxAmount = amt * 1.05;
            } else {
                minAmount = 0.1;
                maxAmount = undefined;
            }

            // NOTE: You need to implement DepositSessionRepository.create in your codebase.
            const session = await sessionRepo.create({
                userId,
                walletAddress: wallet.address,
                chain: currentNetwork,
                tokenSymbol: 'USDC',
                tokenAddress: BASE_USDC_ADDRESS,
                expectedAmount: expectedAmount ?? null,
                minAmount,
                maxAmount,
                status: 'AWAITING_TRANSFER',
                createdAt,
                expiresAt,
                createdAtBlockNumber
            });

            // Queue job to scan blockchain for this deposit
            // Job will run every 30 seconds until deposit is confirmed or session expires
            await ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE.add(
                {
                    depositSessionId: session.id,
                    userId
                },
                {
                    repeat: {
                        every: 30000, // Check every 30 seconds
                        limit: 120 // Max 120 attempts (60 minutes total)
                    },
                    attempts: 3, // Retry each attempt 3 times if it fails
                    backoff: {
                        type: 'exponential',
                        delay: 3000
                    },
                    jobId: `onchain-deposit-${session.id}`, // Prevents duplicate jobs
                    removeOnComplete: true,
                    removeOnFail: false
                }
            );

            console.log(`✅ Queued onchain deposit confirmation job for session ${session.id}`);

            return res.send(
                super.response(super._201, {
                    depositSessionId: session.id,
                    depositAddress: wallet.address,
                    chain: currentNetwork,
                    token: { symbol: 'USDC', address: BASE_USDC_ADDRESS },
                    expiresAt
                })
            );
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Confirm a deposit session.
     * This scans USDC Transfer logs TO the user's wallet within the session window,
     * binds the first unclaimed matching event, and credits the portfolio ONCE.
     */
    public static async confirmDeposit(req: Request, res: Response) {
        try {
            const userId = (req as AuthenticatedRequest).userId;
            if (!userId) {
                return res.send(super.response(super._401, null, ['Not authenticated']));
            }
            const { depositSessionId } = req.body || {};
            if (!depositSessionId) {
                return res.send(super.response(super._400, null, ['depositSessionId is required']));
            }

            const sessionRepo = new DepositSessionRepository();
            const txRepo = new TransactionRepository();
            const portfolioRepo = new PortfolioRepository();
            const userRepo = new UserRepository();
            const walletRepo = new WalletRepository();

            const session = await sessionRepo.getById(depositSessionId);
            if (!session || session.userId !== userId) {
                return res.send(super.response(super._404, null, ['Deposit session not found']));
            }

            // Expire sessions deterministically.
            if (session.status === 'AWAITING_TRANSFER' && new Date() > new Date(session.expiresAt)) {
                await sessionRepo.updateStatus(session.id, 'EXPIRED');
                return res.send(super.response(super._400, null, ['Deposit session expired']));
            }

            // Idempotent return if already confirmed.
            if (session.status === 'CONFIRMED') {
                return res.send(
                    super.response(super._200, {
                        status: 'CONFIRMED',
                        txHash: session.matchedTxHash,
                        amount: session.matchedAmount,
                        credited: true
                    })
                );
            }

            const latestBlock = Number(await baseClient.getBlockNumber());

            // Use session boundary if available; fallback to a conservative window.
            const fromBlock = Number.isFinite(Number(session.createdAtBlockNumber))
                ? BigInt(session.createdAtBlockNumber)
                : BigInt(Math.max(latestBlock - 5000, 0));

            const logs = await baseClient.getLogs({
                address: (session.tokenAddress || BASE_USDC_ADDRESS) as `0x${string}`,
                event: TRANSFER_EVENT,
                args: {
                    to: session.walletAddress as `0x${string}`,
                },
                fromBlock,
                toBlock: BigInt(latestBlock),
            });

            // newest-first
            const createdAtMs = new Date(session.createdAt).getTime();
            let matched: {
                txHash: string;
                logIndex: number;
                blockNumber: number;
                from: string;
                to: string;
                amount: number;
            } | null = null;

            for (const log of logs.slice().reverse()) {
                // viem gives you blockNumber but not timestamp; fetch block for timestamp
                const block = await baseClient.getBlock({ blockNumber: log.blockNumber! });
                const blockMs = Number(block.timestamp) * 1000;
                if (blockMs < createdAtMs) continue;

                const amount = Number(formatUnits(log.args.value!, 6)); // USDC 6 decimals
                const from = (log.args.from || "").toLowerCase();
                const to = (log.args.to || "").toLowerCase();

                if (session.minAmount != null && amount < Number(session.minAmount)) continue;
                if (session.maxAmount != null && amount > Number(session.maxAmount)) continue;

                const alreadyProcessed = await sessionRepo.isEventProcessed({
                    chain: "base",
                    txHash: log.transactionHash.toLowerCase(),
                    logIndex: Number(log.logIndex),
                });
                if (alreadyProcessed) continue;

                matched = {
                    txHash: log.transactionHash.toLowerCase(),
                    logIndex: Number(log.logIndex),
                    blockNumber: Number(log.blockNumber),
                    from,
                    to,
                    amount,
                };
                break;
            }

            if (!matched) {
                return res.send(super.response(super._200, { status: "AWAITING_TRANSFER" }));
            }

            const confirmations = latestBlock - matched.blockNumber + 1;


            // Bind the event to the session (even if not yet confirmed)
            await sessionRepo.bindOnchainEvent(session.id, {
                txHash: matched.txHash,
                logIndex: matched.logIndex,
                fromAddress: matched.from,
                amount: matched.amount,
                blockNumber: matched.blockNumber
            });

            if (confirmations < DEPOSIT_CONFIRMATIONS_REQUIRED) {
                await sessionRepo.updateStatus(session.id, 'RECEIVED');
                return res.send(
                    super.response(super._200, {
                        status: 'RECEIVED',
                        txHash: matched.txHash,
                        amount: matched.amount,
                        confirmations
                    })
                );
            }

            // Mark processed FIRST to make crediting idempotent even on retries.
            await sessionRepo.markEventProcessed({
                chain: 'base',
                txHash: matched.txHash,
                logIndex: matched.logIndex
            });

            // Credit portfolio/categories using user's latest target allocation
            const user = await userRepo.getById(userId);
            const wallet = await walletRepo.getByUserId(userId);
            const portfolio = await portfolioRepo.getByUserId(userId);
            if (!user || !wallet || !portfolio) {
                return res.send(super.response(super._404, null, ['User, wallet or portfolio not found']));
            }

            const allocation = {
                stableYields: user.targetStableYieldsPercent || 80,
                tokenizedStocks: user.targetTokenizedStocksPercent || 15,
                tokenizedGold: user.targetTokenizedGoldPercent || 5
            };

            // NOTE: Implement txRepo.createOnchainDeposit in your TransactionRepository.
            const transaction = await txRepo.createOnchainDeposit({
                userId,
                chain: 'base',
                tokenSymbol: 'USDC',
                tokenAddress: session.tokenAddress || BASE_USDC_ADDRESS,
                walletAddress: wallet.address,
                amountUsd: matched.amount,
                txHash: matched.txHash,
                logIndex: matched.logIndex,
                allocation
            });

            // Treat onchain deposit as cash until user confirms conversion.
            await walletRepo.incrementBalances(userId, {
                usdcBalance: matched.amount
            });

            await portfolioRepo.recordDeposit(userId, matched.amount);

            await sessionRepo.updateStatus(session.id, 'CONFIRMED');

            return res.send(
                super.response(super._200, {
                    status: 'CONFIRMED',
                    txHash: matched.txHash,
                    amount: matched.amount,
                    confirmations,
                    credited: true,
                    transactionId: transaction?.id
                })
            );
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Provide deposit review data once deposit is confirmed
     * - projection data
     * - recommended assets
     */
    public static async getDepositReview(req: Request, res: Response) {
        try {
            const userId = (req as AuthenticatedRequest).userId;
            if (!userId) {
                return res.send(super.response(super._401, null, ['Not authenticated']));
            }

            const { depositSessionId } = req.body || {};
            if (!depositSessionId) {
                return res.send(super.response(super._400, null, ['depositSessionId is required']));
            }

            const sessionRepo = new DepositSessionRepository();
            const userRepo = new UserRepository();
            const marketDataRepo = new MarketDataRepository();

            const session = await sessionRepo.getById(depositSessionId);
            if (!session || session.userId !== userId) {
                return res.send(super.response(super._404, null, ['Deposit session not found']));
            }

            if (session.status !== 'CONFIRMED') {
                return res.send(
                    super.response(super._400, null, ['Deposit must be confirmed before review'])
                );
            }

            const user = await userRepo.getById(userId);
            if (!user) {
                return res.send(super.response(super._404, null, ['User not found']));
            }

            const depositAmount = Number(session.matchedAmount || session.expectedAmount || 0);
            if (depositAmount <= 0) {
                return res.send(super.response(super._400, null, ['Invalid deposit amount']));
            }

            const allocation = {
                stableYields: user.targetStableYieldsPercent || 80,
                tokenizedStocks: user.targetTokenizedStocksPercent || 15,
                tokenizedGold: user.targetTokenizedGoldPercent || 5,
            };

            const classKeys = [
                { key: 'stable_yields', weight: allocation.stableYields, defaultReturn: 0.05 },
                { key: 'tokenized_stocks', weight: allocation.tokenizedStocks, defaultReturn: 0.1 },
                { key: 'tokenized_gold', weight: allocation.tokenizedGold, defaultReturn: 0.04 },
            ] as const;

            const assets = [] as Array<{
                symbol: string;
                name: string;
                classKey: string;
                price: number;
                change: number;
                changePercent: number;
            }>;

            let expectedAnnualReturn = 0;

            for (const assetClass of classKeys) {
                const primaryAsset = await assetRegistry.getPrimaryAssetByClassKey(assetClass.key);
                if (!primaryAsset) continue;

                const marketData = await marketDataRepo.getAssetData(primaryAsset.symbol);
                const apy = marketData?.currentApy != null
                    ? Number(marketData.currentApy) / 100
                    : assetClass.defaultReturn;

                expectedAnnualReturn += (assetClass.weight / 100) * apy;

                assets.push({
                    symbol: primaryAsset.symbol,
                    name: primaryAsset.name,
                    classKey: assetClass.key,
                    price: marketData?.price != null ? Number(marketData.price) : 1,
                    change: marketData?.change24h != null ? Number(marketData.change24h) : 0,
                    changePercent: marketData?.changePercent24h != null ? Number(marketData.changePercent24h) : 0,
                });
            }

            const sortedAssets = assets.sort((a, b) => {
                const weightA = classKeys.find(k => k.key === a.classKey)?.weight || 0;
                const weightB = classKeys.find(k => k.key === b.classKey)?.weight || 0;
                return weightB - weightA;
            });

            const monthlyRate = expectedAnnualReturn / 12;
            const projection = [] as Array<{ date: string; investment: number; returns: number }>;

            const now = new Date();
            for (let i = 0; i < 12; i++) {
                const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
                const compounded = Math.pow(1 + monthlyRate, i + 1);
                const returns = depositAmount * (compounded - 1);
                projection.push({
                    date: date.toISOString(),
                    investment: Number(depositAmount.toFixed(2)),
                    returns: Number(returns.toFixed(2)),
                });
            }

            return res.send(
                super.response(super._200, {
                    depositSessionId,
                    amountUsd: depositAmount,
                    allocation,
                    projection,
                    assets: sortedAssets,
                    description: 'Based on your target allocation, these assets match your risk and growth profile.'
                })
            );
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Initiate deposit (Screens 10a & 10b)
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async initiateDeposit(req: Request, res: Response) {
        try {
            const transactionRepo: TransactionRepository = new TransactionRepository();
            const portfolioRepo: PortfolioRepository = new PortfolioRepository();
            const userRepo: UserRepository = new UserRepository();
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

            const { amountKes, mpesaPhoneNumber, customAllocation } = req.body;

            if (!amountKes || amountKes < 100) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['Minimum deposit is KES 100']
                    )
                );
            }

            if (!mpesaPhoneNumber || !mpesaPhoneNumber.match(/^\+254\d{9}$/)) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['Invalid M-Pesa phone number format']
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

            // Get exchange rate
            const exchangeRate = await marketDataRepo.getKesUsdRate();
            const amountUsd = amountKes / exchangeRate;

            let allocation;
            if (customAllocation) {
                const total = customAllocation.stableYields +
                    customAllocation.tokenizedStocks +
                    customAllocation.tokenizedGold;

                if (Math.abs(total - 100) > 0.01) {
                    return res.send(
                        super.response(
                            super._400,
                            null,
                            ['Allocation must add up to 100%']
                        )
                    );
                }

                allocation = {
                    stableYields: customAllocation.stableYields,
                    tokenizedStocks: customAllocation.tokenizedStocks,
                    tokenizedGold: customAllocation.tokenizedGold
                };
            } else {
                allocation = {
                    stableYields: user.targetStableYieldsPercent || 80,
                    tokenizedStocks: user.targetTokenizedStocksPercent || 15,
                    tokenizedGold: user.targetTokenizedGoldPercent || 5
                };
            }

            const feePercent = 2.0;
            const feeKes = amountKes * (feePercent / 100);
            const feeUsd = amountUsd * (feePercent / 100);
            const netAmountUsd = amountUsd - feeUsd;

            const isFirstDeposit = !user.firstDepositSubsidyUsed;
            const subsidyAmount = isFirstDeposit ? feeUsd : 0;
            const effectiveAmountUsd = netAmountUsd + subsidyAmount;

            // Create transaction
            const transaction = await transactionRepo.createDeposit({
                userId,
                amountKes,
                amountUsd: effectiveAmountUsd,
                exchangeRate,
                mpesaPhoneNumber,
                allocation,
                feeKes,
                feeUsd
            });

            const stableAsset = await assetRegistry.getPrimaryAssetByClassKey('stable_yields');
            const stocksAsset = await assetRegistry.getPrimaryAssetByClassKey('tokenized_stocks');
            const goldAsset = await assetRegistry.getPrimaryAssetByClassKey('tokenized_gold');

            const assetBreakdown = {
                stableYields: {
                    asset: stableAsset?.symbol || null,
                    amountUsd: effectiveAmountUsd * ((allocation.stableYields || 0) / 100),
                    percentage: allocation.stableYields || 0
                },
                tokenizedStocks: {
                    asset: stocksAsset?.symbol || null,
                    amountUsd: effectiveAmountUsd * ((allocation.tokenizedStocks || 0) / 100),
                    percentage: allocation.tokenizedStocks || 0,
                    requiresTier2: true
                },
                tokenizedGold: {
                    asset: goldAsset?.symbol || null,
                    amountUsd: effectiveAmountUsd * ((allocation.tokenizedGold || 0) / 100),
                    percentage: allocation.tokenizedGold || 0
                }
            };

            const depositData = {
                transactionId: transaction.id,
                amountKes,
                amountUsd: effectiveAmountUsd,
                exchangeRate,
                fees: {
                    feeKes,
                    feeUsd,
                    feePercent,
                    subsidized: isFirstDeposit,
                    subsidyAmount
                },
                allocation: assetBreakdown,
                nextStep: 'mpesa_prompt'
            };

            return res.send(super.response(super._200, depositData));

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Trigger M-Pesa STK push (Screen 10c)
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async triggerMpesaPush(req: Request, res: Response) {
        try {
            const transactionRepo: TransactionRepository = new TransactionRepository();

            const userId = (req as AuthenticatedRequest).userId;
            const { transactionId } = req.body;

            if (!transactionId) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['Transaction ID is required']
                    )
                );
            }

            // Get transaction
            const transaction = await transactionRepo.getById(transactionId);

            if (!transaction || transaction.userId !== userId) {
                return res.send(
                    super.response(
                        super._404,
                        null,
                        ['Transaction not found']
                    )
                );
            }

            // TODO: Integrate with real M-Pesa STK Push API
            const checkoutRequestId = DepositController.generateCheckoutRequestId();

            await transactionRepo.updateMpesaCheckout(transactionId, checkoutRequestId);

            const pushData = {
                transactionId: transaction.id,
                checkoutRequestId,
                amountKes: transaction.sourceAmount,
                phoneNumber: transaction.mpesaPhoneNumber,
                status: 'awaiting_payment'
            };

            return res.send(super.response(super._200, pushData));

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * M-Pesa callback handler (Screen 10d)
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async mpesaCallback(req: Request, res: Response) {
        try {
            const transactionRepo: TransactionRepository = new TransactionRepository();

            const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = req.body;

            // Find transaction
            const transaction = await transactionRepo.getByMpesaCheckoutId(CheckoutRequestID);

            if (!transaction) {
                console.error(`Transaction not found for checkout ID: ${CheckoutRequestID}`);
                return res.json({ ResultCode: 1, ResultDesc: 'Transaction not found' });
            }

            if (ResultCode === 0 && CallbackMetadata) {
                const mpesaReceiptNumber = CallbackMetadata.MpesaReceiptNumber;

                // Update transaction to PROCESSING
                await transactionRepo.markAsProcessing(transaction.id, mpesaReceiptNumber);

                console.log(`Processing transaction ${transaction.id} with receipt ${mpesaReceiptNumber}`);

                // Add job to queue for blockchain confirmation
                // The worker will pick this up and complete the deposit
                await DEPOSIT_COMPLETION_QUEUE.add(
                    {
                        transactionId: transaction.id,
                        txHash: `pending_${Date.now()}`, // Temporary - will be replaced by actual txHash
                        blockchainData: {
                            chain: 'base'
                        }
                    },
                    {
                        attempts: 5, // Retry up to 5 times (blockchain can be flaky)
                        backoff: {
                            type: 'exponential',
                            delay: 5000 // Start with 5 second delay
                        },
                        removeOnComplete: true,
                        removeOnFail: false // Keep failed jobs for debugging
                    }
                );

                console.log(`✅ Queued deposit completion job for transaction ${transaction.id}`);
            } else {
                // Mark as failed
                await transactionRepo.markAsFailed(transaction.id, ResultDesc);
            }

            return res.json({ ResultCode: 0, ResultDesc: 'Callback received successfully' });

        } catch (error) {
            console.error('M-Pesa callback error:', error);
            return res.json({ ResultCode: 1, ResultDesc: 'Internal server error' });
        }
    }

    /**
     * Check transaction status (Screen 10e)
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async getTransactionStatus(req: Request, res: Response) {
        try {
            const transactionRepo: TransactionRepository = new TransactionRepository();

            const userId = (req as AuthenticatedRequest).userId;
            const { transactionId } = req.params;

            // Get transaction
            const transaction = await transactionRepo.getById(transactionId);

            if (!transaction || transaction.userId !== userId) {
                return res.send(
                    super.response(
                        super._404,
                        null,
                        ['Transaction not found']
                    )
                );
            }

            const statusData = {
                transactionId: transaction.id,
                status: transaction.status,
                amountKes: transaction.sourceAmount,
                amountUsd: transaction.destinationAmount,
                mpesaReceiptNumber: transaction.mpesaReceiptNumber,
                txHash: transaction.txHash,
                completedAt: transaction.completedAt,
                failureReason: transaction.failureReason
            };

            return res.send(super.response(super._200, statusData));

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Complete deposit (called by background job)
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async completeDeposit(req: Request, res: Response) {
        try {
            const transactionRepo: TransactionRepository = new TransactionRepository();
            const portfolioRepo: PortfolioRepository = new PortfolioRepository();
            const userRepo: UserRepository = new UserRepository();
            const walletRepo: WalletRepository = new WalletRepository();

            const { transactionId, txHash, blockchainData } = req.body;

            if (!transactionId || !txHash) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['Transaction ID and transaction hash are required']
                    )
                );
            }

            // Get transaction
            const transaction = await transactionRepo.getById(transactionId);

            if (!transaction) {
                return res.send(
                    super.response(
                        super._404,
                        null,
                        ['Transaction not found']
                    )
                );
            }

            // Mark as completed
            await transactionRepo.markAsCompleted(transactionId, {
                txHash,
                chain: blockchainData?.chain || 'base'
            });

            const allocation = transaction.allocation;
            const amountUsd = transaction.destinationAmount;

            // Update portfolio
            await portfolioRepo.updateValues(transaction.userId, {
                stableYieldsValueUsd: amountUsd * ((allocation?.stableYields || 0) / 100),
                tokenizedStocksValueUsd: amountUsd * ((allocation?.tokenizedStocks || 0) / 100),
                tokenizedGoldValueUsd: amountUsd * ((allocation?.tokenizedGold || 0) / 100),
                kesUsdRate: transaction.exchangeRate
            });

            // Record deposit
            await portfolioRepo.recordDeposit(transaction.userId, amountUsd);

            // Calculate returns
            await portfolioRepo.calculateReturns(transaction.userId);

            // Update wallet balances
            await walletRepo.updateBalances(transaction.userId, {
                stableYieldBalance: amountUsd * ((allocation?.stableYields || 0) / 100),
                tokenizedStocksBalance: amountUsd * ((allocation?.tokenizedStocks || 0) / 100),
                tokenizedGoldBalance: amountUsd * ((allocation?.tokenizedGold || 0) / 100)
            });

            // Mark first deposit subsidy as used
            const user = await userRepo.getById(transaction.userId);
            if (user && !user.firstDepositSubsidyUsed) {
                user.firstDepositSubsidyUsed = true;
                await userRepo.save(user);
            }

            const completionData = {
                transactionId: transaction.id,
                txHash,
                completedAt: new Date()
            };

            return res.send(super.response(super._200, completionData));

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Convert USDC deposit to user's target allocation
     * Called after onchain USDC deposit is confirmed
     *
     * Body:
     * - depositSessionId: string (UUID)
     *
     * Flow:
     * 1. Get deposit session
     * 2. Verify it's confirmed
     * 3. Get user's target allocation (class-based, using primary assets per class)
     * 4. Calculate swap amounts
     * 5. Create SWAP transactions for each target asset
     * 6. Queue SWAP_EXECUTION_QUEUE jobs
     */
    public static async convertDeposit(req: Request, res: Response) {
        try {
            const userId = (req as AuthenticatedRequest).userId;
            if (!userId) {
                return res.send(super.response(super._401, null, ['Not authenticated']));
            }

            const { depositSessionId } = req.body || {};

            if (!depositSessionId) {
                return res.send(
                    super.response(super._400, null, ['depositSessionId is required'])
                );
            }

            // Import dependencies
            const { DepositSessionRepository } = await import('../repositories/deposit-session.repo');
            const { UserRepository } = await import('../repositories/user.repo');
            const { SwapRepository } = await import('../repositories/swap.repo');
            const { SWAP_EXECUTION_QUEUE } = await import('../configs/queue.config');
            const { v4: uuidv4 } = await import('uuid');

            const sessionRepo = new DepositSessionRepository();
            const userRepo = new UserRepository();

            // Get deposit session
            const session = await sessionRepo.getById(depositSessionId);

            if (!session) {
                return res.send(
                    super.response(super._404, null, ['Deposit session not found'])
                );
            }

            if (session.userId !== userId) {
                return res.send(
                    super.response(super._403, null, ['Access denied'])
                );
            }

            if (session.status !== 'CONFIRMED') {
                return res.send(
                    super.response(super._400, null, [
                        `Deposit must be confirmed before conversion. Current status: ${session.status}`,
                    ])
                );
            }

            // Get user's target allocation
            const user = await userRepo.getById(userId);

            if (!user) {
                return res.send(super.response(super._404, null, ['User not found']));
            }

            // Calculate swap amounts based on deposited USDC amount
            const depositedAmount = session.matchedAmount || session.expectedAmount || 0;

            if (depositedAmount <= 0) {
                return res.send(
                    super.response(super._400, null, ['Invalid deposit amount'])
                );
            }

            // Calculate allocation amounts
            const stableYieldsAmount =
                (depositedAmount * (user.targetStableYieldsPercent || 80)) / 100;
            const tokenizedStocksAmount =
                (depositedAmount * (user.targetTokenizedStocksPercent || 15)) / 100;
            const tokenizedGoldAmount =
                (depositedAmount * (user.targetTokenizedGoldPercent || 5)) / 100;

            // Create conversion group ID (links all swaps in same conversion)
            const conversionGroupId = uuidv4();

            const stableAsset = await assetRegistry.getPrimaryAssetByClassKey('stable_yields');
            const stocksAsset = await assetRegistry.getPrimaryAssetByClassKey('tokenized_stocks');
            const goldAsset = await assetRegistry.getPrimaryAssetByClassKey('tokenized_gold');

            if (!stableAsset || !stocksAsset || !goldAsset) {
                return res.send(
                    super.response(super._500, null, ['Missing primary assets for one or more classes'])
                );
            }

            const network = getCurrentNetwork();
            try {
                await assetRegistry.resolveAssetAddress(stableAsset, network);
                await assetRegistry.resolveAssetAddress(stocksAsset, network);
                await assetRegistry.resolveAssetAddress(goldAsset, network);
            } catch (error) {
                return res.send(
                    super.response(super._400, null, [
                        (error as Error).message || 'Asset not available on current network'
                    ])
                );
            }

            // Create swap transactions for non-zero amounts
            const swapRepo = new SwapRepository();
            const createdSwaps = [];

            // Swap USDC → primary Stable Yields asset
            if (stableYieldsAmount > 0) {
                const estimatedToAmount = stableYieldsAmount * 0.998; // Assume 0.2% slippage

                const transaction = await swapRepo.createSwap({
                    userId,
                    fromAsset: 'USDC',
                    toAsset: stableAsset.symbol,
                    fromAmount: stableYieldsAmount,
                    estimatedToAmount,
                    slippage: 1.0,
                    metadata: {
                        conversionGroupId,
                        depositSessionId,
                        initiatedVia: 'deposit-conversion',
                    },
                    type: 'swap' as any,
                });

                await SWAP_EXECUTION_QUEUE.add(
                    {
                        transactionId: transaction.id,
                        userId,
                        fromAsset: 'USDC',
                        toAsset: stableAsset.symbol,
                        amount: stableYieldsAmount,
                        slippage: 1.0,
                    },
                    {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 2000 },
                        jobId: `swap-execute-${transaction.id}`,
                        removeOnComplete: true,
                        removeOnFail: false,
                    }
                );

                createdSwaps.push({
                    transactionId: transaction.id,
                    toAsset: stableAsset.symbol,
                    amount: stableYieldsAmount,
                });
            }

            // Swap USDC → primary Tokenized Stocks asset
            if (tokenizedStocksAmount > 0) {
                const estimatedToAmount = tokenizedStocksAmount * 0.998;

                const transaction = await swapRepo.createSwap({
                    userId,
                    fromAsset: 'USDC',
                    toAsset: stocksAsset.symbol,
                    fromAmount: tokenizedStocksAmount,
                    estimatedToAmount,
                    slippage: 1.0,
                    metadata: {
                        conversionGroupId,
                        depositSessionId,
                        initiatedVia: 'deposit-conversion',
                    },
                    type: 'swap' as any,
                });

                await SWAP_EXECUTION_QUEUE.add(
                    {
                        transactionId: transaction.id,
                        userId,
                        fromAsset: 'USDC',
                        toAsset: stocksAsset.symbol,
                        amount: tokenizedStocksAmount,
                        slippage: 1.0,
                    },
                    {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 2000 },
                        jobId: `swap-execute-${transaction.id}`,
                        removeOnComplete: true,
                        removeOnFail: false,
                    }
                );

                createdSwaps.push({
                    transactionId: transaction.id,
                    toAsset: stocksAsset.symbol,
                    amount: tokenizedStocksAmount,
                });
            }

            // Swap USDC → primary Tokenized Gold asset
            if (tokenizedGoldAmount > 0) {
                const estimatedToAmount = tokenizedGoldAmount * 0.998;

                const transaction = await swapRepo.createSwap({
                    userId,
                    fromAsset: 'USDC',
                    toAsset: goldAsset.symbol,
                    fromAmount: tokenizedGoldAmount,
                    estimatedToAmount,
                    slippage: 1.0,
                    metadata: {
                        conversionGroupId,
                        depositSessionId,
                        initiatedVia: 'deposit-conversion',
                    },
                    type: 'swap' as any,
                });

                await SWAP_EXECUTION_QUEUE.add(
                    {
                        transactionId: transaction.id,
                        userId,
                        fromAsset: 'USDC',
                        toAsset: goldAsset.symbol,
                        amount: tokenizedGoldAmount,
                        slippage: 1.0,
                    },
                    {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 2000 },
                        jobId: `swap-execute-${transaction.id}`,
                        removeOnComplete: true,
                        removeOnFail: false,
                    }
                );

                createdSwaps.push({
                    transactionId: transaction.id,
                    toAsset: goldAsset.symbol,
                    amount: tokenizedGoldAmount,
                });
            }

            // Return conversion plan
            const conversionData = {
                conversionGroupId,
                depositSessionId,
                depositedAmount,
                status: 'pending',
                swaps: createdSwaps,
                swapCount: createdSwaps.length,
                estimatedCompletionTime: '5-10 minutes',
                allocation: {
                    stableYields: user.targetStableYieldsPercent || 80,
                    tokenizedStocks: user.targetTokenizedStocksPercent || 15,
                    tokenizedGold: user.targetTokenizedGoldPercent || 5,
                },
            };

            return res.send(super.response(super._201, conversionData));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Convert wallet USDC balance to user's target allocation
     * Body:
     * - amountUsd?: number (optional, defaults to full wallet balance)
     */
    public static async convertWalletBalance(req: Request, res: Response) {
        try {
            const userId = (req as AuthenticatedRequest).userId;
            if (!userId) {
                return res.send(super.response(super._401, null, ['Not authenticated']));
            }

            const { amountUsd } = req.body || {};

            const { UserRepository } = await import('../repositories/user.repo');
            const { WalletRepository } = await import('../repositories/wallet.repo');
            const { SwapRepository } = await import('../repositories/swap.repo');
            const { SWAP_EXECUTION_QUEUE } = await import('../configs/queue.config');
            const { v4: uuidv4 } = await import('uuid');

            const userRepo = new UserRepository();
            const walletRepo = new WalletRepository();

            const user = await userRepo.getById(userId);
            const wallet = await walletRepo.getByUserId(userId);

            if (!user || !wallet) {
                return res.send(super.response(super._404, null, ['User or wallet not found']));
            }

            const availableBalance = Number(wallet.usdcBalance || 0);
            const convertAmount = amountUsd != null ? Number(amountUsd) : availableBalance;

            if (!convertAmount || convertAmount <= 0) {
                return res.send(super.response(super._400, null, ['No USDC balance available to convert']));
            }

            if (convertAmount > availableBalance) {
                return res.send(super.response(super._400, null, ['Amount exceeds wallet USDC balance']));
            }

            const allocation = {
                stableYields: user.targetStableYieldsPercent || 80,
                tokenizedStocks: user.targetTokenizedStocksPercent || 15,
                tokenizedGold: user.targetTokenizedGoldPercent || 5,
            };

            const stableYieldsAmount = (convertAmount * allocation.stableYields) / 100;
            const tokenizedStocksAmount = (convertAmount * allocation.tokenizedStocks) / 100;
            const tokenizedGoldAmount = (convertAmount * allocation.tokenizedGold) / 100;

            const conversionGroupId = uuidv4();

            const stableAsset = await assetRegistry.getPrimaryAssetByClassKey('stable_yields');
            const stocksAsset = await assetRegistry.getPrimaryAssetByClassKey('tokenized_stocks');
            const goldAsset = await assetRegistry.getPrimaryAssetByClassKey('tokenized_gold');

            if (!stableAsset || !stocksAsset || !goldAsset) {
                return res.send(
                    super.response(super._500, null, ['Missing primary assets for one or more classes'])
                );
            }

            const swapRepo = new SwapRepository();
            const createdSwaps = [];

            if (stableYieldsAmount > 0) {
                const estimatedToAmount = stableYieldsAmount * 0.998;
                const transaction = await swapRepo.createSwap({
                    userId,
                    fromAsset: 'USDC',
                    toAsset: stableAsset.symbol,
                    fromAmount: stableYieldsAmount,
                    estimatedToAmount,
                    slippage: 1.0,
                    metadata: {
                        conversionGroupId,
                        initiatedVia: 'wallet-conversion',
                    },
                    type: 'swap' as any,
                });

                await SWAP_EXECUTION_QUEUE.add(
                    {
                        transactionId: transaction.id,
                        userId,
                        fromAsset: 'USDC',
                        toAsset: stableAsset.symbol,
                        amount: stableYieldsAmount,
                        slippage: 1.0,
                    },
                    {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 2000 },
                        jobId: `swap-execute-${transaction.id}`,
                        removeOnComplete: true,
                        removeOnFail: false,
                    }
                );

                createdSwaps.push({
                    transactionId: transaction.id,
                    toAsset: stableAsset.symbol,
                    amount: stableYieldsAmount,
                });
            }

            if (tokenizedStocksAmount > 0) {
                const estimatedToAmount = tokenizedStocksAmount * 0.998;
                const transaction = await swapRepo.createSwap({
                    userId,
                    fromAsset: 'USDC',
                    toAsset: stocksAsset.symbol,
                    fromAmount: tokenizedStocksAmount,
                    estimatedToAmount,
                    slippage: 1.0,
                    metadata: {
                        conversionGroupId,
                        initiatedVia: 'wallet-conversion',
                    },
                    type: 'swap' as any,
                });

                await SWAP_EXECUTION_QUEUE.add(
                    {
                        transactionId: transaction.id,
                        userId,
                        fromAsset: 'USDC',
                        toAsset: stocksAsset.symbol,
                        amount: tokenizedStocksAmount,
                        slippage: 1.0,
                    },
                    {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 2000 },
                        jobId: `swap-execute-${transaction.id}`,
                        removeOnComplete: true,
                        removeOnFail: false,
                    }
                );

                createdSwaps.push({
                    transactionId: transaction.id,
                    toAsset: stocksAsset.symbol,
                    amount: tokenizedStocksAmount,
                });
            }

            if (tokenizedGoldAmount > 0) {
                const estimatedToAmount = tokenizedGoldAmount * 0.998;
                const transaction = await swapRepo.createSwap({
                    userId,
                    fromAsset: 'USDC',
                    toAsset: goldAsset.symbol,
                    fromAmount: tokenizedGoldAmount,
                    estimatedToAmount,
                    slippage: 1.0,
                    metadata: {
                        conversionGroupId,
                        initiatedVia: 'wallet-conversion',
                    },
                    type: 'swap' as any,
                });

                await SWAP_EXECUTION_QUEUE.add(
                    {
                        transactionId: transaction.id,
                        userId,
                        fromAsset: 'USDC',
                        toAsset: goldAsset.symbol,
                        amount: tokenizedGoldAmount,
                        slippage: 1.0,
                    },
                    {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 2000 },
                        jobId: `swap-execute-${transaction.id}`,
                        removeOnComplete: true,
                        removeOnFail: false,
                    }
                );

                createdSwaps.push({
                    transactionId: transaction.id,
                    toAsset: goldAsset.symbol,
                    amount: tokenizedGoldAmount,
                });
            }

            const conversionData = {
                conversionGroupId,
                convertedAmount: convertAmount,
                status: 'pending',
                swaps: createdSwaps,
                swapCount: createdSwaps.length,
                estimatedCompletionTime: '5-10 minutes',
                allocation,
            };

            return res.send(super.response(super._201, conversionData));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Generate mock checkout request ID
     * @returns string
     */
    private static generateCheckoutRequestId(): string {
        return `ws_CO_${Date.now()}${Math.floor(Math.random() * 10000)}`;
    }
}

export default DepositController;
