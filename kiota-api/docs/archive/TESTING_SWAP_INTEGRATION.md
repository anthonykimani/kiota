# 1inch Swap Integration - Testing Guide

## 📋 Prerequisites

### 1. Environment Variables
Add to your `.env` file:

```bash
# 1inch Fusion API
ONEINCH_API_KEY="your_api_key_from_1inch_portal"
ONEINCH_NETWORK="base-sepolia"  # or "base" for mainnet

# Slippage Settings
DEFAULT_SLIPPAGE_PERCENT=1.0
MAX_SLIPPAGE_PERCENT=3.0

# Redis (for Bull queues)
REDIS_URL="redis://localhost:6379"

# Base RPC (already configured)
BASE_RPC_URL="https://sepolia.base.org"
BASE_USDC_ADDRESS="0x036CbD53842c5426634e7929541eC2318f3dCF7e"
```

### 2. Get 1inch API Key
1. Go to https://portal.1inch.dev
2. Sign up / Log in
3. Create a new API key
4. Copy the key to `ONEINCH_API_KEY` in `.env`

### 3. Update Testnet Token Addresses
Edit `service/configs/tokens.config.ts` lines 36-38:
```typescript
'base-sepolia': {
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  USDM: '0x...', // Get testnet USDM address
  BCSPX: '0x...', // Get testnet bCSPX address
  PAXG: '0x...', // Get testnet PAXG address
}
```

### 4. Register Swap Routes
Add to `service/index.ts` or `service/app.ts`:
```typescript
import swapRoutes from './routes/index.swap';

// Add with other routes
app.use('/api/swap', swapRoutes);
```

### 5. Start Services
```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Worker (processes background jobs)
npm run worker

# Terminal 3: Start API Server
npm run dev
```

---

## 🧪 Testing Sequence

### **Step 1: Verify Setup**

#### Check Server Health
```bash
curl http://localhost:3000/api/health
```

Expected: `200 OK` with health status

#### Check Queue Health
```bash
curl http://localhost:3000/api/health/detailed
```

Expected: All queues should show as healthy, including:
- `swap-execution`
- `swap-confirmation`

---

### **Step 2: Test Swap Quote Endpoint**

#### Get Quote for USDC → USDM
```bash
curl -X GET "http://localhost:3000/api/swap/quote?fromAsset=USDC&toAsset=USDM&amount=100" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Expected Response:**
```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "fromAsset": "USDC",
    "toAsset": "USDM",
    "fromAmount": 100,
    "estimatedToAmount": 99.5,
    "slippage": 1,
    "priceImpact": 0.2,
    "fees": {
      "network": 0.1,
      "protocol": 0.4
    },
    "route": ["USDC", "USDM"],
    "expiresAt": "2026-01-21T12:30:00Z"
  },
  "errors": []
}
```

**Troubleshooting:**
- **503 Error**: ONEINCH_API_KEY not set or invalid
- **400 Error**: Invalid parameters (check asset names, amount)
- **Network error**: Check BASE_RPC_URL and internet connection

---

### **Step 3: Test User-Initiated Swap**

#### Execute Swap
```bash
curl -X POST "http://localhost:3000/api/swap/execute" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromAsset": "USDC",
    "toAsset": "USDM",
    "amount": 100,
    "slippage": 1.0
  }'
```

**Expected Response:**
```json
{
  "status": 201,
  "message": "Created",
  "data": {
    "transactionId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "fromAsset": "USDC",
    "toAsset": "USDM",
    "fromAmount": 100,
    "estimatedToAmount": 99.5,
    "estimatedCompletionTime": "2-5 minutes"
  },
  "errors": []
}
```

**What Happens:**
1. Transaction record created with status `PENDING`
2. Job queued in `swap-execution` queue
3. Worker picks up job and places order with 1inch
4. Order hash saved to transaction metadata
5. Confirmation job queued in `swap-confirmation` queue
6. Worker polls 1inch order status every 30s
7. On completion: balances updated atomically

---

### **Step 4: Monitor Swap Progress**

#### Check Swap Status
```bash
curl -X GET "http://localhost:3000/api/swap/status/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Status Progression:**
1. **pending** → Waiting for worker to pick up job
2. **processing** → Order placed with 1inch, polling for confirmation
3. **completed** → Swap confirmed, balances updated
4. **failed** → Swap failed (see failureReason)

**Completed Response:**
```json
{
  "status": 200,
  "data": {
    "transactionId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "type": "swap",
    "fromAsset": "usdc",
    "toAsset": "usdm",
    "fromAmount": 100,
    "toAmount": 99.52,
    "txHash": "0xabc123...",
    "chain": "base",
    "createdAt": "2026-01-21T10:00:00Z",
    "completedAt": "2026-01-21T10:03:45Z",
    "metadata": {
      "orderHash": "0x1inch_order_hash",
      "slippage": 1.0,
      "priceImpact": 0.2
    }
  }
}
```

