/**
 * Rebalance Service
 *
 * Calculates required swaps to rebalance portfolio back to target allocation
 *
 * Key features:
 * - Detects drift > 5% from target allocation
 * - Calculates minimal set of swaps to reach target
 * - Handles rounding errors and edge cases
 * - Optimizes swap routing (minimize number of swaps)
 *
 * Algorithm:
 * 1. Calculate USD value difference for each category (target - current)
 * 2. Identify over-allocated categories (sell) and under-allocated (buy)
 * 3. Create swap pairs from over → under
 * 4. Filter out swaps < $1 (ignore dust)
 */

import { assetRegistry } from '../services/asset-registry.service';
import { createLogger } from '../utils/logger.util';

const logger = createLogger('rebalance-service');

/**
 * Allocation percentages
 */
export interface Allocation {
  stableYields: number; // 0-100
  defiYield: number; // 0-100
  tokenizedGold: number; // 0-100
  bluechipCrypto: number; // 0-100
}

/**
 * Current balances (USD values)
 */
export interface Balances {
  stableYields: number;
  defiYield: number;
  tokenizedGold: number;
  bluechipCrypto: number;
}

/**
 * Swap instruction
 */
export interface SwapInstruction {
  fromAsset: string;
  toAsset: string;
  fromAmount: number; // USD amount to swap
}

/**
 * Rebalance calculation result
 */
export interface RebalanceResult {
  needsRebalance: boolean;
  currentAllocation: Allocation;
  targetAllocation: Allocation;
  drift: number; // Total percentage drift
  swaps: SwapInstruction[];
  totalSwapValue: number; // Total USD value to be swapped
}

class RebalanceService {
  /**
   * Check if rebalance is needed (drift > 5%)
   */
  needsRebalance(current: Allocation, target: Allocation): boolean {
    const drifts = [
      Math.abs(current.stableYields - target.stableYields),
      Math.abs(current.defiYield - target.defiYield),
      Math.abs(current.tokenizedGold - target.tokenizedGold),
      Math.abs(current.bluechipCrypto - target.bluechipCrypto),
    ];

    const totalDrift = drifts.reduce((sum, d) => sum + d, 0);

    logger.debug('Checking rebalance need', {
      current,
      target,
      drifts,
      totalDrift,
      threshold: 5,
    });

    return totalDrift > 5;
  }

  /**
   * Calculate required swaps to reach target allocation
   */
  async calculateRequiredSwaps(params: {
    currentAllocation: Allocation;
    targetAllocation: Allocation;
    totalValueUsd: number;
    currentBalances: Balances;
  }): Promise<SwapInstruction[]> {
    const { currentAllocation, targetAllocation, totalValueUsd, currentBalances } = params;

    logger.info('Calculating required swaps', {
      currentAllocation,
      targetAllocation,
      totalValueUsd,
    });

    if (totalValueUsd <= 0) {
      logger.warn('Total value is zero, no swaps needed');
      return [];
    }

    // Calculate USD value differences for each category
    const categoryDiffs = {
      stableYields:
        ((targetAllocation.stableYields - currentAllocation.stableYields) * totalValueUsd) / 100,
      defiYield:
        ((targetAllocation.defiYield - currentAllocation.defiYield) * totalValueUsd) / 100,
      tokenizedGold:
        ((targetAllocation.tokenizedGold - currentAllocation.tokenizedGold) * totalValueUsd) / 100,
      bluechipCrypto:
        ((targetAllocation.bluechipCrypto - currentAllocation.bluechipCrypto) * totalValueUsd) /
        100,
    };

    logger.debug('Category value differences calculated', { categoryDiffs });

    // Separate into over-allocated (negative diff) and under-allocated (positive diff)
    const overAllocated: Array<{ category: string; asset: string; classKey: keyof Balances; excess: number }> = [];
    const underAllocated: Array<{ category: string; asset: string; classKey: keyof Balances; deficit: number }> = [];

    for (const [category, diff] of Object.entries(categoryDiffs)) {
      const classKey = this.mapAllocationKeyToClassKey(
        category as 'stableYields' | 'defiYield' | 'tokenizedGold' | 'bluechipCrypto'
      );
      const primaryAsset = await assetRegistry.getPrimaryAssetByClassKey(classKey);

      if (!primaryAsset) {
        continue;
      }

      const asset = primaryAsset.symbol;

      if (diff < -1) {
        // Over-allocated by more than $1
        overAllocated.push({
          category,
          asset,
          classKey: this.mapAllocationKeyToBalanceKey(category as keyof Allocation),
          excess: Math.abs(diff),
        });
      } else if (diff > 1) {
        // Under-allocated by more than $1
        underAllocated.push({
          category,
          asset,
          classKey: this.mapAllocationKeyToBalanceKey(category as keyof Allocation),
          deficit: diff,
        });
      }
    }

    logger.debug('Over/under-allocated categories identified', {
      overAllocated: overAllocated.map((o) => ({
        category: o.category,
        asset: o.asset,
        excess: o.excess.toFixed(2),
      })),
      underAllocated: underAllocated.map((u) => ({
        category: u.category,
        asset: u.asset,
        deficit: u.deficit.toFixed(2),
      })),
    });

    // Create swap pairs
    const swaps: SwapInstruction[] = [];

    // Sort by amount (largest first) for more efficient swapping
    overAllocated.sort((a, b) => b.excess - a.excess);
    underAllocated.sort((a, b) => b.deficit - a.deficit);

    // Match over-allocated with under-allocated
    for (const over of overAllocated) {
      let remaining = over.excess;

      for (const under of underAllocated) {
        if (remaining < 1) break; // Stop if remaining is dust
        if (under.deficit < 1) continue; // Skip if deficit is dust

        // Calculate swap amount (min of remaining excess and deficit)
        const swapAmount = Math.min(remaining, under.deficit);

        // Verify user has sufficient balance
        const availableBalance = currentBalances[over.classKey] ?? 0;
        if (availableBalance < swapAmount) {
          logger.warn('Insufficient balance for swap', {
            fromAsset: over.asset,
            required: swapAmount,
            available: availableBalance,
          });
          // Do partial swap with available balance
          const partialAmount = Math.floor(availableBalance * 100) / 100; // Round down to 2 decimals
          if (partialAmount >= 1) {
            swaps.push({
              fromAsset: over.asset,
              toAsset: under.asset,
              fromAmount: partialAmount,
            });

            remaining -= partialAmount;
            under.deficit -= partialAmount;
          }
          break; // Can't swap more from this asset
        }

        // Create swap instruction
        swaps.push({
          fromAsset: over.asset,
          toAsset: under.asset,
          fromAmount: swapAmount,
        });

        logger.debug('Swap instruction created', {
          fromAsset: over.asset,
          toAsset: under.asset,
          amount: swapAmount.toFixed(2),
        });

        // Update remaining values
        remaining -= swapAmount;
        under.deficit -= swapAmount;
      }

      if (remaining > 1) {
        logger.warn('Could not fully allocate excess', {
          asset: over.asset,
          remainingExcess: remaining.toFixed(2),
        });
      }
    }

    // Filter out swaps < $1 (dust)
    const filteredSwaps = swaps.filter((s) => s.fromAmount >= 1);

    const totalSwapValue = filteredSwaps.reduce((sum, s) => sum + s.fromAmount, 0);

    logger.info('Swap calculation complete', {
      swapCount: filteredSwaps.length,
      totalSwapValue: totalSwapValue.toFixed(2),
      swaps: filteredSwaps.map((s) => ({
        from: s.fromAsset,
        to: s.toAsset,
        amount: s.fromAmount.toFixed(2),
      })),
    });

    return filteredSwaps;
  }

