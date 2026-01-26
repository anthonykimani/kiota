# Quick Swap API Test

Fast reference for testing swap endpoints.

## Setup (One-Time)

```bash
# 1. Update .env.development
ONEINCH_NETWORK="ethereum-sepolia"  # or "ethereum" for mainnet
ONEINCH_API_KEY="your_api_key_here"
SWAP_WALLET_PRIVATE_KEY="0x..."
NODE_URL="https://ethereum-sepolia-rpc.publicnode.com"

# 2. Start services
npm run worker &    # Terminal 1
npm run dev &       # Terminal 2

# 3. Generate auth token
export AUTH_TOKEN="Bearer $(node -e 'console.log(Buffer.from(JSON.stringify({userId:"test-123",iat:Date.now(),exp:Date.now()+3600000})).toString("base64"))')"
```

## Quick Tests

### 1. Get Quote
```bash
curl "http://localhost:3003/api/swap/quote?fromAsset=USDC&toAsset=USDM&amount=10" \
  -H "Authorization: $AUTH_TOKEN" | jq
```

### 2. Execute Swap
```bash
curl -X POST "http://localhost:3003/api/swap/execute" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fromAsset":"USDC","toAsset":"USDM","amount":10}' | jq
```

### 3. Check Status (replace UUID with your transaction ID)
```bash
curl "http://localhost:3003/api/swap/status/YOUR-TRANSACTION-ID" \
  -H "Authorization: $AUTH_TOKEN" | jq
```

### 4. View History
```bash
curl "http://localhost:3003/api/swap/history" \
  -H "Authorization: $AUTH_TOKEN" | jq
```

## Monitoring

- **Bull Board**: http://localhost:3003/admin/queues
- **Logs**: Watch terminals running worker and dev server
- **Etherscan**: https://sepolia.etherscan.io (testnet) or https://etherscan.io (mainnet)

## Common Issues

**"1inch API not configured"** → Set `ONEINCH_API_KEY` in `.env.development`

**"Insufficient funds"** → Fund wallet with ETH (testnet only) or USDC

**"Token not deployed"** → Only USDC available on Sepolia testnet

**"Authorization required"** → Regenerate `AUTH_TOKEN`

## Full Documentation

See `docs/TESTING_GUIDE.md` for complete instructions.
