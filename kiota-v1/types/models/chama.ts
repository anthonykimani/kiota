/**
 * Chama Models
 * Group savings and social features
 */

export interface Chama {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;

  // Members
  memberCount: number;
  maxMembers: number | null;
  inviteCode: string;

  // Group goal
  hasGroupGoal: boolean;
  groupGoal: SavingsGoal | null;

  // Stats
  totalValueUSD: number;
  totalDepositsUSD: number;
  averageMemberBalance: number;

  // Settings
  isPublic: boolean;
  allowInvites: boolean;
  requireApproval: boolean;

  // Status
  status: ChamaStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum ChamaStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export interface ChamaMember {
  id: string;
  chamaId: string;
  userId: string;

  // Role
  role: ChamaMemberRole;

  // Stats
  totalContributedUSD: number;
  currentBalanceUSD: number;
  rankInChama: number;

  // Status
  status: MemberStatus;
  joinedAt: Date;
  leftAt: Date | null;
}

export enum ChamaMemberRole {
  CREATOR = 'creator',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum MemberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LEFT = 'left',
  REMOVED = 'removed',
}

export interface ChamaActivity {
  id: string;
  chamaId: string;
  userId: string;
  type: ChamaActivityType;
  description: string;
  amountUSD: number | null;
  createdAt: Date;
}

export enum ChamaActivityType {
  MEMBER_JOINED = 'member_joined',
  MEMBER_LEFT = 'member_left',
  DEPOSIT_MADE = 'deposit_made',
  GOAL_CREATED = 'goal_created',
  GOAL_COMPLETED = 'goal_completed',
  LESSON_COMPLETED = 'lesson_completed',
  BADGE_EARNED = 'badge_earned',
}

export interface ChamaInvite {
  id: string;
  chamaId: string;
  inviterId: string;
  inviteeEmail: string | null;
  inviteePhone: string | null;

  // Status
  status: InviteStatus;
  acceptedAt: Date | null;
  expiresAt: Date;

  createdAt: Date;
}

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

// For batched deposits
export interface ChamaBatchDeposit {
  id: string;
  chamaId: string;
  coordinatorId: string;

  // Batch details
  totalAmountKES: number;
  memberCount: number;
  feePercentage: number;
  totalFeeKES: number;

  // Status
  status: BatchDepositStatus;

  // Members participating
  participants: BatchParticipant[];

  // Payment
  mpesaTransactionId: string | null;
  transactionHash: string | null; // blockchain tx for split

  // Timing
  scheduledDate: Date;
  completedDate: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export enum BatchDepositStatus {
  PENDING = 'pending',
  COLLECTING = 'collecting',
  READY = 'ready',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface BatchParticipant {
  userId: string;
  amountKES: number;
  paid: boolean;
  paidAt: Date | null;
  walletAddress: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmountUSD: number;
  currentAmountUSD: number;
  targetDate: Date;
}