  /**
   * Perform full rebalance calculation
   *
   * Combines drift detection and swap calculation
   */
  async calculateRebalance(params: {
    currentAllocation: Allocation;
    targetAllocation: Allocation;
    totalValueUsd: number;
    currentBalances: Balances;
  }): Promise<RebalanceResult> {
    const { currentAllocation, targetAllocation, totalValueUsd, currentBalances } = params;

    const needsRebalance = this.needsRebalance(currentAllocation, targetAllocation);

    const swaps = needsRebalance
      ? await this.calculateRequiredSwaps({
          currentAllocation,
          targetAllocation,
          totalValueUsd,
          currentBalances,
        })
      : [];

    const totalSwapValue = swaps.reduce((sum, s) => sum + s.fromAmount, 0);

    const drift =
      Math.abs(currentAllocation.stableYields - targetAllocation.stableYields) +
      Math.abs(currentAllocation.defiYield - targetAllocation.defiYield) +
      Math.abs(currentAllocation.tokenizedGold - targetAllocation.tokenizedGold) +
      Math.abs(currentAllocation.bluechipCrypto - targetAllocation.bluechipCrypto);

    return {
      needsRebalance,
      currentAllocation,
      targetAllocation,
      drift,
      swaps,
      totalSwapValue,
    };
  }

  /**
   * Calculate allocation percentages from balances
   */
  calculateAllocation(balances: {
    stableYields: number;
    defiYield: number;
    tokenizedGold: number;
    bluechipCrypto: number;
  }): Allocation {
    const total =
      balances.stableYields + balances.defiYield + balances.tokenizedGold + balances.bluechipCrypto;

    if (total <= 0) {
      return {
        stableYields: 0,
        defiYield: 0,
        tokenizedGold: 0,
        bluechipCrypto: 0,
      };
    }

    return {
      stableYields: (balances.stableYields / total) * 100,
      defiYield: (balances.defiYield / total) * 100,
      tokenizedGold: (balances.tokenizedGold / total) * 100,
      bluechipCrypto: (balances.bluechipCrypto / total) * 100,
    };
  }

  private mapAllocationKeyToClassKey(
    key: 'stableYields' | 'defiYield' | 'tokenizedGold' | 'bluechipCrypto'
  ): 'stable_yields' | 'defi_yield' | 'tokenized_gold' | 'bluechip_crypto' {
    const mapping = {
      stableYields: 'stable_yields',
      defiYield: 'defi_yield',
      tokenizedGold: 'tokenized_gold',
      bluechipCrypto: 'bluechip_crypto',
    } as const;

    return mapping[key];
  }

  private mapAllocationKeyToBalanceKey(
    key: keyof Allocation
  ): keyof Balances {
    const mapping: Record<keyof Allocation, keyof Balances> = {
      stableYields: 'stableYields',
      defiYield: 'defiYield',
      tokenizedGold: 'tokenizedGold',
      bluechipCrypto: 'bluechipCrypto',
    };

    return mapping[key];
  }
}

// Singleton instance
export const rebalanceService = new RebalanceService();

export default RebalanceService;
