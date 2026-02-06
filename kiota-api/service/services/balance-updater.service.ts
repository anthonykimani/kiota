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
import { PortfolioHolding } from '../models/portfolio-holding.entity';
import { TransactionStatus } from '../enums/Transaction';
import { assetRegistry } from '../services/asset-registry.service';
import { createLogger } from '../utils/logger.util';

const logger = createLogger('balance-updater-service');

/**
 * Parameters for single swap balance update
 */
export interface UpdateAfterSwapParams {
  userId: string;
  fromAsset: string;
  toAsset: string;
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
    fromAsset: string;
    toAsset: string;
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

    const fromClassKey = await assetRegistry.getAssetClassKeyBySymbol(fromAsset);
    const toClassKey = await assetRegistry.getAssetClassKeyBySymbol(toAsset);

    const isCashAsset = (symbol: string) => symbol.toUpperCase() === 'USDC';
    const fromIsCash = isCashAsset(fromAsset);
    const toIsCash = isCashAsset(toAsset);

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
      const holdingRepo = manager.getRepository(PortfolioHolding);

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
          defiYield: wallet.defiYieldBalance,
          tokenizedGold: wallet.tokenizedGoldBalance,
          bluechipCrypto: wallet.bluechipCryptoBalance,
        },
      });

      // Build portfolio updates
      const portfolioUpdates: Partial<Portfolio> = {};

      // Decrement source asset
      const fromCategory = this.normalizeClassKey(fromClassKey);
      if (fromCategory && !fromIsCash) {
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
      const toCategory = this.normalizeClassKey(toClassKey);
      if (toCategory && !toIsCash) {
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
      const newDefiYield =
        portfolioUpdates.defiYieldValueUsd !== undefined
          ? portfolioUpdates.defiYieldValueUsd
          : Number(portfolio.defiYieldValueUsd);
      const newGold =
        portfolioUpdates.tokenizedGoldValueUsd !== undefined
          ? portfolioUpdates.tokenizedGoldValueUsd
          : Number(portfolio.tokenizedGoldValueUsd);
      const newCrypto =
        portfolioUpdates.bluechipCryptoValueUsd !== undefined
          ? portfolioUpdates.bluechipCryptoValueUsd
          : Number(portfolio.bluechipCryptoValueUsd);

      const newTotal = newStableYields + newDefiYield + newGold + newCrypto;
      portfolioUpdates.totalValueUsd = newTotal;

      // Calculate percentages
      if (newTotal > 0) {
        portfolioUpdates.stableYieldsPercent = (newStableYields / newTotal) * 100;
        portfolioUpdates.defiYieldPercent = (newDefiYield / newTotal) * 100;
        portfolioUpdates.tokenizedGoldPercent = (newGold / newTotal) * 100;
        portfolioUpdates.bluechipCryptoPercent = (newCrypto / newTotal) * 100;
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
          defiYield: portfolioUpdates.defiYieldPercent,
          tokenizedGold: portfolioUpdates.tokenizedGoldPercent,
          bluechipCrypto: portfolioUpdates.bluechipCryptoPercent,
        },
      });

      // Update portfolio
      await portfolioRepo.update({ userId }, portfolioUpdates);

      // Build wallet updates
      const walletUpdates: Partial<Wallet> = {};

      // Decrement source balance
      if (fromCategory && !fromIsCash) {
        const fromBalanceField = this.getBalanceField(fromCategory);
        (walletUpdates as any)[fromBalanceField] = Number(wallet[fromBalanceField]) - fromAmount;
      }

      if (fromIsCash) {
        (walletUpdates as any).usdcBalance = Number(wallet.usdcBalance) - fromAmount;
      }

      // Increment destination balance
      if (toCategory && !toIsCash) {
        const toBalanceField = this.getBalanceField(toCategory);
        (walletUpdates as any)[toBalanceField] =
          ((walletUpdates as any)[toBalanceField] !== undefined
            ? Number((walletUpdates as any)[toBalanceField])
            : Number(wallet[toBalanceField])) + toAmount;
      }

      if (toIsCash) {
        const base = (walletUpdates as any).usdcBalance !== undefined
          ? Number((walletUpdates as any).usdcBalance)
          : Number(wallet.usdcBalance);
        (walletUpdates as any).usdcBalance = base + toAmount;
      }

      walletUpdates.balancesLastUpdated = new Date();

      logger.debug('Wallet updates calculated', { walletUpdates });

      // Update wallet
      await walletRepo.update({ userId }, walletUpdates);

      if (portfolio) {
        if (fromAsset && fromAsset.toUpperCase() !== 'USDC') {
          const existingFrom = await holdingRepo.findOne({
            where: { portfolioId: portfolio.id, assetSymbol: fromAsset },
          });

          const fromHolding = existingFrom
            ? Object.assign(existingFrom, {
                assetCategory: fromClassKey ?? existingFrom.assetCategory,
                balance: Number(existingFrom.balance) - fromAmount,
                valueUsd: Number(existingFrom.valueUsd) - fromAmount,
                lastUpdated: new Date(),
              })
            : holdingRepo.create({
                portfolioId: portfolio.id,
                assetSymbol: fromAsset,
                assetCategory: fromClassKey ?? 'unknown',
                balance: -fromAmount,
                valueUsd: -fromAmount,
                costBasisUsd: 0,
                lastUpdated: new Date(),
              });

          await holdingRepo.save(fromHolding);
        }

        if (toAsset && toAsset.toUpperCase() !== 'USDC') {
          const existingTo = await holdingRepo.findOne({
            where: { portfolioId: portfolio.id, assetSymbol: toAsset },
          });

          const toHolding = existingTo
            ? Object.assign(existingTo, {
                assetCategory: toClassKey ?? existingTo.assetCategory,
                balance: Number(existingTo.balance) + toAmount,
                valueUsd: Number(existingTo.valueUsd) + toAmount,
                lastUpdated: new Date(),
              })
            : holdingRepo.create({
                portfolioId: portfolio.id,
                assetSymbol: toAsset,
                assetCategory: toClassKey ?? 'unknown',
                balance: toAmount,
                valueUsd: toAmount,
                costBasisUsd: 0,
                lastUpdated: new Date(),
              });

          await holdingRepo.save(toHolding);
        }
      }

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
          defiYield: portfolioUpdates.defiYieldPercent?.toFixed(2),
          tokenizedGold: portfolioUpdates.tokenizedGoldPercent?.toFixed(2),
          bluechipCrypto: portfolioUpdates.bluechipCryptoPercent?.toFixed(2),
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
      const holdingRepo = manager.getRepository(PortfolioHolding);

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
        defiYield: 0,
        tokenizedGold: 0,
        bluechipCrypto: 0,
      };

      const walletChanges = {
        usdcBalance: 0,
        stableYieldBalance: 0,
        defiYieldBalance: 0,
        tokenizedGoldBalance: 0,
        bluechipCryptoBalance: 0,
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
        const fromClassKey = await assetRegistry.getAssetClassKeyBySymbol(fromAsset);
        const toClassKey = await assetRegistry.getAssetClassKeyBySymbol(toAsset);
        const fromCategory = this.normalizeClassKey(fromClassKey);
        const toCategory = this.normalizeClassKey(toClassKey);

        // Handle USDC as source (cash being converted to portfolio assets)
        if (fromAsset === 'USDC') {
          walletChanges.usdcBalance -= fromAmount;
        } else if (fromCategory) {
          portfolioChanges[fromCategory] -= fromAmount;
          walletChanges[this.getBalanceFieldSimple(fromCategory)] -= fromAmount;
        }

        if (toCategory) {
          portfolioChanges[toCategory] += toAmount;
          walletChanges[this.getBalanceFieldSimple(toCategory)] += toAmount;
        }

        if (portfolio) {
          if (fromAsset) {
            const existingFrom = await holdingRepo.findOne({
              where: { portfolioId: portfolio.id, assetSymbol: fromAsset },
            });

            const fromHolding = existingFrom
              ? Object.assign(existingFrom, {
                  assetCategory: fromClassKey ?? existingFrom.assetCategory,
                  balance: Number(existingFrom.balance) - fromAmount,
                  valueUsd: Number(existingFrom.valueUsd) - fromAmount,
                  lastUpdated: new Date(),
                })
              : holdingRepo.create({
                  portfolioId: portfolio.id,
                  assetSymbol: fromAsset,
                  assetCategory: fromClassKey ?? 'unknown',
                  balance: -fromAmount,
                  valueUsd: -fromAmount,
                  costBasisUsd: 0,
                  lastUpdated: new Date(),
                });

            await holdingRepo.save(fromHolding);
          }

          if (toAsset) {
            const existingTo = await holdingRepo.findOne({
              where: { portfolioId: portfolio.id, assetSymbol: toAsset },
            });

            const toHolding = existingTo
              ? Object.assign(existingTo, {
                  assetCategory: toClassKey ?? existingTo.assetCategory,
                  balance: Number(existingTo.balance) + toAmount,
                  valueUsd: Number(existingTo.valueUsd) + toAmount,
                  lastUpdated: new Date(),
                })
              : holdingRepo.create({
                  portfolioId: portfolio.id,
                  assetSymbol: toAsset,
                  assetCategory: toClassKey ?? 'unknown',
                  balance: toAmount,
                  valueUsd: toAmount,
                  costBasisUsd: 0,
                  lastUpdated: new Date(),
                });

            await holdingRepo.save(toHolding);
          }
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
      const newDefiYield = Number(portfolio.defiYieldValueUsd) + portfolioChanges.defiYield;
      const newGold = Number(portfolio.tokenizedGoldValueUsd) + portfolioChanges.tokenizedGold;
      const newCrypto =
        Number(portfolio.bluechipCryptoValueUsd) + portfolioChanges.bluechipCrypto;
      const newTotal = newStableYields + newDefiYield + newGold + newCrypto;

      const portfolioUpdates: Partial<Portfolio> = {
        stableYieldsValueUsd: newStableYields,
        defiYieldValueUsd: newDefiYield,
        tokenizedGoldValueUsd: newGold,
        bluechipCryptoValueUsd: newCrypto,
        totalValueUsd: newTotal,
      };

      if (newTotal > 0) {
        portfolioUpdates.stableYieldsPercent = (newStableYields / newTotal) * 100;
        portfolioUpdates.defiYieldPercent = (newDefiYield / newTotal) * 100;
        portfolioUpdates.tokenizedGoldPercent = (newGold / newTotal) * 100;
        portfolioUpdates.bluechipCryptoPercent = (newCrypto / newTotal) * 100;
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
        usdcBalance: Number(wallet.usdcBalance) + walletChanges.usdcBalance,
        stableYieldBalance: Number(wallet.stableYieldBalance) + walletChanges.stableYieldBalance,
        defiYieldBalance: Number(wallet.defiYieldBalance) + walletChanges.defiYieldBalance,
        tokenizedGoldBalance:
          Number(wallet.tokenizedGoldBalance) + walletChanges.tokenizedGoldBalance,
        bluechipCryptoBalance:
          Number(wallet.bluechipCryptoBalance) + walletChanges.bluechipCryptoBalance,
        balancesLastUpdated: new Date(),
      };

      await walletRepo.update({ userId }, walletUpdates);

      logger.info('Multi-swap balance update complete', {
        swapCount: swaps.length,
        portfolioTotal: newTotal,
        portfolioPercentages: {
          stableYields: portfolioUpdates.stableYieldsPercent?.toFixed(2),
          defiYield: portfolioUpdates.defiYieldPercent?.toFixed(2),
          tokenizedGold: portfolioUpdates.tokenizedGoldPercent?.toFixed(2),
          bluechipCrypto: portfolioUpdates.bluechipCryptoPercent?.toFixed(2),
        },
      });
    });

    logger.info('Multi-swap balance update transaction committed successfully');
  }

  /**
   * Get portfolio field name for asset category
   */
  private getCategoryField(
    category: 'stableYields' | 'defiYield' | 'tokenizedGold' | 'bluechipCrypto'
  ): keyof Portfolio {
    const mapping: Record<string, keyof Portfolio> = {
      stableYields: 'stableYieldsValueUsd',
      defiYield: 'defiYieldValueUsd',
      tokenizedGold: 'tokenizedGoldValueUsd',
      bluechipCrypto: 'bluechipCryptoValueUsd',
    };
    return mapping[category];
  }

  /**
   * Get wallet balance field name for asset category
   */
  private getBalanceField(
    category: 'stableYields' | 'defiYield' | 'tokenizedGold' | 'bluechipCrypto'
  ): keyof Wallet {
    const mapping: Record<string, keyof Wallet> = {
      stableYields: 'stableYieldBalance',
      defiYield: 'defiYieldBalance',
      tokenizedGold: 'tokenizedGoldBalance',
      bluechipCrypto: 'bluechipCryptoBalance',
    };
    return mapping[category];
  }

  /**
   * Get wallet balance field name (simple) for multi-swap accumulation
   */
  private getBalanceFieldSimple(
    category: 'stableYields' | 'defiYield' | 'tokenizedGold' | 'bluechipCrypto'
  ): 'stableYieldBalance' | 'defiYieldBalance' | 'tokenizedGoldBalance' | 'bluechipCryptoBalance' {
    const mapping = {
      stableYields: 'stableYieldBalance' as const,
      defiYield: 'defiYieldBalance' as const,
      tokenizedGold: 'tokenizedGoldBalance' as const,
      bluechipCrypto: 'bluechipCryptoBalance' as const,
    };
    return mapping[category];
  }

  private normalizeClassKey(
    classKey: string | null
  ): 'stableYields' | 'defiYield' | 'tokenizedGold' | 'bluechipCrypto' | null {
    if (!classKey) {
      return null;
    }

    const mapping: Record<string, 'stableYields' | 'defiYield' | 'tokenizedGold' | 'bluechipCrypto'> = {
      stable_yields: 'stableYields',
      defi_yield: 'defiYield',
      tokenized_gold: 'tokenizedGold',
      bluechip_crypto: 'bluechipCrypto',
      stableYields: 'stableYields',
      defiYield: 'defiYield',
      tokenizedGold: 'tokenizedGold',
      bluechipCrypto: 'bluechipCrypto',
    };

    return mapping[classKey] ?? null;
  }
}

// Singleton instance
export const balanceUpdaterService = new BalanceUpdaterService();

export default BalanceUpdaterService;
