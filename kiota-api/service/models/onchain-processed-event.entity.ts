import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

/**
 * OnchainProcessedEvent entity
 * Tracks blockchain events that have been processed to prevent double-crediting
 * Unique constraint on (chain, txHash, logIndex) ensures idempotency
 */
@Entity('onchain_processed_events')
@Unique(['chain', 'txHash', 'logIndex'])
@Index(['chain', 'txHash'])
export class OnchainProcessedEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  chain: string; // base, celo, ethereum

  @Column({ type: 'varchar', length: 66 })
  txHash: string; // Transaction hash (lowercase)

  @Column({ type: 'int' })
  logIndex: number; // Log index within the transaction

  @CreateDateColumn()
  processedAt: Date; // When this event was processed

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
