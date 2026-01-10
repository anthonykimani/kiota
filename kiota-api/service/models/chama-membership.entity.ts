import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Chama } from './chama.entity';
import { MemberRole, MemberStatus } from '../enums/Chama';

@Entity('chama_memberships')
@Unique(['userId', 'chamaId'])
@Index(['chamaId', 'role'])
export class ChamaMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  chamaId: string;

  @Column({
    type: 'enum',
    enum: MemberRole,
    default: MemberRole.MEMBER,
  })
  role: MemberRole;

  @Column({
    type: 'enum',
    enum: MemberStatus,
    default: MemberStatus.ACTIVE,
  })
  status: MemberStatus;

  // Member's contribution tracking
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalContributedUsd: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  contributionPercent: number; // % of total chama value

  @Column({ type: 'int', default: 0 })
  contributionCount: number;

  @Column({ type: 'date', nullable: true })
  lastContributionDate: Date;

  // Leaderboard position
  @Column({ type: 'int', nullable: true })
  rank: number;

  // Permissions
  @Column({ type: 'boolean', default: true })
  canInvite: boolean;

  @Column({ type: 'timestamp' })
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  leftAt: Date;

  @Column({ type: 'text', nullable: true })
  leaveReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.chamaMemberships)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Chama, (chama) => chama.memberships)
  @JoinColumn({ name: 'chamaId' })
  chama: Chama;
}