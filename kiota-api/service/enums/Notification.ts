
export enum NotificationType {
  // Transactions
  DEPOSIT_PENDING = 'deposit_pending',
  DEPOSIT_COMPLETED = 'deposit_completed',
  DEPOSIT_FAILED = 'deposit_failed',
  WITHDRAWAL_COMPLETED = 'withdrawal_completed',
  
  // Auto-save
  AUTO_SAVE_REMINDER = 'auto_save_reminder',
  AUTO_SAVE_SUCCESS = 'auto_save_success',
  AUTO_SAVE_FAILED = 'auto_save_failed',
  
  // Goals
  GOAL_MILESTONE = 'goal_milestone',
  GOAL_COMPLETED = 'goal_completed',
  GOAL_REMINDER = 'goal_reminder',
  GOAL_OFF_TRACK = 'goal_off_track',
  
  // Portfolio
  PORTFOLIO_REVIEW = 'portfolio_review',
  REBALANCE_NEEDED = 'rebalance_needed',
  MARKET_ALERT = 'market_alert',
  YIELD_EARNED = 'yield_earned',
  
  // Learning
  LESSON_REMINDER = 'lesson_reminder',
  STREAK_WARNING = 'streak_warning',
  STREAK_LOST = 'streak_lost',
  BADGE_EARNED = 'badge_earned',
  LEVEL_UP = 'level_up',
  
  // Chama
  CHAMA_INVITE = 'chama_invite',
  CHAMA_ACTIVITY = 'chama_activity',
  CHAMA_MILESTONE = 'chama_milestone',
  
  // System
  SYSTEM_UPDATE = 'system_update',
  KYC_APPROVED = 'kyc_approved',
  KYC_REJECTED = 'kyc_rejected',
  PREMIUM_EXPIRING = 'premium_expiring',
}

export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  IN_APP = 'in_app',
  SMS = 'sms',
}