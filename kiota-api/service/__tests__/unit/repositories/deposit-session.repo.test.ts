/**
 * DepositSessionRepository Unit Tests
 */

import { DepositSessionRepository } from '../../../repositories/deposit-session.repo';
import { initTestDatabase, closeTestDatabase, clearDatabase } from '../../utils/test-db.util';
import { createMockDepositSession, createMockOnchainProcessedEvent } from '../../utils/fixtures.util';
import { randomUUID } from 'crypto';

describe('DepositSessionRepository', () => {
  let repository: DepositSessionRepository;

  beforeAll(async () => {
    await initTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    repository = new DepositSessionRepository();
  });

  describe('create', () => {
    it('should create a new deposit session', async () => {
      const testUserId = randomUUID();
      const sessionData = createMockDepositSession({
        userId: testUserId,
        walletAddress: '0xTestWallet',
        expectedAmount: 100
      });

      const session = await repository.create(sessionData);

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.userId).toBe(testUserId);
      expect(session.walletAddress).toBe('0xTestWallet');
      expect(Number(session.expectedAmount)).toBe(100);
      expect(session.status).toBe('AWAITING_TRANSFER');
    });

    it('should create session with correct time boundaries', async () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

      const sessionData = createMockDepositSession({
        createdAt: now,
        expiresAt
      });

      const session = await repository.create(sessionData);

      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.expiresAt).toBeInstanceOf(Date);
      expect(session.expiresAt.getTime()).toBeGreaterThan(session.createdAt.getTime());
    });
  });

  describe('getById', () => {
    it('should retrieve a session by ID', async () => {
      const testUserId = randomUUID();
      const sessionData = createMockDepositSession({ userId: testUserId });
      const created = await repository.create(sessionData);

      const retrieved = await repository.getById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.userId).toBe(testUserId);
    });

    it('should return null for non-existent session', async () => {
      const retrieved = await repository.getById(randomUUID());

      expect(retrieved).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update session status', async () => {
      const sessionData = createMockDepositSession({
        status: 'AWAITING_TRANSFER'
      });
      const created = await repository.create(sessionData);

      const updated = await repository.updateStatus(created.id, 'RECEIVED');

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('RECEIVED');
    });

    it('should update status to CONFIRMED', async () => {
      const sessionData = createMockDepositSession();
      const created = await repository.create(sessionData);

      const updated = await repository.updateStatus(created.id, 'CONFIRMED');

      expect(updated?.status).toBe('CONFIRMED');
    });

    it('should update status to EXPIRED', async () => {
      const sessionData = createMockDepositSession();
      const created = await repository.create(sessionData);

      const updated = await repository.updateStatus(created.id, 'EXPIRED');

      expect(updated?.status).toBe('EXPIRED');
    });
  });

  describe('bindOnchainEvent', () => {
    it('should bind blockchain event to session', async () => {
      const sessionData = createMockDepositSession();
      const created = await repository.create(sessionData);

      const eventData = {
        txHash: '0xabcdef123456',
        logIndex: 5,
        fromAddress: '0xSenderAddress',
        amount: 100.5,
        blockNumber: 1000000
      };

      const updated = await repository.bindOnchainEvent(created.id, eventData);

      expect(updated).toBeDefined();
      expect(updated?.matchedTxHash).toBe('0xabcdef123456');
      expect(updated?.matchedLogIndex).toBe(5);
      expect(updated?.matchedFromAddress).toBe('0xSenderAddress');
      expect(Number(updated?.matchedAmount)).toBe(100.5);
      expect(updated?.matchedBlockNumber).toBe(1000000);
    });

    it('should handle optional fromAddress', async () => {
      const sessionData = createMockDepositSession();
      const created = await repository.create(sessionData);

      const eventData = {
        txHash: '0xabcdef',
        logIndex: 0,
        amount: 50,
        blockNumber: 999999
      };

      const updated = await repository.bindOnchainEvent(created.id, eventData);

      expect(updated?.matchedTxHash).toBe('0xabcdef');
      expect(updated?.matchedFromAddress).toBeNull();
    });
  });

  describe('isEventProcessed', () => {
    it('should return false for unprocessed event', async () => {
      const isProcessed = await repository.isEventProcessed({
        chain: 'base',
        txHash: '0xunprocessed',
        logIndex: 0
      });

      expect(isProcessed).toBe(false);
    });

    it('should return true for processed event', async () => {
      // Mark event as processed
      await repository.markEventProcessed({
        chain: 'base',
        txHash: '0xprocessed',
        logIndex: 0
      });

      const isProcessed = await repository.isEventProcessed({
        chain: 'base',
        txHash: '0xprocessed',
        logIndex: 0
      });

      expect(isProcessed).toBe(true);
    });

    it('should be case-insensitive for txHash', async () => {
      await repository.markEventProcessed({
        chain: 'base',
        txHash: '0xABCDEF',
        logIndex: 0
      });

      const isProcessed = await repository.isEventProcessed({
        chain: 'base',
        txHash: '0xabcdef',
        logIndex: 0
      });

      expect(isProcessed).toBe(true);
    });
  });

  describe('markEventProcessed', () => {
    it('should mark event as processed', async () => {
      const result = await repository.markEventProcessed({
        chain: 'base',
        txHash: '0xnewEvent',
        logIndex: 1
      });

      expect(result).toBe(true);

      // Verify it's marked
      const isProcessed = await repository.isEventProcessed({
        chain: 'base',
        txHash: '0xnewEvent',
        logIndex: 1
      });

      expect(isProcessed).toBe(true);
    });

    it('should be idempotent (can call multiple times)', async () => {
      const params = {
        chain: 'base',
        txHash: '0xidempotent',
        logIndex: 2
      };

      // Mark twice
      await repository.markEventProcessed(params);
      await repository.markEventProcessed(params);

      // Should still be marked once
      const isProcessed = await repository.isEventProcessed(params);
      expect(isProcessed).toBe(true);
    });

    it('should enforce unique constraint on (chain, txHash, logIndex)', async () => {
      const params = {
        chain: 'base',
        txHash: '0xunique',
        logIndex: 3
      };

      // First call should succeed
      await repository.markEventProcessed(params);

      // Second call should not throw (upsert handles duplicate)
      await expect(repository.markEventProcessed(params)).resolves.toBe(true);
    });

    it('should lowercase txHash before storing', async () => {
      await repository.markEventProcessed({
        chain: 'base',
        txHash: '0xUPPERCASE',
        logIndex: 0
      });

      // Check with lowercase
      const isProcessed = await repository.isEventProcessed({
        chain: 'base',
        txHash: '0xuppercase',
        logIndex: 0
      });

      expect(isProcessed).toBe(true);
    });
  });

  describe('Integration: Complete deposit flow', () => {
    it('should handle full deposit session lifecycle', async () => {
      // 1. Create session
      const sessionData = createMockDepositSession({
        userId: randomUUID(),
        expectedAmount: 100,
        status: 'AWAITING_TRANSFER'
      });

      const session = await repository.create(sessionData);
      expect(session.status).toBe('AWAITING_TRANSFER');

      // 2. Bind blockchain event
      const eventData = {
        txHash: '0xdeposit123',
        logIndex: 0,
        fromAddress: '0xSender',
        amount: 100,
        blockNumber: 1000000
      };

      await repository.bindOnchainEvent(session.id, eventData);

      // 3. Update to RECEIVED (waiting for confirmations)
      let updated = await repository.updateStatus(session.id, 'RECEIVED');
      expect(updated?.status).toBe('RECEIVED');
      expect(updated?.matchedTxHash).toBe('0xdeposit123');

      // 4. Mark event as processed
      await repository.markEventProcessed({
        chain: 'base',
        txHash: '0xdeposit123',
        logIndex: 0
      });

      // 5. Update to CONFIRMED
      updated = await repository.updateStatus(session.id, 'CONFIRMED');
      expect(updated?.status).toBe('CONFIRMED');

      // 6. Verify event is marked as processed
      const isProcessed = await repository.isEventProcessed({
        chain: 'base',
        txHash: '0xdeposit123',
        logIndex: 0
      });

      expect(isProcessed).toBe(true);
    });

    it('should prevent double-processing of same blockchain event', async () => {
      // Create two sessions
      const session1 = await repository.create(createMockDepositSession());
      const session2 = await repository.create(createMockDepositSession());

      const txHash = '0xsharedEvent';

      // Mark event as processed for session1
      await repository.markEventProcessed({
        chain: 'base',
        txHash,
        logIndex: 0
      });

      // Check if event is already processed (should be true)
      const isProcessed = await repository.isEventProcessed({
        chain: 'base',
        txHash,
        logIndex: 0
      });

      expect(isProcessed).toBe(true);

      // Session2 should not be able to use this event
      // (this check would be done in the processor/controller)
    });
  });
});
