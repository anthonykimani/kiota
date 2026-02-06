/**
 * TransactionRepository Unit Tests
 */

import { TransactionRepository } from '../../../repositories/transaction.repo';
import { initTestDatabase, closeTestDatabase, clearDatabase } from '../../utils/test-db.util';
import { createMockTransaction } from '../../utils/fixtures.util';
import { randomUUID } from 'crypto';

describe('TransactionRepository', () => {
  let repository: TransactionRepository;

  beforeAll(async () => {
    await initTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    repository = new TransactionRepository();
  });

  describe('createOnchainDeposit', () => {
    const baseDepositData = {
      userId: randomUUID(),
      chain: 'base',
      tokenSymbol: 'USDC',
      tokenAddress: '0xUSDCAddress',
      walletAddress: '0xWalletAddress',
      amountUsd: 100,
      txHash: '0xTransactionHash',
      logIndex: 0,
      allocation: {
        stableYields: 80,
        bluechipCrypto: 15,
        tokenizedGold: 5
      }
    };

    it('should create a new onchain deposit transaction', async () => {
      const transaction = await repository.createOnchainDeposit(baseDepositData);

      expect(transaction).toBeDefined();
      expect(transaction.id).toBeDefined();
      expect(transaction.userId).toBe(randomUUID());
      expect(transaction.type).toBe('DEPOSIT');
      expect(transaction.status).toBe('COMPLETED');
      expect(transaction.chain).toBe('base');
      expect(transaction.tokenSymbol).toBe('USDC');
      expect(transaction.txHash).toBe('0xtransactionhash'); // Should be lowercased
      expect(transaction.logIndex).toBe(0);
      expect(Number(transaction.valueUsd)).toBe(100);
    });

    it('should set correct source and destination assets', async () => {
      const transaction = await repository.createOnchainDeposit(baseDepositData);

      expect(transaction.sourceAsset).toBe('USDC');
      expect(Number(transaction.sourceAmount)).toBe(100);
      expect(transaction.destinationAsset).toBe('USDC');
      expect(Number(transaction.destinationAmount)).toBe(100);
    });

    it('should store allocation data', async () => {
      const transaction = await repository.createOnchainDeposit(baseDepositData);

      expect(transaction.allocation).toEqual({
        stableYields: 80,
        bluechipCrypto: 15,
        tokenizedGold: 5
      });
    });

    it('should set completedAt timestamp', async () => {
      const transaction = await repository.createOnchainDeposit(baseDepositData);

      expect(transaction.completedAt).toBeInstanceOf(Date);
      expect(transaction.completedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should lowercase txHash', async () => {
      const data = {
        ...baseDepositData,
        txHash: '0xABCDEF123456'
      };

      const transaction = await repository.createOnchainDeposit(data);

      expect(transaction.txHash).toBe('0xabcdef123456');
    });

    describe('Idempotency', () => {
      it('should return existing transaction if already processed', async () => {
        // Create first transaction
        const first = await repository.createOnchainDeposit(baseDepositData);

        // Try to create again with same (chain, txHash, logIndex)
        const second = await repository.createOnchainDeposit(baseDepositData);

        // Should return the same transaction
        expect(second.id).toBe(first.id);
        expect(second.txHash).toBe(first.txHash);
      });

      it('should create different transactions for different logIndex', async () => {
        const first = await repository.createOnchainDeposit(baseDepositData);

        const secondData = {
          ...baseDepositData,
          logIndex: 1 // Different log index
        };

        const second = await repository.createOnchainDeposit(secondData);

        // Should create new transaction
        expect(second.id).not.toBe(first.id);
        expect(second.logIndex).toBe(1);
      });

      it('should create different transactions for different txHash', async () => {
        const first = await repository.createOnchainDeposit(baseDepositData);

        const secondData = {
          ...baseDepositData,
          txHash: '0xDifferentHash'
        };

        const second = await repository.createOnchainDeposit(secondData);

        // Should create new transaction
        expect(second.id).not.toBe(first.id);
        expect(second.txHash).toBe('0xdifferenthash');
      });

      it('should create different transactions for different chain', async () => {
        const first = await repository.createOnchainDeposit(baseDepositData);

        const secondData = {
          ...baseDepositData,
          chain: 'ethereum'
        };

        const second = await repository.createOnchainDeposit(secondData);

        // Should create new transaction
        expect(second.id).not.toBe(first.id);
        expect(second.chain).toBe('ethereum');
      });
    });
  });

  describe('getAllocatedUsdcUsd', () => {
    const userId = randomUUID();

    it('should return 0 for user with no deposits', async () => {
      const allocated = await repository.getAllocatedUsdcUsd(userId);

      expect(Number(allocated)).toBe(0);
    });

    it('should sum completed USDC deposits', async () => {
      // Create 3 USDC deposits
      await repository.createOnchainDeposit({
        userId,
        chain: 'base',
        tokenSymbol: 'USDC',
        tokenAddress: '0xUSDC',
        walletAddress: '0xWallet',
        amountUsd: 100,
        txHash: '0xHash1',
        logIndex: 0,
        allocation: { stableYields: 80, bluechipCrypto: 15, tokenizedGold: 5 }
      });

      await repository.createOnchainDeposit({
        userId,
        chain: 'base',
        tokenSymbol: 'USDC',
        tokenAddress: '0xUSDC',
        walletAddress: '0xWallet',
        amountUsd: 50,
        txHash: '0xHash2',
        logIndex: 0,
        allocation: { stableYields: 80, bluechipCrypto: 15, tokenizedGold: 5 }
      });

      await repository.createOnchainDeposit({
        userId,
        chain: 'base',
        tokenSymbol: 'USDC',
        tokenAddress: '0xUSDC',
        walletAddress: '0xWallet',
        amountUsd: 25,
        txHash: '0xHash3',
        logIndex: 0,
        allocation: { stableYields: 80, bluechipCrypto: 15, tokenizedGold: 5 }
      });

      const allocated = await repository.getAllocatedUsdcUsd(userId);

      expect(Number(allocated)).toBe(175);
    });

    it('should only count USDC deposits on Base chain', async () => {
      await repository.createOnchainDeposit({
        userId,
        chain: 'base',
        tokenSymbol: 'USDC',
        tokenAddress: '0xUSDC',
        walletAddress: '0xWallet',
        amountUsd: 100,
        txHash: '0xHash1',
        logIndex: 0,
        allocation: { stableYields: 80, bluechipCrypto: 15, tokenizedGold: 5 }
      });

      // Create on different chain
      await repository.createOnchainDeposit({
        userId,
        chain: 'ethereum',
        tokenSymbol: 'USDC',
        tokenAddress: '0xUSDC',
        walletAddress: '0xWallet',
        amountUsd: 50,
        txHash: '0xHash2',
        logIndex: 0,
        allocation: { stableYields: 80, bluechipCrypto: 15, tokenizedGold: 5 }
      });

      const allocated = await repository.getAllocatedUsdcUsd(userId);

      // Should only count Base chain
      expect(Number(allocated)).toBe(100);
    });

    it('should only count completed transactions', async () => {
      // Create completed deposit
      await repository.createOnchainDeposit({
        userId,
        chain: 'base',
        tokenSymbol: 'USDC',
        tokenAddress: '0xUSDC',
        walletAddress: '0xWallet',
        amountUsd: 100,
        txHash: '0xHash1',
        logIndex: 0,
        allocation: { stableYields: 80, bluechipCrypto: 15, tokenizedGold: 5 }
      });

      // Create pending M-Pesa deposit (not onchain yet)
      await repository.createDeposit({
        userId,
        amountKes: 1000,
        amountUsd: 10,
        exchangeRate: 100,
        mpesaPhoneNumber: '+254712345678',
        allocation: { stableYields: 80, bluechipCrypto: 15, tokenizedGold: 5 }
      });

      const allocated = await repository.getAllocatedUsdcUsd(userId);

      // Should only count completed onchain deposit
      expect(Number(allocated)).toBe(100);
    });

    it('should isolate amounts by user', async () => {
      // User 1 deposits
      await repository.createOnchainDeposit({
        userId: randomUUID(),
        chain: 'base',
        tokenSymbol: 'USDC',
        tokenAddress: '0xUSDC',
        walletAddress: '0xWallet1',
        amountUsd: 100,
        txHash: '0xHash1',
        logIndex: 0,
        allocation: { stableYields: 80, bluechipCrypto: 15, tokenizedGold: 5 }
      });

      // User 2 deposits
      await repository.createOnchainDeposit({
        userId: randomUUID(),
        chain: 'base',
        tokenSymbol: 'USDC',
        tokenAddress: '0xUSDC',
        walletAddress: '0xWallet2',
        amountUsd: 50,
        txHash: '0xHash2',
        logIndex: 0,
        allocation: { stableYields: 80, bluechipCrypto: 15, tokenizedGold: 5 }
      });

      const allocated1 = await repository.getAllocatedUsdcUsd(randomUUID());
      const allocated2 = await repository.getAllocatedUsdcUsd(randomUUID());

      expect(Number(allocated1)).toBe(100);
      expect(Number(allocated2)).toBe(50);
    });
  });

  describe('M-Pesa deposit methods', () => {
    it('should create M-Pesa deposit', async () => {
      const transaction = await repository.createDeposit({
        userId: randomUUID(),
        amountKes: 1000,
        amountUsd: 10,
        exchangeRate: 100,
        mpesaPhoneNumber: '+254712345678',
        allocation: {
          stableYields: 80,
          bluechipCrypto: 15,
          tokenizedGold: 5
        },
        feeKes: 20,
        feeUsd: 0.2
      });

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe('DEPOSIT');
      expect(transaction.status).toBe('PENDING');
      expect(transaction.sourceAsset).toBe('KES');
      expect(Number(transaction.sourceAmount)).toBe(1000);
      expect(transaction.destinationAsset).toBe('USDC');
      expect(Number(transaction.destinationAmount)).toBe(10);
      expect(transaction.paymentMethod).toBe('MPESA');
    });

    it('should update M-Pesa checkout ID', async () => {
      const transaction = await repository.createDeposit({
        userId: randomUUID(),
        amountKes: 1000,
        amountUsd: 10,
        exchangeRate: 100,
        mpesaPhoneNumber: '+254712345678',
        allocation: { stableYields: 80, bluechipCrypto: 15, tokenizedGold: 5 }
      });

      const updated = await repository.updateMpesaCheckout(
        transaction.id,
        'ws_CO_123456789'
      );

      expect(updated).toBeDefined();
      expect(updated?.mpesaCheckoutRequestId).toBe('ws_CO_123456789');
    });

    it('should mark as processing with receipt number', async () => {
      const transaction = await repository.createDeposit({
        userId: randomUUID(),
        amountKes: 1000,
        amountUsd: 10,
        exchangeRate: 100,
        mpesaPhoneNumber: '+254712345678',
        allocation: { stableYields: 80, bluechipCrypto: 15, tokenizedGold: 5 }
      });

      const updated = await repository.markAsProcessing(
        transaction.id,
        'ABC123XYZ'
      );

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('PROCESSING');
      expect(updated?.mpesaReceiptNumber).toBe('ABC123XYZ');
    });

    it('should mark as completed with blockchain data', async () => {
      const transaction = await repository.createDeposit({
        userId: randomUUID(),
        amountKes: 1000,
        amountUsd: 10,
        exchangeRate: 100,
        mpesaPhoneNumber: '+254712345678',
        allocation: { stableYields: 80, bluechipCrypto: 15, tokenizedGold: 5 }
      });

      const updated = await repository.markAsCompleted(transaction.id, {
        txHash: '0xBlockchainHash',
        chain: 'base'
      });

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('COMPLETED');
      expect(updated?.txHash).toBe('0xBlockchainHash');
      expect(updated?.chain).toBe('base');
      expect(updated?.completedAt).toBeInstanceOf(Date);
    });

    it('should mark as failed with reason', async () => {
      const transaction = await repository.createDeposit({
        userId: randomUUID(),
        amountKes: 1000,
        amountUsd: 10,
        exchangeRate: 100,
        mpesaPhoneNumber: '+254712345678',
        allocation: { stableYields: 80, bluechipCrypto: 15, tokenizedGold: 5 }
      });

      const updated = await repository.markAsFailed(
        transaction.id,
        'Payment cancelled by user'
      );

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('FAILED');
      expect(updated?.failureReason).toBe('Payment cancelled by user');
      expect(updated?.failedAt).toBeInstanceOf(Date);
    });

    it('should get transaction by M-Pesa checkout ID', async () => {
      const transaction = await repository.createDeposit({
        userId: randomUUID(),
        amountKes: 1000,
        amountUsd: 10,
        exchangeRate: 100,
        mpesaPhoneNumber: '+254712345678',
        allocation: { stableYields: 80, bluechipCrypto: 15, tokenizedGold: 5 }
      });

      await repository.updateMpesaCheckout(transaction.id, 'ws_CO_FIND_ME');

      const found = await repository.getByMpesaCheckoutId('ws_CO_FIND_ME');

      expect(found).toBeDefined();
      expect(found?.id).toBe(transaction.id);
      expect(found?.mpesaCheckoutRequestId).toBe('ws_CO_FIND_ME');
    });
  });

  describe('getById', () => {
    it('should retrieve transaction by ID', async () => {
      const created = await repository.createOnchainDeposit({
        userId: randomUUID(),
        chain: 'base',
        tokenSymbol: 'USDC',
        tokenAddress: '0xUSDC',
        walletAddress: '0xWallet',
        amountUsd: 100,
        txHash: '0xHash',
        logIndex: 0,
        allocation: { stableYields: 80, bluechipCrypto: 15, tokenizedGold: 5 }
      });

      const retrieved = await repository.getById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.valueUsd).toBe(100);
    });

    it('should return null for non-existent ID', async () => {
      const retrieved = await repository.getById(randomUUID());

      expect(retrieved).toBeNull();
    });
  });
});
