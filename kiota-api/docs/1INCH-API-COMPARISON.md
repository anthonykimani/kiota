# 1inch API Comparison: Classic Swap vs Fusion

## Executive Summary

We have **TWO** 1inch API options for implementing swap functionality. This document compares both approaches to help you choose the best path forward.

**CRITICAL FINDING**: 1inch Fusion **does NOT support testnets** (including Base Sepolia). This fundamentally impacts our testing strategy.

---

## Option 1: Classic Swap API (v6.1)

### Overview
Traditional DEX aggregator that routes trades through multiple liquidity sources and returns transaction data for the user to broadcast.

### Architecture Pattern
```
User → API Request → 1inch Classic Swap API → Transaction Data → User Broadcasts → DEX
```

### Key Characteristics

**✅ Pros:**
- ✅ **Testnet Support**: Works on Base Sepolia for testing
- ✅ **Well-Documented REST API**: Clear endpoints and parameters
- ✅ **Instant Execution**: No auction delay, immediate swaps
- ✅ **Simple Integration**: Standard REST API with GET requests
- ✅ **No Wallet Signing Required**: Returns unsigned transaction data
- ✅ **Predictable Gas Costs**: Gas estimates included in quote

**❌ Cons:**
- ❌ **User Pays Gas**: Requires ETH balance for gas fees (not "gasless")
- ❌ **No MEV Protection**: Vulnerable to front-running and sandwich attacks
- ❌ **Transaction Broadcasting Required**: Must sign and broadcast transactions ourselves
- ❌ **Requires Token Approval**: Two-step process (approve + swap)
- ❌ **Less Optimal Pricing**: Limited to DEX liquidity only

### API Endpoints

**Base URL**: `https://api.1inch.dev/swap/v6.1/{chainId}`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/quote` | GET | Get swap pricing (no approval needed) |
| `/swap` | GET | Build swap transaction calldata |
| `/approve/transaction` | GET | Generate token approval transaction |
| `/approve/spender` | GET | Get 1inch router address to approve |
| `/allowance` | GET | Check current token allowance |

### Request Format (GET /swap)

```
GET /swap/v6.1/8453/swap?
  src=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&
  dst=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&
  amount=1000000000000000000&
  from=0xUserWalletAddress&
  slippage=1
```

### Response Format

```json
{
  "fromToken": {
    "symbol": "ETH",
    "decimals": 18,
    "address": "0xEee..."
  },
  "toToken": {
    "symbol": "USDC",
    "decimals": 6,
    "address": "0x833..."
  },
  "toAmount": "2450000000",
  "tx": {
    "from": "0xUserAddress",
    "to": "0x1111111254fb6c44bac0bed2854e76f90643097d",
    "data": "0x...",
    "value": "1000000000000000000",
    "gasPrice": "25000000000",
    "gas": "120000"
  }
}
```

### Implementation Flow

```typescript
// 1. Get Quote
const quote = await fetch(
  `https://api.1inch.dev/swap/v6.1/8453/quote?src=${fromToken}&dst=${toToken}&amount=${amount}`,
  { headers: { 'Authorization': `Bearer ${apiKey}` } }
)

// 2. Check/Set Approval (if needed)
const allowance = await fetch(
  `https://api.1inch.dev/swap/v6.1/8453/allowance?tokenAddress=${fromToken}&walletAddress=${userAddress}`,
  { headers: { 'Authorization': `Bearer ${apiKey}` } }
)

if (allowance.allowance < amount) {
  const approveTx = await fetch(
    `https://api.1inch.dev/swap/v6.1/8453/approve/transaction?tokenAddress=${fromToken}`,
    { headers: { 'Authorization': `Bearer ${apiKey}` } }
  )
  // Broadcast approve transaction
  await wallet.sendTransaction(approveTx)
}

// 3. Build Swap Transaction
const swap = await fetch(
  `https://api.1inch.dev/swap/v6.1/8453/swap?src=${fromToken}&dst=${toToken}&amount=${amount}&from=${userAddress}&slippage=1`,
  { headers: { 'Authorization': `Bearer ${apiKey}` } }
)

