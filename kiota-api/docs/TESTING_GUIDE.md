# Kiota API Testing Guide

Complete guide for testing the Kiota API.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
3. [Running Tests](#running-tests)
4. [Manual API Testing](#manual-api-testing)
5. [Testing Deposits](#testing-deposits)
6. [Testing Swaps](#testing-swaps)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Node.js v18+
- PostgreSQL 14+ running locally
- Redis 6+ running locally

### Required Accounts (for full testing)
- **1inch**: API key from https://portal.1inch.dev
- **Privy**: App credentials from https://console.privy.io
- **OpenAI**: API key from https://platform.openai.com

### Testnet Funds (for blockchain testing)
- Base Sepolia ETH from faucet
- Base Sepolia USDC from Circle testnet faucet

---

## Setup

### 1. Create Test Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create databases
CREATE DATABASE kiota_postgres;
CREATE DATABASE kiota_test;

# Exit
\q
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env.development
cp .env.example .env.test

# Edit .env.development with your credentials
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Services

```bash
# Terminal 1: Start API server
npm run dev

# Terminal 2: Start background worker
npm run worker
```

### 5. Verify Setup

```bash
# Health check
curl http://localhost:3003/health

# Expected: {"status":"ok",...}
```

---

## Running Tests

### Run All Tests

```bash
npm test
```

### Run with Coverage

```bash
npm run test:coverage
```

### Run in Watch Mode

```bash
npm run test:watch
```

### Run Specific Tests

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Specific file
npm test -- deposit-session.repo.test.ts

# Specific test name
npm test -- --testNamePattern="should create deposit"
```

---

## Manual API Testing

### Generate Auth Token

Using JWT (recommended):

```bash
# Create a user first via Privy sync, then use the returned token
# Or generate a test token:

node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: 'test-user-123' },
  process.env.JWT_SECRET || 'kiota-development-secret-change-in-production',
  { expiresIn: '7d' }
);
console.log('Bearer ' + token);
"
```

Save for reuse:
```bash
export AUTH="Authorization: Bearer <your_token>"
```

### Test Core Endpoints

```bash
# Health check
curl http://localhost:3003/health

# Get current user
curl -H "$AUTH" http://localhost:3003/api/v1/auth/privy/me

# Get dashboard
curl -H "$AUTH" http://localhost:3003/api/v1/dashboard

# Get portfolio
curl -H "$AUTH" http://localhost:3003/api/v1/portfolio/detail

# Get wallet
curl -H "$AUTH" http://localhost:3003/api/v1/wallet
```

---

## Testing Deposits

### Test Onchain USDC Deposit

#### 1. Create Deposit Intent

```bash
curl -X POST http://localhost:3003/api/v1/deposit/intent/create \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "expectedAmount": 10,
    "token": "USDC",
    "chain": "base"
  }'
```

Response:
```json
{
  "data": {
    "depositSessionId": "uuid-here",
    "depositAddress": "0x...",
    "expiresAt": "..."
  }
}
```

#### 2. Send USDC (Testnet)

Send USDC to the `depositAddress` on Base Sepolia:
- Use MetaMask or any wallet
- USDC contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

#### 3. Check Confirmation

```bash
curl -X POST http://localhost:3003/api/v1/deposit/intent/confirm \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"depositSessionId": "uuid-here"}'
```

#### 4. Convert to Assets

```bash
curl -X POST http://localhost:3003/api/v1/deposit/convert \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"depositSessionId": "uuid-here"}'
```

---

### Test M-Pesa Deposit (Mock)

```bash
# 1. Initiate deposit
curl -X POST http://localhost:3003/api/v1/deposit/initiate \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "amountKes": 1000,
    "mpesaPhoneNumber": "+254712345678"
  }'

# 2. Trigger STK push
curl -X POST http://localhost:3003/api/v1/deposit/mpesa/push \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "uuid-here"}'

# 3. Check status
curl http://localhost:3003/api/v1/deposit/transaction/uuid-here \
  -H "$AUTH"
```

---

## Testing Swaps

### Get Quote

```bash
curl "http://localhost:3003/api/v1/swap/quote?fromAsset=USDC&toAsset=USDM&amount=10" \
  -H "$AUTH"
```

### Execute Swap

```bash
curl -X POST http://localhost:3003/api/v1/swap/execute \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "fromAsset": "USDC",
    "toAsset": "USDM",
    "amount": 10,
    "slippage": 1.0
  }'
