import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { LearningTrack } from './learningTrack.entity';
import { Lesson } from './lesson.entity';

@Entity('learning_modules')
export class LearningModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  trackId: string;

  @Column({ type: 'int' })
  orderIndex: number; // Module 1, 2, 3 within track

  @Column({ type: 'varchar', length: 100 })
  title: string; // "Why Dollar Assets?"

  @Column({ type: 'varchar', length: 255 })
  subtitle: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  emoji: string;

  // Requirements
  @Column({ type: 'uuid', nullable: true })
  prerequisiteModuleId: string;

  // Gamification
  @Column({ type: 'int', default: 100 })
  completionPoints: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  completionBadgeId: string;

  // Statistics
  @Column({ type: 'int', default: 0 })
  totalLessons: number;

  @Column({ type: 'int', default: 0 })
  estimatedMinutes: number;

  @Column({ type: 'int', default: 0 })
  totalCompletions: number;

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => LearningTrack, (track) => track.modules)
  @JoinColumn({ name: 'trackId' })
  track: LearningTrack;

  @OneToMany(() => Lesson, (lesson) => lesson.module)
  lessons: Lesson[];
}