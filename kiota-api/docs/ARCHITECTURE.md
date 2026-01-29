# Kiota API Architecture

## Overview

Kiota is a wealth management platform for Kenya's emerging middle class, enabling access to USD-denominated tokenized assets through mobile money (M-Pesa) integration.

### Core Value Proposition

- **Problem**: Kenyan savers lose 7-15% annually to currency devaluation
- **Solution**: Access to tokenized assets (USDM 5% yield, S&P 500, Gold) via M-Pesa
- **Target**: 10,000 sophisticated users in Phase 1

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Runtime** | Node.js 18+ | Server runtime |
| **Framework** | Express.js 5 | REST API framework |
| **Language** | TypeScript | Type safety |
| **Database** | PostgreSQL 14+ | Primary data store |
| **ORM** | TypeORM | Database abstraction |
| **Queue** | Bull (Redis) | Background job processing |
| **Blockchain** | viem | Ethereum/Base interaction |
| **Wallet** | Privy | Non-custodial embedded wallets |
| **DEX** | 1inch | Token swaps |
| **AI** | OpenAI GPT-4o-mini | Strategy generation |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Mobile App  │  │   Web App    │  │   MiniPay    │           │
│  │(React Native)│  │  (Next.js)   │  │   (PWA)      │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         └─────────────────┴─────────────────┘                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Express.js Server                     │    │
│  │                                                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
│  │  │   Auth   │ │  Quiz    │ │ Deposit  │ │Portfolio │   │    │
│  │  │Controller│ │Controller│ │Controller│ │Controller│   │    │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │    │
│  │       │            │            │            │          │    │
│  │       └────────────┴────────────┴────────────┘          │    │
│  │                         │                                │    │
│  │  ┌──────────────────────┴───────────────────────────┐   │    │
│  │  │                  Repositories                     │   │    │
│  │  │   User · Wallet · Portfolio · Transaction · Goal  │   │    │
│  │  └──────────────────────┬───────────────────────────┘   │    │
│  └─────────────────────────┼───────────────────────────────┘    │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   PostgreSQL    │ │     Redis       │ │     Privy       │
│   (Data Store)  │ │   (Job Queue)   │ │   (Wallets)     │
└─────────────────┘ └────────┬────────┘ └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Bull Workers   │
                    │                 │
                    │ • Deposit Jobs  │
                    │ • Swap Jobs     │
                    │ • Confirmation  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Blockchain    │
                    │   (Base/ETH)    │
                    │                 │
                    │ • 1inch API     │
                    │ • USDC Contract │
                    │ • viem Client   │
                    └─────────────────┘
```

---

## Directory Structure

```
kiota-api/
├── service/
│   ├── configs/              # Configuration files
│   │   ├── ormconfig.ts      # Database configuration
│   │   ├── queue.config.ts   # Bull queue setup
│   │   ├── tokens.config.ts  # Token addresses
│   │   └── corsconfig.ts     # CORS settings
│   │
│   ├── controllers/          # HTTP request handlers
│   │   ├── auth.controller.ts
│   │   ├── deposit.controller.ts
│   │   ├── goal.controller.ts
│   │   ├── portfolio.controller.ts
│   │   ├── quiz.controller.ts
│   │   ├── swap.controller.ts
│   │   └── wallet.controller.ts
│   │
│   ├── enums/                # TypeScript enums
│   │   ├── Transaction.ts
│   │   ├── Goal.ts
│   │   └── ...
│   │
│   ├── interfaces/           # TypeScript interfaces
│   │   ├── IAuth.ts
│   │   ├── ISwapProvider.ts
│   │   └── ...
│   │
│   ├── jobs/                 # Background job processing
│   │   ├── processors/
│   │   │   ├── deposit-completion.processor.ts
│   │   │   ├── swap-execution.processor.ts
│   │   │   └── swap-confirmation.processor.ts
│   │   └── worker.ts
│   │
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts           # JWT authentication
│   │   └── validation.ts     # Request validation
│   │
│   ├── models/               # TypeORM entities
│   │   ├── user.entity.ts
│   │   ├── wallet.entity.ts
│   │   ├── portfolio.entity.ts
│   │   ├── transaction.entity.ts
│   │   └── ...
│   │
│   ├── repositories/         # Data access layer
│   │   ├── user.repo.ts
│   │   ├── wallet.repo.ts
│   │   ├── portfolio.repo.ts
│   │   └── ...
│   │
│   ├── routes/               # Express routes
│   │   ├── index.auth.ts
│   │   ├── index.deposit.ts
│   │   └── ...
│   │
│   ├── services/             # Business logic
│   │   ├── classic-swap.provider.ts
│   │   ├── fusion-swap.provider.ts
│   │   ├── rebalance.service.ts
│   │   └── ...
│   │
│   ├── utils/                # Utilities
│   │   ├── logger.util.ts
│   │   └── provider/
│   │       └── privy.ts
│   │
│   └── index.ts              # Application entry point
│
├── docs/                     # Documentation
├── .env.example              # Environment template
└── package.json
```

---

## Data Flow

### 1. User Authentication Flow

```
User → Privy SDK → Privy Cloud → Kiota API → Database
  │                    │              │           │
  │  1. Login         │              │           │
  │  (Phone/Email)    │              │           │
  │ ───────────────────►│             │           │
  │                    │              │           │
  │  2. Verify OTP    │              │           │
  │ ◄───────────────────│             │           │
  │                    │              │           │
  │  3. Get ID Token  │              │           │
  │ ◄───────────────────│             │           │
  │                    │              │           │
  │  4. Sync User     │  5. Validate │           │
  │ ─────────────────────────────────►│           │
  │                    │              │           │
  │                    │  6. Create/  │  7. Save  │
  │                    │  Update User │───────────►│
  │                    │              │           │
  │  8. JWT Token     │              │           │
  │ ◄─────────────────────────────────│           │