// 4. Broadcast Swap Transaction
const txHash = await wallet.sendTransaction(swap.tx)

// 5. Monitor Transaction (via RPC)
const receipt = await provider.waitForTransaction(txHash)
```

---

## Option 2: Fusion API (Intent-Based Swaps)

### Overview
Intent-based swap protocol where users sign orders and professional resolvers compete to fill them, providing gasless swaps and MEV protection.

### Architecture Pattern
```
User → Sign Order → 1inch Fusion → Auction → Resolver Fills → DEX (via Resolver)
```

### Key Characteristics

**✅ Pros:**
- ✅ **Gasless for Users**: Resolver pays all gas fees
- ✅ **MEV Protection**: Protected from front-running and sandwich attacks
- ✅ **Better Pricing**: Access to both DEX and CEX liquidity through professional market makers
- ✅ **Official SDK Available**: `@1inch/fusion-sdk` with TypeScript support
- ✅ **Server-Side Friendly**: Works with single wallet via PrivateKeyProviderConnector
- ✅ **Base Mainnet Support**: Fully supported on Base (chain ID 8453)

**❌ Cons:**
- ❌ **NO TESTNET SUPPORT**: Fusion is mainnet-only (no Base Sepolia)
- ❌ **Slower Execution**: Dutch auction takes time (not instant)
- ❌ **More Complex**: Requires EIP-712 signing and order management
- ❌ **SDK Dependency**: Must use official SDK or implement complex signing logic
- ❌ **Requires Blockchain Provider**: Needs ethers.js or web3.js integration
- ❌ **Less Predictable**: No guarantee order will be filled

### API Approach

**Base URL**: `https://api.1inch.dev/fusion`

**Recommended**: Use official SDK instead of raw REST API

```bash
npm install @1inch/fusion-sdk
```

### SDK Implementation

```typescript
import { FusionSDK, NetworkEnum, PrivateKeyProviderConnector } from '@1inch/fusion-sdk'
import { JsonRpcProvider } from 'ethers'

// 1. Setup Provider
const provider = new JsonRpcProvider(NODE_URL)
const ethersProviderConnector = {
  eth: {
    call(transactionConfig) {
      return provider.call(transactionConfig)
    }
  },
  extend() {}
}

// 2. Create Connector with Private Key
const connector = new PrivateKeyProviderConnector(
  PRIVATE_KEY,
  ethersProviderConnector
)

// 3. Initialize SDK
const sdk = new FusionSDK({
  url: 'https://api.1inch.dev/fusion',
  network: NetworkEnum.COINBASE, // Base = 8453
  blockchainProvider: connector,
  authKey: DEV_PORTAL_API_TOKEN
})

// 4. Get Quote
const quote = await sdk.getQuote({
  fromTokenAddress: '0x...',
  toTokenAddress: '0x...',
  amount: '1000000000000000000'
})

// 5. Place Order (creates + submits automatically)
const orderResult = await sdk.placeOrder({
  fromTokenAddress: '0x...',
  toTokenAddress: '0x...',
  amount: '1000000000000000000',
  walletAddress: userAddress
})

// 6. Poll Order Status
while (true) {
  const { status } = await sdk.getOrderStatus(orderResult.hash)

  if (status === 'Executed' || status === 'Expired' || status === 'Refunded') {
    break
  }

  await sleep(1000) // Poll every 1 second
}
```

### Order Lifecycle

1. **Quote Phase**: Get pricing estimate
2. **Order Creation**: Sign EIP-712 order (SDK handles this)
3. **Order Submission**: Submit to Fusion orderbook
4. **Dutch Auction**: Price starts high, gradually decreases
5. **Resolver Fill**: Professional resolver accepts and executes
6. **Settlement**: Order marked as Executed, Expired, or Refunded

---

## Side-by-Side Comparison

