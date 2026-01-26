# Swap Provider Architecture

## Overview

The Kiota API uses a **hybrid swap provider architecture** that seamlessly switches between two 1inch API implementations based on the deployment environment:

- **Ethereum Sepolia (Testnet)**: Uses 1inch Classic Swap API v6.1
- **Ethereum Mainnet (Production)**: Uses 1inch Fusion SDK

This architecture allows safe testnet iteration while providing the best production experience with gasless swaps.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Swap Controller / Processors                 │
│                  (Uses swapProvider interface)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Swap Provider   │
                    │     Factory      │
                    │                  │
                    │ createSwapProvider()
                    └────────┬─────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼──────────┐       ┌─────────▼──────────┐
    │ ClassicSwapProvider│       │ FusionSwapProvider │
    │   (Ethereum Sepolia)   │       │   (Ethereum Mainnet)   │
    └─────────┬──────────┘       └─────────┬──────────┘
              │                             │
    ┌─────────▼──────────┐       ┌─────────▼──────────┐
    │ 1inch Classic Swap │       │  1inch Fusion SDK  │
    │    API v6.1        │       │ (Official SDK)     │
    │  REST Endpoints    │       │                    │
    └────────────────────┘       └────────────────────┘
```

---

## Core Components

### 1. ISwapProvider Interface

**Location**: `service/interfaces/ISwapProvider.ts`

Common interface that both providers implement:

```typescript
interface ISwapProvider {
  getQuote(params: QuoteParams): Promise<QuoteResult>
  executeSwap(params: SwapParams): Promise<SwapResult>
  getSwapStatus(orderId: string): Promise<SwapStatus>
  isConfigured(): boolean
  getProviderName(): string
}
```

**Benefits**:
- Controllers and processors are agnostic to the underlying implementation
- Easy to add new providers in the future (e.g., Uniswap, ParaSwap)
- Consistent API across different swap mechanisms

### 2. Swap Provider Factory

**Location**: `service/services/swap-provider.factory.ts`

Automatically selects the correct provider based on `ONEINCH_NETWORK` environment variable:

```typescript
export function createSwapProvider(): ISwapProvider {
  const network = process.env.ONEINCH_NETWORK || 'base';
  const isTestnet = network.includes('sepolia') || network.includes('testnet');

  if (isTestnet) {
    return new ClassicSwapProvider();  // Testnet support
  } else {
    return new FusionSwapProvider();    // Production gasless swaps
  }
}
```

**Selection Logic**:
- If network name contains `sepolia` or `testnet` → **Classic Swap**
- Otherwise → **Fusion SDK**

### 3. ClassicSwapProvider

**Location**: `service/services/classic-swap.provider.ts`

**Use Case**: Ethereum Sepolia testnet development and testing

**Implementation Details**:
- REST API integration with `https://api.1inch.dev/swap/v6.1/{chainId}`
- Uses `viem` for transaction signing and broadcasting
- Handles ERC20 token approvals automatically
- Monitors transaction status via RPC

**Flow**:
```
1. getQuote() → GET /quote (pricing preview)
2. executeSwap() →
   a. Check token allowance
   b. Approve token if needed (broadcast approval tx, wait for confirmation)
   c. GET /swap (build swap transaction)
   d. Broadcast swap transaction via viem
   e. Return txHash
3. getSwapStatus() → Poll RPC for transaction receipt
```

**Pros**:
- ✅ Works on Ethereum Sepolia testnet
- ✅ Instant execution (no auction delay)
- ✅ Well-documented REST API
- ✅ Predictable behavior

**Cons**:
- ❌ User (server wallet) pays gas fees
- ❌ No MEV protection
- ❌ Limited to DEX liquidity only

### 4. FusionSwapProvider

**Location**: `service/services/fusion-swap.provider.ts`

**Use Case**: Ethereum mainnet production deployment

**Implementation Details**:
- Uses official `@1inch/fusion-sdk` package
- Initializes with `PrivateKeyProviderConnector` for server-side signing
- Leverages `ethers.js` for blockchain calls
- Orders are filled by professional market makers (resolvers)

**Flow**:
```
1. getQuote() → sdk.getQuote() (pricing preview from Fusion API)
2. executeSwap() →
   a. sdk.placeOrder() (creates EIP-712 signed order)
   b. Submit order to Fusion orderbook
   c. Return orderHash
3. getSwapStatus() → sdk.getOrderStatus() (poll order status)
   - Status: pending → processing → completed | failed
```

**Pros**:
- ✅ **Gasless swaps** - resolver pays all gas fees
- ✅ **MEV protection** - orders bundled by resolvers
- ✅ **Better pricing** - access to CEX + DEX liquidity
- ✅ Official SDK with TypeScript support

