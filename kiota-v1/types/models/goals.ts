/**
 * Goals Models
 * Savings goals and milestone tracking
 */

export interface SavingsGoal {
  id: string;
  userId: string;

  // Goal details
  title: string;
  category: GoalCategory;
  icon: string; // emoji or icon identifier

  // Financial targets
  targetAmountUSD: number;
  currentAmountUSD: number;
  progressPercentage: number;

  // Timeline
  targetDate: Date;
  createdAt: Date;
  completedAt: Date | null;

  // Status
  status: GoalStatus;
  onTrack: boolean;
  projectedCompletionDate: Date | null;
  monthsRemaining: number;

  // Strategy
  recommendedMonthlyDeposit: number; // in USD
  recommendedAllocation: AssetAllocation;

  // Milestones
  milestones: GoalMilestone[];
  nextMilestone: GoalMilestone | null;
}

export enum GoalCategory {
  HOUSE = 'house',
  CAR = 'car',
  EDUCATION = 'education',
  WEDDING = 'wedding',
  TRAVEL = 'travel',
  EMERGENCY_FUND = 'emergency_fund',
  BUSINESS = 'business',
  RETIREMENT = 'retirement',
  OTHER = 'other',
}

export enum GoalStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  milestoneNumber: number;

  // Target
  targetAmountUSD: number;
  targetDate: Date;

  // Actual
  actualPaidUSD: number;
  actualDate: Date | null;

  // Status
  status: MilestoneStatus;
  commitmentDate: Date | null;

  createdAt: Date;
}

export enum MilestoneStatus {
  PENDING = 'pending',
  COMMITTED = 'committed',
  COMPLETED = 'completed',
  MISSED = 'missed',
  LATE = 'late',
}

export interface AssetAllocation {
  USDM: number;
  bCSPX: number;
  PAXG: number;
  BTC?: number;
  ETH?: number;
}

// Activity tracking for goals
export interface GoalActivity {
  id: string;
  goalId: string;
  userId: string;
  type: GoalActivityType;
  amountUSD: number;
  description: string;
  createdAt: Date;
}

export enum GoalActivityType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  MILESTONE_REACHED = 'milestone_reached',
  GOAL_CREATED = 'goal_created',
  GOAL_COMPLETED = 'goal_completed',
  GOAL_PAUSED = 'goal_paused',
  GOAL_RESUMED = 'goal_resumed',
}
