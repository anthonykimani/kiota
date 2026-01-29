/**
 * Swap Repository
 *
 * Manages swap transaction records (type: SWAP or REBALANCE)
 *
 * Follows the same pattern as TransactionRepository.createOnchainDeposit()
 * Uses existing Transaction entity with metadata JSONB field for 1inch order details
 */

import { Repository } from 'typeorm';
import AppDataSource from '../configs/ormconfig';
import { Transaction } from '../models/transaction.entity';
import { TransactionStatus, TransactionType } from '../enums/Transaction';
import { assetRegistry } from '../services/asset-registry.service';

/**
 * Swap creation parameters
 */
export interface CreateSwapParams {
  userId: string;
  fromAsset: string;
  toAsset: string;
  fromAmount: number;
  estimatedToAmount: number;
  slippage: number;
  metadata: {
    orderHash?: string;        // 1inch order hash (set after order placement)
    quote?: any;               // 1inch quote response
    route?: any[];             // Swap routing details
    priceImpact?: number;      // Price impact percentage
    attemptedSlippages?: number[]; // Track retry attempts
    rebalanceGroupId?: string; // Groups swaps in same rebalance operation
    conversionGroupId?: string; // Groups swaps in same deposit conversion
    depositSessionId?: string; // Links to deposit session (for conversions)
    initiatedVia?: string;     // Source of swap (e.g., 'rebalance-endpoint', 'deposit-conversion')
    [key: string]: any;        // Allow additional metadata properties
  };
  type?: TransactionType;      // SWAP (default) or REBALANCE
}

/**
 * Update swap status parameters
 */
export interface UpdateSwapStatusParams {
  orderHash: string;
  status: TransactionStatus;
  actualToAmount?: number;
  txHash?: string;
  blockNumber?: number;
  failureReason?: string;
}

export class SwapRepository {
  private repo: Repository<Transaction>;

  constructor() {
    this.repo = AppDataSource.getRepository(Transaction);
  }

  /**
   * Create swap transaction
   *
   * Idempotent via orderHash in metadata (checked before creation)
   */
  async createSwap(data: CreateSwapParams): Promise<Transaction> {
    const sourceAssetClassKey = await assetRegistry.getAssetClassKeyBySymbol(data.fromAsset);
    const destinationAssetClassKey = await assetRegistry.getAssetClassKeyBySymbol(data.toAsset);

    // If orderHash provided, check if swap already exists (idempotency)
    if (data.metadata.orderHash) {
      const existing = await this.getSwapByOrderHash(data.metadata.orderHash);
      if (existing) {
        return existing;
      }
    }

    // Create new swap transaction
    const transaction = this.repo.create({
      userId: data.userId,
      type: data.type || TransactionType.SWAP,
      status: TransactionStatus.PENDING,
      sourceAsset: data.fromAsset,
      sourceAmount: data.fromAmount,
      destinationAsset: data.toAsset,
      destinationAmount: data.estimatedToAmount,
      valueUsd: data.fromAmount, // Assume all assets are USD-pegged or tracked
      sourceAssetClassKey: sourceAssetClassKey ?? null,
      destinationAssetClassKey: destinationAssetClassKey ?? null,
      chain: 'base', // Always Base for now
      tokenSymbol: data.toAsset,
      metadata: {
        ...data.metadata,
        slippage: data.slippage,
        createdVia: '1inch-fusion',
      },
      initiatedAt: new Date(),
    });

    return await this.repo.save(transaction);
  }

  /**
   * Update swap status after 1inch confirmation
   */
  async updateSwapStatus(params: UpdateSwapStatusParams): Promise<Transaction | null> {
    const { orderHash, status, actualToAmount, txHash, blockNumber, failureReason } = params;

    // Find transaction by orderHash in metadata
    const transaction = await this.getSwapByOrderHash(orderHash);

    if (!transaction) {
      return null;
    }

    // Update transaction
    transaction.status = status;

    if (actualToAmount !== undefined) {
      transaction.destinationAmount = actualToAmount;
      transaction.valueUsd = actualToAmount; // Update USD value to actual received
    }

    if (txHash) {
      transaction.txHash = txHash.toLowerCase();
    }

    if (blockNumber !== undefined) {
      transaction.blockNumber = blockNumber;
    }

    if (status === TransactionStatus.COMPLETED) {
      transaction.completedAt = new Date();
    }

    if (status === TransactionStatus.FAILED) {
      transaction.failedAt = new Date();
      transaction.failureReason = failureReason || 'Swap failed';
    }

    // Update metadata with latest info
    transaction.metadata = {
      ...transaction.metadata,
      lastUpdated: new Date().toISOString(),
      finalStatus: status,
    };

    return await this.repo.save(transaction);
  }

