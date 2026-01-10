import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserBadge } from './user-badge.entity';
import { BadgeCategory, BadgeTier } from '../enums/Badges';


@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string; // first_100, streak_30, foundation_graduate

  @Column({ type: 'varchar', length: 100 })
  title: string; // "First $100"

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 10 })
  emoji: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl: string;

  @Column({
    type: 'enum',
    enum: BadgeCategory,
  })
  category: BadgeCategory;

  @Column({
    type: 'enum',
    enum: BadgeTier,
    default: BadgeTier.BRONZE,
  })
  tier: BadgeTier;

  // Unlock criteria (stored as JSON for flexibility)
  @Column({ type: 'jsonb' })
  criteria: {
    type: string; // balance, streak, lessons, goal, etc.
    threshold: number;
    condition?: string; // Additional condition
  };

  // Points awarded
  @Column({ type: 'int', default: 50 })
  pointsReward: number;

  // NFT details (soulbound)
  @Column({ type: 'boolean', default: true })
  isSoulbound: boolean;

  @Column({ type: 'varchar', length: 66, nullable: true })
  nftContractAddress: string;

  @Column({ type: 'int', nullable: true })
  nftTokenId: number;

  // Display
  @Column({ type: 'boolean', default: true })
  isPublic: boolean;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Statistics
  @Column({ type: 'int', default: 0 })
  totalAwarded: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => UserBadge, (userBadge) => userBadge.badge)
  userBadges: UserBadge[];
}