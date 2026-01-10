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
import { LearningModule } from './learning-module.entity';
import { LessonProgress } from './lesson-progress.entity';
import { Quiz } from './quiz.entity';
import { LessonStatus, LessonType } from '../enums/Learning';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  moduleId: string;

  @Column({ type: 'int' })
  orderIndex: number; // Order within module (1.1, 1.2, etc.)

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  subtitle: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: LessonType,
    default: LessonType.STORY,
  })
  lessonType: LessonType;

  // Content
  @Column({ type: 'jsonb' })
  content: {
    sections: {
      type: 'text' | 'image' | 'video' | 'quiz' | 'interactive';
      content: string;
      imageUrl?: string;
      videoUrl?: string;
      quizId?: string;
    }[];
  };

  // Key takeaway shown after completion
  @Column({ type: 'text', nullable: true })
  keyTakeaway: string;

  // Estimated time
  @Column({ type: 'int', default: 3 })
  estimatedMinutes: number;

  // Gamification
  @Column({ type: 'int', default: 10 })
  pointsReward: number;

  // Requirements
  @Column({ type: 'uuid', nullable: true })
  prerequisiteLessonId: string;

  @Column({ type: 'boolean', default: false })
  requiresKyc: boolean;

  @Column({ type: 'boolean', default: false })
  premiumOnly: boolean;

  // Statistics
  @Column({ type: 'int', default: 0 })
  totalCompletions: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  averageRating: number;

  @Column({
    type: 'enum',
    enum: LessonStatus,
    default: LessonStatus.PUBLISHED,
  })
  status: LessonStatus;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => LearningModule, (module) => module.lessons)
  @JoinColumn({ name: 'moduleId' })
  module: LearningModule;

  @OneToMany(() => LessonProgress, (progress) => progress.lesson)
  progress: LessonProgress[];

  @OneToMany(() => Quiz, (quiz) => quiz.lesson)
  quizzes: Quiz[];
}