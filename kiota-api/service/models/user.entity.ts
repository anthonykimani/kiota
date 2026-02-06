import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Wallet } from './wallet.entity';
import { Portfolio } from './portfolio.entity';
import { Goal } from './goal.entity';
import { AutoSaveRule } from './autosave-rule.entity';
import { SavingsCommitment } from './savings-commitment.entity';
import { RoundupTracker } from './roundup-tracker.entity';
import { UserBadge } from './user-badge.entity';
import { LessonProgress } from './lesson-progress.entity';
import { Transaction } from './transaction.entity';
import { Notification } from './notification.entity';
import { ChamaMembership } from './chama-membership.entity';
import { InvestmentExperience, KYCStatus, MembershipTier, RiskTolerance } from '../enums/User';
import { AuthMethod } from '../enums/AuthMethod';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  @Index()
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profilePhotoUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  googleId: string;

  // Investment Profile from Quiz
  @Column({
    type: 'enum',
    enum: RiskTolerance,
    nullable: true,
  })
  riskTolerance: RiskTolerance;

  @Column({
    type: 'enum',
    enum: InvestmentExperience,
    default: InvestmentExperience.BEGINNER,
  })
  investmentExperience: InvestmentExperience;

  @Column({ type: 'varchar', length: 50, nullable: true })
  primaryGoal: string; // emergency_fund, house, education, retirement, wealth_building

  @Column({ type: 'varchar', length: 50, nullable: true })
  investmentTimeline: string; // <1yr, 1-3yr, 3-5yr, 5-10yr, 10yr+

  @Column({ type: 'varchar', length: 50, nullable: true })
  currentSavingsRange: string; // <50k, 50k-200k, 200k-500k, 500k-1m, 1m+

  @Column({ type: 'varchar', length: 50, nullable: true })
  monthlySavingsRange: string; // <5k, 5k-10k, 10k-20k, 20k-50k, 50k+

  @Column({ type: 'boolean', default: true })
  comfortableWithDollars: boolean;

  @Column({ type: 'simple-array', nullable: true })
  investmentPriorities: string[]; // safety, growth, high_returns, liquidity, learning

  // Target Allocation (from quiz scoring)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 40 })
  targetStableYieldsPercent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15 })
  targetTokenizedGoldPercent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 30 })
  targetDefiYieldPercent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15 })
  targetBluechipCryptoPercent: number;

  // Risk score from quiz (0-55)
  @Column({ type: 'int', nullable: true })
  riskScore: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  strategyName: string; // ultra_conservative, conservative, balanced, growth, aggressive

  // Account Status
  @Column({
    type: 'enum',
    enum: KYCStatus,
    default: KYCStatus.NOT_STARTED,
  })
  kycStatus: KYCStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fractalId: string; // Fractal ID for KYC

  @Column({
    type: 'enum',
    enum: MembershipTier,
    default: MembershipTier.FREE,
  })
  membershipTier: MembershipTier;

  @Column({ type: 'timestamp', nullable: true })
  premiumExpiresAt: Date;

  // Gamification
  @Column({ type: 'int', default: 0 })
  totalPoints: number;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ type: 'varchar', length: 50, default: 'Beginner Saver' })
  levelTitle: string;

  @Column({ type: 'int', default: 0 })
  currentStreak: number; // Days of consecutive deposits

  @Column({ type: 'int', default: 0 })
  longestStreak: number;

  @Column({ type: 'date', nullable: true })
  lastDepositDate: Date;

  // Settings
  @Column({ type: 'boolean', default: true })
  pushNotificationsEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  emailNotificationsEnabled: boolean;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  preferredLanguage: string; // en, sw (Swahili)

  @Column({ type: 'boolean', default: false })
  hasCompletedOnboarding: boolean;

  @Column({ type: 'boolean', default: false })
  hasCompletedQuiz: boolean;

  @Column({ type: 'boolean', default: false })
  firstDepositSubsidyUsed: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  privyUserId: string;

  @Column({ type: 'enum', enum: AuthMethod, nullable: true })
  primaryAuthMethod: AuthMethod; // 'phone', 'email', 'google', 'wallet'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  // Relations
  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;

  @OneToOne(() => Portfolio, (portfolio) => portfolio.user)
  portfolio: Portfolio;

  @OneToMany(() => Goal, (goal) => goal.user)
  goals: Goal[];

  @OneToMany(() => AutoSaveRule, (rule) => rule.user)
  autoSaveRules: AutoSaveRule[];

  @OneToMany(() => SavingsCommitment, (commitment) => commitment.user)
  savingsCommitments: SavingsCommitment[];

  @OneToMany(() => RoundupTracker, (tracker) => tracker.user)
  roundupTrackers: RoundupTracker[];

  @OneToMany(() => UserBadge, (badge) => badge.user)
  badges: UserBadge[];

  @OneToMany(() => LessonProgress, (progress) => progress.user)
  lessonProgress: LessonProgress[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => ChamaMembership, (membership) => membership.user)
  chamaMemberships: ChamaMembership[];
}
