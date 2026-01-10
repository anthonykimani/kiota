import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Chama } from './chama.entity';
import { User } from './user.entity';
import { ActivityType } from '../enums/Chama';


@Entity('chama_activities')
@Index(['chamaId', 'createdAt'])
export class ChamaActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  chamaId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string; // User who triggered the activity

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  activityType: ActivityType;

  @Column({ type: 'text' })
  message: string; // "Sarah K. deposited $150"

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    amount?: number;
    badgeId?: string;
    lessonId?: string;
    milestonePercent?: number;
  };

  @Column({ type: 'boolean', default: true })
  isPublic: boolean; // Visible to all members

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Chama, (chama) => chama.activities)
  @JoinColumn({ name: 'chamaId' })
  chama: Chama;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;
}