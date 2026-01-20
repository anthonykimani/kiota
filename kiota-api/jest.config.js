module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Test environment (node for backend testing)
  testEnvironment: 'node',

  // Root directory for tests
  roots: ['<rootDir>/service'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/*.test.ts',
    '**/*.spec.ts'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'service/**/*.ts',
    '!service/**/*.d.ts',
    '!service/**/index.ts',
    '!service/__tests__/**',
    '!service/jobs/worker.ts', // Exclude worker entry point
    '!service/index.ts' // Exclude main server entry point
  ],

  // Coverage threshold (optional - adjust as needed)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Module path aliases (match your tsconfig paths if any)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/service/$1'
  },

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/service/__tests__/setup.ts'],

  // Transform files with ts-jest
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        isolatedModules: true
      }
    }]
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.git/'
  ],

  // Verbose output
  verbose: true,

  // Timeout for tests (5 seconds default, increase for integration tests)
  testTimeout: 10000,

  // Run tests serially to avoid database conflicts
  maxWorkers: 1,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Coverage output directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html']
};
