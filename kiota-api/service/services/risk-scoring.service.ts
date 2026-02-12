/**
 * Risk Scoring Service
 *
 * Deterministic robo-advisor scoring system inspired by Betterment/Wealthfront.
 * Calculates user risk profile from quiz answers and generates portfolio allocation.
 *
 * Scoring Methodology:
 * - 6 questions covering financial capacity + risk tolerance
 * - Points-based scoring (0-55 max)
 * - Maps to 5 risk profiles with predefined allocations
 * - Crypto preference modifier adjusts allocation
 *
 * Asset Classes:
 * - Stable Yields (USDM): Capital preservation, ~5% APY
 * - Tokenized Gold (PAXG): Inflation hedge, tracks gold price
 * - DeFi Yield (USDE): On-chain yield, variable returns ~8%
 * - Blue Chip Crypto (WETH): Growth exposure, high volatility ~15% expected
 */

import { createLogger } from '../utils/logger.util';

const logger = createLogger('risk-scoring-service');

// ============================================================================
// Types
// ============================================================================

export type AgeRange = '18-25' | '26-35' | '36-45' | '46-55' | '56+';
export type TimelineRange = '10+' | '5-10' | '3-5' | '1-3' | '<1';
export type EmergencyFundRange = '6+' | '3-6' | '<3';
export type MarketDropReaction = 'buy' | 'hold' | 'sell-some' | 'sell-all';
export type VolatilityComfort = 'high' | 'moderate' | 'low';
export type CryptoComfort = 'yes' | 'small' | 'none';

export interface QuizAnswers {
  age: AgeRange;
  timeline: TimelineRange;
  emergencyFund: EmergencyFundRange;
  marketDrop: MarketDropReaction;
  volatility: VolatilityComfort;
  cryptoComfort: CryptoComfort;
}

export type RiskProfile =
  | 'ultra_conservative'
  | 'conservative'
  | 'balanced'
  | 'growth'
  | 'aggressive';

export type RiskLevel = 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';

export interface Allocation {
  stableYields: number;
  tokenizedGold: number;
  defiYield: number;
  bluechipCrypto: number;
}

export interface StrategyResult {
  score: number;
  maxScore: number;
  profileName: string;
  profileKey: RiskProfile;
  allocation: Allocation;
  defaultAssets: {
    stableYields: string;
    tokenizedGold: string;
    defiYield: string;
    bluechipCrypto: string;
  };
  expectedReturn: number;
  riskLevel: RiskLevel;
  rationale: string;
}

// ============================================================================
// Scoring Tables
// ============================================================================

const AGE_SCORES: Record<AgeRange, number> = {
  '18-25': 15,
  '26-35': 12,
  '36-45': 8,
  '46-55': 4,
  '56+': 0,
};

const TIMELINE_SCORES: Record<TimelineRange, number> = {
  '10+': 15,
  '5-10': 10,
  '3-5': 5,
  '1-3': 2,
  '<1': 0,
};

const EMERGENCY_FUND_SCORES: Record<EmergencyFundRange, number> = {
  '6+': 5,
  '3-6': 3,
  '<3': 0,
};

const MARKET_DROP_SCORES: Record<MarketDropReaction, number> = {
  'buy': 10,
  'hold': 5,
  'sell-some': 2,
  'sell-all': 0,
};

const VOLATILITY_SCORES: Record<VolatilityComfort, number> = {
  'high': 10,
  'moderate': 5,
  'low': 0,
};

const MAX_SCORE = 55; // 15 + 15 + 5 + 10 + 10

// ============================================================================
// Risk Profiles & Allocations
// ============================================================================

interface ProfileConfig {
  name: string;
  key: RiskProfile;
  riskLevel: RiskLevel;
  allocation: Allocation;
  expectedReturn: number;
  rationale: string;
}

