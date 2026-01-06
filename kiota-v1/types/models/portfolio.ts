/**
 * Portfolio Models
 * Investment portfolio and asset tracking
 */

export interface Portfolio {
  id: string;
  userId: string;
  totalValueUSD: number;
  totalValueKES: number;

  // Asset holdings (in USD)
  holdings: AssetHolding[];

  // Performance
  allTimeReturn: number; // percentage
  allTimeReturnUSD: number; // absolute value
  monthlyReturn: number; // percentage
  monthlyReturnUSD: number; // absolute value

  // Allocation tracking
  currentAllocation: Record<AssetType, number>; // percentages
  targetAllocation: Record<AssetType, number>; // percentages
  driftPercentage: number; // how far from target
  needsRebalancing: boolean;

  updatedAt: Date;
}

export enum AssetType {
  USDM = 'USDM',
  USDY = 'USDY',
  BCSPX = 'bCSPX',
  PAXG = 'PAXG',
  BTC = 'BTC',
  ETH = 'ETH',
  OUSG = 'OUSG',
}

export interface AssetHolding {
  asset: AssetType;
  amountUSD: number;
  amountTokens: number; // actual token amount
  percentageOfPortfolio: number;
  entryPriceUSD: number; // average entry price
  currentPriceUSD: number;
  unrealizedGainUSD: number;
  unrealizedGainPercent: number;

  // Performance
  dailyChangeUSD: number;
  dailyChangePercent: number;
  monthlyYield: number; // for yield-bearing assets

  updatedAt: Date;
}

export interface AssetMetadata {
  type: AssetType;
  name: string;
  symbol: string;
  description: string;
  category: 'yield' | 'growth' | 'hedge' | 'speculative';

  // Contract info
  contractAddress: string;
  chain: 'base' | 'ethereum' | 'polygon';
  decimals: number;

  // Characteristics
  yieldAPY: number | null; // null for non-yield assets
  averageReturn: number | null; // historical average (for growth assets)
  volatility: 'none' | 'low' | 'medium' | 'high' | 'very-high';
  liquidity: 'excellent' | 'good' | 'medium' | 'low';

  // Requirements
  requiresKYC: boolean;
  minimumDeposit: number; // in USD

  // Risk info
  riskLevel: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
  backingType: string; // e.g., "US Treasury Bills", "Physical Gold"
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;

  // Amounts
  amountKES: number | null;
  amountUSD: number;
  feeKES: number | null;
  feeUSD: number;

  // Asset details
  asset: AssetType;
  tokenAmount: number;
  pricePerToken: number;

  // Transaction details
  transactionHash: string | null;
  mpesaTransactionId: string | null;

  // Metadata
  description: string;
  createdAt: Date;
  completedAt: Date | null;
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  SWAP = 'swap', // between assets
  REBALANCE = 'rebalance',
  YIELD_EARNED = 'yield_earned',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface PerformanceMetrics {
  userId: string;
  period: '24h' | '7d' | '30d' | '90d' | '1y' | 'all';

  // Returns
  returnUSD: number;
  returnPercent: number;

  // Comparison
  vsMMFReturn: number; // comparison to Kenyan MMF baseline
  vsKESHolding: number; // comparison to holding KES

  // Risk metrics
  volatility: number;
  sharpeRatio: number | null;
  maxDrawdown: number;

  calculatedAt: Date;
}
