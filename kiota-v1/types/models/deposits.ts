/**
 * Deposit Models
 * Different deposit pathways and tracking
 */

export interface AutoSaveRule {
  id: string;
  userId: string;

  // Amount and frequency
  amountKES: number;
  frequency: DepositFrequency;

  // Scheduling
  dayOfWeek: number | null; // 0-6 for weekly/biweekly
  dayOfMonth: number | null; // 1-31 for monthly
  nextTriggerDate: Date;

  // Status
  status: AutoSaveStatus;
  failedAttempts: number;
  lastExecutionDate: Date | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  pausedAt: Date | null;
}

export enum DepositFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

export enum AutoSaveStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface AutoSaveExecution {
  id: string;
  ruleId: string;
  userId: string;

  // Scheduled vs actual
  scheduledDate: Date;
  executedDate: Date | null;

  // Payment details
  amountKES: number;
  mpesaTransactionId: string | null;

  // Status
  status: ExecutionStatus;
  errorMessage: string | null;
  retryCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export enum ExecutionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface RoundupTracker {
  id: string;
  userId: string;

  // Period tracking
  periodStart: Date;
  periodEnd: Date;

  // Roundup calculations
  totalSpentKES: number;
  totalRoundedUpKES: number;
  transactionCount: number;

  // Commitment
  status: RoundupStatus;
  committedAmountKES: number | null;
  commitmentDate: Date | null;
  dueDate: Date | null;

  // Actual payment
  paidAmountKES: number | null;
  paidDate: Date | null;
  mpesaTransactionId: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export enum RoundupStatus {
  TRACKING = 'tracking',
  COMMITTED = 'committed',
  COMPLETED = 'completed',
  MISSED = 'missed',
}

export interface MpesaTransaction {
  id: string;
  userId: string;

  // M-Pesa details
  mpesaTransactionId: string;
  phoneNumber: string;
  amountKES: number;

  // Status
  status: MpesaStatus;
  resultCode: string | null;
  resultDescription: string | null;

  // Mapping to deposit
  depositId: string | null;

  // Timestamps
  initiatedAt: Date;
  callbackReceivedAt: Date | null;
  completedAt: Date | null;
}

export enum MpesaStatus {
  INITIATED = 'initiated',
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled',
}

export interface SavingsCommitment {
  id: string;
  userId: string;

  // Commitment details
  amountKES: number;
  dueDate: Date;
  description: string | null;

  // Status
  status: CommitmentStatus;
  reminderSent: boolean;
  reminderSentAt: Date | null;

  // Linked to goal or pathway
  goalId: string | null;
  pathwayType: 'smart_batching' | 'automated' | 'milestone';

  // Payment
  paidAmountKES: number | null;
  paidDate: Date | null;
  mpesaTransactionId: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export enum CommitmentStatus {
  PENDING = 'pending',
  REMINDED = 'reminded',
  PAID = 'paid',
  MISSED = 'missed',
  CANCELLED = 'cancelled',
}
