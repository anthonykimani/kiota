/**
 * Balance Updater Service
 *
 * Performs atomic balance updates after swap completion
 *
 * Key features:
 * - Uses database transactions for atomicity (all-or-nothing updates)
 * - Updates Portfolio values (asset USD values and percentages)
 * - Updates Wallet balances (cached balances)
 * - Marks Transaction as completed
 * - Recalculates portfolio returns
 *
 * CRITICAL: All updates must happen in a single database transaction
 * to prevent inconsistent state if any operation fails.
 */

import AppDataSource from '../configs/ormconfig';
import { Portfolio } from '../models/portfolio.entity';
import { Wallet } from '../models/wallet.entity';
import { Transaction } from '../models/transaction.entity';
import { TransactionStatus } from '../enums/Transaction';
import { AssetType as TokenAssetType, getAssetCategory } from '../configs/tokens.config';
import { createLogger } from '../utils/logger.util';

const logger = createLogger('balance-updater-service');

/**
 * Parameters for single swap balance update
 */
export interface UpdateAfterSwapParams {
  userId: string;
  fromAsset: TokenAssetType;
  toAsset: TokenAssetType;
  fromAmount: number; // Amount sent
  toAmount: number; // Amount received
  transactionId: string;
}

/**
 * Parameters for multi-swap balance update (rebalancing, deposit conversion)
 */
export interface UpdateAfterMultiSwapParams {
  userId: string;
  swaps: Array<{
    fromAsset: TokenAssetType;
    toAsset: TokenAssetType;
    fromAmount: number;
    toAmount: number;
    transactionId: string;
  }>;
}

class BalanceUpdaterService {
  /**
   * Update balances after a single swap completes
   *
   * Uses database transaction for atomicity
   */
  async updateAfterSwap(params: UpdateAfterSwapParams): Promise<void> {
    const { userId, fromAsset, toAsset, fromAmount, toAmount, transactionId } = params;

    logger.info('Starting atomic balance update after swap', {
      userId,
      fromAsset,
      toAsset,
      fromAmount,
      toAmount,
      transactionId,
    });

    // Execute all updates in a single database transaction
    await AppDataSource.transaction(async (manager) => {
      const portfolioRepo = manager.getRepository(Portfolio);
      const walletRepo = manager.getRepository(Wallet);
      const txRepo = manager.getRepository(Transaction);

      // Fetch current state
      const portfolio = await portfolioRepo.findOne({ where: { userId } });
      const wallet = await walletRepo.findOne({ where: { userId } });
      const transaction = await txRepo.findOne({ where: { id: transactionId } });

      if (!portfolio || !wallet || !transaction) {
        throw new Error('Portfolio, wallet, or transaction not found');
      }

      logger.debug('Current state retrieved', {
        portfolioTotal: portfolio.totalValueUsd,
        walletBalances: {
          stableYields: wallet.stableYieldBalance,
          tokenizedStocks: wallet.tokenizedStocksBalance,
          tokenizedGold: wallet.tokenizedGoldBalance,
        },
      });

      // Build portfolio updates
      const portfolioUpdates: Partial<Portfolio> = {};

      // Decrement source asset
      const fromCategory = getAssetCategory(fromAsset);
      if (fromCategory) {
        const fromField = this.getCategoryField(fromCategory);
        (portfolioUpdates as any)[fromField] = Number(portfolio[fromField]) - fromAmount;
        logger.debug(`Decrementing ${fromCategory}`, {
          field: fromField,
          before: portfolio[fromField],
          change: -fromAmount,
          after: (portfolioUpdates as any)[fromField],
        });
      }

      // Increment destination asset
      const toCategory = getAssetCategory(toAsset);
      if (toCategory) {
        const toField = this.getCategoryField(toCategory);
        (portfolioUpdates as any)[toField] =
          ((portfolioUpdates as any)[toField] !== undefined
            ? Number((portfolioUpdates as any)[toField])
            : Number(portfolio[toField])) + toAmount;
        logger.debug(`Incrementing ${toCategory}`, {
          field: toField,
          before: portfolio[toField],
          change: +toAmount,
          after: (portfolioUpdates as any)[toField],
        });
      }

      // Calculate new total and percentages
      const newStableYields =
        portfolioUpdates.stableYieldsValueUsd !== undefined
          ? portfolioUpdates.stableYieldsValueUsd
          : Number(portfolio.stableYieldsValueUsd);
      const newStocks =
        portfolioUpdates.tokenizedStocksValueUsd !== undefined
          ? portfolioUpdates.tokenizedStocksValueUsd
          : Number(portfolio.tokenizedStocksValueUsd);
      const newGold =
        portfolioUpdates.tokenizedGoldValueUsd !== undefined
          ? portfolioUpdates.tokenizedGoldValueUsd
          : Number(portfolio.tokenizedGoldValueUsd);

      const newTotal = newStableYields + newStocks + newGold;
      portfolioUpdates.totalValueUsd = newTotal;

      // Calculate percentages
      if (newTotal > 0) {
        portfolioUpdates.stableYieldsPercent = (newStableYields / newTotal) * 100;
        portfolioUpdates.tokenizedStocksPercent = (newStocks / newTotal) * 100;
        portfolioUpdates.tokenizedGoldPercent = (newGold / newTotal) * 100;
      }

      // Calculate returns (gains/losses)
      const totalDeposited = Number(portfolio.totalDeposited);
      const totalWithdrawn = Number(portfolio.totalWithdrawn);
      const netDeposited = totalDeposited - totalWithdrawn;

      if (netDeposited > 0) {
        const totalGains = newTotal - netDeposited;
        portfolioUpdates.totalGainsUsd = totalGains;
        portfolioUpdates.allTimeReturnPercent = (totalGains / netDeposited) * 100;
      }

      logger.debug('Portfolio updates calculated', {
        newTotal,
        percentages: {
          stableYields: portfolioUpdates.stableYieldsPercent,
          tokenizedStocks: portfolioUpdates.tokenizedStocksPercent,
          tokenizedGold: portfolioUpdates.tokenizedGoldPercent,
        },
      });

      // Update portfolio
      await portfolioRepo.update({ userId }, portfolioUpdates);

      // Build wallet updates
      const walletUpdates: Partial<Wallet> = {};

      // Decrement source balance
      if (fromCategory) {
        const fromBalanceField = this.getBalanceField(fromCategory);
        (walletUpdates as any)[fromBalanceField] = Number(wallet[fromBalanceField]) - fromAmount;
      }

      // Increment destination balance
      if (toCategory) {
        const toBalanceField = this.getBalanceField(toCategory);
        (walletUpdates as any)[toBalanceField] =
          ((walletUpdates as any)[toBalanceField] !== undefined
            ? Number((walletUpdates as any)[toBalanceField])
            : Number(wallet[toBalanceField])) + toAmount;
      }

      walletUpdates.balancesLastUpdated = new Date();

      logger.debug('Wallet updates calculated', { walletUpdates });

      // Update wallet
      await walletRepo.update({ userId }, walletUpdates);

      // Mark transaction as completed
      await txRepo.update(
        { id: transactionId },
        {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
          destinationAmount: toAmount, // Update with actual received amount
        }
      );

      logger.info('Atomic balance update complete', {
        transactionId,
        portfolioTotal: newTotal,
        portfolioPercentages: {
          stableYields: portfolioUpdates.stableYieldsPercent?.toFixed(2),
          tokenizedStocks: portfolioUpdates.tokenizedStocksPercent?.toFixed(2),
          tokenizedGold: portfolioUpdates.tokenizedGoldPercent?.toFixed(2),
        },
      });
    });

    logger.info('Balance update transaction committed successfully');
  }

