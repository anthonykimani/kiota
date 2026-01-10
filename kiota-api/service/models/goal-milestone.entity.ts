import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Goal } from './goal.entity';
import { MilestoneStatus } from '../enums/Goal';


@Entity('goal_milestones')
export class GoalMilestone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  goalId: string;

  @Column({ type: 'int' })
  milestoneNumber: number; // 1, 2, 3, etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  title: string; // e.g., "Q1 Target"

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  targetAmountUsd: number;

  @Column({ type: 'date' })
  targetDate: Date;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  actualPaidUsd: number;

  @Column({
    type: 'enum',
    enum: MilestoneStatus,
    default: MilestoneStatus.PENDING,
  })
  status: MilestoneStatus;

  @Column({ type: 'timestamp', nullable: true })
  committedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'boolean', default: false })
  reminderSent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Goal, (goal) => goal.milestones)
  @JoinColumn({ name: 'goalId' })
  goal: Goal;
}