  /**
   * Update swap metadata (e.g., save orderHash after order placement)
   */
  async updateSwapMetadata(
    transactionId: string,
    metadata: Record<string, any>
  ): Promise<Transaction | null> {
    const transaction = await this.repo.findOne({ where: { id: transactionId } });

    if (!transaction) {
      return null;
    }

    transaction.metadata = {
      ...transaction.metadata,
      ...metadata,
    };

    return await this.repo.save(transaction);
  }

  /**
   * Get swap by transaction ID
   */
  async getById(id: string): Promise<Transaction | null> {
    return await this.repo.findOne({ where: { id } });
  }

  /**
   * Get swap by 1inch order hash
   *
   * Queries metadata.orderHash using JSONB containment
   */
  async getSwapByOrderHash(orderHash: string): Promise<Transaction | null> {
    // TypeORM JSONB query for metadata.orderHash
    const transaction = await this.repo
      .createQueryBuilder('transaction')
      .where("transaction.metadata->>'orderHash' = :orderHash", { orderHash })
      .andWhere('transaction.type IN (:...types)', {
        types: [TransactionType.SWAP, TransactionType.REBALANCE],
      })
      .getOne();

    return transaction;
  }

  /**
   * Get user's swap history
   */
  async getSwapHistory(userId: string, limit: number = 20): Promise<Transaction[]> {
    return await this.repo.find({
      where: [
        { userId, type: TransactionType.SWAP },
        { userId, type: TransactionType.REBALANCE },
      ],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get pending/processing swaps for a user
   */
  async getPendingSwaps(userId: string): Promise<Transaction[]> {
    return await this.repo.find({
      where: [
        {
          userId,
          type: TransactionType.SWAP,
          status: TransactionStatus.PENDING,
        },
        {
          userId,
          type: TransactionType.SWAP,
          status: TransactionStatus.PROCESSING,
        },
        {
          userId,
          type: TransactionType.REBALANCE,
          status: TransactionStatus.PENDING,
        },
        {
          userId,
          type: TransactionType.REBALANCE,
          status: TransactionStatus.PROCESSING,
        },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get recent swaps by asset pair
   */
  async getSwapsByAssetPair(
    userId: string,
    fromAsset: string,
    toAsset: string,
    limit: number = 10
  ): Promise<Transaction[]> {
    return await this.repo.find({
      where: {
        userId,
        sourceAsset: fromAsset,
        destinationAsset: toAsset,
        status: TransactionStatus.COMPLETED,
        type: TransactionType.SWAP,
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Mark swap as failed
   */
  async markAsFailed(transactionId: string, reason: string): Promise<Transaction | null> {
    const transaction = await this.repo.findOne({ where: { id: transactionId } });

    if (!transaction) {
      return null;
    }

    transaction.status = TransactionStatus.FAILED;
    transaction.failureReason = reason;
    transaction.failedAt = new Date();

    return await this.repo.save(transaction);
  }

  /**
   * Create multiple swaps (for rebalancing)
   *
   * All swaps created with type: REBALANCE and linked via metadata.rebalanceGroupId
   */
  async createRebalanceSwaps(
    userId: string,
    swaps: Array<{
      fromAsset: string;
      toAsset: string;
      fromAmount: number;
      estimatedToAmount: number;
      slippage: number;
      metadata: any;
    }>,
    rebalanceGroupId: string
  ): Promise<Transaction[]> {
    const transactions: Transaction[] = [];

    for (const swap of swaps) {
      const transaction = await this.createSwap({
        userId,
        fromAsset: swap.fromAsset,
        toAsset: swap.toAsset,
        fromAmount: swap.fromAmount,
        estimatedToAmount: swap.estimatedToAmount,
        slippage: swap.slippage,
        metadata: {
          ...swap.metadata,
          rebalanceGroupId, // Link all swaps in same rebalance operation
        },
        type: TransactionType.REBALANCE,
      });

      transactions.push(transaction);
    }

    return transactions;
  }

  /**
   * Get all swaps in a rebalance group
   */
  async getRebalanceGroup(rebalanceGroupId: string): Promise<Transaction[]> {
    return await this.repo
      .createQueryBuilder('transaction')
      .where("transaction.metadata->>'rebalanceGroupId' = :rebalanceGroupId", {
        rebalanceGroupId,
      })
      .andWhere('transaction.type = :type', { type: TransactionType.REBALANCE })
      .orderBy('transaction.createdAt', 'ASC')
      .getMany();
  }

  /**
   * Map token asset type to transaction asset type enum
   */
}
