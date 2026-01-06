/**
 * Learning Models
 * Educational content and gamification
 */

export interface LearningTrack {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  orderIndex: number;

  // Content
  modules: Module[];
  totalLessons: number;
  estimatedMinutes: number;

  // Requirements
  requiredTrackId: string | null; // previous track to complete
  requiredPoints: number;

  // Rewards
  pointsReward: number;
  badgeId: string | null;
}

export interface Module {
  id: string;
  trackId: string;
  title: string;
  slug: string;
  description: string;
  orderIndex: number;

  // Content
  lessons: Lesson[];
  totalLessons: number;
  estimatedMinutes: number;

  // Quiz
  hasQuiz: boolean;
  quizPassingScore: number; // percentage

  // Rewards
  pointsReward: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  orderIndex: number;

  // Content
  content: LessonContent[];
  estimatedMinutes: number;

  // Media
  videoUrl: string | null;
  videoDurationSeconds: number | null;

  // Metadata
  completedByCount: number;

  // Rewards
  pointsReward: number;
}

export interface LessonContent {
  type: 'text' | 'image' | 'video' | 'quiz' | 'interactive';
  content: string | QuizQuestion | InteractiveContent;
  orderIndex: number;
}

export interface QuizQuestion {
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface InteractiveContent {
  type: 'calculator' | 'chart' | 'slider' | 'allocation_builder';
  config: Record<string, any>;
}

// User progress tracking
export interface UserLearningProgress {
  userId: string;
  trackId: string;
  moduleId: string | null;
  lessonId: string | null;

  // Progress
  lessonsCompleted: number;
  totalLessons: number;
  progressPercentage: number;

  // Status
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt: Date | null;

  // Time tracking
  totalTimeSpentMinutes: number;
  startedAt: Date | null;
  lastAccessedAt: Date | null;
}

export interface LessonCompletion {
  id: string;
  userId: string;
  lessonId: string;

  // Completion
  completedAt: Date;
  timeSpentMinutes: number;

  // Quiz performance (if applicable)
  quizScore: number | null; // percentage
  quizAttempts: number;
}

// Gamification
export interface Badge {
  id: string;
  title: string;
  description: string;
  category: BadgeCategory;

  // Visual
  icon: string; // emoji or icon identifier
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';

  // Requirements
  requirement: BadgeRequirement;

  // Blockchain (soulbound NFT)
  contractAddress: string | null;
  tokenId: string | null;
}

export enum BadgeCategory {
  MILESTONE = 'milestone',
  STREAK = 'streak',
  LEARNING = 'learning',
  BEHAVIORAL = 'behavioral',
  SPECIAL = 'special',
}

export interface BadgeRequirement {
  type: BadgeRequirementType;
  threshold: number;
  description: string;
}

export enum BadgeRequirementType {
  BALANCE_REACHED = 'balance_reached',
  STREAK_DAYS = 'streak_days',
  LESSONS_COMPLETED = 'lessons_completed',
  TRACK_COMPLETED = 'track_completed',
  GOAL_ACHIEVED = 'goal_achieved',
  HELD_THROUGH_CRASH = 'held_through_crash',
  NO_WITHDRAWALS = 'no_withdrawals',
  REFERRALS = 'referrals',
  EARLY_ADOPTER = 'early_adopter',
  CHAMA_CREATED = 'chama_created',
  ALLOCATION_MAINTAINED = 'allocation_maintained',
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;

  // Earning
  earnedAt: Date;
  progress: number; // for progressive badges

  // NFT
  nftMinted: boolean;
  nftTransactionHash: string | null;
  nftMintedAt: Date | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userPhoto: string | null;

  // Metric depends on leaderboard type
  score: number;
  scoreLabel: string; // e.g., "1,240 points", "+28%", "$1,450"

  // Additional info
  metadata: Record<string, any>;
}

export interface Leaderboard {
  type: LeaderboardType;
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[];
  userRank: number | null; // current user's rank
  updatedAt: Date;
}

export enum LeaderboardType {
  POINTS = 'points',
  WEALTH_GROWTH = 'wealth_growth',
  STREAK = 'streak',
  LEARNING = 'learning',
}

export enum LeaderboardPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time',
}
