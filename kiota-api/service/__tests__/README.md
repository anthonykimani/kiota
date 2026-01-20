# Test Suite Documentation

## Overview

Comprehensive test suite for the Kiota API, covering repositories, controllers, queue processors, and integration tests.

## Test Structure

```
service/__tests__/
├── setup.ts                    # Global test setup
├── smoke.test.ts              # Basic verification tests
├── utils/
│   ├── test-db.util.ts        # Database test utilities
│   ├── fixtures.util.ts       # Mock data factories
│   └── mocks.util.ts          # Mock external dependencies
├── unit/
│   ├── repositories/          # Repository unit tests
│   │   ├── deposit-session.repo.test.ts
│   │   └── transaction.repo.test.ts
│   ├── controllers/           # Controller unit tests
│   └── processors/            # Queue processor unit tests
└── integration/               # Integration tests
    └── deposit-flow.test.ts   # End-to-end deposit flows
```

## Running Tests

### All Tests
```bash
npm test
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Specific Test File
```bash
npm test -- deposit-session.repo.test.ts
```

### Specific Test Suite
```bash
npm test -- --testNamePattern="createOnchainDeposit"
```

## Test Database Setup

### Prerequisites

1. **Create Test Database**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create test database
CREATE DATABASE kiota_test;

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE kiota_test TO postgres;
```

2. **Configure Environment**

Ensure `.env.test` exists with:
```env
DB_NAME='kiota_test'
DB_HOST='localhost'
DB_USER='postgres'
DB_PASSWORD='admin'
```

3. **Automatic Setup**

Tests automatically:
- Initialize database connection
- Create tables from entities
- Clear data between tests
- Close connections after tests

## Test Utilities

### Database Utilities (`test-db.util.ts`)

```typescript
import { initTestDatabase, closeTestDatabase, clearDatabase } from '../utils/test-db.util';

beforeAll(async () => {
  await initTestDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
});

beforeEach(async () => {
  await clearDatabase(); // Ensures test isolation
});
```

### Fixtures (`fixtures.util.ts`)

Factory functions for creating mock data:

```typescript
import { createMockUser, createMockTransaction } from '../utils/fixtures.util';

const user = createMockUser({ email: 'custom@example.com' });
const transaction = createMockTransaction({ amountUsd: 100 });
```

Available factories:
- `createMockUser()`
- `createMockWallet()`
- `createMockTransaction()`
- `createMockPortfolio()`
- `createMockDepositSession()`
- `createMockOnchainProcessedEvent()`
- `createMockTransferLog()`
- `createMockMpesaCallback()`

### Mocks (`mocks.util.ts`)

Mocking external dependencies:

```typescript
import { createMockJob, createMockViemClient, createMockQueue } from '../utils/mocks.util';

// Mock Bull job
const job = createMockJob({ transactionId: '123' });

// Mock blockchain client
const viemClient = createMockViemClient();

// Mock Express request/response
const req = createMockRequest({ body: { amount: 100 } });
const res = createMockResponse();
```

## Test Coverage

### Current Coverage

Run `npm run test:coverage` to see detailed coverage report.

### Coverage Goals

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

Coverage reports are generated in `/coverage` directory:
- `coverage/index.html` - Visual HTML report
- `coverage/lcov.info` - LCOV format for CI/CD

## Repository Tests

### DepositSessionRepository Tests

**File**: `unit/repositories/deposit-session.repo.test.ts`

**Test Coverage:**
- ✅ Create deposit sessions
- ✅ Retrieve sessions by ID
- ✅ Update session status
- ✅ Bind blockchain events to sessions
- ✅ Check if events are processed
- ✅ Mark events as processed (idempotency)
- ✅ Full deposit lifecycle integration
- ✅ Prevent double-processing of blockchain events

**Key Test Cases:**
```typescript
describe('DepositSessionRepository', () => {
  it('should create a new deposit session')
  it('should update session status')
  it('should bind blockchain event to session')
  it('should prevent double-processing of events')
  // ... 15+ test cases
});
```

### TransactionRepository Tests

**File**: `unit/repositories/transaction.repo.test.ts`

**Test Coverage:**
- ✅ Create onchain deposits
- ✅ Idempotency (same txHash/logIndex returns existing)
- ✅ Calculate allocated USDC
- ✅ M-Pesa deposit lifecycle
- ✅ Status transitions (PENDING → PROCESSING → COMPLETED)
- ✅ Transaction retrieval by ID and checkout ID

**Key Test Cases:**
```typescript
describe('TransactionRepository', () => {
  describe('createOnchainDeposit', () => {
    it('should create a new onchain deposit transaction')
    it('should return existing transaction if already processed')
    it('should lowercase txHash')
    // ... 20+ test cases
  });

  describe('getAllocatedUsdcUsd', () => {
    it('should sum completed USDC deposits')
    it('should only count USDC on Base chain')
    // ... 5+ test cases
  });
});
```

