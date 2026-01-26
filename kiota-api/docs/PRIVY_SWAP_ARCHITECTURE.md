# Privy + 1inch Swap Architecture

## Overview

The Kiota API uses **Privy embedded wallets** combined with **1inch Classic Swap API** for decentralized swap execution.

### Key Architecture Points

✅ **Non-Custodial**: Each user has their own Privy-managed wallet
✅ **Server-Side Signing**: Privy SDK signs transactions on behalf of users
✅ **No Private Keys**: Backend never has access to user private keys
✅ **Classic Swap Only**: Currently uses 1inch Classic Swap (Fusion requires EIP-712 support)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Makes Swap Request                   │
│                  POST /api/swap/execute                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               Swap Execution Processor (Bull Job)            │
│                                                              │
│  1. Get user from database                                   │
│  2. Get user's Privy wallet ID from wallet table             │
│  3. Call swap provider with privyWalletId                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              ClassicSwapProvider (with Privy)                │
│                                                              │
│  1. Check token allowance (read-only via viem)               │
│  2. If needed: Build approve tx → Privy signs & sends        │
│  3. Build swap tx from 1inch API                             │
│  4. Privy signs & sends swap transaction                     │
│  5. Return txHash                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Privy Service (privyService)                    │
│                                                              │
│  privyService.sendTransaction(privyWalletId, tx)             │
│  → Privy signs with user's wallet                            │
│  → Broadcasts to Ethereum RPC                                │
│  → Returns transaction hash                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Ethereum Network                         │
│              (Sepolia Testnet or Mainnet)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Wallets Table

Each user has a wallet record with their Privy wallet ID:

```sql
wallets {
  id: uuid
  user_id: uuid (FK to users)
  address: string               -- Ethereum address (0x...)
  privy_user_id: string        -- Privy wallet ID (used for signing)
  provider: 'privy'
  primary_chain: 'base' | 'ethereum'
  is_active: boolean
  created_at: timestamp
}
```

**Key Field**: `privy_user_id` - This is passed to `privyService.sendTransaction()`

---

## Component Breakdown

### 1. Privy Service (`service/utils/provider/privy.ts`)

Handles all Privy SDK interactions:

```typescript
class PrivyService {
  // Send transaction (signs and broadcasts)
  async sendTransaction(walletId: string, tx: {
    to: string;
    value?: string;
    data?: string;
    chainId: number;
  }): Promise<{ success: boolean; hash?: string; error?: string }>

  // Sign transaction (signs but doesn't broadcast)
  async signTransaction(walletId, tx): Promise<{ success: boolean; signedTransaction?: string }>

  // Sign message
  async signMessage(walletId, message): Promise<{ success: boolean; signature?: string }>
}
```

**Used in swap**: `sendTransaction()` for approval and swap transactions

---

### 2. Classic Swap Provider (`service/services/classic-swap.provider.ts`)

Integrates 1inch Classic Swap API v6.1 with Privy wallets:

**Key Features:**
- Uses **viem** for read-only operations (checking allowances, receipts)
- Uses **Privy SDK** for transaction signing/broadcasting
- No longer needs `SWAP_WALLET_PRIVATE_KEY`

**Flow:**
1. Check token allowance using `publicClient.readContract()`
2. If allowance insufficient:
   - Build approve transaction calldata using `encodeFunctionData()`
   - Call `privyService.sendTransaction(privyWalletId, approveTx)`
   - Wait for approval transaction confirmation
3. Get swap transaction from 1inch API
4. Call `privyService.sendTransaction(privyWalletId, swapTx)`
5. Return transaction hash

**Methods:**
```typescript
class ClassicSwapProvider implements ISwapProvider {
  async getQuote(params: QuoteParams): Promise<QuoteResult>
  async executeSwap(params: SwapParams): Promise<SwapResult>
  async getSwapStatus(orderId: string): Promise<SwapStatus>

  private async approveToken(tokenAddress, spenderAddress, amount, privyWalletId)
  private async checkAllowance(tokenAddress, ownerAddress, spenderAddress)
  private async waitForTransaction(txHash)
}
```

---

### 3. Swap Execution Processor (`service/jobs/processors/swap-execution.processor.ts`)

Background job that executes swaps:

**Updated Flow:**
1. Get swap transaction from database
2. Get user's wallet record
3. **Extract `wallet.privyUserId`** (Privy wallet ID)
4. Call `swapProvider.executeSwap()` with `privyWalletId`
5. Save transaction hash to database
6. Queue confirmation job

**Key Change:**
```typescript
// OLD (server wallet)
const swapResult = await swapProvider.executeSwap({
  fromToken, toToken, amount, userAddress
});

// NEW (Privy wallet)
const swapResult = await swapProvider.executeSwap({
  fromToken, toToken, amount, userAddress,
  privyWalletId: wallet.privyUserId  // ← New parameter
});
```

---

### 4. Swap Confirmation Processor (`service/jobs/processors/swap-confirmation.processor.ts`)

Polls transaction status and updates balances:

**No changes needed** - still uses `swapProvider.getSwapStatus(txHash)` which checks RPC for transaction receipts.

---

## Environment Variables

### Required Variables

