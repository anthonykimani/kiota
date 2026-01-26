# Swap API Testing Guide

Complete guide for testing the hybrid 1inch swap integration on Ethereum mainnet and Ethereum Sepolia testnet.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Starting the Services](#starting-the-services)
4. [Authentication](#authentication)
5. [Testing Endpoints](#testing-endpoints)
6. [Monitoring Results](#monitoring-results)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Node.js v18+ installed
- PostgreSQL running locally
- Redis running locally
- An Ethereum wallet with private key

### Required Accounts
- **1inch Developer Portal**: Get API key from https://portal.1inch.dev
- **Ethereum Sepolia Faucet**: Get test ETH from https://sepoliafaucet.com
- **Ethereum Sepolia USDC**: Get testnet USDC from Circle faucet

### Wallet Funding

**For Testnet (Ethereum Sepolia):**
```
1. Get test ETH from faucet (needed for gas fees)
2. Get test USDC from Circle testnet faucet
   USDC Address: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

**For Mainnet (Ethereum):**
```
1. Fund wallet with small amount of USDC for testing
2. NO ETH needed (Fusion is gasless)
```

---

## Environment Setup

### 1. Configure Environment Variables

The app is already configured in `.env.development`. Ensure these are set:

```bash
# Blockchain Network (choose one)
ONEINCH_NETWORK="ethereum-sepolia"    # For testnet
# ONEINCH_NETWORK="ethereum"          # For mainnet

# 1inch API Configuration
ONEINCH_API_KEY="your_1inch_api_key_here"

# Server Wallet (signs transactions)
SWAP_WALLET_PRIVATE_KEY="0x..."       # Your wallet private key

# RPC Endpoints (optional, defaults are provided)
NODE_URL="https://ethereum-sepolia-rpc.publicnode.com"  # Testnet
# NODE_URL="https://eth.llamarpc.com"                   # Mainnet

# Application
PORT=3003
```

### 2. Update .env.development

Edit `/home/priest/kiota/kiota-api/.env.development`:

```bash
# Add these lines (or update if they exist)
SWAP_WALLET_PRIVATE_KEY="0xYOUR_PRIVATE_KEY_HERE"
NODE_URL="https://ethereum-sepolia-rpc.publicnode.com"
```

**⚠️ Security Warning**: Never commit private keys to git. Add `.env.development` to `.gitignore`.

### 3. Check Token Configuration

The supported assets are:
- **USDC**: Deposit currency (available on testnet)
- **USDM**: Mountain Protocol USD (mainnet only for now)
- **BCSPX**: Backed CSP Index (mainnet only for now)
- **PAXG**: Paxos Gold (mainnet only for now)

For testnet testing, only USDC swaps to other testnet-deployed tokens will work. You may need to deploy test versions of USDM, BCSPX, PAXG on Sepolia.

---

## Starting the Services

### 1. Install Dependencies

```bash
cd /home/priest/kiota/kiota-api
npm install
```

### 2. Start Database

Ensure PostgreSQL is running:
```bash
# Check if running
psql -h localhost -U postgres -d kiota_postgres -c "SELECT 1;"
```

### 3. Start Redis

Ensure Redis is running:
```bash
# Check if running
redis-cli ping
# Should return: PONG
```

If not running:
```bash
redis-server &
```

### 4. Start Worker Process

In terminal 1:
```bash
npm run worker
```

Expected output:
```
[INFO] Creating [Classic Swap|Fusion SDK] provider for [testnet|mainnet]
[INFO] Swap provider initialized successfully
[INFO] Worker listening for jobs...
```

### 5. Start API Server

In terminal 2:
```bash
npm run dev
```

Expected output:
```
[INFO] Server running on http://localhost:3003
```

### 6. Verify Bull Board

Open browser to: http://localhost:3003/admin/queues

You should see:
- Swap Execution queue
- Swap Confirmation queue

---

## Authentication

All swap endpoints require authentication via Bearer token.

### Generate Test Token

Create a token with this format:

```javascript
// Node.js
const payload = {
  userId: "test-user-123",
  iat: Date.now(),
  exp: Date.now() + 3600000  // Expires in 1 hour
};

const token = Buffer.from(JSON.stringify(payload)).toString('base64');
console.log('Bearer', token);
```

**Example Token:**
```bash
Bearer eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMTIzIiwiaWF0IjoxNzM3NjU1MjAwMDAwLCJleHAiOjE3Mzc2NTg4MDAwMDB9
```

### Save Token for Reuse

```bash
export AUTH_TOKEN="Bearer eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMTIzIiwiaWF0IjoxNzM3NjU1MjAwMDAwLCJleHAiOjE3Mzc2NTg4MDAwMDB9"
```

---

## Testing Endpoints

### Base URL
```
http://localhost:3003/api/swap
```

---

### 1. GET /api/swap/quote - Get Swap Quote

Get pricing preview without executing a swap.

**Request:**
```bash
curl -X GET "http://localhost:3003/api/swap/quote?fromAsset=USDC&toAsset=USDM&amount=10" \
  -H "Authorization: $AUTH_TOKEN"
```

**Query Parameters:**
- `fromAsset`: Source token (USDC, USDM, BCSPX, PAXG)
- `toAsset`: Destination token (USDC, USDM, BCSPX, PAXG)
- `amount`: Amount in token units (not wei)

**Expected Response:**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "fromAsset": "USDC",
    "toAsset": "USDM",
    "fromAmount": 10,
    "estimatedToAmount": 9.98,
    "slippage": 1.0,
    "priceImpact": 0.15,
    "fees": {
      "network": 0,
      "protocol": 0
    },
    "route": [
      "1inch Router"
    ],
    "expiresAt": "2024-01-23T12:34:56.789Z"
  },
  "errors": null
}
```

**Common Errors:**

```json
// 401 Unauthorized
{
  "status": 401,
  "message": "Unauthorized",
  "data": null,
  "errors": ["Authorization header required"]
}

// 503 Service Unavailable
{
  "status": 503,
  "message": "Service Unavailable",
  "data": null,
  "errors": ["1inch API not configured. Please set ONEINCH_API_KEY"]
}

// 400 Bad Request
{
  "status": 400,
  "message": "Bad Request",
  "data": null,
  "errors": ["Cannot swap same asset"]
}
```

---

### 2. POST /api/swap/execute - Execute Swap

Execute a swap transaction. This queues a background job that will:
- Call the swap provider (Classic Swap or Fusion SDK based on network)
- Sign and submit the transaction/order
- Poll for completion
- Update balances when complete

**Request:**
```bash
curl -X POST "http://localhost:3003/api/swap/execute" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromAsset": "USDC",
    "toAsset": "USDM",
    "amount": 10,
    "slippage": 1.0
  }'
```

**Body Parameters:**
- `fromAsset`: Source token (required)
- `toAsset`: Destination token (required)
- `amount`: Amount in token units (required)
- `slippage`: Slippage tolerance in percent (optional, default: 1.0)

**Expected Response:**
```json
{
  "status": 201,
  "message": "Created",
  "data": {
    "transactionId": "uuid-here",
    "status": "pending",
    "fromAsset": "USDC",
    "toAsset": "USDM",
    "fromAmount": 10,
    "estimatedToAmount": 9.98,
    "estimatedCompletionTime": "2-5 minutes"
  },
  "errors": null
}
```

**What Happens Next:**

1. **Swap Execution Job** (runs immediately):
   - Calls swap provider
   - **Classic Swap**: Approves token (if needed), signs transaction, broadcasts to RPC
   - **Fusion SDK**: Creates EIP-712 order, submits to Fusion orderbook
   - Updates transaction with order hash/tx hash

2. **Swap Confirmation Job** (polls every 5 seconds):
   - **Classic Swap**: Polls RPC for transaction receipt
   - **Fusion SDK**: Polls 1inch API for order status
   - When complete: Updates balances atomically

---

### 3. GET /api/swap/status/:transactionId - Check Status

Check the status of a swap transaction.

**Request:**
```bash
curl -X GET "http://localhost:3003/api/swap/status/uuid-here" \
  -H "Authorization: $AUTH_TOKEN"
```

**Expected Response (Pending):**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "transactionId": "uuid-here",
    "status": "pending",
    "fromAsset": "USDC",
    "toAsset": "USDM",
    "fromAmount": 10,
    "estimatedToAmount": 9.98,
    "actualToAmount": null,
    "orderHash": "0x...",
    "txHash": null,
    "createdAt": "2024-01-23T12:00:00Z",
    "completedAt": null
  },
  "errors": null
}
```

**Expected Response (Completed):**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "transactionId": "uuid-here",
    "status": "completed",
    "fromAsset": "USDC",
    "toAsset": "USDM",
    "fromAmount": 10,
    "estimatedToAmount": 9.98,
    "actualToAmount": 9.97,
    "orderHash": "0x...",
    "txHash": "0x...",
    "createdAt": "2024-01-23T12:00:00Z",
    "completedAt": "2024-01-23T12:02:30Z"
  },
  "errors": null
}
```

**Status Values:**
- `pending`: Swap queued, not yet executed
- `processing`: Order submitted, waiting for fill
- `completed`: Swap successful, balances updated
- `failed`: Swap failed (see error message)

---

### 4. GET /api/swap/history - Get Swap History

Get user's swap transaction history.

**Request:**
```bash
curl -X GET "http://localhost:3003/api/swap/history" \
  -H "Authorization: $AUTH_TOKEN"
```

**Expected Response:**
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "transactionId": "uuid-1",
      "status": "completed",
      "fromAsset": "USDC",
      "toAsset": "USDM",
      "fromAmount": 10,
      "actualToAmount": 9.97,
      "txHash": "0x...",
      "createdAt": "2024-01-23T12:00:00Z",
      "completedAt": "2024-01-23T12:02:30Z"
    },
    {
      "transactionId": "uuid-2",
      "status": "pending",
      "fromAsset": "USDC",
      "toAsset": "BCSPX",
      "fromAmount": 50,
      "actualToAmount": null,
      "txHash": null,
      "createdAt": "2024-01-23T12:05:00Z",
      "completedAt": null
    }
  ],
  "errors": null
}
```

---

## Monitoring Results

### 1. Watch Logs in Real-Time

**Worker Logs (Terminal 1):**
```bash
# Watch for job processing
tail -f worker.log  # If you redirect output to a file