**Cons**:
- ❌ **NO testnet support** - mainnet only
- ❌ Slower execution (1-5 minutes for auction)
- ❌ Less predictable (order may expire unfilled)

---

## Response Format Normalization

Both providers return the same interface types, but map different underlying responses:

### Quote Response

| Field | Classic Swap | Fusion SDK |
|-------|--------------|------------|
| `fromToken` | `data.fromToken.address` | `quote.fromTokenAddress` |
| `toToken` | `data.toToken.address` | `quote.toTokenAddress` |
| `toAmount` | `data.toAmount` | `quote.toAmount` |
| `estimatedGas` | `data.gas` | `undefined` (gasless) |
| `route` | `data.protocols[0]` | `[]` (market makers) |

### Swap Result

| Field | Classic Swap | Fusion SDK |
|-------|--------------|------------|
| `orderId` | `txHash` | `orderHash` |
| `status` | `'pending'` | `'pending'` |
| `provider` | `'classic'` | `'fusion'` |
| `txHash` | Available immediately | Available after fill |

### Swap Status

| Field | Classic Swap | Fusion SDK |
|-------|--------------|------------|
| `status` | `'pending' \| 'completed' \| 'failed'` | `'pending' \| 'processing' \| 'completed' \| 'failed'` |
| `txHash` | Same as `orderId` | From fills array |
| `actualOutput` | From receipt logs | Sum of `fills[].filledMakerAmount` |

---

## Environment Configuration

### Ethereum Sepolia (Testnet)

```bash
# Network selection
ONEINCH_NETWORK="ethereum-sepolia"

# API authentication
ONEINCH_API_KEY="your_1inch_api_key"

# Wallet configuration
SWAP_WALLET_PRIVATE_KEY="0x..."  # Server wallet for signing/broadcasting

# RPC endpoint
NODE_URL="https://ethereum-sepolia-rpc.publicnode.com"
```

**Result**: Uses `ClassicSwapProvider` with 1inch Classic Swap API v6.1

### Ethereum Mainnet (Production)

```bash
# Network selection
ONEINCH_NETWORK="ethereum"

# API authentication
ONEINCH_API_KEY="your_1inch_api_key"

# Wallet configuration
SWAP_WALLET_PRIVATE_KEY="0x..."  # Server wallet for Fusion order signing

# RPC endpoint
NODE_URL="https://eth.llamarpc.com"
```

**Result**: Uses `FusionSwapProvider` with 1inch Fusion SDK

---

## Integration Points

### Controllers

**Location**: `service/controllers/swap.controller.ts`

```typescript
import { swapProvider } from '../services/swap-provider.factory';

// Usage in controller
const quote = await swapProvider.getQuote({
  fromToken: fromTokenAddress,
  toToken: toTokenAddress,
  amount: amountWei,
});
```

Controllers are **provider-agnostic** - they don't know or care whether Classic Swap or Fusion is being used.

### Background Job Processors

#### Swap Execution Processor

**Location**: `service/jobs/processors/swap-execution.processor.ts`

```typescript
// Execute swap via provider (Classic or Fusion based on network)
const swapResult = await swapProvider.executeSwap({
  fromToken: fromTokenAddress,
  toToken: toTokenAddress,
  amount: amountWei,
  userAddress: wallet.address,
});

// Store provider type and order ID in metadata
await swapRepo.updateSwapMetadata(transactionId, {
  orderHash: swapResult.orderId,
  provider: swapResult.provider,  // 'classic' or 'fusion'
  orderStatus: swapResult.status,
});
```

#### Swap Confirmation Processor

**Location**: `service/jobs/processors/swap-confirmation.processor.ts`

```typescript
// Poll order status (RPC for Classic, 1inch API for Fusion)
const orderStatus = await swapProvider.getSwapStatus(orderHash);

// Handle status regardless of provider
if (orderStatus.status === 'completed') {
  // Update balances atomically
  await balanceUpdaterService.updateAfterSwap({...});
}
```

---

## Testing Strategy

### Phase 1: Testnet Testing (Classic Swap)

```bash
# Set environment to Ethereum Sepolia
export ONEINCH_NETWORK="ethereum-sepolia"
export ONEINCH_API_KEY="your_key"
export SWAP_WALLET_PRIVATE_KEY="0x..."
export NODE_URL="https://ethereum-sepolia-rpc.publicnode.com"

# Start services
npm run worker  # Background jobs
npm run dev     # API server
```

**Test Cases**:
1. Quote endpoint returns pricing for USDC → USDM
2. Execute swap completes successfully (server pays gas)
3. Transaction confirmed on Etherscan Sepolia
4. Balance updates are atomic and correct
5. Auto-rebalancing works with drift >5%
6. Deposit conversion allocates funds correctly

### Phase 2: Mainnet Testing (Fusion SDK)