```bash
# Privy Configuration
PRIVY_APP_ID="your_privy_app_id"
PRIVY_APP_SECRET="your_privy_app_secret"

# 1inch Configuration
ONEINCH_API_KEY="your_1inch_api_key"              # From https://portal.1inch.dev
ONEINCH_NETWORK="ethereum-sepolia"                # or "ethereum" for mainnet

# RPC Endpoint
NODE_URL="https://ethereum-sepolia-rpc.publicnode.com"  # For reading blockchain state
```

### Removed Variables

```bash
# NO LONGER NEEDED - each user has their own Privy wallet
# SWAP_WALLET_PRIVATE_KEY  ❌ Removed
```

---

## Comparison: Old vs New Architecture

| Aspect | Old (Server Wallet) | New (Privy Wallets) |
|--------|---------------------|---------------------|
| **Private Keys** | Single `SWAP_WALLET_PRIVATE_KEY` | No private keys in backend |
| **Wallets** | One server wallet for all users | Each user has own Privy wallet |
| **Custody** | Custodial (server holds funds) | Non-custodial (Privy manages keys) |
| **Signing** | Viem signs with private key | Privy SDK signs via API |
| **Security Risk** | High (single point of failure) | Low (keys never leave Privy) |
| **User Experience** | Server pays gas | User pays gas (per wallet) |
| **Database** | Tracks virtual balances | Tracks wallet addresses + Privy IDs |

---

## Testing the Integration

### 1. Create Test User with Privy Wallet

```bash
curl -X POST "http://localhost:3003/api/auth/privy/server-create" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Response:
```json
{
  "status": 200,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "test@example.com",
      "privyUserId": "did:privy:..."
    },
    "wallet": {
      "address": "0x...",
      "privyWalletId": "01234567-89ab-cdef-0123-456789abcdef"
    },
    "token": "base64-token-here"
  }
}
```

**Save the `token` for authentication**

### 2. Fund Wallet (Testnet)

The wallet address needs:
- **ETH** for gas fees
- **USDC** for testing swaps

Get testnet funds:
- ETH: https://sepoliafaucet.com
- USDC: Circle testnet faucet (address: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`)

### 3. Execute Test Swap

```bash
export AUTH_TOKEN="Bearer base64-token-here"

curl -X POST "http://localhost:3003/api/swap/execute" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromAsset": "USDC",
    "toAsset": "USDM",
    "amount": 10
  }'
```

### 4. Monitor Execution

- **Bull Board**: http://localhost:3003/admin/queues
- **Logs**: Check worker terminal for Privy signing events
- **Etherscan**: https://sepolia.etherscan.io/address/WALLET_ADDRESS

---

## Troubleshooting

### Issue: "Privy wallet ID not found"

**Cause**: Wallet record doesn't have `privyUserId` field

**Fix**:
```sql
-- Check wallet record
SELECT id, user_id, address, privy_user_id, provider
FROM wallets
WHERE user_id = 'user-uuid-here';

-- Update if missing (use actual Privy wallet ID from Privy dashboard)
UPDATE wallets
SET privy_user_id = 'privy-wallet-id-here'
WHERE user_id = 'user-uuid-here';
```

### Issue: "Privy transaction failed"

**Cause**: Insufficient ETH for gas, or invalid transaction data

**Debug**:
1. Check wallet ETH balance:
   ```bash
   cast balance 0xWALLET_ADDRESS --rpc-url https://ethereum-sepolia-rpc.publicnode.com
   ```
2. Check Privy logs for detailed error
3. Verify token allowance is correct

### Issue: "Transaction confirmation timeout"

**Cause**: Network congestion or RPC issues

**Fix**:
- Increase timeout in `waitForTransaction()` (currently 2 minutes)
- Check transaction on Etherscan manually
- Verify RPC URL is working

---

## Why Not Fusion SDK with Privy?

**Fusion SDK requires EIP-712 typed data signing**, which is different from regular transaction signing.

**Current Situation:**
- Privy SDK supports: `signMessage()`, `signTransaction()`, `sendTransaction()`
- Fusion SDK needs: EIP-712 typed data signing (not yet in Privy service)

**To Add Fusion Support:**
1. Add `signTypedData()` method to `PrivyService`
2. Create custom Fusion SDK connector using Privy
3. Update factory to use Fusion on mainnet

For now: **Classic Swap works for both testnet and mainnet** with Privy wallets.

---

## Security Considerations

✅ **Private keys never touch backend** - Privy manages them in secure enclaves
✅ **User-specific wallets** - Each user's funds isolated
✅ **Transaction signing auditable** - Privy logs all signing requests
⚠️ **Users pay gas** - Each Privy wallet needs ETH for gas
⚠️ **Privy API dependency** - Swaps fail if Privy API is down

---

## Next Steps

1. ✅ Classic Swap with Privy wallets (DONE)
2. ⏳ Add EIP-712 signing to Privy service
3. ⏳ Implement Fusion SDK with Privy
4. ⏳ Add gas estimation to prevent failed transactions
5. ⏳ Implement gas sponsorship (meta-transactions) for better UX

---

## Summary

The refactored architecture:
- Uses **Privy embedded wallets** for non-custodial transaction signing
- Uses **1inch Classic Swap API** for swap execution
- Removes **SWAP_WALLET_PRIVATE_KEY** dependency
- Each user has their own wallet and pays their own gas
- More secure, scalable, and decentralized than custodial approach
