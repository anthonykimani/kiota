// User types
export interface User {
  id: string
  phoneNumber: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  primaryAuthMethod: string
  hasCompletedOnboarding: boolean
  hasCompletedQuiz: boolean
  totalPoints: number
  level: number
}

export interface Wallet {
  address: string
  provider: string
  usdcBalance?: number
  stableYieldBalance?: number
  defiYieldBalance?: number
  tokenizedStocksBalance?: number
  tokenizedGoldBalance?: number
}

export interface Portfolio {
  id: string
  totalValueUsd: number
}

// Strategy/Quiz types
export interface StrategyAllocation {
  stableYields: number
  defiYield: number
  tokenizedStocks: number
  tokenizedGold: number
}

export interface Strategy {
  name: string
  allocation: StrategyAllocation
  rationale: string
  expectedReturn: number
  riskLevel: string
  assets: {
    stableYields: string
    defiYield: string
    tokenizedStocks: string
    tokenizedGold: string
  }
}

export interface QuizSession {
  id: string
  createdAt: string
  aiResponse: unknown
  userAccepted: boolean | null
}

export interface QuizAnswers {
  primaryGoal: string
  investmentTimeline: string
  riskTolerance: string
  investmentExperience: string
  currentSavingsRange?: string
  monthlySavingsRange?: string
  comfortableWithDollars?: boolean
  investmentPriorities?: string[]
}

// Dashboard types
export interface DashboardPortfolio {
  totalValueUsd: number
  totalValueKes: number
  monthlyChange: number
  monthlyChangePercent: number
  monthlyTrend: 'up' | 'down' | 'stable'
}

export interface DashboardAsset {
  classKey: string
  name: string
  primaryAssetSymbol: string | null
  valueUsd: number
  percentage: number
  monthlyEarnings: number
  apy?: number
  avgReturn?: number
  requiresTier2?: boolean
  price?: number
  change?: number
  changePercent?: number
}

export interface DashboardGoal {
  id: string
  emoji: string
  title: string
  currentAmount: number
  targetAmount: number
  progressPercent: number
  targetDate: string
  onTrack: boolean
  status: string
}

export interface Dashboard {
  user: {
    id: string
    firstName: string | null
    hasCompletedOnboarding: boolean
    totalPoints: number
    level: number
  }
  chain?: {
    id: string
    name: string
    isTestnet: boolean
  }
  onchain?: {
    hasHoldings: boolean
    totalValueUsd: number
  }
  wallet?: {
    usdcBalance: number
    stableYieldBalance: number
    defiYieldBalance: number
    tokenizedStocksBalance: number
    tokenizedGoldBalance: number
  }
  portfolio: DashboardPortfolio
  assets: DashboardAsset[]
  marketPerformance?: Array<{
    symbol: string
    name: string
    price: number
    change: number
    changePercent: number
  }>
  totalMonthlyEarnings: number
  goals: DashboardGoal[]
  quickActions: {
    canAddMoney: boolean
    canWithdraw: boolean
    canRebalance: boolean
    canLearn: boolean
  }
  kesUsdRate: number
}

// Portfolio detail types
export interface PortfolioSummary {
  totalValueUsd: number
  totalValueKes: number
  allTimeReturn: {
    amountUsd: number
    percentage: number
  }
  totalDeposited: number
  totalWithdrawn: number
  monthlyEarnings: number
  kesUsdRate: number
}

export interface PortfolioAsset {
  classKey: string
  name: string
  valueUsd: number
  percentage: number
  targetPercentage: number
  apy?: number
  avgReturn?: number
  requiresTier2?: boolean
}

export interface PortfolioHolding {
  symbol: string
  name: string
  assetClassKey: string
  balance: number
  valueUsd: number
  lastUpdated: string
}

export interface PortfolioTransaction {
  id: string
  type: string
  status: string
  amountKes: number
  amountUsd: number
  date: string
  mpesaReceipt?: string
  txHash?: string
}

export interface PortfolioHistory {
  date: string
  value: number
}

export interface PortfolioDetail {
  summary: PortfolioSummary
  assets: PortfolioAsset[]
  holdings: PortfolioHolding[]
  needsRebalance: boolean
  rebalanceThreshold: number
  transactions: PortfolioTransaction[]
  history: PortfolioHistory[]
  period: string
}

// Goal types
export interface GoalCategory {
  value: string
  label: string
  emoji: string
}

export interface Goal {
  id: string
  title: string
  category: string
  emoji: string
  targetAmountKes: number
  targetAmountUsd: number
  currentAmountUsd: number
  progressPercent: number
  targetDate: string
  status: string
  onTrack: boolean
  createdAt?: string
  completedAt?: string | null
}

// Deposit types
export interface DepositIntent {
  depositSessionId: string
  depositAddress: string
  chain: string
  token: {
    symbol: string
    address: string
  }
  expiresAt: string
}

export type DepositStatus = 'AWAITING_TRANSFER' | 'RECEIVED' | 'CONFIRMED'

export interface DepositConfirmation {
  status: DepositStatus
  txHash?: string
  amount?: number
  confirmations?: number
  credited?: boolean
  transactionId?: string
}

export interface DepositConversion {
  conversionGroupId: string
  depositSessionId: string
  depositedAmount: number
  status: string
  swaps: Array<{
    transactionId: string
    toAsset: string
    amount: number
  }>
  swapCount: number
  estimatedCompletionTime: string
  allocation: StrategyAllocation
}

export interface DepositReviewProjectionPoint {
  date: string
  investment: number
  returns: number
}

export interface DepositReviewAsset {
  symbol: string
  name: string
  classKey: string
  price: number
  change: number
  changePercent: number
}

export interface DepositReviewResponse {
  depositSessionId: string
  amountUsd: number
  allocation: {
    stableYields: number
    defiYield: number
    tokenizedStocks: number
    tokenizedGold: number
  }
  projection: DepositReviewProjectionPoint[]
  assets: DepositReviewAsset[]
  description: string
}

// Swap types
export interface SwapQuote {
  fromAsset: string
  toAsset: string
  fromAmount: number
  estimatedToAmount: number
  slippage: number
  priceImpact: number
  fees: {
    network: number
    protocol: number
  }
  expiresAt: string
  provider: string
}

export interface SwapExecution {
  transactionId: string
  status: string
  fromAsset: string
  toAsset: string
  fromAmount: number
  estimatedToAmount: number
  estimatedCompletionTime: string
}

export interface SwapStatus {
  transactionId: string
  status: string
  fromAsset: string
  toAsset: string
  fromAmount: number
  estimatedToAmount: number
  actualToAmount?: number
  orderHash?: string
  txHash?: string
  createdAt: string
  completedAt?: string
}

export interface SwapHistoryItem {
  transactionId: string
  status: string
  fromAsset: string
  toAsset: string
  fromAmount: number
  actualToAmount: number
  txHash: string
  createdAt: string
  completedAt: string
}

// Auth sync response
export interface AuthSyncResponse {
  user: User
  wallet: Wallet
  portfolio: Portfolio
  token: string
  isNewUser: boolean
  nextStep: 'quiz' | 'onboarding' | 'dashboard'
}