```bash
# Set environment to Ethereum mainnet
export ONEINCH_NETWORK="ethereum"
export ONEINCH_API_KEY="your_key"
export SWAP_WALLET_PRIVATE_KEY="0x..."
export NODE_URL="https://eth.llamarpc.com"

# Start services
npm run worker
npm run dev
```

**Test Cases**:
1. Quote endpoint uses Fusion provider (check logs)
2. Small swap (~$5) executes without gas fees
3. Order fills within 5 minutes
4. Transaction confirmed on Etherscan
5. Gasless execution verified (no gas deducted from server wallet)
6. Larger swaps work after initial success

---

## Monitoring & Observability

### Logging

Both providers use structured logging with context:

```typescript
logger.info('Fetching quote', {
  provider: 'classic' | 'fusion',
  fromToken: '0x...',
  toToken: '0x...',
  amount: '1000000',
});
```

**Log Locations**:
- Application logs: stdout/stderr
- Worker logs: Background process output
- Bull Board: http://localhost:3000/admin/queues

### Metrics to Track

| Metric | Classic Swap | Fusion SDK |
|--------|--------------|------------|
| Success Rate | Target >95% | Target >90% (auction-based) |
| Avg Execution Time | <30 seconds | 1-5 minutes |
| Gas Costs | User pays (track amount) | $0 (resolver pays) |
| Error Rate | <5% | <10% (orders can expire) |

### Health Checks

```bash
# Check provider initialization
curl http://localhost:3000/health

# Expected logs on startup:
# - "Creating [Classic Swap|Fusion SDK] provider for [testnet|mainnet]"
# - "[Provider] initialized successfully"
```

---

## Migration Path

### Development → Production

```
┌─────────────────┐
│ Local Dev       │
│ (Ethereum Sepolia)  │ → Classical Swap (testnet)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Staging         │
│ (Ethereum Sepolia)  │ → Classic Swap (testnet)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Production      │
│ (Ethereum Mainnet)  │ → Fusion SDK (gasless)
└─────────────────┘
```

**Migration Steps**:
1. Test thoroughly on Ethereum Sepolia with Classic Swap
2. Verify all three use cases work: swaps, rebalancing, conversion
3. Deploy to production with `ONEINCH_NETWORK="ethereum"`
4. Fusion SDK automatically activated
5. Monitor for 48 hours before full rollout

---

## Troubleshooting

### Issue: "Provider not configured"

**Cause**: Missing environment variables

**Fix**:
```bash
# Check configuration
echo $ONEINCH_API_KEY
echo $SWAP_WALLET_PRIVATE_KEY
echo $NODE_URL

# Restart services after setting variables
```

### Issue: Classic Swap transactions failing

**Possible Causes**:
1. Insufficient ETH for gas in server wallet
2. Token not approved
3. Insufficient token balance
4. Network congestion

**Debug**:
```bash
# Check wallet balance
cast balance $SERVER_WALLET_ADDRESS --rpc-url $NODE_URL

# Check transaction logs
tail -f worker.log | grep "classic-swap-provider"
```

### Issue: Fusion orders expiring unfilled

**Possible Causes**:
1. Order price not competitive (resolver won't fill)
2. Low liquidity for token pair
3. Network issues preventing order submission

**Debug**:
```bash
# Check order status manually
curl -H "Authorization: Bearer $ONEINCH_API_KEY" \
  https://api.1inch.dev/fusion/orders/{orderHash}

# Check logs
tail -f worker.log | grep "fusion-swap-provider"
```

---

## Future Enhancements

### Potential Additions

1. **Additional Providers**:
   - Uniswap V3 direct integration
   - Paraswap aggregator
   - Matcha/0x protocol

2. **Smart Routing**:
   - Compare quotes from multiple providers
   - Select best price automatically

3. **Fallback Logic**:
   - If Fusion order doesn't fill in 5 minutes, fallback to Classic Swap
   - Hybrid execution for best UX

4. **Gas Optimization**:
   - Batch multiple swaps into single transaction
   - Use EIP-2930 access lists

---

## Summary

The hybrid swap provider architecture provides:

✅ **Flexibility**: Easy switching between Classic and Fusion
✅ **Testability**: Safe iteration on Ethereum Sepolia testnet
✅ **Production Quality**: Gasless swaps with MEV protection on mainnet
✅ **Maintainability**: Clear separation of concerns via interfaces
✅ **Future-Proof**: Easy to add new swap providers

**Key Files**:
- Interface: `service/interfaces/ISwapProvider.ts`
- Factory: `service/services/swap-provider.factory.ts`
- Classic: `service/services/classic-swap.provider.ts`
- Fusion: `service/services/fusion-swap.provider.ts`
- Controller: `service/controllers/swap.controller.ts`
- Processors: `service/jobs/processors/swap-*.processor.ts`

For testing instructions, see `TESTING_SWAP_INTEGRATION.md`.
