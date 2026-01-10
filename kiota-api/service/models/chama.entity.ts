import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ChamaMembership } from './chama-membership.entity';
import { ChamaActivity } from './chama-activity';
import { ChamaStatus, ChamaType } from '../enums/Chama';

@Entity('chamas')
export class Chama {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  emoji: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl: string;

  @Column({
    type: 'enum',
    enum: ChamaType,
    default: ChamaType.SAVINGS,
  })
  chamaType: ChamaType;

  // Group goal (optional)
  @Column({ type: 'varchar', length: 100, nullable: true })
  goalTitle: string; // "Land Purchase"

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  goalTargetUsd: number;

  @Column({ type: 'date', nullable: true })
  goalTargetDate: Date;

  // Progress tracking
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalValueUsd: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  goalProgressPercent: number;

  // Membership
  @Column({ type: 'int', default: 0 })
  memberCount: number;

  @Column({ type: 'int', default: 50 })
  maxMembers: number;

  @Column({ type: 'uuid' })
  createdByUserId: string;

  @Column({ type: 'uuid' })
  adminUserId: string;

  // Settings
  @Column({ type: 'boolean', default: false })
  isPrivate: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  inviteCode: string; // For private chamas

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  minimumContribution: number; // Minimum deposit to join

  @Column({ type: 'boolean', default: false })
  batchDepositsEnabled: boolean; // Pathway 4 - group batching

  @Column({
    type: 'enum',
    enum: ChamaStatus,
    default: ChamaStatus.ACTIVE,
  })
  status: ChamaStatus;

  // Statistics
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalDepositedUsd: number;

  @Column({ type: 'int', default: 0 })
  totalDeposits: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => ChamaMembership, (membership) => membership.chama)
  memberships: ChamaMembership[];

  @OneToMany(() => ChamaActivity, (activity) => activity.chama)
  activities: ChamaActivity[];
}