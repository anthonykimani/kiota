export enum ChamaStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  DISBANDED = 'disbanded',
}

export enum ChamaType {
  SAVINGS = 'savings', // General savings group
  GOAL_BASED = 'goal_based', // Working toward specific goal
  ROTATING = 'rotating', // ROSCA style
}

export enum MemberRole {
  MEMBER = 'member',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

export enum MemberStatus {
  PENDING = 'pending', // Awaiting approval
  ACTIVE = 'active',
  PAUSED = 'paused',
  REMOVED = 'removed',
  LEFT = 'left',
}

export enum ActivityType {
  DEPOSIT = 'deposit',
  MEMBER_JOINED = 'member_joined',
  MEMBER_LEFT = 'member_left',
  GOAL_CREATED = 'goal_created',
  GOAL_UPDATED = 'goal_updated',
  MILESTONE_REACHED = 'milestone_reached',
  BADGE_EARNED = 'badge_earned',
  LESSON_COMPLETED = 'lesson_completed',
  ANNOUNCEMENT = 'announcement',
}