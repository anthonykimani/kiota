import { Repository, MoreThanOrEqual } from "typeorm";
import dotenv from "dotenv";
import AppDataSource from "../configs/ormconfig";
import { Transaction } from "../models/transaction.entity";
import { PaymentMethod, TransactionStatus, TransactionType } from "../enums/Transaction";
import { assetRegistry } from "../services/asset-registry.service";


export class TransactionRepository {
    private repo: Repository<Transaction>;

    constructor() {
        this.repo = AppDataSource.getRepository(Transaction);
        dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
    }

    /**
   * Idempotent onchain deposit creation.
   * Requires UNIQUE constraint on (chain, txHash, logIndex) in transactions table.
   */
    async createOnchainDeposit(data: {
        userId: string;
        chain: string;              // "base"
        tokenSymbol: string;        // "USDC"
        tokenAddress: string;
        walletAddress: string;
        amountUsd: number;          // USDC treated as USD
        txHash: string;
        logIndex: number;
        allocation: {
            stableYields: number;
            tokenizedStocks: number;
            tokenizedGold: number;
        };
    }): Promise<Transaction> {
        const txHash = data.txHash.toLowerCase();

        // 1) If exists, return it (idempotent)
        const existing = await this.repo.findOne({
            where: {
                chain: data.chain,
                txHash,
                logIndex: data.logIndex,
            },
        });

        if (existing) return existing;

        // 2) Create new
        const assetClassKey = await assetRegistry.getAssetClassKeyBySymbol(data.tokenSymbol);

        const tx = this.repo.create({
            userId: data.userId,
            type: TransactionType.DEPOSIT,
            status: TransactionStatus.COMPLETED,
            sourceAsset: data.tokenSymbol,
            sourceAmount: data.amountUsd,
            destinationAsset: data.tokenSymbol,
            destinationAmount: data.amountUsd,
            valueUsd: data.amountUsd,
            sourceAssetClassKey: assetClassKey ?? null,
            destinationAssetClassKey: assetClassKey ?? null,
            chain: data.chain,
            tokenSymbol: data.tokenSymbol,
            tokenAddress: data.tokenAddress,
            walletAddress: data.walletAddress,
            txHash,
            logIndex: data.logIndex,
            allocation: data.allocation,
            completedAt: new Date(),
        });

        return await this.repo.save(tx);
    }

    /**
     * Allocated USDC = sum(COMPLETED deposits) - sum(COMPLETED withdrawals) (optional)
     *
     */
    async getAllocatedUsdcUsd(userId: string): Promise<number> {
        const qb = this.repo
            .createQueryBuilder("t")
            .select("COALESCE(SUM(t.valueUsd), 0)", "sum")
            .where("t.userId = :userId", { userId })
            .andWhere("t.status = :status", { status: TransactionStatus.COMPLETED })
            .andWhere("t.chain = :chain", { chain: "base" })
            .andWhere("t.tokenSymbol = :tokenSymbol", { tokenSymbol: "USDC" })
            .andWhere("t.type = :type", { type: TransactionType.DEPOSIT });

        const result = await qb.getRawOne<{ sum: string }>();
        return Number(result?.sum ?? 0);
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
            const destinationAssetClassKey = await assetRegistry.getAssetClassKeyBySymbol('USDC');

            const transaction = this.repo.create({
                userId: data.userId,
                type: TransactionType.DEPOSIT,
                status: TransactionStatus.PENDING,
                sourceAsset: 'KES',
                sourceAmount: data.amountKes,
                destinationAsset: 'USDC',
                destinationAmount: data.amountUsd,
                valueUsd: data.amountUsd,
                destinationAssetClassKey: destinationAssetClassKey ?? null,
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
    async getByUserAndAsset(userId: string, asset: string, limit: number = 20): Promise<Transaction[]> {
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

    // Get completed transactions for history (after a start date)
    async getCompletedForHistory(userId: string, startDate: Date): Promise<Transaction[]> {
        try {
            return await this.repo.find({
                where: {
                    userId,
                    status: TransactionStatus.COMPLETED,
                    completedAt: MoreThanOrEqual(startDate),
                } as any,
                order: { completedAt: 'ASC' },
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
