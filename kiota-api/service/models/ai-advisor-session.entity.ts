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
import { AISessionType } from '../enums/RoboAdvisor';


@Entity('ai_advisor_sessions')
@Index(['userId', 'createdAt'])
export class AIAdvisorSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: AISessionType,
  })
  sessionType: AISessionType;

  // Input data sent to Claude
  @Column({ type: 'jsonb' })
  inputContext: {
    userProfile?: Record<string, any>;
    portfolio?: Record<string, any>;
    marketData?: Record<string, any>;
    quizAnswers?: Record<string, any>;
    question?: string;
  };

  // Claude's response
  @Column({ type: 'jsonb', nullable: true })
  aiResponse: {
    allocation?: {
      usdm: number;
      bcspx: number;
      paxg: number;
      btc?: number;
    };
    projections?: Record<string, any>;
    rationale?: string;
    risks?: string[];
    recommendations?: string[];
    rawText?: string;
  };

  // API details
  @Column({ type: 'varchar', length: 50, nullable: true })
  modelUsed: string; // claude-sonnet-4-20250514

  @Column({ type: 'int', nullable: true })
  inputTokens: number;

  @Column({ type: 'int', nullable: true })
  outputTokens: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  costUsd: number;

  @Column({ type: 'int', nullable: true })
  latencyMs: number;

  // User feedback
  @Column({ type: 'boolean', nullable: true })
  userAccepted: boolean;

  @Column({ type: 'int', nullable: true })
  userRating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  userFeedback: string;

  @Column({ type: 'boolean', default: false })
  hadError: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}