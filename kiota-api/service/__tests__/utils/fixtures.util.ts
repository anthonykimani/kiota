/**
 * Test Fixtures
 * Factory functions for creating test data
 */

import { User } from '../../models/user.entity';
import { Wallet } from '../../models/wallet.entity';
import { Transaction } from '../../models/transaction.entity';
import { Portfolio } from '../../models/portfolio.entity';
import { DepositSession } from '../../models/deposit-session.entity';
import { OnchainProcessedEvent } from '../../models/onchain-processed-event.entity';
import { randomUUID } from 'crypto';

/**
 * Create mock user
 */
export function createMockUser(overrides?: Partial<User>): Partial<User> {
  return {
    id: randomUUID(),
    phoneNumber: '+254712345678',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    targetStableYieldsPercent: 80,
    targetTokenizedStocksPercent: 15,
    targetTokenizedGoldPercent: 5,
    targetBlueChipCryptoPercent: 0,
    firstDepositSubsidyUsed: false,
    hasCompletedOnboarding: true,
    hasCompletedQuiz: true,
    isActive: true,
    ...overrides
  };
}

/**
 * Create mock wallet
 */
export function createMockWallet(overrides?: Partial<Wallet>): Partial<Wallet> {
  return {
    id: randomUUID(),
    userId: randomUUID(),
    address: '0x' + '1'.repeat(40), // Mock Ethereum address
    chain: 'base',
    stableYieldBalance: 0,
    tokenizedStocksBalance: 0,
    tokenizedGoldBalance: 0,
    blueChipCryptoBalance: 0,
    gasBalance: 0,
    ...overrides
  };
}

/**
 * Create mock transaction
 */
export function createMockTransaction(overrides?: Partial<Transaction>): Partial<Transaction> {
  return {
    id: randomUUID(),
    userId: randomUUID(),
    type: 'DEPOSIT' as any,
    status: 'PENDING' as any,
    sourceAsset: 'KES' as any,
    sourceAmount: 1000,
    destinationAsset: 'USDC' as any,
    destinationAmount: 10,
    valueUsd: 10,
    feeAmount: 20,
    feeUsd: 0.2,
    feePercent: 2.0,
    feeSubsidized: false,
    subsidyAmount: 0,
    allocation: {
      stableYields: 80,
      tokenizedStocks: 15,
      tokenizedGold: 5
    },
    ...overrides
  };
}

/**
 * Create mock portfolio
 */
export function createMockPortfolio(overrides?: Partial<Portfolio>): Partial<Portfolio> {
  return {
    id: randomUUID(),
    userId: randomUUID(),
    totalValueUsd: 0,
    stableYieldsValueUsd: 0,
    tokenizedStocksValueUsd: 0,
    tokenizedGoldValueUsd: 0,
    blueChipCryptoValueUsd: 0,
    totalDepositsUsd: 0,
    totalWithdrawalsUsd: 0,
    allTimeReturnUsd: 0,
    allTimeReturnPercent: 0,
    currentReturnUsd: 0,
    currentReturnPercent: 0,
    ...overrides
  };
}

/**
 * Create mock deposit session
 */
export function createMockDepositSession(overrides?: Partial<DepositSession>): Partial<DepositSession> {
  return {
    id: randomUUID(),
    userId: randomUUID(),
    walletAddress: '0x' + '1'.repeat(40),
    chain: 'base',
    tokenSymbol: 'USDC',
    tokenAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    expectedAmount: 100,
    minAmount: 95,
    maxAmount: 105,
    status: 'AWAITING_TRANSFER',
    createdAtBlockNumber: 1000000,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    ...overrides
  };
}

/**
 * Create mock onchain processed event
 */
export function createMockOnchainProcessedEvent(overrides?: Partial<OnchainProcessedEvent>): Partial<OnchainProcessedEvent> {
  return {
    id: randomUUID(),
    chain: 'base',
    txHash: '0x' + 'a'.repeat(64),
    logIndex: 0,
    processedAt: new Date(),
    ...overrides
  };
}

/**
 * Create mock blockchain transfer log
 */
export function createMockTransferLog(overrides?: any) {
  return {
    address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    topics: [],
    data: '0x',
    blockNumber: BigInt(1000000),
    transactionHash: '0x' + 'a'.repeat(64),
    transactionIndex: 0,
    blockHash: '0x' + 'b'.repeat(64),
    logIndex: 0,
    removed: false,
    args: {
      from: '0x' + '2'.repeat(40),
      to: '0x' + '1'.repeat(40),
      value: BigInt(100_000000) // 100 USDC (6 decimals)
    },
    ...overrides
  };
}

/**
 * Create mock M-Pesa callback data
 */
export function createMockMpesaCallback(overrides?: any) {
  return {
    CheckoutRequestID: 'ws_CO_' + Date.now(),
    ResultCode: 0,
    ResultDesc: 'The service request is processed successfully.',
    CallbackMetadata: {
      MpesaReceiptNumber: 'ABC123XYZ',
      Amount: 1000,
      TransactionDate: Date.now(),
      PhoneNumber: '254712345678'
    },
    ...overrides
  };
}

/**
 * Wait for a specific amount of time (useful for async tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
