# Deposit Flow Architecture

This document explains the architecture of the deposit flows in the Kiota API, covering both onchain USDC deposits and M-Pesa deposits.

## Table of Contents

1. [Overview](#overview)
2. [Onchain USDC Deposit Flow](#onchain-usdc-deposit-flow)
3. [M-Pesa Deposit Flow](#mpesa-deposit-flow)
4. [Idempotency Guarantees](#idempotency-guarantees)
5. [Queue System](#queue-system)
6. [Monitoring & Alerts](#monitoring--alerts)
7. [Error Handling](#error-handling)
8. [Database Schema](#database-schema)

---

## Overview

The Kiota API supports two deposit methods:

1. **Onchain USDC Deposits** (Base Chain)
   - Users send USDC directly to their wallet address
   - System scans blockchain for Transfer events
   - Credits portfolio once confirmations are met

2. **M-Pesa Deposits** (Kenya Mobile Money)
   - Users pay via M-Pesa STK Push
   - Backend converts KES to USDC on Base chain
   - Credits portfolio after blockchain confirmation

Both flows are designed with **idempotency** as a core principle to prevent double-crediting.

---

## Onchain USDC Deposit Flow

### Architecture Diagram

```
User Wallet → Base Chain → Deposit Session → Event Scanner → Portfolio Credit
     ↓            ↓              ↓                ↓                ↓
  Sends USDC   Transfer      Awaiting          Scans for      Updates
   to Address   Event        Transfer           Match          Balances
```

### Step-by-Step Flow

#### 1. Create Deposit Intent

**Endpoint:** `POST /api/deposit/intent/create`

**Request:**
```json
{
  "expectedAmount": 100,
  "token": "USDC",
  "chain": "base"
}
```

**Process:**
- Validates user authentication
- Retrieves user's wallet address
- Captures current block number (for deterministic scanning)
- Creates `DepositSession` with:
  - Expected amount ±5% tolerance
  - 60-minute expiration
  - Status: `AWAITING_TRANSFER`

**Response:**
```json
{
  "depositSessionId": "uuid",
  "depositAddress": "0x...",
  "expiresAt": "2025-01-20T12:00:00Z"
}
```

**Background Job:**
- Queues repeating job in `onchain-deposit-confirmation` queue
- Runs every 30 seconds for 60 minutes
- Scans blockchain for matching Transfer event

#### 2. User Sends USDC

User sends USDC to their wallet address using any wallet (MetaMask, Coinbase Wallet, etc.)

#### 3. Blockchain Event Scanning

**Job Processor:** `onchain-deposit-confirmation.processor.ts`

**Process:**
1. Fetch deposit session from database
2. Check if session is expired (skip if yes)
3. Check if session is already confirmed (return if yes)
4. Scan blockchain for USDC Transfer events:
   - **From block:** Session creation block number
   - **To block:** Current block number
   - **Filter:** Transfer TO user's wallet address
   - **Amount:** Within ±5% of expected amount
5. Find newest matching event that:
   - Occurred after session creation timestamp
   - Is not already processed (idempotency check)
   - Meets amount criteria

#### 4. Event Matching & Binding

**Process:**
1. Bind event to session:
   - Store `txHash`, `logIndex`, `fromAddress`, `amount`, `blockNumber`
   - Update status to `RECEIVED`
2. Check confirmations:
   - If < 2 confirmations: Return and wait for next job run
   - If ≥ 2 confirmations: Proceed to crediting

#### 5. Portfolio Crediting

**Idempotency Check:**
```typescript
await sessionRepo.markEventProcessed({
  chain: 'base',
  txHash: matched.txHash,
  logIndex: matched.logIndex
});
```

This creates a row in `onchain_processed_events` with unique constraint on `(chain, txHash, logIndex)`. Any duplicate attempts will return existing record.

**Credit Process:**
1. Create transaction record:
   ```typescript
   await txRepo.createOnchainDeposit({
     userId,
     chain: 'base',
     tokenSymbol: 'USDC',
     amountUsd: matched.amount,
     txHash: matched.txHash,
     logIndex: matched.logIndex,
     allocation: { stableYields: 80, tokenizedStocks: 15, tokenizedGold: 5 }
   });
   ```

2. Update portfolio values:
   ```typescript
   await portfolioRepo.updateValues(userId, {
     stableYieldsValueUsd: amount * 0.80,
     tokenizedStocksValueUsd: amount * 0.15,
     tokenizedGoldValueUsd: amount * 0.05
   });
   ```

3. Record deposit:
   ```typescript
   await portfolioRepo.recordDeposit(userId, amount);
   await portfolioRepo.calculateReturns(userId);
   ```

4. Update session status to `CONFIRMED`
5. Remove repeating job from queue

#### 6. User Confirmation

**Endpoint:** `POST /api/deposit/intent/confirm`

**Request:**
```json
{
  "depositSessionId": "uuid"
}
```

**Response (if confirmed):**
```json
{
  "status": "CONFIRMED",
  "txHash": "0x...",
  "amount": 100,
  "confirmations": 5,
  "credited": true
}
```

---

## M-Pesa Deposit Flow

### Architecture Diagram

```
User → M-Pesa → STK Push → Payment → Callback → Queue → Blockchain → Portfolio
  ↓       ↓         ↓          ↓         ↓        ↓         ↓           ↓
Input   KES→USD   Phone     Success   Process   Job     Transfer    Credit
Amount  Conversion Prompt            Receipt   Queued   USDC       Balances
```

### Step-by-Step Flow

#### 1. Initiate Deposit (Screen 10a/10b)

**Endpoint:** `POST /api/deposit/initiate`

**Request:**
```json
{
  "amountKes": 1000,
  "mpesaPhoneNumber": "+254712345678"
}
```

**Process:**
1. Validate minimum amount (100 KES)
2. Get KES/USD exchange rate
3. Calculate fees:
   - Base fee: 2% of amount
   - First deposit: Fee subsidized (user gets full amount)
4. Create transaction with status `PENDING`:
   ```typescript
   {
     type: 'DEPOSIT',
     status: 'PENDING',
     sourceAsset: 'KES',
     sourceAmount: 1000,
     destinationAsset: 'USDC',
     destinationAmount: 10,
     feeUsd: 0.2,
     allocation: { stableYields: 80, tokenizedStocks: 15, tokenizedGold: 5 }
   }
   ```

**Response:**
```json
{
  "transactionId": "uuid",
  "amountKes": 1000,
  "amountUsd": 10,
  "fees": {
    "feeKes": 20,
    "feeUsd": 0.2,
    "subsidized": true
  },
  "allocation": {
    "stableYields": { asset: "USDM", amountUsd": 8 },
    "tokenizedStocks": { "asset": "bCSPX", "amountUsd": 1.5 },
    "tokenizedGold": { "asset": "PAXG", "amountUsd": 0.5 }
  }
}
```

#### 2. Trigger M-Pesa STK Push (Screen 10c)

**Endpoint:** `POST /api/deposit/mpesa/push`

**Request:**
```json
{
  "transactionId": "uuid"
}
```

**Process:**
1. Fetch transaction
2. Call M-Pesa STK Push API
3. Store `checkoutRequestId`

**Response:**
```json
{
  "checkoutRequestId": "ws_CO_123456",
  "status": "awaiting_payment"
}
```

User receives payment prompt on their phone.

#### 3. M-Pesa Callback (Screen 10d)

**Endpoint:** `POST /api/deposit/mpesa/callback`

**Request (from M-Pesa):**
```json
{
  "CheckoutRequestID": "ws_CO_123456",
  "ResultCode": 0,
  "ResultDesc": "Success",
  "CallbackMetadata": {
    "MpesaReceiptNumber": "ABC123XYZ",
    "Amount": 1000,
    "TransactionDate": 20250120120000
  }
}
```

**Process:**
1. Find transaction by `CheckoutRequestID`
2. If success (ResultCode === 0):
   - Update status to `PROCESSING`
   - Store M-Pesa receipt number
   - Queue job in `deposit-completion` queue
3. If failed:
   - Update status to `FAILED`
   - Store failure reason

**Response:**
```json
{
  "ResultCode": 0,
  "ResultDesc": "Callback received successfully"
}
```

#### 4. Background Job Processing

**Job Processor:** `deposit-completion.processor.ts`

**Process:**
1. Fetch transaction from database
2. Generate USDC on Base chain (simulate for MVP)
3. Record blockchain transaction hash
4. Update transaction:
   - Status: `COMPLETED`
   - txHash: "0x..."
   - completedAt: timestamp
5. Credit portfolio (same as onchain flow)
6. Update wallet balances
7. Mark first deposit subsidy as used

#### 5. Check Status (Screen 10e)

**Endpoint:** `GET /api/deposit/transaction/:transactionId`

**Response:**
```json
{
  "transactionId": "uuid",
  "status": "COMPLETED",
  "amountKes": 1000,
  "amountUsd": 10,
  "mpesaReceiptNumber": "ABC123XYZ",
  "txHash": "0x...",
  "completedAt": "2025-01-20T12:00:00Z"
}
```

---

## Idempotency Guarantees

### Why Idempotency Matters

In a distributed system with retries and background jobs, the same operation might be attempted multiple times. Idempotency ensures that:

- ✅ A blockchain event is only credited once
- ✅ Duplicate M-Pesa callbacks don't double-credit
- ✅ Job retries don't cause duplicate transactions

### Idempotency Mechanisms

#### 1. Onchain Event Deduplication

**Table:** `onchain_processed_events`

**Unique Constraint:** `(chain, txHash, logIndex)`

```sql
CREATE UNIQUE INDEX idx_processed_events_unique
ON onchain_processed_events (chain, txHash, logIndex);
```

**Code:**
```typescript
// Mark event as processed BEFORE crediting
await sessionRepo.markEventProcessed({
  chain: 'base',
  txHash: '0x...',
  logIndex: 0
});

// This will succeed only once due to unique constraint
// Subsequent calls return existing record without error
```

#### 2. Transaction Deduplication

**Table:** `transactions`

**Unique Constraint:** `(chain, txHash, logIndex)`

```typescript
// createOnchainDeposit is idempotent
const tx = await txRepo.createOnchainDeposit({
  ...data,
  txHash: '0x...',
  logIndex: 0
});

// If transaction exists, returns existing record
// If new, creates and returns new record
```

#### 3. Job Deduplication

**Queue Configuration:**
```typescript
ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE.add(data, {
  jobId: `onchain-deposit-${sessionId}`, // Unique job ID
  // ...
});
```

Using a unique `jobId` ensures that:
- Duplicate job adds are ignored
- Only one job exists per deposit session

#### 4. Status Transitions

**Finite State Machine:**
```
AWAITING_TRANSFER → RECEIVED → CONFIRMED
                  ↓
                EXPIRED
                  ↓
                FAILED
```

Transitions are unidirectional. Once `CONFIRMED`, status cannot change.

---

## Queue System

### Architecture

We use **Bull** (Redis-backed queue) for reliable background job processing.

### Queues

#### 1. `deposit-completion` Queue

**Purpose:** Process M-Pesa deposit confirmations

**Configuration:**
- Concurrency: 5 jobs
- Retry attempts: 5
- Backoff: Exponential (5s, 10s, 20s, 40s, 80s)

**Job Data:**
```typescript
{
  transactionId: string,
  txHash: string,
  blockchainData: {
    chain: string
  }
}
```

#### 2. `onchain-deposit-confirmation` Queue

**Purpose:** Scan blockchain for deposit events

**Configuration:**
- Concurrency: 3 jobs
- Retry attempts: 3
- Backoff: Exponential (3s, 6s, 12s)
- Repeating: Every 30s for 60 minutes (120 attempts)

**Job Data:**
```typescript
{
  depositSessionId: string,
  userId: string
}
```

### Worker Process

**File:** `service/jobs/worker.ts`

**How to Run:**
```bash
# Development
npm run worker

# Production
pm2 start service/jobs/worker.ts --name kiota-worker
pm2 start service/jobs/worker.ts -i 4  # Run 4 instances
```

**Monitoring:**
```bash
pm2 logs kiota-worker      # View logs
pm2 monit                  # Live monitoring
```

### Bull Board Dashboard

**URL:** `http://localhost:3000/admin/queues`

Visual dashboard showing:
- Active jobs
- Completed jobs
- Failed jobs
- Job details and logs

---

## Monitoring & Alerts

### Monitoring Service

**File:** `service/services/monitoring.service.ts`

**Features:**
- ✅ Tracks success/failure rates
- ✅ Records job metrics
- ✅ Sends alerts on threshold violations
- ✅ Provides health check data

### Metrics Tracked

For each queue:
- `totalProcessed`: Total jobs processed
- `totalSucceeded`: Successful jobs
- `totalFailed`: Failed jobs
- `totalStalled`: Stalled jobs (worker crash)
- `recentFailures`: Last 10 failures with details
- `successRate`: Percentage of successful jobs

### Alert Thresholds

**Configuration:**
```bash
# .env
ENABLE_ALERTS=true
FAILURE_ALERT_THRESHOLD=5    # Alert after 5 consecutive failures
STALLED_ALERT_THRESHOLD=3    # Alert after 3 stalled jobs
ALERT_WEBHOOK_URL=https://hooks.slack.com/...
```

**Alerts Sent:**
- 🚨 **Critical:** N consecutive failures detected
- ⚠️  **Warning:** N jobs stalled (worker issue)

**Alert Channels:**
- Console logs (always)
- Slack/Discord webhook (if configured)
- Email (configurable)

### Health Check Endpoints

#### Basic Health
```
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T12:00:00Z",
  "uptime": 3600
}
```

#### Detailed Health
```
GET /api/health/detailed
```

Response:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy", "connected": true },
    "redis": { "status": "healthy", "connected": true },
    "queues": {
      "deposit-completion": {
        "successRate": 98.5,
        "recentFailures": 0,
        "totalStalled": 0,
        "status": "healthy"
      },
      "onchain-deposit-confirmation": {
        "successRate": 100,
        "recentFailures": 0,
        "totalStalled": 0,
        "status": "healthy"
      }
    }
  }
}
```

#### Queue Metrics
```
GET /api/health/metrics/queues
```

Response:
```json
{
  "timestamp": "2025-01-20T12:00:00Z",
  "queues": {
    "deposit-completion": {
      "totalProcessed": 150,
      "totalSucceeded": 148,
      "totalFailed": 2,
      "totalStalled": 0,
      "successRate": 98.67,
      "recentFailures": []
    }
  }
}
```

#### Readiness Probe (Kubernetes)
```
GET /api/health/ready
```

Returns 200 if database and Redis are connected.

#### Liveness Probe (Kubernetes)
```
GET /api/health/live
```

Returns 200 if process is alive.

---

## Error Handling

### Error Types

#### 1. Validation Errors (400)
- Invalid deposit amount
- Missing required fields
- Invalid phone number format

#### 2. Not Found (404)
- Deposit session not found
- User or wallet not found

#### 3. Business Logic Errors (400)
- Session expired
- Insufficient balance
- Allocation doesn't add to 100%

#### 4. External Service Errors (503)
- RPC node unavailable
- M-Pesa API timeout
- Redis connection lost

#### 5. Internal Errors (500)
- Database query failed
- Unexpected exceptions

### Retry Strategy

**Bull Queue Retry Configuration:**
```typescript
{
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 5000  // 5s, 10s, 20s, 40s, 80s
  }
}
```

**When to Retry:**
- ✅ RPC node temporary failure
- ✅ Network timeout
- ✅ Database connection issue

**When NOT to Retry:**
- ❌ Validation errors
- ❌ Session expired
- ❌ Event already processed

### Error Logging

**Structured Logging:**
```typescript
logger.error('Failed to process deposit', error, {
  userId,
  transactionId,
  depositSessionId
});
```

**Log Format (Production):**
```json
{
  "timestamp": "2025-01-20T12:00:00Z",
  "level": "error",
  "service": "deposit-processor",
  "message": "Failed to process deposit",
  "error": "Connection timeout",
  "userId": "uuid",
  "transactionId": "uuid"
}
```

---

## Database Schema

### Key Tables

#### 1. `deposit_sessions`

Tracks onchain deposit intents.

```sql
CREATE TABLE deposit_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_address VARCHAR(42) NOT NULL,
  chain VARCHAR(20) NOT NULL,
  token_symbol VARCHAR(10) NOT NULL,
  token_address VARCHAR(42) NOT NULL,
  expected_amount DECIMAL(20, 8),
  min_amount DECIMAL(20, 8),
  max_amount DECIMAL(20, 8),
  status VARCHAR(20) NOT NULL,  -- AWAITING_TRANSFER, RECEIVED, CONFIRMED, EXPIRED

  -- Matched event data
  matched_tx_hash VARCHAR(66),
  matched_log_index INTEGER,
  matched_from_address VARCHAR(42),
  matched_amount DECIMAL(20, 8),
  matched_block_number BIGINT,

  created_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at_block_number BIGINT NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_status (user_id, status)
);
```

#### 2. `onchain_processed_events`

Prevents double-processing of blockchain events.

```sql
CREATE TABLE onchain_processed_events (
  id UUID PRIMARY KEY,
  chain VARCHAR(20) NOT NULL,
  tx_hash VARCHAR(66) NOT NULL,
  log_index INTEGER NOT NULL,
  processed_at TIMESTAMP NOT NULL,

  UNIQUE KEY uk_event (chain, tx_hash, log_index)
);
```

#### 3. `transactions`

All deposit/withdrawal transactions.

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(20) NOT NULL,  -- DEPOSIT, WITHDRAWAL
  status VARCHAR(20) NOT NULL,  -- PENDING, PROCESSING, COMPLETED, FAILED

  -- Amounts
  source_asset VARCHAR(10) NOT NULL,
  source_amount DECIMAL(20, 8) NOT NULL,
  destination_asset VARCHAR(10) NOT NULL,
  destination_amount DECIMAL(20, 8) NOT NULL,
  value_usd DECIMAL(20, 8) NOT NULL,

  -- Fees
  fee_amount DECIMAL(20, 8),
  fee_usd DECIMAL(20, 8),
  fee_subsidized BOOLEAN DEFAULT FALSE,

  -- Blockchain
  chain VARCHAR(20),
  tx_hash VARCHAR(66),
  log_index INTEGER,
  token_symbol VARCHAR(10),
  token_address VARCHAR(42),
  wallet_address VARCHAR(42),

  -- M-Pesa
  mpesa_phone_number VARCHAR(15),
  mpesa_checkout_request_id VARCHAR(50),
  mpesa_receipt_number VARCHAR(50),
  exchange_rate DECIMAL(10, 4),

  -- Allocation
  allocation JSON,

  -- Timestamps
  created_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  failed_at TIMESTAMP,
  failure_reason TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uk_onchain (chain, tx_hash, log_index),
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_mpesa_checkout (mpesa_checkout_request_id)
);
```

---

## Best Practices

### For Developers

1. **Always check idempotency** before crediting
2. **Use structured logging** with context
3. **Handle all error cases** explicitly
4. **Test with duplicate events** to verify idempotency
5. **Monitor queue metrics** in production

### For Operations

1. **Monitor health endpoints** with uptime service
2. **Set up alerts** for critical failures
3. **Run multiple worker instances** for high availability
4. **Back up Redis** to prevent job loss
5. **Scale workers** based on queue depth

### Security Considerations

1. **Validate all inputs** (amounts, addresses)
2. **Use lowercase for addresses** (case-insensitive matching)
3. **Require authentication** for all endpoints
4. **Rate limit** deposit creation
5. **Log all critical operations** for audit trail

---

## Troubleshooting

### Common Issues

#### Deposits Not Being Detected

**Symptoms:** User sent USDC but status remains `AWAITING_TRANSFER`

**Checklist:**
- [ ] Worker process is running
- [ ] RPC URL is correct and accessible
- [ ] USDC address matches contract on Base
- [ ] Transaction was sent AFTER session creation
- [ ] Amount is within ±5% tolerance
- [ ] Sufficient block confirmations (≥2)

**Debug:**
```bash
# Check queue jobs
curl http://localhost:3000/admin/queues

# Check worker logs
pm2 logs kiota-worker

# Check session status
psql -c "SELECT * FROM deposit_sessions WHERE id = 'session-id';"
```

#### Jobs Failing Repeatedly

**Symptoms:** Jobs marked as failed, alerts firing

**Checklist:**
- [ ] RPC node is responding
- [ ] Database connection is stable
- [ ] Redis is running
- [ ] Environment variables are set

**Debug:**
```bash
# Check health
curl http://localhost:3000/api/health/detailed

# View failed jobs
# Open Bull Board dashboard

# Restart worker
pm2 restart kiota-worker
```

#### Double-Crediting Suspicion

**Symptoms:** Portfolio balance higher than expected

**Check idempotency:**
```sql
-- Check if event was processed multiple times
SELECT COUNT(*) FROM onchain_processed_events
WHERE tx_hash = '0x...' AND log_index = 0;
-- Should be exactly 1

-- Check transaction duplicates
SELECT COUNT(*) FROM transactions
WHERE tx_hash = '0x...' AND log_index = 0;
-- Should be exactly 1
```

---

## Future Enhancements

1. **Multi-chain Support** - Support Ethereum, Polygon, Arbitrum
2. **Token Diversity** - Support USDT, DAI, other stablecoins
3. **Webhook Notifications** - Alert users when deposit confirmed
4. **Auto-rebalancing** - Adjust allocations based on market conditions
5. **Withdrawal Flow** - Allow users to withdraw funds
6. **Advanced Monitoring** - Integrate with Datadog, New Relic

---

**Last Updated:** 2025-01-20
**Version:** 1.0.0