## Writing New Tests

### Unit Test Template

```typescript
import { initTestDatabase, closeTestDatabase, clearDatabase } from '../../utils/test-db.util';

describe('YourComponent', () => {
  beforeAll(async () => {
    await initTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it('should do something', async () => {
    // Arrange
    const input = {};

    // Act
    const result = await yourFunction(input);

    // Assert
    expect(result).toBeDefined();
  });
});
```

### Integration Test Template

```typescript
import request from 'supertest';
import { app } from '../../../index';
import { initTestDatabase, closeTestDatabase } from '../../utils/test-db.util';

describe('Deposit Flow Integration', () => {
  beforeAll(async () => {
    await initTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  it('should complete full M-Pesa deposit flow', async () => {
    // 1. Initiate deposit
    const initiateRes = await request(app)
      .post('/api/v1/deposit/initiate')
      .send({ amountKes: 1000 });

    expect(initiateRes.status).toBe(200);

    // 2. Trigger M-Pesa push
    // 3. Simulate callback
    // 4. Check status
  });
});
```

## Best Practices

### 1. Test Isolation

Each test should be independent:
```typescript
beforeEach(async () => {
  await clearDatabase(); // Clean slate for each test
});
```

### 2. Use Fixtures

Don't create mock data inline:
```typescript
// ❌ Bad
const user = { id: '123', email: 'test@example.com', ... };

// ✅ Good
const user = createMockUser({ email: 'test@example.com' });
```

### 3. Test Behavior, Not Implementation

```typescript
// ❌ Bad - tests implementation details
expect(repository.query).toHaveBeenCalledWith('SELECT * FROM...');

// ✅ Good - tests behavior
const session = await repository.getById('123');
expect(session.id).toBe('123');
```

### 4. Descriptive Test Names

```typescript
// ❌ Bad
it('works')

// ✅ Good
it('should return existing transaction if already processed (idempotency)')
```

### 5. Arrange-Act-Assert Pattern

```typescript
it('should create deposit session', async () => {
  // Arrange
  const data = createMockDepositSession();

  // Act
  const session = await repository.create(data);

  // Assert
  expect(session.id).toBeDefined();
});
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: admin
          POSTGRES_DB: kiota_test
        ports:
          - 5432:5432

      redis:
        image: redis:alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci
      - run: npm test
      - run: npm run test:coverage

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
```

## Debugging Tests

### Run Single Test in Debug Mode

```bash
# Add debugger statement in test
it('should do something', async () => {
  debugger; // Execution will pause here
  const result = await yourFunction();
});

# Run with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand --testNamePattern="should do something"
```

### View Test Output

```bash
# Verbose mode
npm test -- --verbose

# Show console.log output
npm test -- --silent=false
```

### Debug Specific Test

```bash
# Run only failing tests
npm test -- --onlyFailures

# Update snapshots
npm test -- --updateSnapshot
```

## Common Issues

### 1. Database Connection Issues

**Problem**: Tests fail with "Database not initialized"

**Solution**:
```typescript
beforeAll(async () => {
  await initTestDatabase(); // Must be called before tests
});
```

### 2. Test Timeout

**Problem**: Tests timeout after 5 seconds

**Solution**:
```typescript
// Increase timeout for specific test
it('should process long operation', async () => {
  // test code
}, 15000); // 15 second timeout

// Or set in jest.config.js
testTimeout: 10000
```

### 3. Flaky Tests

**Problem**: Tests pass/fail randomly

**Solution**:
- Ensure test isolation with `clearDatabase()`
- Avoid shared state between tests
- Use `await` for all async operations
- Mock external dependencies

### 4. Port Already in Use

**Problem**: "Port 3004 already in use"

**Solution**:
```bash
# Kill process using port
lsof -ti:3004 | xargs kill -9

# Or use different port in .env.test
PORT=3005
```

## Extending Tests

### Adding New Test Suites

1. Create test file in appropriate directory:
   - Unit tests: `__tests__/unit/`
   - Integration tests: `__tests__/integration/`

2. Follow naming convention: `*.test.ts` or `*.spec.ts`

3. Import necessary utilities:
```typescript
import { initTestDatabase, closeTestDatabase, clearDatabase } from '../utils/test-db.util';
import { createMock... } from '../utils/fixtures.util';
```

4. Run tests:
```bash
npm test -- your-new-test.test.ts
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://testingjavascript.com/)
- [TypeORM Testing](https://typeorm.io/#/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

## Support

For test-related issues:
1. Check this documentation
2. Review existing test examples
3. Run tests in verbose mode: `npm test -- --verbose`
4. Check test coverage: `npm run test:coverage`