| Feature | Classic Swap | Fusion |
|---------|--------------|--------|
| **Gas Fees** | User pays | Free (resolver pays) |
| **MEV Protection** | ❌ No | ✅ Yes |
| **Speed** | Instant | 1-5 minutes (auction) |
| **Testnet Support** | ✅ Base Sepolia | ❌ Mainnet only |
| **Liquidity** | DEX only | DEX + CEX |
| **Integration** | REST API | SDK required |
| **Complexity** | Low | Medium |
| **Transaction Broadcasting** | You handle it | Resolver handles it |
| **Pricing** | Good | Better |
| **Predictability** | High | Medium |
| **Server-Side** | ✅ Easy | ✅ Easy |
| **Best For** | Testing, instant swaps | Production, best execution |

---

## Recommendation Matrix

### Choose Classic Swap If:
- ✅ You need testnet support (Base Sepolia)
- ✅ You want instant execution
- ✅ You prefer simpler REST API integration
- ✅ Gas costs are acceptable for your use case
- ✅ You're building an MVP that needs rapid iteration

### Choose Fusion If:
- ✅ You're deploying to mainnet only
- ✅ Gasless swaps are a core feature
- ✅ MEV protection is important
- ✅ You want best execution pricing
- ✅ You can wait 1-5 minutes for fills

### Hybrid Approach (Recommended):
**Use Classic Swap for testnet development, migrate to Fusion for mainnet production**

1. **Phase 1 (Testing)**: Implement Classic Swap API for Base Sepolia
2. **Phase 2 (Production)**: Switch to Fusion SDK for Base mainnet
3. **Architecture**: Design abstraction layer that supports both implementations

---

## Testing Strategy Implications

### Classic Swap Strategy
```
Development → Base Sepolia (Classic) → Base Mainnet (Classic or Fusion)
```
- ✅ Can test on Base Sepolia with testnet tokens
- ✅ Full end-to-end testing possible before mainnet
- ❌ Different API in production if switching to Fusion

### Fusion-Only Strategy
```
Development → Base Mainnet (small amounts) → Base Mainnet (production)
```
- ❌ No testnet testing available
- ❌ Must test on mainnet with real funds
- ✅ Same API in development and production
- ⚠️ Higher risk during development

### Hybrid Strategy (Recommended)
```
Development → Base Sepolia (Classic) → Base Mainnet (Fusion)
```
- ✅ Safe testnet testing with Classic Swap
- ✅ Best production experience with Fusion
- ⚠️ Requires abstraction layer to swap implementations
- ✅ Lowest overall risk

---

## Current Implementation Status

**What's Built**: REST-based implementation attempting to use Fusion API

**Issues Identified**:
1. Using `/fusion/v1.0/{chainId}` base URL (format may be incorrect)
2. Not using official Fusion SDK
3. Raw HTTP requests instead of SDK methods
4. Response parsing may not match actual API
5. Slippage retry logic contradicts Fusion's design (Fusion uses auctions, not slippage)

**Files Requiring Changes**:
- `service/services/oneinch-fusion.service.ts` - Core API wrapper
- `service/jobs/processors/swap-execution.processor.ts` - Order placement
- `service/jobs/processors/swap-confirmation.processor.ts` - Status polling
- `service/controllers/swap.controller.ts` - API endpoints
- `package.json` - Add SDK dependency (if using Fusion)

---

## Decision Required

**You must choose ONE of the following paths:**

### Path A: Classic Swap (Testnet-Friendly)
- Refactor to use Classic Swap API v6.1
- Full testnet support on Base Sepolia
- User pays gas fees
- Instant swaps

### Path B: Fusion SDK (Production-Optimized)
- Refactor to use official `@1inch/fusion-sdk`
- Mainnet-only (no testnet)
- Gasless swaps
- MEV protection

### Path C: Hybrid (Recommended)
- Create abstraction layer (`SwapProvider` interface)
- Classic Swap implementation for testnet
- Fusion SDK implementation for mainnet
- Toggle via environment variable

---

## Next Steps

1. **Decide on approach** (A, B, or C)
2. **Confirm network strategy** (testnet vs mainnet)
3. **Approve implementation plan** (will be created based on your choice)
4. **Begin refactoring** existing code

**Question for you**: Which path do you want to take? (A, B, or C)