---

### **Step 5: Monitor Bull Board**

**Access Bull Board UI:**
```
http://localhost:3000/admin/queues
```

**What to Check:**
- **swap-execution** queue: Jobs being processed (concurrency: 5)
- **swap-confirmation** queue: Jobs polling order status (concurrency: 3)
- **Completed jobs**: Should show successful executions
- **Failed jobs**: Check error messages

**Job Details to Inspect:**
- Job ID
- Job data (transactionId, userId, fromAsset, toAsset, amount)
- Job logs (shows real-time progress)
- Stack traces (if failed)

---

### **Step 6: Test Auto-Rebalancing**

#### Trigger Rebalance
```bash
curl -X POST "http://localhost:3000/api/portfolio/rebalance" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "force": false
  }'
```

**Expected Response (if drift > 5%):**
```json
{
  "status": 200,
  "data": {
    "rebalanceGroupId": "rebal-550e8400-e29b-41d4-a716",
    "status": "pending",
    "estimatedCompletionTime": "5-10 minutes",
    "currentAllocation": {
      "stableYields": 75,
      "tokenizedStocks": 20,
      "tokenizedGold": 5
    },
    "targetAllocation": {
      "stableYields": 80,
      "tokenizedStocks": 15,
      "tokenizedGold": 5
    },
    "drift": "10.00",
    "totalSwapValue": "50.00",
    "requiredSwaps": [
      {
        "transactionId": "tx-1",
        "fromAsset": "BCSPX",
        "toAsset": "USDM",
        "amount": 50
      }
    ],
    "swapCount": 1
  }
}
```

**If drift < 5%:**
```json
{
  "status": 400,
  "errors": ["Portfolio does not need rebalancing (drift < 5%). Use force=true to rebalance anyway."]
}
```

---

### **Step 7: Test Deposit Conversion**

#### Convert Deposit to Target Allocation
```bash
curl -X POST "http://localhost:3000/api/deposit/convert" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "depositSessionId": "deposit-session-uuid"
  }'
```

**Expected Response:**
```json
{
  "status": 201,
  "data": {
    "conversionGroupId": "conv-550e8400",
    "depositSessionId": "deposit-session-uuid",
    "depositedAmount": 100,
    "status": "pending",
    "swaps": [
      {
        "transactionId": "tx-1",
        "toAsset": "USDM",
        "amount": 80
      },
      {
        "transactionId": "tx-2",
        "toAsset": "BCSPX",
        "amount": 15
      },
      {
        "transactionId": "tx-3",
        "toAsset": "PAXG",
        "amount": 5
      }
    ],
    "swapCount": 3,
    "estimatedCompletionTime": "5-10 minutes",
    "allocation": {
      "stableYields": 80,
      "tokenizedStocks": 15,
      "tokenizedGold": 5
    }
  }
}
```

---

### **Step 8: Check Swap History**

```bash
curl -X GET "http://localhost:3000/api/swap/history?limit=20" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Expected Response:**
```json
{
  "status": 200,
  "data": {
    "swaps": [
      {
        "transactionId": "tx-1",
        "type": "swap",
        "status": "completed",
        "fromAsset": "usdc",
        "toAsset": "usdm",
        "fromAmount": 100,
        "toAmount": 99.52,
        "valueUsd": 99.52,
        "txHash": "0xabc123...",
        "createdAt": "2026-01-21T10:00:00Z",
        "completedAt": "2026-01-21T10:03:45Z"
      }
    ],
    "count": 1
  }
}
```

---

## 🗄️ Database Verification

### Check Transactions Table
```sql
-- View recent swaps
SELECT
  id,
  type,
  status,
  "sourceAsset",
  "destinationAsset",
  "sourceAmount",
  "destinationAmount",
  metadata,
  "createdAt",
  "completedAt"
FROM transactions
WHERE type IN ('swap', 'rebalance')
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Check Portfolio Balances
```sql
-- Verify portfolio updated correctly
SELECT
  "userId",
  "stableYieldsValueUsd",
  "tokenizedStocksValueUsd",
  "tokenizedGoldValueUsd",
  "totalValueUsd",
  "stableYieldsPercent",
  "tokenizedStocksPercent",
  "tokenizedGoldPercent"
FROM portfolios
WHERE "userId" = 'your-user-id';
```

### Check Wallet Balances
```sql
-- Verify wallet balances updated
SELECT
  "userId",
  "stableYieldBalance",
  "tokenizedStocksBalance",
  "tokenizedGoldBalance",
  "balancesLastUpdated"
FROM wallets
WHERE "userId" = 'your-user-id';
```