# Or watch stdout
# Jobs will log:
# - "Executing swap for transaction {id}"
# - "Swap executed successfully"
# - "Polling order status for {orderHash}"
# - "Order completed, updating balances"
```

**Server Logs (Terminal 2):**
```bash
# Watch API requests
# Logs will show:
# - "Fetching swap quote"
# - "Getting quote for swap execution"
# - "Swap transaction created"
# - "Swap execution job queued"
```

### 2. Bull Board Dashboard

Open http://localhost:3003/admin/queues

**Swap Execution Queue:**
- Shows active swap execution jobs
- Click job to see details (transaction ID, amount, assets)
- See job status: waiting, active, completed, failed

**Swap Confirmation Queue:**
- Shows active confirmation polling jobs
- See polling attempts and current status

**Failed Jobs:**
- Click "Failed" tab to see errors
- View stack traces and retry history

### 3. Check Transaction on Explorer

**Ethereum Sepolia (Testnet):**
```
https://sepolia.etherscan.io/tx/{txHash}
```

**Ethereum Mainnet:**
```
https://etherscan.io/tx/{txHash}
```

### 4. Database Queries

Check transaction status directly:

```sql
-- Connect to database
psql -h localhost -U postgres -d kiota_postgres

-- View recent swaps
SELECT
  id,
  user_id,
  source_asset,
  destination_asset,
  source_amount,
  destination_amount,
  status,
  metadata->>'orderHash' as order_hash,
  metadata->>'provider' as provider,
  created_at,
  updated_at
