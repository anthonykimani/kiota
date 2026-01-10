import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Badge } from './badge.entity';

@Entity('user_badges')
@Unique(['userId', 'badgeId'])
@Index(['userId', 'earnedAt'])
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  badgeId: string;

  @Column({ type: 'timestamp' })
  earnedAt: Date;

  // NFT minting details
  @Column({ type: 'boolean', default: false })
  nftMinted: boolean;

  @Column({ type: 'varchar', length: 66, nullable: true })
  nftTxHash: string;

  @Column({ type: 'int', nullable: true })
  nftTokenId: number;

  // Context when badge was earned
  @Column({ type: 'jsonb', nullable: true })
  earnedContext: {
    value?: number; // e.g., balance when earned
    streak?: number;
    lessonId?: string;
    goalId?: string;
  };

  @Column({ type: 'int', default: 0 })
  pointsAwarded: number;

  @Column({ type: 'boolean', default: false })
  isDisplayed: boolean; // User chose to display on profile

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.badges)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Badge, (badge) => badge.userBadges)
  @JoinColumn({ name: 'badgeId' })
  badge: Badge;
}