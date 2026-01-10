import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { OTPPurpose, OTPStatus } from '../enums/Otp';

@Entity('otps')
@Index(['phoneNumber', 'purpose', 'status'])
@Index(['code', 'phoneNumber'])
export class OTP {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 6 })
  code: string;

  @Column({
    type: 'enum',
    enum: OTPPurpose,
  })
  purpose: OTPPurpose;

  @Column({
    type: 'enum',
    enum: OTPStatus,
    default: OTPStatus.PENDING,
  })
  status: OTPStatus;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', default: 3 })
  maxAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}