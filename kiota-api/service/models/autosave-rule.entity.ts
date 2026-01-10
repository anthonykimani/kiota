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
import { User } from './user.entity';
import { AutoSaveExecution } from './autosave-execution.entity';
import { AutoSaveFrequency, AutoSaveStatus } from '../enums/Autosave';

@Entity('auto_save_rules')
export class AutoSaveRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string; // "Weekly Friday savings"

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amountKes: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amountUsd: number; // Estimated based on current rate

  @Column({
    type: 'enum',
    enum: AutoSaveFrequency,
  })
  frequency: AutoSaveFrequency;

  // For weekly frequency
  @Column({ type: 'int', nullable: true })
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.

  // For monthly frequency
  @Column({ type: 'int', nullable: true })
  dayOfMonth: number; // 1-31

  // For biweekly
  @Column({ type: 'date', nullable: true })
  biweeklyStartDate: Date;

  // Execution times
  @Column({ type: 'time', default: '09:00:00' })
  executionTime: string; // When to trigger STK push

  @Column({ type: 'date' })
  nextTriggerDate: Date;

  @Column({ type: 'date', nullable: true })
  lastTriggerDate: Date;

  // Asset allocation for this rule
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 80 })
  usdmPercent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15 })
  bcspxPercent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5 })
  paxgPercent: number;

  @Column({ type: 'boolean', default: true })
  useDefaultAllocation: boolean; // Use user's default strategy

  // Statistics
  @Column({ type: 'int', default: 0 })
  totalExecutions: number;

  @Column({ type: 'int', default: 0 })
  successfulExecutions: number;

  @Column({ type: 'int', default: 0 })
  failedExecutions: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalSavedKes: number;

  @Column({
    type: 'enum',
    enum: AutoSaveStatus,
    default: AutoSaveStatus.ACTIVE,
  })
  status: AutoSaveStatus;

  @Column({ type: 'text', nullable: true })
  pauseReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.autoSaveRules)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => AutoSaveExecution, (execution) => execution.rule)
  executions: AutoSaveExecution[];
}