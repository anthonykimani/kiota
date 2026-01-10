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
import { Lesson } from './lesson.entity';
import { QuizQuestionType } from '../enums/Quiz';

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  lessonId: string;

  @Column({ type: 'int' })
  orderIndex: number;

  @Column({
    type: 'enum',
    enum: QuizQuestionType,
    default: QuizQuestionType.SINGLE_CHOICE,
  })
  questionType: QuizQuestionType;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text', nullable: true })
  questionContext: string; // Additional context before the question

  // Options for choice questions
  @Column({ type: 'jsonb', nullable: true })
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];

  // For numeric/fill-in questions
  @Column({ type: 'varchar', length: 255, nullable: true })
  correctAnswer: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  numericTolerance: number; // For numeric answers

  // Explanation shown after answer
  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ type: 'text', nullable: true })
  correctExplanation: string;

  @Column({ type: 'text', nullable: true })
  incorrectExplanation: string;

  // Points for this question
  @Column({ type: 'int', default: 10 })
  points: number;

  // Passing threshold for module quizzes (percentage)
  @Column({ type: 'int', default: 70 })
  passingScore: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Lesson, (lesson) => lesson.quizzes)
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;
}