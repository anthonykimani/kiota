import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { GoalCategory, GoalStatus } from '../enums/Goal';
import { User } from './user.entity';
import { GoalMilestone } from './goal-milestone.entity';
import { GoalContribution } from './goal-contribution.entity';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: GoalCategory,
    default: GoalCategory.OTHER,
  })
  category: GoalCategory;

  @Column({ type: 'varchar', length: 10, nullable: true })
  emoji: string; // Custom emoji for display

  // Target amounts
  @Column({ type: 'decimal', precision: 18, scale: 2 })
  targetAmountUsd: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  targetAmountKes: number;

  @Column({ type: 'date' })
  targetDate: Date;

  // Progress tracking
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  currentAmountUsd: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressPercent: number;

  // AI-recommended savings pathway
  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  recommendedMonthlyUsd: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  projectedTotalUsd: number; // Expected with compound growth

  @Column({ type: 'date', nullable: true })
  projectedCompletionDate: Date;

  @Column({ type: 'boolean', default: true })
  onTrack: boolean;

  // Status
  @Column({
    type: 'enum',
    enum: GoalStatus,
    default: GoalStatus.ACTIVE,
  })
  status: GoalStatus;

  @Column({ type: 'date', nullable: true })
  completedAt: Date;

  // Settings
  @Column({ type: 'boolean', default: true })
  notificationsEnabled: boolean;

  @Column({ type: 'int', default: 7 })
  reminderDaysBefore: number; // Days before milestone to remind

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.goals)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => GoalMilestone, (milestone) => milestone.goal)
  milestones: GoalMilestone[];

  @OneToMany(() => GoalContribution, (contribution) => contribution.goal)
  contributions: GoalContribution[];
}