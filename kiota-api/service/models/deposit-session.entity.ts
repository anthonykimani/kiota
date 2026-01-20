import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type DepositSessionStatus =
  | 'AWAITING_TRANSFER'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'FAILED';

/**
 * DepositSession entity
 * Tracks onchain deposit intents and matches them to blockchain Transfer events
 * Used for idempotent confirmation of USDC deposits
 */
@Entity('deposit_sessions')
@Index(['userId', 'status'])
@Index(['walletAddress', 'chain'])
export class DepositSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 42 })
  walletAddress: string; // User's wallet address

  @Column({ type: 'varchar', length: 20 })
  chain: string; // base, celo, ethereum

  @Column({ type: 'varchar', length: 10 })
  tokenSymbol: string; // USDC

  @Column({ type: 'varchar', length: 42 })
  tokenAddress: string; // USDC contract address

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  expectedAmount: number; // Expected deposit amount (if specified)

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  minAmount: number; // Minimum acceptable amount

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  maxAmount: number; // Maximum acceptable amount (null = no limit)

  @Column({
    type: 'varchar',
    length: 20,
    default: 'AWAITING_TRANSFER',
  })
  status: DepositSessionStatus;

  // Matched event details (populated when Transfer event is found)
  @Column({ type: 'varchar', length: 66, nullable: true })
  @Index()
  matchedTxHash: string; // Transaction hash of matched Transfer event

  @Column({ type: 'int', nullable: true })
  matchedLogIndex: number; // Log index within the transaction

  @Column({ type: 'varchar', length: 42, nullable: true })
  matchedFromAddress: string; // Sender address from Transfer event

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  matchedAmount: number; // Actual transferred amount

  @Column({ type: 'int', nullable: true })
  matchedBlockNumber: number; // Block number of matched event

  // Block boundary for deterministic scanning
  @Column({ type: 'int' })
  createdAtBlockNumber: number; // Block number at session creation

  @Column({ type: 'int', nullable: true })
  expiresAtBlockNumber: number; // Block number when session expires (optional)

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date; // Session expiration time (60 minutes from creation)

  @UpdateDateColumn()
  updatedAt: Date;
}