---

## 📊 Monitoring & Logs

### Worker Logs
Watch worker console for real-time processing:
```
🚀 Worker is ready and processing jobs!

Queues:
  • deposit-completion (concurrency: 5)
  • onchain-deposit-confirmation (concurrency: 3)
  • swap-execution (concurrency: 5)
  • swap-confirmation (concurrency: 3)

✅ [swap-execution] Job 1 completed successfully
✅ [swap-confirmation] Job 2 completed successfully
```

### Check Queue Metrics
```bash
curl http://localhost:3000/api/health/metrics/queues
```

Expected metrics for each queue:
- totalProcessed
- totalSucceeded
- totalFailed
- successRate

---

## ⚠️ Common Issues & Fixes

### Issue: "1inch API not configured"
**Fix:** Set `ONEINCH_API_KEY` in `.env` and restart server

### Issue: "Token not deployed on base-sepolia testnet"
**Fix:** Update testnet token addresses in `service/configs/tokens.config.ts`

### Issue: Jobs stuck in "pending"
**Fix:**
1. Check worker is running: `ps aux | grep worker`
2. Check Redis connection: `redis-cli ping`
3. Check Bull Board for stuck jobs

### Issue: Swap fails with high slippage
**Fix:**
- Increase `MAX_SLIPPAGE_PERCENT` in `.env`
- Check liquidity on 1inch for token pair
- Try smaller amounts

### Issue: Balance not updating
**Fix:**
1. Check transaction status is "completed"
2. Verify `balanceUpdaterService.updateAfterSwap()` is uncommented in `swap-confirmation.processor.ts` (line ~75)
3. Check database transaction logs

---

## ✅ Success Criteria

**MVP is working if:**
- ✅ Quote endpoint returns prices for all token pairs
- ✅ User swaps complete in < 5 minutes with >90% success rate
- ✅ Auto-rebalance corrects drift >5% to within ±1% of target
- ✅ Deposit conversion splits USDC into 80/15/5 allocation
- ✅ Portfolio/wallet balances update atomically (no partial updates)
- ✅ Failed swaps are marked as failed (not stuck)
- ✅ Bull Board shows jobs completing successfully

---

## 📝 Postman Collection

Import this collection for easier testing:

```json
{
  "info": {
    "name": "Kiota API - Swap Integration",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Swap Quote",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/swap/quote?fromAsset=USDC&toAsset=USDM&amount=100",
          "host": ["{{baseUrl}}"],
          "path": ["api", "swap", "quote"],
          "query": [
            {"key": "fromAsset", "value": "USDC"},
            {"key": "toAsset", "value": "USDM"},
            {"key": "amount", "value": "100"}
          ]
        }
      }
    },
    {
      "name": "Execute Swap",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"fromAsset\": \"USDC\",\n  \"toAsset\": \"USDM\",\n  \"amount\": 100,\n  \"slippage\": 1.0\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/swap/execute",
          "host": ["{{baseUrl}}"],
          "path": ["api", "swap", "execute"]
        }
      }
    },
    {
      "name": "Get Swap Status",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/swap/status/{{transactionId}}",
          "host": ["{{baseUrl}}"],
          "path": ["api", "swap", "status", "{{transactionId}}"]
        }
      }
    },
    {
      "name": "Get Swap History",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/swap/history?limit=20",
          "host": ["{{baseUrl}}"],
          "path": ["api", "swap", "history"],
          "query": [
            {"key": "limit", "value": "20"}
          ]
        }
      }
    },
    {
      "name": "Rebalance Portfolio",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"force\": false\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/portfolio/rebalance",
          "host": ["{{baseUrl}}"],
          "path": ["api", "portfolio", "rebalance"]
        }
      }
    },
    {
      "name": "Convert Deposit",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"depositSessionId\": \"your-deposit-session-id\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/deposit/convert",
          "host": ["{{baseUrl}}"],
          "path": ["api", "deposit", "convert"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "authToken",
      "value": "your_auth_token_here"
    },
    {
      "key": "transactionId",
      "value": "transaction_id_from_execute_response"
    }
  ]
}
```

Save this as `Kiota_Swap_Integration.postman_collection.json` and import into Postman.

---

## 🎯 Next Steps After Testing

1. **Testnet Deployment** - Deploy to Base Sepolia, invite beta testers
2. **Monitoring Setup** - Configure alerts for failed swaps (ALERT_WEBHOOK_URL)
3. **Load Testing** - Test 100+ concurrent swaps
4. **Mainnet Prep** - Get mainnet token addresses, audit critical paths
5. **Phased Launch**:
   - Week 1: User swaps only
   - Week 2: Deposit conversion (if stable)
   - Week 3: Auto-rebalance (if stable)
