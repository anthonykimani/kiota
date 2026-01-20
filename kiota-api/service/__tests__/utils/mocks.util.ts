/**
 * Mock Utilities
 * Mocks for external dependencies
 */

import { Job } from 'bull';

/**
 * Create mock Bull job
 */
export function createMockJob<T = any>(data: T, overrides?: Partial<Job<T>>): jest.Mocked<Job<T>> {
  return {
    id: '1',
    data,
    opts: {},
    progress: jest.fn(),
    log: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    retry: jest.fn(),
    discard: jest.fn(),
    promote: jest.fn(),
    finished: jest.fn(),
    moveToCompleted: jest.fn(),
    moveToFailed: jest.fn(),
    ...overrides
  } as any;
}

/**
 * Create mock Viem public client
 */
export function createMockViemClient() {
  return {
    getBlockNumber: jest.fn().mockResolvedValue(BigInt(1000000)),
    getBlock: jest.fn().mockResolvedValue({
      number: BigInt(1000000),
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
      hash: '0x' + 'b'.repeat(64)
    }),
    getLogs: jest.fn().mockResolvedValue([]),
    readContract: jest.fn(),
    getTransaction: jest.fn(),
    getTransactionReceipt: jest.fn(),
    waitForTransactionReceipt: jest.fn()
  };
}

/**
 * Mock Bull queue
 */
export function createMockQueue() {
  return {
    add: jest.fn().mockResolvedValue({ id: '1', data: {} }),
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    clean: jest.fn().mockResolvedValue([]),
    empty: jest.fn().mockResolvedValue(undefined),
    getJobs: jest.fn().mockResolvedValue([]),
    getJob: jest.fn().mockResolvedValue(null),
    isReady: jest.fn().mockResolvedValue(true),
    whenCurrentJobsFinished: jest.fn().mockResolvedValue(undefined)
  };
}

/**
 * Mock Express request
 */
export function createMockRequest(overrides?: any) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    userId: null, // Set by auth middleware
    ...overrides
  };
}

/**
 * Mock Express response
 */
export function createMockResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
}

/**
 * Mock Express next function
 */
export function createMockNext() {
  return jest.fn();
}
