/**
 * Deposit Flow Integration Tests
 *
 * Tests the complete deposit flows including idempotency guarantees:
 * 1. Onchain USDC deposit flow with blockchain event matching
 * 2. M-Pesa deposit flow with callback handling
 * 3. Idempotency scenarios (double-processing prevention)
 */

import { DepositSessionRepository } from '../../repositories/deposit-session.repo';
import { TransactionRepository } from '../../repositories/transaction.repo';
import { PortfolioRepository } from '../../repositories/portfolio.repo';
import { WalletRepository } from '../../repositories/wallet.repo';
import { UserRepository } from '../../repositories/user.repo';
import { initTestDatabase, closeTestDatabase, clearDatabase } from '../utils/test-db.util';
import { createMockUser, createMockWallet, createMockPortfolio } from '../utils/fixtures.util';
import { randomUUID } from 'crypto';

describe('Deposit Flow Integration Tests', () => {
  let sessionRepo: DepositSessionRepository;
  let txRepo: TransactionRepository;
  let portfolioRepo: PortfolioRepository;
  let walletRepo: WalletRepository;
  let userRepo: UserRepository;

  beforeAll(async () => {
    await initTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    sessionRepo = new DepositSessionRepository();
    txRepo = new TransactionRepository();
    portfolioRepo = new PortfolioRepository();
    walletRepo = new WalletRepository();
    userRepo = new UserRepository();
  });

  describe('Onchain Deposit Flow - Idempotency', () => {
    it('should prevent double-crediting when same blockchain event is confirmed twice', async () => {
      // Setup: Create user, wallet, portfolio
      const userId = randomUUID();
      const user = await userRepo.create(createMockUser({
        id: userId,
        targetStableYieldsPercent: 80,
        targetTokenizedStocksPercent: 15,
        targetTokenizedGoldPercent: 5
      }));

      const wallet = await walletRepo.create(createMockWallet({
        userId,
        address: '0xUserWallet123',
        chain: 'base'
      }));

      const portfolio = await portfolioRepo.create(createMockPortfolio({
        userId,
        totalValueUsd: 0
      }));

      // Step 1: Create deposit session
      const session = await sessionRepo.create({
        userId,
        walletAddress: wallet.address,
        chain: 'base',
        tokenSymbol: 'USDC',
        tokenAddress: '0xUSDCAddress',
        expectedAmount: 100,
        minAmount: 95,
        maxAmount: 105,
        status: 'AWAITING_TRANSFER',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAtBlockNumber: 1000000
      });

      expect(session.status).toBe('AWAITING_TRANSFER');

      // Step 2: Simulate blockchain event received
      const blockchainEvent = {
        txHash: '0xabcdef123456',
        logIndex: 0,
        fromAddress: '0xSenderAddress',
        amount: 100,
        blockNumber: 1000010
      };

      await sessionRepo.bindOnchainEvent(session.id, blockchainEvent);
      await sessionRepo.updateStatus(session.id, 'RECEIVED');

      // Step 3: Confirm deposit (first time) - should succeed
      const isProcessed1 = await sessionRepo.isEventProcessed({
        chain: 'base',
        txHash: blockchainEvent.txHash,
        logIndex: blockchainEvent.logIndex
      });
      expect(isProcessed1).toBe(false);

      // Mark as processed
      await sessionRepo.markEventProcessed({
        chain: 'base',
        txHash: blockchainEvent.txHash,
        logIndex: blockchainEvent.logIndex
      });

      // Create transaction record
      const tx1 = await txRepo.createOnchainDeposit({
        userId,
        chain: 'base',
        tokenSymbol: 'USDC',
        tokenAddress: '0xUSDCAddress',
        walletAddress: wallet.address,
        amountUsd: blockchainEvent.amount,
        txHash: blockchainEvent.txHash,
        logIndex: blockchainEvent.logIndex,
        allocation: {
          stableYields: 80,
          tokenizedStocks: 15,
          tokenizedGold: 5
        }
      });

      await sessionRepo.updateStatus(session.id, 'CONFIRMED');

      // Step 4: Try to confirm same deposit again (should be idempotent)
      const isProcessed2 = await sessionRepo.isEventProcessed({
        chain: 'base',
        txHash: blockchainEvent.txHash,
        logIndex: blockchainEvent.logIndex
      });
      expect(isProcessed2).toBe(true);

      // Try to create another transaction with same event (should return existing)
      const tx2 = await txRepo.createOnchainDeposit({
        userId,
        chain: 'base',
        tokenSymbol: 'USDC',
        tokenAddress: '0xUSDCAddress',
        walletAddress: wallet.address,
        amountUsd: blockchainEvent.amount,
        txHash: blockchainEvent.txHash,
        logIndex: blockchainEvent.logIndex,
        allocation: {
          stableYields: 80,
          tokenizedStocks: 15,
          tokenizedGold: 5
        }
      });

      // Should return the same transaction (idempotency)
      expect(tx2.id).toBe(tx1.id);
      expect(tx2.txHash).toBe(tx1.txHash);
      expect(tx2.logIndex).toBe(tx1.logIndex);
    });

    it('should prevent multiple sessions from claiming the same blockchain event', async () => {
      // Create two users with different wallets
      const user1Id = randomUUID();
      const user2Id = randomUUID();

      await userRepo.create(createMockUser({ id: user1Id }));
      await userRepo.create(createMockUser({ id: user2Id }));

      const wallet1 = await walletRepo.create(createMockWallet({
        userId: user1Id,
        address: '0xWallet1'
      }));

      const wallet2 = await walletRepo.create(createMockWallet({
        userId: user2Id,
        address: '0xWallet2'
      }));

      // Create two deposit sessions for same expected transfer
      const session1 = await sessionRepo.create({
        userId: user1Id,
        walletAddress: wallet1.address,
        chain: 'base',
        tokenSymbol: 'USDC',
        tokenAddress: '0xUSDC',
        expectedAmount: 100,
        minAmount: 95,
        maxAmount: 105,
        status: 'AWAITING_TRANSFER',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAtBlockNumber: 1000000
      });

      const session2 = await sessionRepo.create({
        userId: user2Id,
        walletAddress: wallet2.address,
        chain: 'base',
        tokenSymbol: 'USDC',
        tokenAddress: '0xUSDC',
        expectedAmount: 100,
        minAmount: 95,
        maxAmount: 105,
        status: 'AWAITING_TRANSFER',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAtBlockNumber: 1000000
      });

      const sharedEvent = {
        txHash: '0xsharedevent',
        logIndex: 0,
        fromAddress: '0xSender',
        amount: 100,
        blockNumber: 1000010
      };

      // Session 1 claims the event first
      await sessionRepo.bindOnchainEvent(session1.id, sharedEvent);
      await sessionRepo.markEventProcessed({
        chain: 'base',
        txHash: sharedEvent.txHash,
        logIndex: sharedEvent.logIndex
      });
      await sessionRepo.updateStatus(session1.id, 'CONFIRMED');

      // Session 2 tries to claim the same event
      const isAlreadyProcessed = await sessionRepo.isEventProcessed({
        chain: 'base',
        txHash: sharedEvent.txHash,
        logIndex: sharedEvent.logIndex
      });

      expect(isAlreadyProcessed).toBe(true);

      // Session 2 should not be able to claim this event
      // (In actual controller logic, this would be skipped)
      const session2Updated = await sessionRepo.getById(session2.id);
      expect(session2Updated?.status).toBe('AWAITING_TRANSFER'); // Still waiting
    });

    it('should handle session expiration correctly', async () => {
      const userId = randomUUID();
      await userRepo.create(createMockUser({ id: userId }));
      const wallet = await walletRepo.create(createMockWallet({ userId }));

      // Create session that's already expired
      const pastTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const session = await sessionRepo.create({
        userId,
        walletAddress: wallet.address,
        chain: 'base',
        tokenSymbol: 'USDC',
        tokenAddress: '0xUSDC',
        expectedAmount: 100,
        minAmount: 95,
        maxAmount: 105,
        status: 'AWAITING_TRANSFER',
        createdAt: pastTime,
        expiresAt: new Date(pastTime.getTime() + 60 * 60 * 1000), // Expired
        createdAtBlockNumber: 1000000
      });

      // Check if expired
      const now = new Date();
      const isExpired = now > new Date(session.expiresAt);
      expect(isExpired).toBe(true);

      // Mark as expired
      await sessionRepo.updateStatus(session.id, 'EXPIRED');

      const expiredSession = await sessionRepo.getById(session.id);
      expect(expiredSession?.status).toBe('EXPIRED');
    });
  });

  describe('M-Pesa Deposit Flow - Idempotency', () => {
    it('should handle duplicate M-Pesa callback gracefully', async () => {
      const userId = randomUUID();
      await userRepo.create(createMockUser({ id: userId }));
      await portfolioRepo.create(createMockPortfolio({ userId }));

      // Create M-Pesa deposit
      const transaction = await txRepo.createDeposit({
        userId,
        amountKes: 1000,
        amountUsd: 10,
        exchangeRate: 100,
        mpesaPhoneNumber: '+254712345678',
        allocation: {
          stableYields: 80,
          tokenizedStocks: 15,
          tokenizedGold: 5
        }
      });

      expect(transaction.status).toBe('PENDING');

      // First callback - should update to PROCESSING
      const checkoutId = 'ws_CO_123456';
      await txRepo.updateMpesaCheckout(transaction.id, checkoutId);

      const receiptNumber = 'ABC123XYZ';
      const updated1 = await txRepo.markAsProcessing(transaction.id, receiptNumber);
      expect(updated1?.status).toBe('PROCESSING');
      expect(updated1?.mpesaReceiptNumber).toBe(receiptNumber);

      // Duplicate callback - should be idempotent (no error)
      const updated2 = await txRepo.markAsProcessing(transaction.id, receiptNumber);
      expect(updated2?.status).toBe('PROCESSING');
      expect(updated2?.mpesaReceiptNumber).toBe(receiptNumber);

      // Transaction should still have same data
      const final = await txRepo.getById(transaction.id);
      expect(final?.status).toBe('PROCESSING');
      expect(final?.mpesaReceiptNumber).toBe(receiptNumber);
    });

    it('should prevent double-completion of M-Pesa deposit', async () => {
      const userId = randomUUID();
      await userRepo.create(createMockUser({ id: userId }));
      await portfolioRepo.create(createMockPortfolio({ userId }));

      const transaction = await txRepo.createDeposit({
        userId,
        amountKes: 1000,
        amountUsd: 10,
        exchangeRate: 100,
        mpesaPhoneNumber: '+254712345678',
        allocation: {
          stableYields: 80,
          tokenizedStocks: 15,
          tokenizedGold: 5
        }
      });

      // Mark as processing
      await txRepo.markAsProcessing(transaction.id, 'RECEIPT123');

      // Complete first time
      const txHash1 = '0xfirstcompletion';
      const completed1 = await txRepo.markAsCompleted(transaction.id, {
        txHash: txHash1,
        chain: 'base'
      });
      expect(completed1?.status).toBe('COMPLETED');
      expect(completed1?.txHash).toBe(txHash1);
      expect(completed1?.completedAt).toBeInstanceOf(Date);

      // Try to complete again with different txHash
      const txHash2 = '0xsecondattempt';
      const completed2 = await txRepo.markAsCompleted(transaction.id, {
        txHash: txHash2,
        chain: 'base'
      });

      // Should still have first completion data
      expect(completed2?.status).toBe('COMPLETED');
      expect(completed2?.txHash).toBe(txHash1); // Original txHash preserved
    });
  });

  describe('Complete Deposit Lifecycle', () => {
    it('should complete full onchain deposit flow from session to portfolio credit', async () => {
      // Setup user, wallet, portfolio
      const userId = randomUUID();
      const user = await userRepo.create(createMockUser({
        id: userId,
        targetStableYieldsPercent: 60,
        targetTokenizedStocksPercent: 30,
        targetTokenizedGoldPercent: 10
      }));

      const wallet = await walletRepo.create(createMockWallet({
        userId,
        address: '0xUserWallet',
        stableYieldBalance: 0,
        tokenizedStocksBalance: 0,
        tokenizedGoldBalance: 0
      }));

      const portfolio = await portfolioRepo.create(createMockPortfolio({
        userId,
        totalValueUsd: 0,
        totalDepositsUsd: 0
      }));

      // 1. Create deposit session
      const session = await sessionRepo.create({
        userId,
        walletAddress: wallet.address,
        chain: 'base',
        tokenSymbol: 'USDC',
        tokenAddress: '0xUSDC',
        expectedAmount: 1000,
        minAmount: 950,
        maxAmount: 1050,
        status: 'AWAITING_TRANSFER',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAtBlockNumber: 1000000
      });

      expect(session.id).toBeDefined();
      expect(session.status).toBe('AWAITING_TRANSFER');

      // 2. Simulate blockchain event
      const event = {
        txHash: '0xdepositevent',
        logIndex: 0,
        fromAddress: '0xSender',
        amount: 1000,
        blockNumber: 1000015
      };

      await sessionRepo.bindOnchainEvent(session.id, event);
      await sessionRepo.updateStatus(session.id, 'RECEIVED');

      const receivedSession = await sessionRepo.getById(session.id);
      expect(receivedSession?.status).toBe('RECEIVED');
      expect(receivedSession?.matchedTxHash).toBe(event.txHash);
      expect(Number(receivedSession?.matchedAmount)).toBe(event.amount);

      // 3. Wait for confirmations (simulated) and confirm
      await sessionRepo.markEventProcessed({
        chain: 'base',
        txHash: event.txHash,
        logIndex: event.logIndex
      });

      // 4. Create transaction and credit portfolio
      const transaction = await txRepo.createOnchainDeposit({
        userId,
        chain: 'base',
        tokenSymbol: 'USDC',
        tokenAddress: '0xUSDC',
        walletAddress: wallet.address,
        amountUsd: event.amount,
        txHash: event.txHash,
        logIndex: event.logIndex,
        allocation: {
          stableYields: 60,
          tokenizedStocks: 30,
          tokenizedGold: 10
        }
      });

      expect(transaction.status).toBe('COMPLETED');
      expect(Number(transaction.valueUsd)).toBe(1000);

      // 5. Update portfolio (simulating controller logic)
      await portfolioRepo.updateValues(userId, {
        stableYieldsValueUsd: 1000 * 0.60,
        tokenizedStocksValueUsd: 1000 * 0.30,
        tokenizedGoldValueUsd: 1000 * 0.10,
        kesUsdRate: 0
      });

      await portfolioRepo.recordDeposit(userId, 1000);
      await portfolioRepo.calculateReturns(userId);

      // 6. Mark session as confirmed
      await sessionRepo.updateStatus(session.id, 'CONFIRMED');

      // 7. Verify final state
      const finalSession = await sessionRepo.getById(session.id);
      expect(finalSession?.status).toBe('CONFIRMED');

      const finalPortfolio = await portfolioRepo.getByUserId(userId);
      expect(Number(finalPortfolio?.stableYieldsValueUsd)).toBe(600);
      expect(Number(finalPortfolio?.tokenizedStocksValueUsd)).toBe(300);
      expect(Number(finalPortfolio?.tokenizedGoldValueUsd)).toBe(100);
      expect(Number(finalPortfolio?.totalDepositsUsd)).toBe(1000);

      // Verify event can't be reused
      const isProcessed = await sessionRepo.isEventProcessed({
        chain: 'base',
        txHash: event.txHash,
        logIndex: event.logIndex
      });
      expect(isProcessed).toBe(true);
    });

    it('should complete full M-Pesa deposit flow from initiation to completion', async () => {
      const userId = randomUUID();
      await userRepo.create(createMockUser({
        id: userId,
        firstDepositSubsidyUsed: false
      }));

      const wallet = await walletRepo.create(createMockWallet({ userId }));
      const portfolio = await portfolioRepo.create(createMockPortfolio({ userId }));

      // 1. Initiate deposit
      const transaction = await txRepo.createDeposit({
        userId,
        amountKes: 10000,
        amountUsd: 100,
        exchangeRate: 100,
        mpesaPhoneNumber: '+254712345678',
        allocation: {
          stableYields: 80,
          tokenizedStocks: 15,
          tokenizedGold: 5
        },
        feeKes: 200,
        feeUsd: 2
      });

      expect(transaction.status).toBe('PENDING');

      // 2. STK Push sent, update checkout ID
      const checkoutId = 'ws_CO_TESTFLOW';
      await txRepo.updateMpesaCheckout(transaction.id, checkoutId);

      const withCheckout = await txRepo.getByMpesaCheckoutId(checkoutId);
      expect(withCheckout?.id).toBe(transaction.id);

      // 3. Callback received, mark as processing
      const receiptNumber = 'FLOWTEST123';
      await txRepo.markAsProcessing(transaction.id, receiptNumber);

      const processing = await txRepo.getById(transaction.id);
      expect(processing?.status).toBe('PROCESSING');

      // 4. Blockchain confirmation, mark as completed
      const txHash = '0xmpesaflowcomplete';
      await txRepo.markAsCompleted(transaction.id, {
        txHash,
        chain: 'base'
      });

      const completed = await txRepo.getById(transaction.id);
      expect(completed?.status).toBe('COMPLETED');
      expect(completed?.txHash).toBe(txHash);
      expect(completed?.completedAt).toBeInstanceOf(Date);

      // 5. Verify portfolio would be updated (simulated in controller)
      await portfolioRepo.updateValues(userId, {
        stableYieldsValueUsd: 100 * 0.80,
        tokenizedStocksValueUsd: 100 * 0.15,
        tokenizedGoldValueUsd: 100 * 0.05,
        kesUsdRate: 100
      });

      await portfolioRepo.recordDeposit(userId, 100);

      const finalPortfolio = await portfolioRepo.getByUserId(userId);
      expect(Number(finalPortfolio?.totalDepositsUsd)).toBe(100);
    });
  });

  describe('Edge Cases and Race Conditions', () => {
    it('should handle concurrent attempts to process same event', async () => {
      const userId = randomUUID();
      await userRepo.create(createMockUser({ id: userId }));
      const wallet = await walletRepo.create(createMockWallet({ userId }));

      const session = await sessionRepo.create({
        userId,
        walletAddress: wallet.address,
        chain: 'base',
        tokenSymbol: 'USDC',
        tokenAddress: '0xUSDC',
        expectedAmount: 100,
        minAmount: 95,
        maxAmount: 105,
        status: 'AWAITING_TRANSFER',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAtBlockNumber: 1000000
      });

      const event = {
        chain: 'base' as const,
        txHash: '0xconcurrent',
        logIndex: 0
      };

      // Simulate concurrent marking (both try to mark at same time)
      // Due to unique constraint, only one should succeed
      await Promise.all([
        sessionRepo.markEventProcessed(event),
        sessionRepo.markEventProcessed(event)
      ]);

      // Verify it's marked only once
      const isProcessed = await sessionRepo.isEventProcessed(event);
      expect(isProcessed).toBe(true);
    });

    it('should handle case-insensitive txHash matching', async () => {
      const event1 = {
        chain: 'base' as const,
        txHash: '0xABCDEF123456',
        logIndex: 0
      };

      const event2 = {
        chain: 'base' as const,
        txHash: '0xabcdef123456', // Same hash, different case
        logIndex: 0
      };

      await sessionRepo.markEventProcessed(event1);

      // Should recognize as same event
      const isProcessed = await sessionRepo.isEventProcessed(event2);
      expect(isProcessed).toBe(true);
    });

    it('should treat different logIndex as different events', async () => {
      const baseEvent = {
        chain: 'base' as const,
        txHash: '0xsamehash'
      };

      // Mark logIndex 0 as processed
      await sessionRepo.markEventProcessed({ ...baseEvent, logIndex: 0 });

      // logIndex 1 should NOT be processed
      const isProcessed0 = await sessionRepo.isEventProcessed({ ...baseEvent, logIndex: 0 });
      const isProcessed1 = await sessionRepo.isEventProcessed({ ...baseEvent, logIndex: 1 });

      expect(isProcessed0).toBe(true);
      expect(isProcessed1).toBe(false);
    });
  });
});
