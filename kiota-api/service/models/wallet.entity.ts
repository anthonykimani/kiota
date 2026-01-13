import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { WalletChain, WalletProvider } from '../enums/Wallet';


@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 42, unique: true })
  @Index()
  address: string; // Ethereum/Base wallet address (0x...)

  @Column({
    type: 'enum',
    enum: WalletProvider,
    default: WalletProvider.PRIVY,
  })
  provider: WalletProvider;

  @Column({
    type: 'enum',
    enum: WalletChain,
    default: WalletChain.BASE,
  })
  primaryChain: WalletChain;

  @Column({ type: 'varchar', length: 255, nullable: true })
  privyUserId: string; 

  @Column({ type: 'boolean', default: false })
  isSmartAccount: boolean; 

  @Column({ type: 'varchar', length: 42, nullable: true })
  smartAccountAddress: string; // If using AA

  // Cached balances (updated via background job)
  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  usdcBalance: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  stableYieldBalance: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  tokenizedStocksBalance: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  tokenizedGoldBalance: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  gasBalance: number; // For gas

  @Column({ type: 'timestamp', nullable: true })
  balancesLastUpdated: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.wallet)
  @JoinColumn({ name: 'userId' })
  user: User;
}