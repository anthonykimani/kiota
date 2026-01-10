import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AssetSymbol } from '../enums/MarketData';


@Entity('market_data')
@Index(['symbol', 'timestamp'])
export class MarketData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AssetSymbol,
  })
  symbol: AssetSymbol;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  price: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  price24hAgo: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  change24h: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  changePercent24h: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  high24h: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  low24h: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  volume24h: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  marketCap: number;

  // For yield-bearing assets
  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  currentApy: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string; // coingecko, dexscreener, uniswap, etc.

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;
}

// Separate table for KES/USD exchange rates (updated frequently)
@Entity('exchange_rates')
@Index(['timestamp'])
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, default: 'KES' })
  baseCurrency: string;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  quoteCurrency: string;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  rate: number; // KES per USD

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  bidRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  askRate: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string; // cbk, paycrest, forex_api

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;
}