const RISK_PROFILES: ProfileConfig[] = [
  {
    name: 'Ultra Conservative',
    key: 'ultra_conservative',
    riskLevel: 'very-low',
    allocation: {
      stableYields: 70,
      tokenizedGold: 20,
      defiYield: 10,
      bluechipCrypto: 0,
    },
    expectedReturn: 4.9,
    rationale:
      'Your portfolio prioritizes capital preservation with 70% in stable, yield-generating assets. ' +
      'Gold provides inflation protection, while a small DeFi allocation offers modest growth potential. ' +
      'This conservative approach suits your shorter time horizon and preference for stability.',
  },
  {
    name: 'Conservative',
    key: 'conservative',
    riskLevel: 'low',
    allocation: {
      stableYields: 55,
      tokenizedGold: 20,
      defiYield: 20,
      bluechipCrypto: 5,
    },
    expectedReturn: 5.7,
    rationale:
      'Your portfolio balances safety with measured growth. Over half remains in stable assets for peace of mind, ' +
      'while gold hedges against inflation. DeFi and minimal crypto exposure provide upside potential ' +
      'without excessive risk.',
  },
  {
    name: 'Balanced',
    key: 'balanced',
    riskLevel: 'moderate',
    allocation: {
      stableYields: 40,
      tokenizedGold: 15,
      defiYield: 30,
      bluechipCrypto: 15,
    },
    expectedReturn: 7.1,
    rationale:
      'Your balanced portfolio reflects a healthy risk tolerance and medium-term outlook. ' +
      'Stable assets provide a solid foundation, while meaningful DeFi and crypto allocations ' +
      'position you for growth. Gold adds diversification against market volatility.',
  },
  {
    name: 'Growth',
    key: 'growth',
    riskLevel: 'high',
    allocation: {
      stableYields: 25,
      tokenizedGold: 10,
      defiYield: 35,
      bluechipCrypto: 30,
    },
    expectedReturn: 8.9,
    rationale:
      'Your growth-oriented portfolio leverages your long time horizon and comfort with volatility. ' +
      'Significant DeFi and crypto exposure targets higher returns, while stable assets and gold ' +
      'provide downside protection during market corrections.',
  },
  {
    name: 'Aggressive',
    key: 'aggressive',
    riskLevel: 'very-high',
    allocation: {
      stableYields: 15,
      tokenizedGold: 10,
      defiYield: 35,
      bluechipCrypto: 40,
    },
    expectedReturn: 9.9,
    rationale:
      'Your aggressive portfolio maximizes growth potential through substantial crypto and DeFi exposure. ' +
      'This strategy suits investors with long time horizons, stable income, and strong risk tolerance. ' +
      'The 15% stable allocation ensures some liquidity for opportunities or emergencies.',
  },
];

// Default assets for each category
const DEFAULT_ASSETS = {
  stableYields: 'USDM',
  tokenizedGold: 'PAXG',
  defiYield: 'USDE',
  bluechipCrypto: 'WETH',
};

// ============================================================================
// Scoring Functions
// ============================================================================

/**
 * Calculate raw risk score from quiz answers
 */
export function calculateScore(answers: QuizAnswers): number {
  const ageScore = AGE_SCORES[answers.age] ?? 0;
  const timelineScore = TIMELINE_SCORES[answers.timeline] ?? 0;
  const emergencyScore = EMERGENCY_FUND_SCORES[answers.emergencyFund] ?? 0;
  const marketDropScore = MARKET_DROP_SCORES[answers.marketDrop] ?? 0;
  const volatilityScore = VOLATILITY_SCORES[answers.volatility] ?? 0;

  const total = ageScore + timelineScore + emergencyScore + marketDropScore + volatilityScore;

  logger.debug('Score breakdown', {
    age: ageScore,
    timeline: timelineScore,
    emergency: emergencyScore,
    marketDrop: marketDropScore,
    volatility: volatilityScore,
    total,
  });

  return total;
}

/**
 * Get risk profile based on score
 */
export function getProfileFromScore(score: number): ProfileConfig {
  // Score ranges: 0-11, 12-22, 23-33, 34-44, 45-55
  if (score <= 11) return RISK_PROFILES[0]; // Ultra Conservative
  if (score <= 22) return RISK_PROFILES[1]; // Conservative
  if (score <= 33) return RISK_PROFILES[2]; // Balanced
  if (score <= 44) return RISK_PROFILES[3]; // Growth
  return RISK_PROFILES[4]; // Aggressive
}

/**
 * Apply crypto preference modifier to allocation
 */
export function applyCryptoModifier(
  allocation: Allocation,
  cryptoComfort: CryptoComfort
): Allocation {
  const result = { ...allocation };

  if (cryptoComfort === 'none') {
    // Redistribute crypto to DeFi
    result.defiYield += result.bluechipCrypto;
    result.bluechipCrypto = 0;
  } else if (cryptoComfort === 'small') {
    // Cap crypto at 15%, redistribute excess to DeFi
    if (result.bluechipCrypto > 15) {
      const excess = result.bluechipCrypto - 15;
      result.defiYield += excess;
      result.bluechipCrypto = 15;
    }
  }
  // 'yes' = keep original allocation

  return result;
}

