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
import { Lesson } from './lesson.entity';
import { ProgressStatus } from '../enums/Learning';

@Entity('lesson_progress')
@Unique(['userId', 'lessonId'])
@Index(['userId', 'lessonId'])
export class LessonProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  lessonId: string;

  @Column({
    type: 'enum',
    enum: ProgressStatus,
    default: ProgressStatus.NOT_STARTED,
  })
  status: ProgressStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressPercent: number;

  // Track which sections completed
  @Column({ type: 'int', default: 0 })
  lastSectionIndex: number;

  @Column({ type: 'int', default: 0 })
  totalSections: number;

  // Quiz performance
  @Column({ type: 'int', nullable: true })
  quizScore: number;

  @Column({ type: 'int', nullable: true })
  quizAttempts: number;

  @Column({ type: 'boolean', default: false })
  quizPassed: boolean;

  // Time spent
  @Column({ type: 'int', default: 0 })
  timeSpentSeconds: number;

  // Points awarded
  @Column({ type: 'int', default: 0 })
  pointsEarned: number;

  @Column({ type: 'boolean', default: false })
  pointsAwarded: boolean;

  // User feedback
  @Column({ type: 'int', nullable: true })
  rating: number; // 1-5 stars

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.lessonProgress)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Lesson, (lesson) => lesson.progress)
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;
}