import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { PortfolioSnapshot } from './portfolio-snapshot.entity';


@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  // Current holdings in USD value
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalValueUsd: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalValueKes: number;

  // Asset breakdown in USD
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  stableYieldsValueUsd: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  tokenizedStocksValueUsd: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  tokenizedGoldValueUsd: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  blueChipCryptoValueUsd: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  gasBalanceValueUsd: number;

  // Current allocation percentages (calculated)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  stableYieldsPercent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  tokenizedStocksPercent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  tokenizedGoldPercent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  blueChipCryptoPercent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  gasBalancePercent: number;

  // Performance metrics
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalDeposited: number; // Lifetime deposits in USD

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalWithdrawn: number; // Lifetime withdrawals in USD

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalGainsUsd: number; // Unrealized + realized gains

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  allTimeReturnPercent: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  monthlyEarningsEstimate: number; // Based on current holdings

  // Yield tracking
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalYieldEarned: number; // From USDM rebasing

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  thisMonthYield: number;

  // Last rebalance
  @Column({ type: 'timestamp', nullable: true })
  lastRebalanceAt: Date;

  @Column({ type: 'boolean', default: false })
  needsRebalance: boolean; // If allocation drifted >5%

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.portfolio)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => PortfolioSnapshot, (snapshot) => snapshot.portfolio)
  snapshots: PortfolioSnapshot[];
}