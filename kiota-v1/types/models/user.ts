/**
 * User Models
 * Core user data structures for Kiota
 */

export interface User {
  id: string;
  email: string | null;
  phone: string;
  name: string | null;
  profilePhoto: string | null;
  walletAddress: string;
  createdAt: Date;
  updatedAt: Date;

  // Profile data
  monthlyIncome?: number; // in KES
  currentSavings?: number; // in USD
  investmentExperience: InvestmentExperience;
  riskTolerance: RiskTolerance;

  // Strategy
  investmentStrategy: InvestmentStrategy;

  // Gamification
  level: number;
  points: number;
  badges: string[]; // Array of badge IDs
  streak: number; // consecutive days with deposits
  lastActivityDate: Date | null;

  // Membership
  membershipTier: MembershipTier;
  kycStatus: KYCStatus;
  kycCompletedAt: Date | null;

  // Settings
  preferredCurrency: 'KES' | 'USD';
  notificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
}

export enum InvestmentExperience {
  COMPLETE_BEGINNER = 'complete_beginner',
  KNOW_BASICS = 'know_basics',
  SOMEWHAT_EXPERIENCED = 'somewhat_experienced',
  VERY_EXPERIENCED = 'very_experienced',
}

export enum RiskTolerance {
  VERY_CONSERVATIVE = 'very_conservative',
  SOMEWHAT_CONSERVATIVE = 'somewhat_conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive',
}

export enum MembershipTier {
  FREE = 'free',
  PREMIUM = 'premium',
  WHALE = 'whale',
}

export enum KYCStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface InvestmentStrategy {
  name: string; // e.g., "Conservative Grower", "Wealth Maximizer"
  allocation: AssetAllocation;
  expectedReturn: number; // annual percentage
  riskLevel: 'low' | 'low-medium' | 'medium' | 'medium-high' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetAllocation {
  USDM: number; // percentage (0-100)
  bCSPX: number;
  PAXG: number;
  BTC?: number;
  ETH?: number;
  OUSG?: number;
}

export interface StrategyQuizAnswers {
  goal: 'emergency_fund' | 'house' | 'education' | 'business' | 'retirement' | 'wealth_building';
  timeline: '<1y' | '1-3y' | '3-5y' | '5-10y' | '10y+';
  monthlyIncome: '<50k' | '50-100k' | '100-200k' | '200-400k' | '400k+';
  currentSavings: '<50k' | '50-200k' | '200-500k' | '500k-1m' | '1m+';
  riskResponse: 'sell_immediately' | 'feel_worried' | 'hold' | 'buy_more';
  investmentKnowledge: InvestmentExperience;
  monthlySavings: '<5k' | '5-10k' | '10-20k' | '20-50k' | '50k+';
  dollarComfort: 'yes' | 'maybe' | 'no';
  priorities: ('safety' | 'growth' | 'high_returns' | 'liquidity' | 'learning')[];
}
