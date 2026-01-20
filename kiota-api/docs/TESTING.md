# Testing Guide - Quick Start

## 🚀 Quick Start

### 1. Create Test Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create test database
CREATE DATABASE kiota_test;

# Exit
\q
```

### 2. Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode (for development)
npm run test:watch
```

## 📊 What's Tested

### ✅ Repository Tests (35+ test cases)

**DepositSessionRepository** (15 tests)
- Create/retrieve deposit sessions
- Update session status
- Bind blockchain events
- Check event processing (idempotency)
- Full deposit lifecycle
- Double-processing prevention

**TransactionRepository** (20+ tests)
- Create onchain deposits
- Idempotency guarantees
- Calculate allocated USDC
- M-Pesa deposit lifecycle
- Status transitions
- Transaction retrieval

## 📁 Test Files

```
service/__tests__/
├── smoke.test.ts                              ✅ 4 tests
├── unit/repositories/
│   ├── deposit-session.repo.test.ts          ✅ 15 tests
│   └── transaction.repo.test.ts              ✅ 20+ tests
└── utils/
    ├── test-db.util.ts        # Database helpers
    ├── fixtures.util.ts       # Mock data factories
    └── mocks.util.ts          # External dependency mocks
```

## 🔧 Test Commands

```bash
# All tests
npm test

# With coverage report
npm run test:coverage

# Watch mode
npm run test:watch

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Specific test file
npm test -- deposit-session.repo.test.ts

# Specific test suite
npm test -- --testNamePattern="idempotency"
```

## 📈 Coverage Goals

- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

View coverage report:
```bash
npm run test:coverage
open coverage/index.html
```

## 🛠️ Test Utilities

### Mock Data Factories

```typescript
import {
  createMockUser,
  createMockTransaction,
  createMockDepositSession
} from './utils/fixtures.util';

const user = createMockUser({ email: 'test@example.com' });
const tx = createMockTransaction({ amountUsd: 100 });
```

### Database Utilities

```typescript
import {
  initTestDatabase,
  closeTestDatabase,
  clearDatabase
} from './utils/test-db.util';

beforeAll(() => initTestDatabase());
afterAll(() => closeTestDatabase());
beforeEach(() => clearDatabase());
```

## 📚 Full Documentation

See `service/__tests__/README.md` for:
- Complete test suite documentation
- Writing new tests guide
- Best practices
- Debugging tips
- CI/CD integration examples

## ✨ What's Next

To expand test coverage, add:

1. **Controller Tests**
   - `controllers/deposit.controller.test.ts`
   - Test M-Pesa and onchain endpoints
   - Mock external services (viem, queues)

2. **Processor Tests**
   - `processors/deposit-completion.processor.test.ts`
   - `processors/onchain-deposit-confirmation.processor.test.ts`
   - Mock Bull jobs and blockchain calls

3. **Integration Tests**
   - `integration/deposit-flow.test.ts`
   - End-to-end M-Pesa flow
   - End-to-end onchain deposit flow

4. **E2E Tests**
   - Full API testing with Supertest
   - Real database and queue operations
   - User journey testing

## 🐛 Troubleshooting

**Database connection issues?**
```bash
# Ensure PostgreSQL is running
brew services list | grep postgresql

# Create test database if missing
psql -U postgres -c "CREATE DATABASE kiota_test;"
```

**Port conflicts?**
```bash
# Kill process on test port
lsof -ti:3004 | xargs kill -9
```

**Tests timing out?**
- Increase timeout in specific test: `it('test', async () => {...}, 15000)`
- Or globally in `jest.config.js`: `testTimeout: 15000`

## 🎯 Key Features

✅ **Automatic Database Setup** - Tests create/destroy tables automatically
✅ **Test Isolation** - Each test gets clean database state
✅ **Mock Utilities** - Easy mocking of external dependencies
✅ **Fixture Factories** - Reusable mock data generators
✅ **Coverage Reporting** - HTML and LCOV formats
✅ **Watch Mode** - Fast feedback during development
✅ **TypeScript Support** - Full type safety in tests

## 📝 Example Test

```typescript
import { DepositSessionRepository } from '../../repositories/deposit-session.repo';
import { initTestDatabase, closeTestDatabase, clearDatabase } from '../utils/test-db.util';
import { createMockDepositSession } from '../utils/fixtures.util';

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

  it('should create a new deposit session', async () => {
    // Arrange
    const data = createMockDepositSession({ expectedAmount: 100 });

    // Act
    const session = await repository.create(data);

    // Assert
    expect(session.id).toBeDefined();
    expect(session.expectedAmount).toBe(100);
  });
});
```

Happy Testing! 🎉