FROM transactions
WHERE type = 'swap'
ORDER BY created_at DESC
LIMIT 10;

-- Check specific swap
SELECT * FROM transactions WHERE id = 'uuid-here';
```

---

## Troubleshooting

### Issue: "1inch API not configured"

**Cause**: Missing `ONEINCH_API_KEY` environment variable

**Fix**:
1. Get API key from https://portal.1inch.dev
2. Add to `.env.development`:
   ```bash
   ONEINCH_API_KEY="your_key_here"
   ```
3. Restart worker and server

---

### Issue: "Insufficient funds for gas"

**Cause**: Server wallet doesn't have enough ETH for gas (Classic Swap only)

**Fix**:
1. Check wallet balance:
   ```bash
   cast balance $SWAP_WALLET_ADDRESS --rpc-url https://ethereum-sepolia-rpc.publicnode.com
   ```
2. Get test ETH from faucet: https://sepoliafaucet.com
3. Send to your `SWAP_WALLET_ADDRESS`

---

### Issue: "Token not deployed on ethereum-sepolia testnet"

**Cause**: USDM, BCSPX, or PAXG don't have testnet addresses configured

**Fix**:
For testnet, only USDC is available. To test other assets:
1. Deploy test versions on Sepolia, or
2. Use mainnet with `ONEINCH_NETWORK="ethereum"`

---

### Issue: Fusion order expires unfilled

**Cause**: Order not competitive enough for resolvers to fill

**Fix**:
1. Check order status on 1inch:
   ```bash
   curl -H "Authorization: Bearer $ONEINCH_API_KEY" \
     https://api.1inch.dev/fusion/orders/{orderHash}
   ```
2. Try larger amounts (minimum ~$10 recommended)
3. Increase slippage tolerance

---

### Issue: Worker not processing jobs

**Check**:
1. Redis is running:
   ```bash
   redis-cli ping
   ```
2. Worker process is running:
   ```bash
   ps aux | grep "npm run worker"
   ```
3. Check Bull Board for stuck jobs
4. Restart worker:
   ```bash
   # Kill existing worker
   pkill -f "npm run worker"

   # Start new worker
   npm run worker
   ```

---

### Issue: "Invalid token format"

**Cause**: Auth token is malformed or expired

**Fix**:
1. Generate new token (see [Authentication](#authentication))
2. Ensure token is base64-encoded JSON
3. Check expiration timestamp is in future

---

## Testing Workflow Examples

### Example 1: Complete Testnet Flow (Classic Swap)

```bash
# 1. Set environment to testnet
export ONEINCH_NETWORK="ethereum-sepolia"