  /**
   * Update balances after multiple swaps (rebalancing, deposit conversion)
   *
   * Performs all swap updates in a single atomic transaction
   */
  async updateAfterMultiSwap(params: UpdateAfterMultiSwapParams): Promise<void> {
    const { userId, swaps } = params;

    logger.info('Starting atomic balance update after multi-swap', {
      userId,
      swapCount: swaps.length,
    });

    // Execute all updates in a single database transaction
    await AppDataSource.transaction(async (manager) => {
      const portfolioRepo = manager.getRepository(Portfolio);
      const walletRepo = manager.getRepository(Wallet);
      const txRepo = manager.getRepository(Transaction);

      // Fetch current state
      const portfolio = await portfolioRepo.findOne({ where: { userId } });
      const wallet = await walletRepo.findOne({ where: { userId } });

      if (!portfolio || !wallet) {
        throw new Error('Portfolio or wallet not found');
      }

      logger.debug('Current state retrieved for multi-swap', {
        portfolioTotal: portfolio.totalValueUsd,
      });

      // Accumulate all changes
      const portfolioChanges = {
        stableYields: 0,
        tokenizedStocks: 0,
        tokenizedGold: 0,
      };

      const walletChanges = {
        stableYieldBalance: 0,
        tokenizedStocksBalance: 0,
        tokenizedGoldBalance: 0,
      };

      // Process each swap
      for (const swap of swaps) {
        const { fromAsset, toAsset, fromAmount, toAmount, transactionId } = swap;

        logger.debug('Processing swap in multi-swap batch', {
          transactionId,
          fromAsset,
          toAsset,
          fromAmount,
          toAmount,
        });

        // Update category values
        const fromCategory = getAssetCategory(fromAsset);
        const toCategory = getAssetCategory(toAsset);

        if (fromCategory) {
          portfolioChanges[fromCategory] -= fromAmount;
          walletChanges[this.getBalanceFieldSimple(fromCategory)] -= fromAmount;
        }

        if (toCategory) {
          portfolioChanges[toCategory] += toAmount;
          walletChanges[this.getBalanceFieldSimple(toCategory)] += toAmount;
        }

        // Mark transaction as completed
        await txRepo.update(
          { id: transactionId },
          {
            status: TransactionStatus.COMPLETED,
            completedAt: new Date(),
            destinationAmount: toAmount,
          }
        );
      }

      // Apply accumulated changes to portfolio
      const newStableYields = Number(portfolio.stableYieldsValueUsd) + portfolioChanges.stableYields;
      const newStocks =
        Number(portfolio.tokenizedStocksValueUsd) + portfolioChanges.tokenizedStocks;
      const newGold = Number(portfolio.tokenizedGoldValueUsd) + portfolioChanges.tokenizedGold;
      const newTotal = newStableYields + newStocks + newGold;

      const portfolioUpdates: Partial<Portfolio> = {
        stableYieldsValueUsd: newStableYields,
        tokenizedStocksValueUsd: newStocks,
        tokenizedGoldValueUsd: newGold,
        totalValueUsd: newTotal,
      };

      if (newTotal > 0) {
        portfolioUpdates.stableYieldsPercent = (newStableYields / newTotal) * 100;
        portfolioUpdates.tokenizedStocksPercent = (newStocks / newTotal) * 100;
        portfolioUpdates.tokenizedGoldPercent = (newGold / newTotal) * 100;
      }

      // Calculate returns
      const totalDeposited = Number(portfolio.totalDeposited);
      const totalWithdrawn = Number(portfolio.totalWithdrawn);
      const netDeposited = totalDeposited - totalWithdrawn;

      if (netDeposited > 0) {
        const totalGains = newTotal - netDeposited;
        portfolioUpdates.totalGainsUsd = totalGains;
        portfolioUpdates.allTimeReturnPercent = (totalGains / netDeposited) * 100;
      }

      await portfolioRepo.update({ userId }, portfolioUpdates);

      // Apply accumulated changes to wallet
      const walletUpdates: Partial<Wallet> = {
        stableYieldBalance: Number(wallet.stableYieldBalance) + walletChanges.stableYieldBalance,
        tokenizedStocksBalance:
          Number(wallet.tokenizedStocksBalance) + walletChanges.tokenizedStocksBalance,
        tokenizedGoldBalance:
          Number(wallet.tokenizedGoldBalance) + walletChanges.tokenizedGoldBalance,
        balancesLastUpdated: new Date(),
      };

      await walletRepo.update({ userId }, walletUpdates);

      logger.info('Multi-swap balance update complete', {
        swapCount: swaps.length,
        portfolioTotal: newTotal,
        portfolioPercentages: {
          stableYields: portfolioUpdates.stableYieldsPercent?.toFixed(2),
          tokenizedStocks: portfolioUpdates.tokenizedStocksPercent?.toFixed(2),
          tokenizedGold: portfolioUpdates.tokenizedGoldPercent?.toFixed(2),
        },
      });
    });

    logger.info('Multi-swap balance update transaction committed successfully');
  }

