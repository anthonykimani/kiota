import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { NotificationChannel, NotificationType } from '../enums/Notification';


@Entity('notifications')
@Index(['userId', 'createdAt'])
@Index(['userId', 'isRead'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  emoji: string;

  // Action when tapped
  @Column({ type: 'varchar', length: 100, nullable: true })
  actionType: string; // navigate, deep_link, url

  @Column({ type: 'varchar', length: 255, nullable: true })
  actionTarget: string; // /portfolio, /goals/123, etc.

  // Delivery channels
  @Column({ type: 'simple-array', nullable: true })
  channels: NotificationChannel[];

  // Delivery status per channel
  @Column({ type: 'jsonb', nullable: true })
  deliveryStatus: {
    push?: { sent: boolean; sentAt?: Date; error?: string };
    email?: { sent: boolean; sentAt?: Date; error?: string };
    sms?: { sent: boolean; sentAt?: Date; error?: string };
  };

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'boolean', default: false })
  isDismissed: boolean;

  // Related entities
  @Column({ type: 'uuid', nullable: true })
  relatedTransactionId: string;

  @Column({ type: 'uuid', nullable: true })
  relatedGoalId: string;

  @Column({ type: 'uuid', nullable: true })
  relatedBadgeId: string;

  @Column({ type: 'uuid', nullable: true })
  relatedChamaId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Scheduling
  @Column({ type: 'timestamp', nullable: true })
  scheduledFor: Date;

  @Column({ type: 'boolean', default: false })
  isSent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn({ name: 'userId' })
  user: User;
}