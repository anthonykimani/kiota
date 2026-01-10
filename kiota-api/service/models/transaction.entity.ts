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
import { AssetType, PaymentMethod, TransactionStatus, TransactionType } from '../enums/Transaction';
import { User } from './user.entity';

@Entity('transactions')
@Index(['userId', 'createdAt'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  // Source details (what user sent)
  @Column({
    type: 'enum',
    enum: AssetType,
  })
  sourceAsset: AssetType;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  sourceAmount: number;

  // Destination details (what user received)
  @Column({
    type: 'enum',
    enum: AssetType,
  })
  destinationAsset: AssetType;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  destinationAmount: number;

  // USD equivalent for tracking
  @Column({ type: 'decimal', precision: 18, scale: 2 })
  valueUsd: number;

  // Fee breakdown
  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  feeAmount: number;

  @Column({
    type: 'enum',
    enum: AssetType,
    nullable: true,
  })
  feeAsset: AssetType;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  feeUsd: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  feePercent: number;

  @Column({ type: 'boolean', default: false })
  feeSubsidized: boolean; // First deposit or loyalty rebate

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  subsidyAmount: number;

  // Payment method details
  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod: PaymentMethod;

  // M-Pesa specific
  @Column({ type: 'varchar', length: 50, nullable: true })
  mpesaReceiptNumber: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mpesaCheckoutRequestId: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  mpesaPhoneNumber: string;

  // On-ramp provider details (Paycrest/Kotani)
  @Column({ type: 'varchar', length: 50, nullable: true })
  onrampProvider: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  onrampOrderId: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  exchangeRate: number; // KES/USD at transaction time

  // Blockchain details
  @Column({ type: 'varchar', length: 10, nullable: true })
  chain: string; // base, celo, ethereum

  @Column({ type: 'varchar', length: 66, nullable: true })
  @Index()
  txHash: string; // Blockchain transaction hash

  @Column({ type: 'int', nullable: true })
  blockNumber: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  gasUsed: number;

  @Column({ type: 'boolean', default: false })
  gasSponsored: boolean;

  // Asset allocation (for deposits)
  @Column({ type: 'jsonb', nullable: true })
  allocation: {
    usdm?: number;
    bcspx?: number;
    paxg?: number;
    btc?: number;
  };

  // Timing
  @Column({ type: 'timestamp', nullable: true })
  initiatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  // Metadata
  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  source: string; // auto_save, manual, goal_milestone, withdrawal, etc.

  @Column({ type: 'uuid', nullable: true })
  relatedGoalId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'userId' })
  user: User;
}