  /**
   * Get portfolio field name for asset category
   */
  private getCategoryField(
    category: 'stableYields' | 'tokenizedStocks' | 'tokenizedGold'
  ): keyof Portfolio {
    const mapping: Record<string, keyof Portfolio> = {
      stableYields: 'stableYieldsValueUsd',
      tokenizedStocks: 'tokenizedStocksValueUsd',
      tokenizedGold: 'tokenizedGoldValueUsd',
    };
    return mapping[category];
  }

  /**
   * Get wallet balance field name for asset category
   */
  private getBalanceField(
    category: 'stableYields' | 'tokenizedStocks' | 'tokenizedGold'
  ): keyof Wallet {
    const mapping: Record<string, keyof Wallet> = {
      stableYields: 'stableYieldBalance',
      tokenizedStocks: 'tokenizedStocksBalance',
      tokenizedGold: 'tokenizedGoldBalance',
    };
    return mapping[category];
  }

  /**
   * Get wallet balance field name (simple) for multi-swap accumulation
   */
  private getBalanceFieldSimple(
    category: 'stableYields' | 'tokenizedStocks' | 'tokenizedGold'
  ): 'stableYieldBalance' | 'tokenizedStocksBalance' | 'tokenizedGoldBalance' {
    const mapping = {
      stableYields: 'stableYieldBalance' as const,
      tokenizedStocks: 'tokenizedStocksBalance' as const,
      tokenizedGold: 'tokenizedGoldBalance' as const,
    };
    return mapping[category];
  }
}

// Singleton instance
export const balanceUpdaterService = new BalanceUpdaterService();

export default BalanceUpdaterService;