```

### 2. Deposit Flow (Onchain)

```
User → Frontend → Kiota API → Bull Queue → Blockchain
  │        │          │           │            │
  │  1. Create Intent │           │            │
  │ ──────────────────►│          │            │
  │                    │          │            │
  │  2. Deposit Address│          │            │
  │ ◄──────────────────│          │            │
  │                    │          │            │
  │  3. Send USDC     │          │            │
  │ ─────────────────────────────────────────────►│
  │                    │          │            │
  │                    │  4. Scan  │  5. Detect │
  │                    │  Jobs ◄───┴────────────│
  │                    │          │            │
  │                    │  6. Confirm│           │
  │ ◄──────────────────│ ◄─────────│           │
  │                    │          │            │
  │  7. Conversion     │          │            │
  │ ──────────────────►│──────────►│           │
  │                    │          │            │
  │                    │  8. Swaps │  9. Exec  │
  │                    │          │ ───────────►│
```

### 3. Swap Flow

```
User → API → Swap Service → 1inch API → Privy → Blockchain
  │      │         │            │          │         │
  │  1. Quote     │            │          │         │
  │ ──────────────►│───────────►│         │         │
  │                │            │          │         │
  │  2. Price     │            │          │         │
  │ ◄──────────────│◄───────────│         │         │
  │                │            │          │         │
  │  3. Execute   │            │          │         │
  │ ──────────────►│           │          │         │
  │                │            │          │         │
  │                │  4. Build │          │         │
  │                │   TX ─────►│         │         │
  │                │            │          │         │
  │                │  5. Sign  │          │         │
  │                │ ──────────────────────►│        │
  │                │            │          │         │
  │                │  6. Broadcast        │         │
  │                │ ─────────────────────────────────►│
  │                │            │          │         │
  │  7. Status    │            │          │         │
  │ ◄──────────────│           │          │         │
```

---

## Database Schema (Key Entities)

### Users
```sql
users (
  id UUID PRIMARY KEY,
  privy_user_id VARCHAR,
  phone_number VARCHAR,
  email VARCHAR,
  target_stable_yields_percent INT DEFAULT 80,
  target_tokenized_stocks_percent INT DEFAULT 15,
  target_tokenized_gold_percent INT DEFAULT 5,
  has_completed_quiz BOOLEAN DEFAULT FALSE,
  has_completed_onboarding BOOLEAN DEFAULT FALSE,
  ...
)
```

### Wallets
```sql
wallets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  address VARCHAR(42),
  privy_user_id VARCHAR,
  provider VARCHAR DEFAULT 'privy',
  ...
)
```

### Portfolios
```sql
portfolios (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  total_value_usd DECIMAL(20,8),
  stable_yields_value_usd DECIMAL(20,8),
  tokenized_stocks_value_usd DECIMAL(20,8),
  tokenized_gold_value_usd DECIMAL(20,8),
  total_deposited_usd DECIMAL(20,8),
  total_returns_usd DECIMAL(20,8),
  ...
)
```

### Transactions
```sql
transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR,  -- DEPOSIT, WITHDRAWAL, SWAP, REBALANCE
  status VARCHAR, -- PENDING, PROCESSING, COMPLETED, FAILED
  source_asset VARCHAR,
  source_amount DECIMAL(20,8),
  destination_asset VARCHAR,
  destination_amount DECIMAL(20,8),
  tx_hash VARCHAR(66),
  ...
)
```

### Goals
```sql
goals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR,
  category VARCHAR,
  target_amount_usd DECIMAL(20,8),
  current_amount_usd DECIMAL(20,8),
  progress_percent DECIMAL(5,2),
  target_date DATE,
  status VARCHAR,
  ...
)
```

---

## Security Considerations

### Authentication
- JWT tokens with HMAC-SHA256 signing
- 7-day token expiration
- Privy handles credential storage

### Non-Custodial Wallets
- Privy embedded wallets
- Private keys never touch backend
- Transaction signing via Privy SDK

### Data Protection
- Environment variables for secrets
- `.env` files excluded from git
- Admin endpoints protected

### API Security
- CORS configured for known origins
- Input validation with Zod
- Rate limiting (planned)

---

## Scaling Considerations

### Current Architecture
- Single Express server
- Single database instance
- Single Redis instance
- Suitable for 10K users

### Future Scaling
- Horizontal API scaling (load balancer)
- PostgreSQL read replicas
- Redis cluster
- Worker auto-scaling based on queue depth

---

## Monitoring

### Health Endpoints
- `GET /health` - Basic health check
- Bull Board at `/admin/queues` - Job monitoring

### Logging
- Structured JSON logging
- Log levels: debug, info, warn, error

### Metrics (Planned)
- Request latency
- Queue depth
- Transaction success rate
- Portfolio value growth

---

## External Dependencies

| Service | Purpose | Fallback |
|---------|---------|----------|
| Privy | Wallet management | None (critical) |
| 1inch | Token swaps | Alternative DEX |
| OpenAI | AI strategy | Fallback rules |
| Base RPC | Blockchain reads | Alternative RPC |
| PostgreSQL | Data storage | None (critical) |
| Redis | Job queue | None (critical) |

---

## Version History

- **v1.0.0** (Jan 2026): Initial release
  - Authentication via Privy
  - Investment quiz + AI strategy
  - Onchain USDC deposits
  - Portfolio management
  - Asset swaps via 1inch
  - Goal tracking
