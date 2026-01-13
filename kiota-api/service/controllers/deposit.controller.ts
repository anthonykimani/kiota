import { Request, Response } from 'express';

import { TransactionRepository } from '../repositories/transaction.repo';
import { PortfolioRepository } from '../repositories/portfolio.repo';
import { UserRepository } from '../repositories/user.repo';
import { MarketDataRepository } from '../repositories/market-data.repo';
import { WalletRepository } from '../repositories/wallet.repo';
import Controller from './controller';

/**
 * Deposit Controller
 * Handles deposit/add money flow for Phase 1 MVP
 * Screen: 10 (Add Money Flow - 10a through 10e)
 */
export class DepositController extends Controller {
    private transactionRepo: TransactionRepository;
    private portfolioRepo: PortfolioRepository;
    private userRepo: UserRepository;
    private marketDataRepo: MarketDataRepository;
    private walletRepo: WalletRepository;

    constructor() {
        super();
        this.transactionRepo = new TransactionRepository();
        this.portfolioRepo = new PortfolioRepository();
        this.userRepo = new UserRepository();
        this.marketDataRepo = new MarketDataRepository();
        this.walletRepo = new WalletRepository();
    }

    /**
     * Initiate deposit (Screens 10a & 10b)
     * @param req Express Request
     * @param res Express Response
     */
    async initiateDeposit(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;

            if (!userId) {
                return res.json(
                    DepositController.response(
                        DepositController._401,
                        null,
                        ['Not authenticated']
                    )
                );
            }

            const { amountKes, mpesaPhoneNumber, customAllocation } = req.body;

            if (!amountKes || amountKes < 100) {
                return res.json(
                    DepositController.response(
                        DepositController._400,
                        null,
                        ['Minimum deposit is KES 100']
                    )
                );
            }

            if (!mpesaPhoneNumber || !mpesaPhoneNumber.match(/^\+254\d{9}$/)) {
                return res.json(
                    DepositController.response(
                        DepositController._400,
                        null,
                        ['Invalid M-Pesa phone number format']
                    )
                );
            }

            // Get user using user.repo.ts method
            const user = await this.userRepo.getById(userId);
            // Get portfolio using portfolio.repo.ts method
            const portfolio = await this.portfolioRepo.getByUserId(userId);

            if (!user || !portfolio) {
                return res.json(
                    DepositController.response(
                        DepositController._404,
                        null,
                        ['User or portfolio not found']
                    )
                );
            }

            // Get exchange rate using market-data.repo.ts method
            const exchangeRate = await this.marketDataRepo.getKesUsdRate();
            const amountUsd = amountKes / exchangeRate;

            let allocation;
            if (customAllocation) {
                const total = customAllocation.stableYields + 
                             customAllocation.tokenizedStocks + 
                             customAllocation.tokenizedGold;

                if (Math.abs(total - 100) > 0.01) {
                    return res.json(
                        DepositController.response(
                            DepositController._400,
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

            // Create transaction using transaction.repo.ts method
            const transaction = await this.transactionRepo.createDeposit({
                userId,
                amountKes,
                amountUsd: effectiveAmountUsd,
                exchangeRate,
                mpesaPhoneNumber,
                allocation,
                feeKes,
                feeUsd
            });

            const assetBreakdown = {
                stableYields: {
                    asset: 'USDM',
                    amountUsd: effectiveAmountUsd * ((allocation.stableYields || 0) / 100),
                    percentage: allocation.stableYields || 0
                },
                tokenizedStocks: {
                    asset: 'bCSPX',
                    amountUsd: effectiveAmountUsd * ((allocation.tokenizedStocks || 0) / 100),
                    percentage: allocation.tokenizedStocks || 0,
                    requiresTier2: true
                },
                tokenizedGold: {
                    asset: 'PAXG',
                    amountUsd: effectiveAmountUsd * ((allocation.tokenizedGold || 0) / 100),
                    percentage: allocation.tokenizedGold || 0
                }
            };

            return res.json(
                DepositController.response(
                    DepositController._200,
                    {
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
                    }
                )
            );

        } catch (error: any) {
            console.error('Initiate deposit error:', error);
            return res.json(
                DepositController.response(
                    DepositController._500,
                    null,
                    DepositController.ex(error)
                )
            );
        }
    }

    /**
     * Trigger M-Pesa STK push (Screen 10c)
     * @param req Express Request
     * @param res Express Response
     */
    async triggerMpesaPush(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;
            const { transactionId } = req.body;

            if (!transactionId) {
                return res.json(
                    DepositController.response(
                        DepositController._400,
                        null,
                        ['Transaction ID is required']
                    )
                );
            }

            // Get transaction using transaction.repo.ts method
            const transaction = await this.transactionRepo.getById(transactionId);

            if (!transaction || transaction.userId !== userId) {
                return res.json(
                    DepositController.response(
                        DepositController._404,
                        null,
                        ['Transaction not found']
                    )
                );
            }

            const checkoutRequestId = this.generateCheckoutRequestId();

            // Update transaction using transaction.repo.ts method
            await this.transactionRepo.updateMpesaCheckout(transactionId, checkoutRequestId);

            return res.json(
                DepositController.response(
                    DepositController._200,
                    {
                        transactionId: transaction.id,
                        checkoutRequestId,
                        amountKes: transaction.sourceAmount,
                        phoneNumber: transaction.mpesaPhoneNumber,
                        status: 'awaiting_payment'
                    }
                )
            );

        } catch (error: any) {
            console.error('Trigger M-Pesa push error:', error);
            return res.json(
                DepositController.response(
                    DepositController._500,
                    null,
                    DepositController.ex(error)
                )
            );
        }
    }

    /**
     * M-Pesa callback handler (Screen 10d)
     * @param req Express Request
     * @param res Express Response
     */
    async mpesaCallback(req: Request, res: Response) {
        try {
            const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = req.body;

            // Find transaction using transaction.repo.ts method
            const transaction = await this.transactionRepo.getByMpesaCheckoutId(CheckoutRequestID);

            if (!transaction) {
                console.error(`Transaction not found for checkout ID: ${CheckoutRequestID}`);
                return res.json({ ResultCode: 1, ResultDesc: 'Transaction not found' });
            }

            if (ResultCode === 0 && CallbackMetadata) {
                const mpesaReceiptNumber = CallbackMetadata.MpesaReceiptNumber;

                // Update transaction using transaction.repo.ts method
                await this.transactionRepo.markAsProcessing(transaction.id, mpesaReceiptNumber);

                console.log(`Processing transaction ${transaction.id} with receipt ${mpesaReceiptNumber}`);
            } else {
                // Mark as failed using transaction.repo.ts method
                await this.transactionRepo.markAsFailed(transaction.id, ResultDesc);
            }

            return res.json({ ResultCode: 0, ResultDesc: 'Callback received successfully' });

        } catch (error: any) {
            console.error('M-Pesa callback error:', error);
            return res.json({ ResultCode: 1, ResultDesc: 'Internal server error' });
        }
    }

    /**
     * Check transaction status (Screen 10e)
     * @param req Express Request
     * @param res Express Response
     */
    async getTransactionStatus(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;
            const { transactionId } = req.params;

            // Get transaction using transaction.repo.ts method
            const transaction = await this.transactionRepo.getById(transactionId);

            if (!transaction || transaction.userId !== userId) {
                return res.json(
                    DepositController.response(
                        DepositController._404,
                        null,
                        ['Transaction not found']
                    )
                );
            }

            return res.json(
                DepositController.response(
                    DepositController._200,
                    {
                        transactionId: transaction.id,
                        status: transaction.status,
                        amountKes: transaction.sourceAmount,
                        amountUsd: transaction.destinationAmount,
                        mpesaReceiptNumber: transaction.mpesaReceiptNumber,
                        txHash: transaction.txHash,
                        completedAt: transaction.completedAt,
                        failureReason: transaction.failureReason
                    }
                )
            );

        } catch (error: any) {
            console.error('Get transaction status error:', error);
            return res.json(
                DepositController.response(
                    DepositController._500,
                    null,
                    DepositController.ex(error)
                )
            );
        }
    }

    /**
     * Complete deposit (called by background job)
     * @param req Express Request
     * @param res Express Response
     */
    async completeDeposit(req: Request, res: Response) {
        try {
            const { transactionId, txHash, blockchainData } = req.body;

            if (!transactionId || !txHash) {
                return res.json(
                    DepositController.response(
                        DepositController._400,
                        null,
                        ['Transaction ID and transaction hash are required']
                    )
                );
            }

            // Get transaction using transaction.repo.ts method
            const transaction = await this.transactionRepo.getById(transactionId);

            if (!transaction) {
                return res.json(
                    DepositController.response(
                        DepositController._404,
                        null,
                        ['Transaction not found']
                    )
                );
            }

            // Mark as completed using transaction.repo.ts method
            await this.transactionRepo.markAsCompleted(transactionId, {
                txHash,
                chain: blockchainData?.chain || 'base'
            });

            const allocation = transaction.allocation;
            const amountUsd = transaction.destinationAmount;

            // Update portfolio using portfolio.repo.ts method
            await this.portfolioRepo.updateValues(transaction.userId, {
                stableYieldsValueUsd: amountUsd * ((allocation?.stableYields || 0) / 100),
                tokenizedStocksValueUsd: amountUsd * ((allocation?.tokenizedStocks || 0) / 100),
                tokenizedGoldValueUsd: amountUsd * ((allocation?.tokenizedGold || 0) / 100),
                kesUsdRate: transaction.exchangeRate
            });

            // Record deposit using portfolio.repo.ts method
            await this.portfolioRepo.recordDeposit(transaction.userId, amountUsd);

            // Calculate returns using portfolio.repo.ts method
            await this.portfolioRepo.calculateReturns(transaction.userId);

            // Update wallet balances using wallet.repo.ts method
            await this.walletRepo.updateBalances(transaction.userId, {
                stableYieldBalance: amountUsd * ((allocation?.stableYields || 0) / 100),
                tokenizedStocksBalance: amountUsd * ((allocation?.tokenizedStocks || 0) / 100),
                tokenizedGoldBalance: amountUsd * ((allocation?.tokenizedGold || 0) / 100)
            });

            // Mark first deposit subsidy as used
            const user = await this.userRepo.getById(transaction.userId);
            if (user && !user.firstDepositSubsidyUsed) {
                user.firstDepositSubsidyUsed = true;
                await this.userRepo.save(user);
            }

            return res.json(
                DepositController.response(
                    DepositController._200,
                    {
                        transactionId: transaction.id,
                        txHash,
                        completedAt: new Date()
                    }
                )
            );

        } catch (error: any) {
            console.error('Complete deposit error:', error);
            return res.json(
                DepositController.response(
                    DepositController._500,
                    null,
                    DepositController.ex(error)
                )
            );
        }
    }

    /**
     * Generate mock checkout request ID
     * @returns string
     */
    private generateCheckoutRequestId(): string {
        return `ws_CO_${Date.now()}${Math.floor(Math.random() * 10000)}`;
    }
}