import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { SnapshotType } from '../enums/Portfolio';

@Entity('portfolio_snapshots')
@Index(['portfolioId', 'snapshotDate'])
export class PortfolioSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  portfolioId: string;

  @Column({ type: 'date' })
  snapshotDate: Date;

  @Column({
    type: 'enum',
    enum: SnapshotType,
    default: SnapshotType.DAILY,
  })
  snapshotType: SnapshotType;

  // Values at snapshot time
  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalValueUsd: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalValueKes: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  stableYieldsValueUsd: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  bluechipCryptoValueUsd: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  tokenizedGoldValueUsd: number;

  // Market prices at snapshot
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  kesUsdRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  sp500Price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  goldPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  btcPrice: number;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Portfolio, (portfolio) => portfolio.snapshots)
  @JoinColumn({ name: 'portfolioId' })
  portfolio: Portfolio;
}
