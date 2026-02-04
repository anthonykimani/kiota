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
import { AssetClass } from './asset-class.entity';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  @Index()
  symbol: string; // USDM, IVVON, PAXG, TSLAon, etc.

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'uuid' })
  assetClassId: string;

  @ManyToOne(() => AssetClass, (assetClass) => assetClass.assets)
  @JoinColumn({ name: 'assetClassId' })
  assetClass: AssetClass;

  @Column({ type: 'varchar', length: 20, nullable: true })
  chain: string; // base, ethereum, etc.

  @Column({ type: 'varchar', length: 42, nullable: true })
  address: string;

  @Column({ type: 'int', default: 18 })
  decimals: number;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean; // primary asset for its class

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
