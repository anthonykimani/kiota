import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Goal } from './goal.entity';
import { Transaction } from './transaction.entity';


@Entity('goal_contributions')
export class GoalContribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  goalId: string;

  @Column({ type: 'uuid', nullable: true })
  transactionId: string; // Link to actual transaction

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amountUsd: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amountKes: number;

  @Column({ type: 'varchar', length: 50 })
  source: string; // manual, auto_save, milestone, roundup

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Goal, (goal) => goal.contributions)
  @JoinColumn({ name: 'goalId' })
  goal: Goal;

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;
}