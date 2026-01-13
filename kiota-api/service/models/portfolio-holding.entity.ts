import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('portfolio_holdings')
export class PortfolioHolding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  portfolioId: string;

  @Column({ type: 'varchar', length: 20 })
  assetSymbol: string; // 'USDM', 'bCSPX', 'PAXG', etc.

  @Column({ type: 'varchar', length: 20 })
  assetCategory: string; // 'stable_yield', 'tokenized_stocks', 'tokenized_gold', 'speculative'

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  balance: number; // Token balance

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  valueUsd: number; // Current USD value

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  costBasisUsd: number; // For P&L tracking

  @Column({ type: 'timestamp', nullable: true })
  lastUpdated: Date;
}