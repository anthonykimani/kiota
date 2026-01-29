# Kiota API Reference

Complete REST API documentation for the Kiota wealth management platform.

**Base URL:** `http://localhost:3003/api/v1`

**Authentication:** Most endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

**Asset Classes:** The product is organized around asset classes (stable yields, tokenized stocks, tokenized gold). Token symbols shown in examples (USDM, bCSPX, PAXG) are current implementation details and may change.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Quiz & Strategy](#quiz--strategy)
3. [Wallet](#wallet)
4. [Dashboard](#dashboard)
5. [Deposits](#deposits)
6. [Portfolio](#portfolio)
7. [Swaps](#swaps)
8. [Goals](#goals)
9. [Health](#health)

---

## Authentication

### Sync User (Privy)

Sync user from Privy to database. Called after Privy login.

```
POST /auth/privy/sync
```

**Request Body:**
```json
{
  "idToken": "privy_identity_token_here"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "user": {
      "id": "uuid",
      "phoneNumber": "+254712345678",
      "email": "user@example.com",
      "primaryAuthMethod": "phone",
      "hasCompletedOnboarding": false,
      "hasCompletedQuiz": false,
      "totalPoints": 0,
      "level": 1
    },
    "wallet": {
      "address": "0x...",
      "provider": "privy"
    },
    "portfolio": {
      "id": "uuid",
      "totalValueUsd": 0
    },
    "token": "jwt_token_here",
    "isNewUser": true,
    "nextStep": "quiz"
  }
}
```

---

### Get Current User

Get authenticated user's profile.

```
GET /auth/privy/me
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": 200,
  "data": {
    "user": {
      "id": "uuid",
      "phoneNumber": "+254712345678",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "hasCompletedOnboarding": true,
      "hasCompletedQuiz": true,
      "totalPoints": 150,
      "level": 2
    },
    "wallet": {
      "address": "0x...",
      "provider": "privy"
    },
    "portfolio": {
      "id": "uuid",
      "totalValueUsd": 500.00
    }
  }
}
```

---

### Google Sign In (Legacy)

Sign in with Google OAuth.

```
POST /auth/google-login
```

**Request Body:**
```json
{
  "googleId": "google_user_id",
  "email": "user@gmail.com",
  "phoneNumber": "+254712345678"
}
```

---

## Quiz & Strategy

### Submit Quiz

Submit investment quiz answers and get an AI-generated strategy.

```
POST /quiz/submit
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "answers": {
    "primaryGoal": "wealth_growth",
    "investmentTimeline": "3-5_years",
    "riskTolerance": "moderate",
    "investmentExperience": "beginner",
    "currentSavingsRange": "50000-100000",
    "monthlySavingsRange": "5000-10000",
    "comfortableWithDollars": true,
    "investmentPriorities": ["preservation", "growth"]
  }
}
```

**Response:**
```json
{
  "status": 200,
  "data": {
    "sessionId": "uuid",
    "strategy": {
      "name": "Balanced Growth",
      "allocation": {
        "stableYields": 70,
        "tokenizedStocks": 20,
        "tokenizedGold": 10
      },
      "rationale": "Your moderate risk tolerance and 3-5 year timeline suits a balanced approach...",
      "expectedReturn": 6.5,
      "riskLevel": "Medium",
      "assets": {
        "stableYields": "USDM",
        "tokenizedStocks": "bCSPX",
        "tokenizedGold": "PAXG"
      }
    }
  }
}
```

Allocation is defined at the asset class level. The `assets` field shows the current token implementations for each class.

---

### Accept Strategy

Accept or customize the AI-recommended strategy.

```
POST /quiz/accept-strategy
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "sessionId": "quiz_session_uuid",
  "accepted": true,
  "customAllocation": {
    "stableYields": 80,
    "tokenizedStocks": 15,
    "tokenizedGold": 5
  }
}
```

**Response:**
```json
{
  "status": 200,
  "data": {
    "accepted": true,
    "nextStep": "wallet_creation"
  }
}
```

---

## Wallet

### Get Wallet

Get user's wallet information including balances.

```
GET /wallet
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": 200,
  "data": {
    "wallet": {
      "address": "0x1234567890abcdef...",
      "provider": "privy",
      "primaryChain": "base",
      "isActive": true,
      "createdAt": "2025-01-20T12:00:00Z"
    },
    "balances": {
      "usdc": "150.50",
      "usdm": "800.25",
      "bcspx": "0.05",
      "paxg": "0.002"
    },
    "totalValueUsd": 1250.75
  }
}
```

---

### Check Wallet Exists

Check if user has a wallet.

```
GET /wallet/exists
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": 200,
  "data": {
    "exists": true,
    "address": "0x..."
  }
}
```

---

## Dashboard

### Get Dashboard

Get main dashboard data with portfolio summary and goals.

```
GET /dashboard
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": 200,
  "data": {
    "user": {
      "firstName": "John",
      "totalPoints": 150,
      "level": 2,
      "levelTitle": "Smart Investor"
    },
    "portfolio": {
      "totalValueUsd": 1500.00,
      "totalValueKes": 195000,
      "totalDepositedUsd": 1400.00,
      "totalReturnsUsd": 100.00,
      "totalReturnsPercent": 7.14,
      "allocation": {
        "stableYields": {
          "valueUsd": 1050.00,
          "percentage": 70,
          "asset": "USDM"
        },
        "tokenizedStocks": {
          "valueUsd": 300.00,
          "percentage": 20,
          "asset": "bCSPX"
        },
        "tokenizedGold": {
          "valueUsd": 150.00,
          "percentage": 10,
          "asset": "PAXG"
        }
      }
    },
    "goals": [
      {
        "id": "uuid",
        "title": "Emergency Fund",
        "emoji": "🚨",
        "targetAmountUsd": 1000,
        "currentAmountUsd": 750,
        "progressPercent": 75,
        "onTrack": true
      }
    ],
    "recentActivity": [
      {
        "type": "deposit",
        "amount": 100,
        "asset": "USDC",
        "date": "2025-01-20T12:00:00Z"
      }
    ],
    "exchangeRate": {
      "kesUsd": 130.00,
      "updatedAt": "2025-01-20T12:00:00Z"
    }
  }
}
```

Portfolio allocations are expressed by asset class, with token symbols shown as current implementations.

---

## Deposits

### Create Deposit Intent (Onchain)

Create a deposit intent for receiving USDC.

```
POST /deposit/intent/create
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "expectedAmount": 100,
  "token": "USDC",
  "chain": "base"
}
```

**Response:**
```json
{
  "status": 201,
  "data": {
    "depositSessionId": "uuid",
    "depositAddress": "0x1234567890abcdef...",
    "chain": "base",
    "token": {
      "symbol": "USDC",
      "address": "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
    },
    "expiresAt": "2025-01-20T13:00:00Z"
  }
}
```

**Notes:**
- Send USDC to the `depositAddress`
- Deposit will be auto-detected within 30 seconds
- Session expires in 60 minutes

---

### Confirm Deposit

Check deposit confirmation status.

```
POST /deposit/intent/confirm
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "depositSessionId": "uuid"
}
```

**Response (Confirmed):**
```json
{
  "status": 200,
  "data": {
    "status": "CONFIRMED",
    "txHash": "0xabc123...",
    "amount": 100.00,
    "confirmations": 5,
    "credited": true,
    "transactionId": "uuid"
  }
}
```

**Response (Pending):**
```json
{
  "status": 200,
  "data": {
    "status": "AWAITING_TRANSFER"
  }
}
```

---

### Convert Deposit

Convert deposited USDC to target asset class allocations.

```
POST /deposit/convert
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "depositSessionId": "uuid"
}
```

**Response:**
```json
{
  "status": 201,
  "data": {
    "conversionGroupId": "uuid",
    "depositSessionId": "uuid",
    "depositedAmount": 100.00,
    "status": "pending",
    "swaps": [
      {
        "transactionId": "uuid",
        "toAsset": "USDM",
        "amount": 70.00
      },
      {
        "transactionId": "uuid",
        "toAsset": "BCSPX",
        "amount": 20.00
      },
      {
        "transactionId": "uuid",
        "toAsset": "PAXG",
        "amount": 10.00
      }
    ],
    "estimatedCompletionTime": "5-10 minutes"
  }
}
```

---

### Initiate M-Pesa Deposit

Start M-Pesa deposit flow.

```
POST /deposit/initiate
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amountKes": 10000,
  "mpesaPhoneNumber": "+254712345678",
  "customAllocation": {
    "stableYields": 80,
    "tokenizedStocks": 15,
    "tokenizedGold": 5
  }
}
```

**Response:**
```json
{
  "status": 200,
  "data": {
    "transactionId": "uuid",
    "amountKes": 10000,
    "amountUsd": 76.92,
    "exchangeRate": 130.00,
    "fees": {
      "feeKes": 200,
      "feeUsd": 1.54,
      "feePercent": 2.0,
      "subsidized": true,
      "subsidyAmount": 1.54
    },
    "allocation": {
      "stableYields": {
        "asset": "USDM",
        "amountUsd": 61.54,
        "percentage": 80
      },
      "tokenizedStocks": {
        "asset": "bCSPX",
        "amountUsd": 11.54,
        "percentage": 15
      },
      "tokenizedGold": {
        "asset": "PAXG",
        "amountUsd": 3.85,
        "percentage": 5
      }
    },
    "nextStep": "mpesa_prompt"
  }
}
```

---

### Trigger M-Pesa Push

Send STK Push to user's phone.

```
POST /deposit/mpesa/push
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "transactionId": "uuid"
}
```

**Response:**
```json
{
  "status": 200,
  "data": {
    "transactionId": "uuid",
    "checkoutRequestId": "ws_CO_123456789",
    "amountKes": 10000,
    "phoneNumber": "+254712345678",
    "status": "awaiting_payment"
  }
}
```

---

### Get Transaction Status

Check deposit transaction status.

```
GET /deposit/transaction/:transactionId
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": 200,
  "data": {
    "transactionId": "uuid",
    "status": "COMPLETED",
    "amountKes": 10000,
    "amountUsd": 76.92,
    "mpesaReceiptNumber": "ABC123XYZ",
    "txHash": "0xabc123...",
    "completedAt": "2025-01-20T12:05:00Z",
    "failureReason": null
  }
}
```

---

## Portfolio

### Get Portfolio Detail

Get detailed portfolio breakdown.

```
GET /portfolio/detail
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period`: `1D`, `1W`, `1M`, `3M`, `1Y`, `ALL` (default: `ALL`)

**Response:**
```json
{
  "status": 200,
  "data": {
    "portfolio": {
      "totalValueUsd": 1500.00,
      "totalDepositedUsd": 1400.00,
      "totalReturnsUsd": 100.00,
      "totalReturnsPercent": 7.14
    },
    "allocation": {
      "current": {
        "stableYields": 70.5,
        "tokenizedStocks": 19.5,
        "tokenizedGold": 10.0
      },
      "target": {
        "stableYields": 70,
        "tokenizedStocks": 20,
        "tokenizedGold": 10
      }
    },
    "holdings": [
      {
        "asset": "USDM",
        "category": "stableYields",
        "balance": 1057.50,
        "valueUsd": 1057.50,
        "percentage": 70.5,
        "apy": 5.0
      },
      {
        "asset": "bCSPX",
        "category": "tokenizedStocks",
        "balance": 0.0512,
        "valueUsd": 292.50,
        "percentage": 19.5,
        "priceUsd": 5712.89
      },
      {
        "asset": "PAXG",
        "category": "tokenizedGold",
        "balance": 0.075,
        "valueUsd": 150.00,
        "percentage": 10.0,
        "priceUsd": 2000.00
      }
    ],
    "needsRebalance": false,
    "driftPercent": 0.5
  }
}
```

Holdings are grouped by asset class and mapped to the current token used for that class.

---

### Rebalance Portfolio

Trigger portfolio rebalancing to match target allocation.

```
POST /portfolio/rebalance
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": 200,
  "data": {
    "rebalanceId": "uuid",
    "swapsRequired": 2,
    "swaps": [
      {
        "fromAsset": "USDM",
        "toAsset": "bCSPX",
        "amount": 15.00,
        "reason": "bCSPX underweight by 0.5%"
      }
    ],
    "estimatedCompletionTime": "5-10 minutes",
    "status": "pending"
  }
}
```

---

## Swaps

### Get Quote

Get swap price quote without executing.

```
GET /swap/quote
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `fromAsset`: Token symbol for the asset class (example: `USDM`, `BCSPX`, `PAXG`, `USDC`)
- `toAsset`: Token symbol for the asset class (example: `USDM`, `BCSPX`, `PAXG`, `USDC`)
- `amount`: Amount in token units

**Example:**
```
GET /swap/quote?fromAsset=USDC&toAsset=USDM&amount=100
```

**Response:**
```json
{
  "status": 200,
  "data": {
    "fromAsset": "USDC",
    "toAsset": "USDM",
    "fromAmount": 100,
    "estimatedToAmount": 99.80,
    "slippage": 1.0,
    "priceImpact": 0.15,
    "fees": {
      "network": 0,
      "protocol": 0.20
    },
    "route": ["1inch Router"],
    "expiresAt": "2025-01-20T12:05:00Z"
  }
}
```

---

### Execute Swap

Execute a swap transaction.

```
POST /swap/execute
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "fromAsset": "USDC",
  "toAsset": "USDM",
  "amount": 100,
  "slippage": 1.0
}
```

**Response:**
```json
{
  "status": 201,
  "data": {
    "transactionId": "uuid",
    "status": "pending",
    "fromAsset": "USDC",
    "toAsset": "USDM",
    "fromAmount": 100,
    "estimatedToAmount": 99.80,
    "estimatedCompletionTime": "2-5 minutes"
  }
}
```

---

### Get Swap Status

Check swap transaction status.

```
GET /swap/status/:transactionId
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": 200,
  "data": {
    "transactionId": "uuid",
    "status": "completed",
    "fromAsset": "USDC",
    "toAsset": "USDM",
    "fromAmount": 100,
    "estimatedToAmount": 99.80,
    "actualToAmount": 99.75,
    "orderHash": "0xabc...",
    "txHash": "0xdef...",
    "createdAt": "2025-01-20T12:00:00Z",
    "completedAt": "2025-01-20T12:02:30Z"
  }
}
```

**Status Values:**
- `pending` - Swap queued
- `processing` - Order submitted, waiting for fill
- `completed` - Swap successful
- `failed` - Swap failed

---

### Get Swap History

Get user's swap transaction history.

```
GET /swap/history
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": 200,
  "data": [
    {
      "transactionId": "uuid",
      "status": "completed",
      "fromAsset": "USDC",
      "toAsset": "USDM",
      "fromAmount": 100,
      "actualToAmount": 99.75,
      "txHash": "0xdef...",
      "createdAt": "2025-01-20T12:00:00Z",
      "completedAt": "2025-01-20T12:02:30Z"
    }
  ]
}
```

---

## Goals

### Get Goal Categories

Get available goal categories.

```
GET /goals/categories
```

**Response:**
```json
{
  "status": 200,
  "data": {
    "categories": [
      { "value": "house", "label": "House", "emoji": "🏠" },
      { "value": "car", "label": "Car", "emoji": "🚗" },
      { "value": "education", "label": "Education", "emoji": "📚" },
      { "value": "wedding", "label": "Wedding", "emoji": "💍" },
      { "value": "travel", "label": "Travel", "emoji": "🏖️" },
      { "value": "emergency", "label": "Emergency", "emoji": "🚨" },
      { "value": "retirement", "label": "Retirement", "emoji": "🌴" },
      { "value": "business", "label": "Business", "emoji": "💼" },
      { "value": "other", "label": "Other", "emoji": "🎯" }
    ]
  }
}
```

---

### Create Goal

Create a new financial goal.

```
POST /goals
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Emergency Fund",
  "category": "emergency",
  "targetAmountKes": 130000,
  "targetDate": "2025-12-31"
}
```

**Response:**
```json
{
  "status": 201,
  "data": {
    "goal": {
      "id": "uuid",
      "title": "Emergency Fund",
      "category": "emergency",
      "emoji": "🚨",
      "targetAmountKes": 130000,
      "targetAmountUsd": 1000.00,
      "currentAmountUsd": 0,
      "progressPercent": 0,
      "targetDate": "2025-12-31",
      "status": "active",
      "onTrack": true
    }
  }
}
```

---

### Get All Goals

Get user's goals.

```
GET /goals
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status`: `active` (optional)
- `limit`: Number (default: 10)

**Response:**
```json
{
  "status": 200,
  "data": {
    "goals": [
      {
        "id": "uuid",
        "title": "Emergency Fund",
        "category": "emergency",
        "emoji": "🚨",
        "targetAmountKes": 130000,
        "targetAmountUsd": 1000.00,
        "currentAmountUsd": 750.00,
        "progressPercent": 75,
        "targetDate": "2025-12-31",
        "status": "active",
        "onTrack": true
      }
    ],
    "count": 1
  }
}
```

---

### Get Single Goal

Get goal details.

```
GET /goals/:goalId
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": 200,
  "data": {
    "goal": {
      "id": "uuid",
      "title": "Emergency Fund",
      "category": "emergency",
      "emoji": "🚨",
      "targetAmountKes": 130000,
      "targetAmountUsd": 1000.00,
      "currentAmountUsd": 750.00,
      "progressPercent": 75,
      "targetDate": "2025-12-31",
      "status": "active",
      "onTrack": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "completedAt": null
    }
  }
}
```

---

### Update Goal

Update goal details.

```
PUT /goals/:goalId
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Updated Emergency Fund",
  "targetAmountKes": 150000,
  "targetDate": "2026-06-30"
}
```

**Response:**
```json
{
  "status": 200,
  "data": {
    "goal": {
      "id": "uuid",
      "title": "Updated Emergency Fund",
      "targetAmountKes": 150000,
      "targetAmountUsd": 1153.85,
      "targetDate": "2026-06-30",
      "progressPercent": 65
    }
  }
}
```

---

### Contribute to Goal

Record a contribution to a goal.

```
POST /goals/:goalId/contribute
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amountKes": 5000
}
```

**Response:**
```json
{
  "status": 200,
  "data": {
    "goal": {
      "id": "uuid",
      "title": "Emergency Fund",
      "currentAmountUsd": 788.46,
      "progressPercent": 78.85,
      "status": "active"
    },
    "contribution": {
      "amountKes": 5000,
      "amountUsd": 38.46,
      "exchangeRate": 130.00
    },
    "nextStep": "deposit_initiate"
  }
}
```

---

### Delete Goal

Delete/archive a goal.

```
DELETE /goals/:goalId
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": 200,
  "data": {
    "message": "Goal deleted successfully",
    "goalId": "uuid"
  }
}
```

---

## Health

### Health Check

Basic health check.

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "Core Service",
  "timestamp": "2025-01-20T12:00:00.000Z"
}
```

---

### Root Endpoint

Get API information.

```
GET /
```

**Response:**
```json
{
  "service": "Core Service",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/v1/auth",
    "quiz": "/api/v1/quiz",
    "wallet": "/api/v1/wallet",
    "dashboard": "/api/v1/dashboard",
    "deposit": "/api/v1/deposit",
    "portfolio": "/api/v1/portfolio",
    "swap": "/api/v1/swap",
    "goals": "/api/v1/goals",
    "privy": "/api/v1/auth/privy"
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "status": 400,
  "message": "Bad Request",
  "data": null,
  "errors": ["Specific error message"]
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (access denied) |
| 404 | Not Found |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## Rate Limits

Currently no rate limits are enforced. Future versions will include:
- 100 requests/minute for authenticated endpoints
- 20 requests/minute for unauthenticated endpoints

---

## Changelog

### v1.0.0 (January 2026)
- Initial API release
- Authentication via Privy
- Investment quiz with AI strategy
- Onchain USDC deposits
- Portfolio management
- Asset swaps via 1inch
- Goal tracking
