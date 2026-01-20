# Test Commands Quick Reference

## Prerequisites

### One-Time Setup
```bash
# 1. Create test database
psql -U postgres -c "CREATE DATABASE kiota_test;"

# 2. Verify .env.test exists
cat .env.test
```

## Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run all tests with coverage
npm run test:coverage

# Watch mode (auto-rerun on file changes)
npm run test:watch
```

### Specific Tests
```bash
# Run specific test file
npm test -- deposit-session.repo.test.ts

# Run specific test suite
npm test -- --testNamePattern="createOnchainDeposit"

# Run tests matching pattern
npm test -- --testPathPattern=repositories
```

### By Type
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

### Debugging
```bash
# Verbose output
npm test -- --verbose

# Show console.log output
npm test -- --silent=false

# Run only failed tests
npm test -- --onlyFailures
```

## Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report in browser
open coverage/index.html
# Or on Linux:
xdg-open coverage/index.html
```

## Common Workflows

### Development Workflow
```bash
# 1. Start watch mode
npm run test:watch

# 2. Edit code in your editor
# 3. Tests re-run automatically
# 4. Press 'q' to quit watch mode
```

### Before Commit
```bash
# Run all tests with coverage
npm run test:coverage

# Ensure all tests pass
# Check coverage meets thresholds (70%)
```

### CI/CD
```bash
# Run in CI mode (non-interactive)
CI=true npm test
```

## Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
brew services list | grep postgresql
# Or on Linux:
sudo systemctl status postgresql

# Restart if needed
brew services restart postgresql
# Or on Linux:
sudo systemctl restart postgresql

# Verify test database exists
psql -U postgres -c "\l" | grep kiota_test
```

### Port Already in Use
```bash
# Kill process using test port
lsof -ti:3004 | xargs kill -9
```

### Tests Timeout
```bash
# Increase timeout for all tests (in jest.config.js)
testTimeout: 15000

# Or for specific test
it('slow test', async () => {
  // test code
}, 15000); // 15 second timeout
```

### Clear Test Database
```bash
# If you need to reset test database
psql -U postgres -c "DROP DATABASE IF EXISTS kiota_test;"
psql -U postgres -c "CREATE DATABASE kiota_test;"
```

## Watch Mode Commands

When in watch mode (npm run test:watch), press:
- `a` - Run all tests
- `f` - Run only failed tests
- `p` - Filter by filename pattern
- `t` - Filter by test name pattern
- `q` - Quit watch mode
- `Enter` - Trigger test run

## Test Output Files

```
coverage/
├── index.html          # Visual coverage report (open in browser)
├── lcov.info           # Coverage data for CI/CD
└── lcov-report/        # Detailed HTML reports
```

## Quick Checks

```bash
# Check if tests are configured correctly
npm test -- --listTests

# Dry run (show what would run without running)
npm test -- --listTests

# Clear Jest cache
npm test -- --clearCache
```

## Examples

### Run specific repository tests
```bash
npm test -- deposit-session.repo.test.ts
npm test -- transaction.repo.test.ts
```

### Run tests for idempotency
```bash
npm test -- --testNamePattern="idempotent"
```

### Run with full output
```bash
npm test -- --verbose --silent=false
```

### Generate and view coverage
```bash
npm run test:coverage && open coverage/index.html
```

## Status Checks

```bash
# Check test setup is working
npm test -- smoke.test.ts

# Should show: 4 tests passing
```

## Pro Tips

1. **Use watch mode during development**
   - `npm run test:watch`
   - Fast feedback on code changes

2. **Check coverage before commits**
   - `npm run test:coverage`
   - Aim for 70%+ coverage

3. **Run specific tests when debugging**
   - `npm test -- specific-file.test.ts`
   - Faster than running all tests

4. **Use --verbose for debugging**
   - `npm test -- --verbose`
   - Shows more details about test execution

5. **Keep test database separate**
   - Never use production database for tests
   - Tests clear data between runs

## Need Help?

- Documentation: `TESTING.md`
- Detailed guide: `service/__tests__/README.md`
- Run smoke test: `npm test -- smoke.test.ts`
