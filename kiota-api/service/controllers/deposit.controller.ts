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
class DepositController extends Controller {
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
            
            const userId = (req as any).userId;
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

                // Update transaction
                await transactionRepo.markAsProcessing(transaction.id, mpesaReceiptNumber);

                console.log(`Processing transaction ${transaction.id} with receipt ${mpesaReceiptNumber}`);
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
            
            const userId = (req as any).userId;
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
                // Note: Need to add save method to UserRepository
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
     * Generate mock checkout request ID
     * @returns string
     */
    private static generateCheckoutRequestId(): string {
        return `ws_CO_${Date.now()}${Math.floor(Math.random() * 10000)}`;
    }
}

export default DepositController;