# 2. Generate auth token
export AUTH_TOKEN="Bearer $(node -e 'console.log(Buffer.from(JSON.stringify({userId:"test-123",iat:Date.now(),exp:Date.now()+3600000})).toString("base64"))')"

# 3. Start services
npm run worker &
npm run dev &

# 4. Get quote
curl -X GET "http://localhost:3003/api/swap/quote?fromAsset=USDC&toAsset=USDM&amount=10" \
  -H "Authorization: $AUTH_TOKEN"

# 5. Execute swap
SWAP_RESPONSE=$(curl -X POST "http://localhost:3003/api/swap/execute" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fromAsset":"USDC","toAsset":"USDM","amount":10}')

# 6. Extract transaction ID
TRANSACTION_ID=$(echo $SWAP_RESPONSE | jq -r '.data.transactionId')

# 7. Poll status every 10 seconds
watch -n 10 "curl -s -X GET \"http://localhost:3003/api/swap/status/$TRANSACTION_ID\" -H \"Authorization: $AUTH_TOKEN\" | jq"

# 8. Check on Etherscan when complete
```

---

### Example 2: Mainnet Flow (Fusion SDK)

```bash
# 1. Set environment to mainnet
export ONEINCH_NETWORK="ethereum"

# 2. Follow steps 2-8 from Example 1

# Note: Fusion takes 1-5 minutes (auction-based)
```

---

### Example 3: Automated Testing Script

Create `test-swap.sh`:

```bash
#!/bin/bash

# Configuration
API_URL="http://localhost:3003/api/swap"
FROM_ASSET="USDC"
TO_ASSET="USDM"
AMOUNT=10

# Generate token
PAYLOAD=$(cat <<EOF
{
  "userId": "test-user-123",
  "iat": $(date +%s)000,
  "exp": $(($(date +%s) + 3600))000
}
EOF
)
TOKEN=$(echo -n "$PAYLOAD" | base64)
AUTH_HEADER="Authorization: Bearer $TOKEN"

# Test 1: Get quote
echo "Testing quote endpoint..."
QUOTE=$(curl -s -X GET "$API_URL/quote?fromAsset=$FROM_ASSET&toAsset=$TO_ASSET&amount=$AMOUNT" \
  -H "$AUTH_HEADER")
echo "$QUOTE" | jq

# Test 2: Execute swap
echo "Executing swap..."
SWAP=$(curl -s -X POST "$API_URL/execute" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d "{\"fromAsset\":\"$FROM_ASSET\",\"toAsset\":\"$TO_ASSET\",\"amount\":$AMOUNT}")
echo "$SWAP" | jq

# Extract transaction ID
TX_ID=$(echo "$SWAP" | jq -r '.data.transactionId')

if [ "$TX_ID" != "null" ]; then
  echo "Transaction ID: $TX_ID"

  # Test 3: Poll status
  echo "Polling status..."
  for i in {1..30}; do
    STATUS=$(curl -s -X GET "$API_URL/status/$TX_ID" -H "$AUTH_HEADER")
    CURRENT_STATUS=$(echo "$STATUS" | jq -r '.data.status')

    echo "[$i/30] Status: $CURRENT_STATUS"

    if [ "$CURRENT_STATUS" = "completed" ] || [ "$CURRENT_STATUS" = "failed" ]; then
      echo "Final status:"
      echo "$STATUS" | jq
      break
    fi

    sleep 10
  done
else
  echo "Failed to execute swap"
  exit 1
fi
```

Run:
```bash
chmod +x test-swap.sh
./test-swap.sh
```

---

## Success Criteria

Your swap integration is working correctly when:

✅ **Quote Endpoint**:
- Returns pricing for USDC → other assets
- Response time < 2 seconds
- Price impact looks reasonable

✅ **Execute Endpoint**:
- Creates transaction record
- Queues background job
- Returns transaction ID immediately

✅ **Background Processing**:
- Execution job runs within 5 seconds
- **Classic Swap**: Transaction confirmed on Etherscan within 1 minute
- **Fusion**: Order fills within 1-5 minutes

✅ **Status Endpoint**:
- Status updates from pending → processing → completed
- Transaction hash appears when complete
- Actual output amount is close to estimate

✅ **Bull Board**:
- Jobs appear in queue
- No jobs stuck in "active" state for >5 minutes
- Failed jobs have clear error messages

---

## Next Steps

After successful testing:

1. **Test Different Asset Pairs**: Try USDC → BCSPX, USDC → PAXG
2. **Test Different Amounts**: Small ($5), medium ($100), large ($1000+)
3. **Test Edge Cases**: Same asset swap (should fail), zero amount (should fail)
4. **Test Auto-Rebalancing**: Trigger rebalancing logic if implemented
5. **Test Deposit Conversion**: Test converting deposits to target assets
6. **Load Testing**: Execute multiple swaps concurrently
7. **Monitor Gas Costs**: Track ETH spent on Classic Swap
8. **Deploy to Staging**: Test on staging environment
9. **Deploy to Production**: Use Fusion on mainnet for gasless swaps

---

## Additional Resources

- **1inch Documentation**: https://docs.1inch.io
- **1inch Developer Portal**: https://portal.1inch.dev
- **Ethereum Sepolia Faucet**: https://sepoliafaucet.com
- **Etherscan Sepolia**: https://sepolia.etherscan.io
- **Architecture Docs**: `docs/SWAP_PROVIDER_ARCHITECTURE.md`
- **API Comparison**: `docs/1INCH-API-COMPARISON.md`
