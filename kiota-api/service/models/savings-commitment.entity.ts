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
import { User } from './user.entity';
import { Transaction } from './transaction.entity';
import { CommitmentStatus } from '../enums/SavingsCommitment';

@Entity('savings_commitments')
export class SavingsCommitment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amountKes: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amountUsd: number;

  @Column({ type: 'date' })
  dueDate: Date; // Usually payday

  @Column({ type: 'varchar', length: 50, nullable: true })
  source: string; // roundup, manual_commitment, chama_commitment

  @Column({
    type: 'enum',
    enum: CommitmentStatus,
    default: CommitmentStatus.PENDING,
  })
  status: CommitmentStatus;

  // Reminder tracking
  @Column({ type: 'boolean', default: false })
  reminderSent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  reminderSentAt: Date;

  @Column({ type: 'int', default: 0 })
  reminderCount: number;

  // Payment tracking
  @Column({ type: 'timestamp', nullable: true })
  committedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'uuid', nullable: true })
  transactionId: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.savingsCommitments)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;
}