/**
 * Main function: Calculate complete strategy from quiz answers
 */
export function calculateStrategy(answers: QuizAnswers): StrategyResult {
  const score = calculateScore(answers);
  const profile = getProfileFromScore(score);
  const allocation = applyCryptoModifier(profile.allocation, answers.cryptoComfort);

  // Recalculate expected return based on modified allocation
  const expectedReturn = calculateExpectedReturn(allocation);

  const result: StrategyResult = {
    score,
    maxScore: MAX_SCORE,
    profileName: profile.name,
    profileKey: profile.key,
    allocation,
    defaultAssets: DEFAULT_ASSETS,
    expectedReturn,
    riskLevel: profile.riskLevel,
    rationale: profile.rationale,
  };

  logger.info('Strategy calculated', {
    score,
    maxScore: MAX_SCORE,
    profile: profile.key,
    allocation,
    expectedReturn,
  });

  return result;
}

/**
 * Calculate expected return based on allocation
 *
 * Assumed returns:
 * - Stable Yields: 5% APY
 * - Tokenized Gold: 3% (long-term average)
 * - DeFi Yield: 8% APY
 * - Blue Chip Crypto: 15% (high volatility)
 */
export function calculateExpectedReturn(allocation: Allocation): number {
  const EXPECTED_RETURNS = {
    stableYields: 0.05,
    tokenizedGold: 0.03,
    defiYield: 0.08,
    bluechipCrypto: 0.15,
  };

  const weightedReturn =
    (allocation.stableYields / 100) * EXPECTED_RETURNS.stableYields +
    (allocation.tokenizedGold / 100) * EXPECTED_RETURNS.tokenizedGold +
    (allocation.defiYield / 100) * EXPECTED_RETURNS.defiYield +
    (allocation.bluechipCrypto / 100) * EXPECTED_RETURNS.bluechipCrypto;

  // Return as percentage, rounded to 1 decimal
  return Math.round(weightedReturn * 1000) / 10;
}

/**
 * Validate that allocation sums to 100%
 */
export function validateAllocation(allocation: Allocation): boolean {
  const total =
    allocation.stableYields +
    allocation.tokenizedGold +
    allocation.defiYield +
    allocation.bluechipCrypto;

  return Math.abs(total - 100) < 0.01;
}

/**
 * Apply minimum constraints to custom allocation
 * - Minimum 10% stable yields
 * - Must sum to 100%
 */
export function applyAllocationConstraints(allocation: Allocation): Allocation {
  const result = { ...allocation };

  // Enforce minimum 10% stable
  if (result.stableYields < 10) {
    const deficit = 10 - result.stableYields;
    result.stableYields = 10;

    // Reduce other allocations proportionally
    const otherTotal = result.tokenizedGold + result.defiYield + result.bluechipCrypto;
    if (otherTotal > 0) {
      const factor = (otherTotal - deficit) / otherTotal;
      result.tokenizedGold = Math.round(result.tokenizedGold * factor);
      result.defiYield = Math.round(result.defiYield * factor);
      result.bluechipCrypto = Math.round(result.bluechipCrypto * factor);
    }
  }

  // Ensure exactly 100%
  const total =
    result.stableYields + result.tokenizedGold + result.defiYield + result.bluechipCrypto;

  if (total !== 100) {
    // Adjust largest allocation to make it sum to 100
    const diff = 100 - total;
    const largest = Math.max(
      result.stableYields,
      result.tokenizedGold,
      result.defiYield,
      result.bluechipCrypto
    );

    if (result.stableYields === largest) {
      result.stableYields += diff;
    } else if (result.defiYield === largest) {
      result.defiYield += diff;
    } else if (result.bluechipCrypto === largest) {
      result.bluechipCrypto += diff;
    } else {
      result.tokenizedGold += diff;
    }
  }

  return result;
}

/**
 * Get all available risk profiles (for reference/display)
 */
export function getAllProfiles(): ProfileConfig[] {
  return RISK_PROFILES;
}

/**
 * Get profile by key
 */
export function getProfileByKey(key: RiskProfile): ProfileConfig | undefined {
  return RISK_PROFILES.find((p) => p.key === key);
}
