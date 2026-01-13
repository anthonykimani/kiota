import { Repository } from "typeorm";
import dotenv from "dotenv";
import AppDataSource from "../configs/ormconfig";
import { Transaction } from "../models/transaction.entity";
import { AssetType, PaymentMethod, TransactionStatus, TransactionType } from "../enums/Transaction";


export class TransactionRepository {
    private repo: Repository<Transaction>;

    constructor() {
        this.repo = AppDataSource.getRepository(Transaction);
        dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
    }

    // Screen 10b: Create deposit transaction
    async createDeposit(data: {
        userId: string;
        amountKes: number;
        amountUsd: number;
        exchangeRate: number;
        mpesaPhoneNumber: string;
        allocation: {
            stableYields: number;
            tokenizedStocks: number;
            tokenizedGold: number;
        };
        feeKes?: number;
        feeUsd?: number;
    }): Promise<Transaction> {
        try {
            const transaction = this.repo.create({
                userId: data.userId,
                type: TransactionType.DEPOSIT,
                status: TransactionStatus.PENDING,
                sourceAsset: AssetType.KES,
                sourceAmount: data.amountKes,
                destinationAsset: AssetType.USDC,
                destinationAmount: data.amountUsd,
                valueUsd: data.amountUsd,
                paymentMethod: PaymentMethod.MPESA,
                mpesaPhoneNumber: data.mpesaPhoneNumber,
                exchangeRate: data.exchangeRate,
                allocation: data.allocation,
                feeAmount: data.feeKes || 0,
                feeUsd: data.feeUsd || 0,
                initiatedAt: new Date()
            });

            return await this.repo.save(transaction);
        } catch (error) {
            throw error;
        }
    }

    // Screen 10c: Update with M-Pesa checkout ID
    async updateMpesaCheckout(transactionId: string, checkoutRequestId: string): Promise<Transaction | null> {
        try {
            const transaction = await this.repo.findOne({ where: { id: transactionId } });
            if (!transaction) return null;

            transaction.mpesaCheckoutRequestId = checkoutRequestId;
            return await this.repo.save(transaction);
        } catch (error) {
            throw error;
        }
    }

    // Screen 10d: Update status to processing after M-Pesa payment
    async markAsProcessing(transactionId: string, mpesaReceiptNumber: string): Promise<Transaction | null> {
        try {
            const transaction = await this.repo.findOne({ where: { id: transactionId } });
            if (!transaction) return null;

            transaction.status = TransactionStatus.PROCESSING;
            transaction.mpesaReceiptNumber = mpesaReceiptNumber;
            return await this.repo.save(transaction);
        } catch (error) {
            throw error;
        }
    }

    // Screen 10e: Mark as completed after blockchain confirmation
    async markAsCompleted(transactionId: string, blockchainData: {
        txHash: string;
        chain?: string;
    }): Promise<Transaction | null> {
        try {
            const transaction = await this.repo.findOne({ where: { id: transactionId } });
            if (!transaction) return null;

            transaction.status = TransactionStatus.COMPLETED;
            transaction.txHash = blockchainData.txHash;
            transaction.chain = blockchainData.chain || 'base';
            transaction.completedAt = new Date();
            
            return await this.repo.save(transaction);
        } catch (error) {
            throw error;
        }
    }

    // Screen 10: Mark as failed
    async markAsFailed(transactionId: string, reason: string): Promise<Transaction | null> {
        try {
            const transaction = await this.repo.findOne({ where: { id: transactionId } });
            if (!transaction) return null;

            transaction.status = TransactionStatus.FAILED;
            transaction.failureReason = reason;
            transaction.failedAt = new Date();
            
            return await this.repo.save(transaction);
        } catch (error) {
            throw error;
        }
    }

    // Screen 10c: Find by M-Pesa checkout ID (for callback)
    async getByMpesaCheckoutId(checkoutRequestId: string): Promise<Transaction | null> {
        try {
            return await this.repo.findOne({
                where: { mpesaCheckoutRequestId: checkoutRequestId }
            });
        } catch (error) {
            throw error;
        }
    }

    // Screen 12: Get transactions for asset detail
    async getByUserAndAsset(userId: string, asset: AssetType, limit: number = 20): Promise<Transaction[]> {
        try {
            return await this.repo.find({
                where: [
                    { userId, sourceAsset: asset, status: TransactionStatus.COMPLETED },
                    { userId, destinationAsset: asset, status: TransactionStatus.COMPLETED }
                ],
                order: { createdAt: 'DESC' },
                take: limit
            });
        } catch (error) {
            throw error;
        }
    }

    // Screen 11: Get recent transactions for portfolio
    async getRecentByUser(userId: string, limit: number = 10): Promise<Transaction[]> {
        try {
            return await this.repo.find({
                where: { userId, status: TransactionStatus.COMPLETED },
                order: { createdAt: 'DESC' },
                take: limit
            });
        } catch (error) {
            throw error;
        }
    }

    // General: Get transaction by ID
    async getById(id: string): Promise<Transaction | null> {
        try {
            return await this.repo.findOne({ where: { id } });
        } catch (error) {
            throw error;
        }
    }
}