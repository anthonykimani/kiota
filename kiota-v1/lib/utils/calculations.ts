/**
 * Financial Calculations
 * Portfolio returns, projections, and analytics
 */

import { AssetAllocation } from '@/types/models/user';

/**
 * Calculate expected portfolio return based on allocation
 */
export function calculateExpectedReturn(allocation: AssetAllocation): number {
  const returns = {
    USDM: 5.0,
    bCSPX: 10.0,
    PAXG: 6.0, // approximate gold return
    BTC: 15.0, // highly variable, using conservative estimate
    ETH: 12.0, // highly variable
    OUSG: 4.8,
  };

  let expectedReturn = 0;
  expectedReturn += (allocation.USDM / 100) * returns.USDM;
  expectedReturn += (allocation.bCSPX / 100) * returns.bCSPX;
  expectedReturn += (allocation.PAXG / 100) * returns.PAXG;
  if (allocation.BTC) expectedReturn += (allocation.BTC / 100) * returns.BTC;
  if (allocation.ETH) expectedReturn += (allocation.ETH / 100) * returns.ETH;
  if (allocation.OUSG) expectedReturn += (allocation.OUSG / 100) * returns.OUSG;

  return expectedReturn;
}

/**
 * Calculate risk level based on allocation
 */
export function calculateRiskLevel(
  allocation: AssetAllocation
): 'low' | 'low-medium' | 'medium' | 'medium-high' | 'high' {
  const stablePercent = allocation.USDM + (allocation.OUSG || 0);
  const volatilePercent = (allocation.BTC || 0) + (allocation.ETH || 0);

  if (stablePercent >= 80) return 'low';
  if (stablePercent >= 60) return 'low-medium';
  if (volatilePercent >= 30) return 'high';
  if (volatilePercent >= 15) return 'medium-high';
  return 'medium';
}

/**
 * Project goal completion based on current trajectory
 */
export function projectGoalCompletion(
  currentAmount: number,
  targetAmount: number,
  monthlyDeposit: number,
  expectedReturnPercent: number,
  monthsRemaining: number
): {
  projectedTotal: number;
  willReachGoal: boolean;
  monthsToReach: number | null;
  excessAmount: number;
} {
  const monthlyReturnMultiplier = 1 + expectedReturnPercent / 100 / 12;

  let balance = currentAmount;
  let months = 0;

  while (months < monthsRemaining && balance < targetAmount) {
    balance = balance * monthlyReturnMultiplier + monthlyDeposit;
    months++;
  }

  const projectedTotal = balance;
  const willReachGoal = projectedTotal >= targetAmount;
  const monthsToReach = willReachGoal ? months : null;
  const excessAmount = willReachGoal ? projectedTotal - targetAmount : 0;

  return {
    projectedTotal,
    willReachGoal,
    monthsToReach,
    excessAmount,
  };
}

/**
 * Calculate recommended monthly deposit to reach goal
 */
export function calculateRecommendedMonthlyDeposit(
  currentAmount: number,
  targetAmount: number,
  monthsRemaining: number,
  expectedReturnPercent: number
): number {
  if (monthsRemaining <= 0) return targetAmount - currentAmount;

  const monthlyReturn = expectedReturnPercent / 100 / 12;

  // Using future value of annuity formula
  // FV = PV(1+r)^n + PMT * [((1+r)^n - 1) / r]
  // Solving for PMT:
  // PMT = (FV - PV(1+r)^n) / [((1+r)^n - 1) / r]

  const pvFuture = currentAmount * Math.pow(1 + monthlyReturn, monthsRemaining);
  const annuityFactor = (Math.pow(1 + monthlyReturn, monthsRemaining) - 1) / monthlyReturn;

  const pmt = (targetAmount - pvFuture) / annuityFactor;

  return Math.max(0, pmt);
}

/**
 * Calculate portfolio drift from target allocation
 */
export function calculateAllocationDrift(
  currentAllocation: Record<string, number>,
  targetAllocation: Record<string, number>
): number {
  let totalDrift = 0;
  const assets = Object.keys(targetAllocation);

  for (const asset of assets) {
    const current = currentAllocation[asset] || 0;
    const target = targetAllocation[asset] || 0;
    totalDrift += Math.abs(current - target);
  }

  return totalDrift / 2; // Divide by 2 because each deviation is counted twice
}

/**
 * Generate rebalancing trades
 */
export function generateRebalancingTrades(
  currentHoldings: Record<string, number>, // in USD
  targetAllocation: Record<string, number>, // in percentages
  totalValue: number
): Array<{ asset: string; action: 'buy' | 'sell'; amountUSD: number }> {
  const trades: Array<{ asset: string; action: 'buy' | 'sell'; amountUSD: number }> = [];

  for (const [asset, targetPercent] of Object.entries(targetAllocation)) {
    const targetValue = (totalValue * targetPercent) / 100;
    const currentValue = currentHoldings[asset] || 0;
    const difference = targetValue - currentValue;

    if (Math.abs(difference) > 1) {
      // Only rebalance if difference > $1
      trades.push({
        asset,
        action: difference > 0 ? 'buy' : 'sell',
        amountUSD: Math.abs(difference),
      });
    }
  }

  return trades;
}

/**
 * Calculate compound annual growth rate (CAGR)
 */
export function calculateCAGR(
  initialValue: number,
  finalValue: number,
  years: number
): number {
  if (initialValue <= 0 || years <= 0) return 0;
  return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
}

/**
 * Calculate break-even time for fees
 */
export function calculateFeeBreakEvenMonths(
  feePercent: number,
  expectedReturnPercent: number
): number {
  if (expectedReturnPercent <= 0) return Infinity;
  const monthlyReturn = expectedReturnPercent / 12;
  return (feePercent / monthlyReturn) * 100;
}

/**
 * Calculate Sharpe ratio (risk-adjusted return)
 */
export function calculateSharpeRatio(
  portfolioReturn: number,
  riskFreeRate: number,
  volatility: number
): number {
  if (volatility === 0) return 0;
  return (portfolioReturn - riskFreeRate) / volatility;
}

/**
 * Simple moving average
 */
export function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
}

/**
 * Calculate percentage change
 */
export function calculatePercentChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min((current / target) * 100, 100);
}
