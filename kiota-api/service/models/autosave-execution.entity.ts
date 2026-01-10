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
import { AutoSaveRule } from './autosave-rule.entity';
import { Transaction } from './transaction.entity';
import { ExecutionStatus } from '../enums/Autosave';

@Entity('auto_save_executions')
export class AutoSaveExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  ruleId: string;

  @Column({ type: 'date' })
  scheduledDate: Date;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amountKes: number;

  @Column({
    type: 'enum',
    enum: ExecutionStatus,
    default: ExecutionStatus.PENDING,
  })
  status: ExecutionStatus;

  // M-Pesa tracking
  @Column({ type: 'varchar', length: 50, nullable: true })
  mpesaCheckoutRequestId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mpesaReceiptNumber: string;

  @Column({ type: 'text', nullable: true })
  mpesaResultDesc: string;

  // STK push timing
  @Column({ type: 'timestamp', nullable: true })
  stkPushSentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  // Link to transaction if successful
  @Column({ type: 'uuid', nullable: true })
  transactionId: string;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => AutoSaveRule, (rule) => rule.executions)
  @JoinColumn({ name: 'ruleId' })
  rule: AutoSaveRule;

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;
}