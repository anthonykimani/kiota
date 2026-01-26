# Pre-Testing Checklist - 1inch Swap Integration

## ✅ Code Setup Complete

All TODO sections have been uncommented and swap routes are registered:

- ✅ `swap-execution.processor.ts` - SWAP_CONFIRMATION_QUEUE imported and used
- ✅ `swap-confirmation.processor.ts` - balanceUpdaterService imported and used
- ✅ `swap.controller.ts` - SWAP_EXECUTION_QUEUE imported and used
- ✅ `service/index.ts` - Swap routes imported and registered at `/api/v1/swap`

---

## 📋 Required Setup Steps

### 1. Environment Variables

Add these to your `.env` file:

```bash
# 1inch Fusion API Configuration
ONEINCH_API_KEY="your_api_key_here"              # Get from https://portal.1inch.dev
ONEINCH_NETWORK="base-sepolia"                   # or "base" for mainnet
DEFAULT_SLIPPAGE_PERCENT=1.0
MAX_SLIPPAGE_PERCENT=3.0

# Existing variables (verify these are set)
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
```

**Action Required:**
- [x] Sign up at https://portal.1inch.dev and get API key
- [x] Add `ONEINCH_API_KEY` to `.env`
- [x] Set `ONEINCH_NETWORK="base-sepolia"` for testnet
- [ ] Verify Redis connection details

---

### 2. Update Testnet Token Addresses

Edit `service/configs/tokens.config.ts` lines 41-43:

```typescript
'base-sepolia': {
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // ✅ Already set
  USDM: '0x0000000000000000000000000000000000000000', // ❌ TODO: Update
  BCSPX: '0x0000000000000000000000000000000000000000', // ❌ TODO: Update
  PAXG: '0x0000000000000000000000000000000000000000', // ❌ TODO: Update
},
```

**Action Required:**
- [ ] Get Base Sepolia testnet addresses for USDM, bCSPX, PAXG
- [ ] Update `service/configs/tokens.config.ts` with real addresses
- [ ] If testnet tokens don't exist, consider testing with USDC only initially

**Workaround for Initial Testing:**
You can test USDC swaps only by using `fromAsset=USDC&toAsset=USDC` in quotes (though 1inch will reject same-asset swaps). For real testing, you need at least 2 different tokens.

---

### 3. Verify Queue Registration

Check `service/jobs/worker.ts` to ensure swap processors are registered:

```typescript
// Should have these lines (already added per plan):
SWAP_EXECUTION_QUEUE.process(5, async (job) => {
  await processSwapExecution(job);
});

SWAP_CONFIRMATION_QUEUE.process(3, async (job) => {
  await processSwapConfirmation(job);
});
```

**Action Required:**
- [ ] Open `service/jobs/worker.ts`
- [ ] Verify swap queue processors are registered (should already be there)
- [ ] Verify monitoring service is initialized for swap queues

---

### 4. Database Migration (if needed)

Check if `DepositSession` entity has `matchedAmount` field:

```bash
# Connect to your database and check
psql -U your_user -d your_database
\d deposit_sessions
# Look for "matched_amount" column
```

If `matchedAmount` doesn't exist, you may need to run migrations or manually add it.

**Action Required:**
- [ ] Verify `deposit_sessions` table schema
- [ ] Run migrations if needed: `npm run migration:run` (adjust command as needed)

---

### 5. Fund Server Wallet (Testnet)

The swap execution requires the server wallet to have Base Sepolia ETH for gas:

```bash
# Get your server wallet address (from logs or database)
# Fund it with Base Sepolia ETH from faucet
```

**Faucets:**
- Base Sepolia ETH: https://www.alchemy.com/faucets/base-sepolia
- Or bridge from Sepolia: https://bridge.base.org/

**Action Required:**
- [ ] Get server wallet address
- [ ] Fund with Base Sepolia ETH (at least 0.1 ETH)
- [ ] Optionally fund with testnet USDC for testing

---

### 6. Start Services

Start all required services in order:

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start PostgreSQL (if not running)
# (varies by OS)

# Terminal 3: Start worker (background jobs)
npm run worker
# or
node service/jobs/worker.ts

# Terminal 4: Start API server
npm run dev
# or
npm start
```

**Action Required:**
- [ ] Verify Redis is running: `redis-cli ping` (should return "PONG")
- [ ] Verify PostgreSQL is running and database exists
- [ ] Start worker process (must run for background jobs)
- [ ] Start API server
- [ ] Verify Bull Board is accessible: http://localhost:3000/admin/queues

---

### 7. Initial Health Check

```bash
# Test health endpoint
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "ok",
#   "service": "kiota-api",
#   "timestamp": "2026-01-21T..."
# }

# Test root endpoint (shows all routes including swap)
curl http://localhost:3000/

# Expected: Should list /api/v1/swap in endpoints
```

**Action Required:**
- [ ] Verify health endpoint responds
- [ ] Verify swap routes appear in root endpoint response
- [ ] Check server logs for any startup errors

---

### 8. Verify Queue Connectivity

```bash
# Check Bull Board UI
open http://localhost:3000/admin/queues

# You should see these queues:
# - swap-execution
# - swap-confirmation
# - (plus existing deposit queues)
```

**Action Required:**
- [ ] Open Bull Board in browser
- [ ] Verify `swap-execution` queue exists
- [ ] Verify `swap-confirmation` queue exists
- [ ] Check queue health (should be green/active)

---

## 🧪 Ready to Test?

Once all checkboxes above are complete, you're ready to proceed with testing:

1. **Next Steps**: Follow `TESTING_SWAP_INTEGRATION.md` for detailed testing instructions
2. **Use Postman**: Import the Postman collection from `TESTING_SWAP_INTEGRATION.md`
3. **Monitor Logs**: Watch worker logs in Terminal 3 for background job execution
4. **Monitor Bull Board**: Keep http://localhost:3000/admin/queues open to watch jobs

---

## 🚨 Common Issues & Quick Fixes

### Issue: "1inch API not configured"
**Fix**: Set `ONEINCH_API_KEY` in `.env` and restart server

### Issue: "Queue not found" or jobs not processing
**Fix**:
1. Verify worker is running (`npm run worker`)
2. Check Redis connection
3. Restart worker process

### Issue: TypeScript compilation errors
**Fix**:
```bash
npm run build
# Check for any remaining errors
```

### Issue: "Transaction not found" in confirmation processor
**Fix**: Verify database connection and transaction was created successfully

### Issue: Swap fails with "Insufficient liquidity"
**Fix**:
1. Check testnet token addresses are correct
2. Try smaller amounts
3. Verify 1inch supports the token pair on Base Sepolia

---

## 📊 Success Criteria

Before moving to comprehensive testing, verify:

- [ ] All environment variables set
- [ ] Redis + PostgreSQL + Worker + API all running
- [ ] Bull Board shows swap queues
- [ ] Health endpoint responds
- [ ] No errors in server startup logs
- [ ] Server wallet funded with testnet ETH
- [ ] Testnet token addresses updated (or workaround planned)

**When all checked**: Proceed to `TESTING_SWAP_INTEGRATION.md` → Step 1: Verify Setup ✅
