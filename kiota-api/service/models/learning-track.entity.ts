import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { LearningModule } from './learning-module.entity';
import { TrackLevel } from '../enums/Learning';


@Entity('learning_tracks')
export class LearningTrack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  orderIndex: number; // Track 1, 2, 3

  @Column({ type: 'varchar', length: 100 })
  title: string; // "Foundation", "Strategy", "Expert"

  @Column({ type: 'varchar', length: 255 })
  subtitle: string; // "Master the basics of investing"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TrackLevel,
  })
  level: TrackLevel;

  @Column({ type: 'varchar', length: 10, nullable: true })
  emoji: string;

  // Requirements
  @Column({ type: 'uuid', nullable: true })
  prerequisiteTrackId: string;

  @Column({ type: 'boolean', default: false })
  requiresKyc: boolean;

  @Column({ type: 'boolean', default: false })
  premiumOnly: boolean;

  // Rewards
  @Column({ type: 'int', default: 500 })
  completionPoints: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  certificateName: string; // "Kiota Investor Level 1"

  @Column({ type: 'varchar', length: 100, nullable: true })
  completionBadgeId: string;

  // Statistics
  @Column({ type: 'int', default: 0 })
  totalModules: number;

  @Column({ type: 'int', default: 0 })
  totalLessons: number;

  @Column({ type: 'int', default: 0 })
  estimatedMinutes: number;

  @Column({ type: 'int', default: 0 })
  totalEnrollments: number;

  @Column({ type: 'int', default: 0 })
  totalCompletions: number;

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => LearningModule, (module) => module.track)
  modules: LearningModule[];
}