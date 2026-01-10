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
import { User } from './user.entity';
import { RoundupTrackerStatus } from '../enums/RoundUpTracker';

@Entity('roundup_trackers')
export class RoundupTracker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'date' })
  periodStart: Date;

  @Column({ type: 'date' })
  periodEnd: Date;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalIdentifiedKes: number;

  @Column({ type: 'int', default: 0 })
  transactionCount: number; // Number of M-Pesa transactions analyzed

  // Breakdown of identified savings
  @Column({ type: 'jsonb', nullable: true })
  roundupDetails: {
    date: string;
    originalAmount: number;
    roundedTo: number;
    roundupAmount: number;
    merchant?: string;
  }[];

  @Column({
    type: 'enum',
    enum: RoundupTrackerStatus,
    default: RoundupTrackerStatus.TRACKING,
  })
  status: RoundupTrackerStatus;

  @Column({ type: 'uuid', nullable: true })
  commitmentId: string; // Link to created commitment

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.roundupTrackers)
  @JoinColumn({ name: 'userId' })
  user: User;
}