/**
 * Mock Goals Data
 */

import {
  SavingsGoal,
  GoalCategory,
  GoalStatus,
  GoalMilestone,
  MilestoneStatus,
} from '@/types/models/goals';

export const mockGoals: SavingsGoal[] = [
  {
    id: 'goal-1',
    userId: 'user-1',

    title: 'House Down Payment',
    category: GoalCategory.HOUSE,
    icon: '🏠',

    targetAmountUSD: 15000,
    currentAmountUSD: 2885,
    progressPercentage: 19.2,

    targetDate: new Date('2028-12-31'),
    createdAt: new Date('2025-10-20'),
    completedAt: null,

    status: GoalStatus.ACTIVE,
    onTrack: true,
    projectedCompletionDate: new Date('2028-09-15'),
    monthsRemaining: 35,

    recommendedMonthlyDeposit: 360,
    recommendedAllocation: {
      USDM: 70,
      bCSPX: 20,
      PAXG: 10,
    },

    milestones: [
      {
        id: 'milestone-1-1',
        goalId: 'goal-1',
        milestoneNumber: 1,
        targetAmountUSD: 3000,
        targetDate: new Date('2026-03-31'),
        actualPaidUSD: 2885,
        actualDate: null,
        status: MilestoneStatus.PENDING,
        commitmentDate: null,
        createdAt: new Date('2025-10-20'),
      },
      {
        id: 'milestone-1-2',
        goalId: 'goal-1',
        milestoneNumber: 2,
        targetAmountUSD: 6000,
        targetDate: new Date('2026-09-30'),
        actualPaidUSD: 0,
        actualDate: null,
        status: MilestoneStatus.PENDING,
        commitmentDate: null,
        createdAt: new Date('2025-10-20'),
      },
      {
        id: 'milestone-1-3',
        goalId: 'goal-1',
        milestoneNumber: 3,
        targetAmountUSD: 10000,
        targetDate: new Date('2027-06-30'),
        actualPaidUSD: 0,
        actualDate: null,
        status: MilestoneStatus.PENDING,
        commitmentDate: null,
        createdAt: new Date('2025-10-20'),
      },
      {
        id: 'milestone-1-4',
        goalId: 'goal-1',
        milestoneNumber: 4,
        targetAmountUSD: 15000,
        targetDate: new Date('2028-12-31'),
        actualPaidUSD: 0,
        actualDate: null,
        status: MilestoneStatus.PENDING,
        commitmentDate: null,
        createdAt: new Date('2025-10-20'),
      },
    ],
    nextMilestone: {
      id: 'milestone-1-1',
      goalId: 'goal-1',
      milestoneNumber: 1,
      targetAmountUSD: 3000,
      targetDate: new Date('2026-03-31'),
      actualPaidUSD: 2885,
      actualDate: null,
      status: MilestoneStatus.PENDING,
      commitmentDate: null,
      createdAt: new Date('2025-10-20'),
    },
  },
  {
    id: 'goal-2',
    userId: 'user-1',

    title: "Daughter's University Fund",
    category: GoalCategory.EDUCATION,
    icon: '📚',

    targetAmountUSD: 50000,
    currentAmountUSD: 0,
    progressPercentage: 0,

    targetDate: new Date('2032-09-01'),
    createdAt: new Date('2025-12-10'),
    completedAt: null,

    status: GoalStatus.ACTIVE,
    onTrack: true,
    projectedCompletionDate: new Date('2032-09-01'),
    monthsRemaining: 80,

    recommendedMonthlyDeposit: 550,
    recommendedAllocation: {
      USDM: 50,
      bCSPX: 40,
      PAXG: 10,
    },

    milestones: [],
    nextMilestone: null,
  },
  {
    id: 'goal-3',
    userId: 'user-1',

    title: 'Emergency Fund',
    category: GoalCategory.EMERGENCY_FUND,
    icon: '🚨',

    targetAmountUSD: 1000,
    currentAmountUSD: 1000,
    progressPercentage: 100,

    targetDate: new Date('2025-12-31'),
    createdAt: new Date('2025-09-01'),
    completedAt: new Date('2025-12-15'),

    status: GoalStatus.COMPLETED,
    onTrack: true,
    projectedCompletionDate: new Date('2025-12-15'),
    monthsRemaining: 0,

    recommendedMonthlyDeposit: 0,
    recommendedAllocation: {
      USDM: 100,
      bCSPX: 0,
      PAXG: 0,
    },

    milestones: [],
    nextMilestone: null,
  },
];

export function getMockGoals(userId: string): SavingsGoal[] {
  return mockGoals.filter((g) => g.userId === userId);
}

export function getMockGoal(goalId: string): SavingsGoal | null {
  return mockGoals.find((g) => g.id === goalId) || null;
}