```

### Check Status

```bash
curl http://localhost:3003/api/v1/swap/status/uuid-here \
  -H "$AUTH"
```

### View History

```bash
curl http://localhost:3003/api/v1/swap/history \
  -H "$AUTH"
```

---

## Testing Goals

```bash
# Create goal
curl -X POST http://localhost:3003/api/v1/goals \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Emergency Fund",
    "category": "emergency",
    "targetAmountKes": 50000,
    "targetDate": "2025-12-31"
  }'

# List goals
curl http://localhost:3003/api/v1/goals \
  -H "$AUTH"

# Contribute to goal
curl -X POST http://localhost:3003/api/v1/goals/uuid-here/contribute \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"amountKes": 5000}'
```

---

## Testing Quiz

```bash
# Submit quiz
curl -X POST http://localhost:3003/api/v1/quiz/submit \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "primaryGoal": "wealth_growth",
      "investmentTimeline": "3-5_years",
      "riskTolerance": "moderate",
      "investmentExperience": "beginner"
    }
  }'

# Accept strategy
curl -X POST http://localhost:3003/api/v1/quiz/accept-strategy \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "uuid-here",
    "accepted": true
  }'
```

---

## Monitoring

### Bull Board (Job Queue)

Access job monitoring dashboard:
```
http://localhost:3003/admin/queues
```

**In development:** Accessible without authentication
**In production:** Requires `x-admin-key` header

### View Logs

```bash
# API server logs (Terminal 1)
# Worker logs (Terminal 2)

# Query jobs in Redis
redis-cli keys "bull:*"
```

### Database Queries

```bash
psql -h localhost -U postgres -d kiota_postgres

-- Recent transactions
SELECT id, user_id, type, status, source_amount, destination_amount 
FROM transactions ORDER BY created_at DESC LIMIT 10;

-- Deposit sessions
SELECT id, user_id, status, expected_amount, matched_amount 
FROM deposit_sessions ORDER BY created_at DESC LIMIT 10;

-- Portfolio values
SELECT user_id, total_value_usd, stable_yields_value_usd 
FROM portfolios;
```

---

## Troubleshooting

### "Authorization header required"

```bash
# Check token is set
echo $AUTH

# Regenerate token if expired
```

### "Database connection refused"

```bash
# Check PostgreSQL is running
pg_isready

# Check connection
psql -h localhost -U postgres -d kiota_postgres -c "SELECT 1;"
```

### "Redis connection refused"

```bash
# Check Redis is running
redis-cli ping

# Start Redis if needed
redis-server &
```

### "1inch API not configured"

```bash
# Set API key in .env.development
ONEINCH_API_KEY="your_key_here"

# Restart services
```

### Worker not processing jobs

```bash
# Check Bull Board for stuck jobs
# Restart worker
pkill -f "npm run worker"
npm run worker
```

### Swap fails with "insufficient balance"

```bash
# Check wallet balance
curl http://localhost:3003/api/v1/wallet -H "$AUTH"

# Fund wallet with testnet tokens
```

---

## Test Checklist

### Basic Flow

- [ ] Health check returns OK
- [ ] User can sync via Privy
- [ ] Quiz generates strategy
- [ ] Wallet is created
- [ ] Dashboard loads

### Deposits

- [ ] Deposit intent created
- [ ] USDC transfer detected
- [ ] Deposit confirmed
- [ ] Assets converted to allocation

### Swaps

- [ ] Quote returns pricing
- [ ] Swap executes
- [ ] Status updates to completed
- [ ] Portfolio balances updated

### Goals

- [ ] Goal created
- [ ] Goal listed
- [ ] Contribution recorded
- [ ] Progress calculated

### Rebalancing

- [ ] Drift detected when >5%
- [ ] Rebalance generates swaps
- [ ] Swaps execute correctly

---

## CI/CD Testing

```bash
# Run tests in CI mode
CI=true npm test

# With coverage threshold
npm run test:coverage -- --coverageThreshold='{"global":{"branches":70}}'
```

---

## Additional Resources

- **API Reference**: [API-REFERENCE.md](./API-REFERENCE.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Deposit Flow**: [DEPOSIT-FLOW-ARCHITECTURE.md](./DEPOSIT-FLOW-ARCHITECTURE.md)
- **Swap Architecture**: [SWAP_PROVIDER_ARCHITECTURE.md](./SWAP_PROVIDER_ARCHITECTURE.md)
