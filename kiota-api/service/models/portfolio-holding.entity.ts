import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('portfolio_holdings')
export class PortfolioHolding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  portfolioId: string;

  @Column({ type: 'varchar', length: 20 })
  assetSymbol: string; // 'USDM', 'BCSPX', 'PAXG', etc.

  @Column({ type: 'varchar', length: 20 })
  assetCategory: string; // 'stable_yields', 'tokenized_stocks', 'tokenized_gold', 'blue_chip_crypto', 'cash'

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  balance: number; // Token balance

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  valueUsd: number; // Current USD value

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  costBasisUsd: number; // For P&L tracking

  @Column({ type: 'timestamp', nullable: true })
  lastUpdated: Date;
}
