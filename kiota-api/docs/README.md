# Kiota API Documentation

Welcome to the Kiota API documentation. This guide covers the architecture, setup, and API reference for the Kiota wealth management platform.

## Table of Contents

### Architecture
- [Project Overview](./ARCHITECTURE.md) - System architecture and design decisions
- [Deposit Flow](./DEPOSIT-FLOW-ARCHITECTURE.md) - How deposits work (onchain USDC + M-Pesa)
- [Swap Architecture](./SWAP_PROVIDER_ARCHITECTURE.md) - 1inch integration for asset swaps
- [Privy Integration](./PRIVY_SWAP_ARCHITECTURE.md) - Non-custodial wallet management

### API Reference
- [API Reference](./API-REFERENCE.md) - Complete REST API documentation

### Development
- [Testing Guide](./TESTING_GUIDE.md) - How to test the API

---

## Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL 14+
- Redis 6+

### Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.development

# Edit .env.development with your credentials
# - Database connection
# - Privy API keys
# - OpenAI API key
# - 1inch API key

# Start development server
npm run dev

# Start background worker (separate terminal)
npm run worker
```

### Verify Installation

```bash
# Health check
curl http://localhost:3003/health

# Expected response:
# {"status":"ok","service":"Core Service","timestamp":"..."}
```

---

## Project Status

### Implemented Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Authentication** | Complete | Privy + JWT tokens |
| **Investment Quiz** | Complete | AI-powered strategy generation |
| **Wallet Management** | Complete | Non-custodial Privy wallets |
| **Portfolio Tracking** | Complete | Real-time dashboard |
| **Onchain Deposits** | Complete | USDC on Base chain |
| **Asset Swaps** | Complete | Via 1inch (Classic + Fusion) |
| **Portfolio Rebalancing** | Complete | Automatic drift detection |
| **Goals** | Complete | CRUD + milestone tracking |
| **M-Pesa Integration** | Partial | Mock implementation |
| **Withdrawals** | Not Started | Planned for next phase |
| **Education Platform** | Partial | Entities only, no routes |
| **Gamification** | Partial | Schema only |
| **Chama (Groups)** | Partial | Entities only |

---

## Migration Notes (Asset Registry)

The asset model is now class-led with a database-backed asset registry.

- New tables: `asset_classes`, `assets`
- Transactions now store asset symbols as strings and include `sourceAssetClassKey` / `destinationAssetClassKey` / `feeAssetClassKey`
- Portfolio holdings are tracked per asset in `portfolio_holdings` and rolled up into class totals

### Supported Asset Classes

Kiota is centered on asset classes, not specific tokens. Token tickers shown below are examples of the current implementation and may change as providers evolve.

| Asset Class | Example Token | Purpose | Status |
|------------|---------------|---------|--------|
| Stable Yields | USDM | USD-denominated yield | Active |
| Tokenized Stocks | bCSPX | S&P 500 exposure | Active |
| Tokenized Gold | PAXG | Gold hedge | Active |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     Frontend (Mobile/Web)                 │
│                    React Native / Next.js                 │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                      Kiota API                            │
│                    (Express.js)                           │
│                                                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │  Auth   │ │  Quiz   │ │ Deposit │ │Portfolio│        │
│  │Controller│ │Controller│ │Controller│ │Controller│     │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘        │
│       │           │           │           │              │
│       └───────────┴───────────┴───────────┘              │
│                       │                                   │
│  ┌────────────────────┼────────────────────┐             │
│  │                    │                    │             │
│  ▼                    ▼                    ▼             │
│  Repositories     Services            Jobs (Bull)        │
│                                                           │
└──────┬───────────────┬───────────────────┬───────────────┘
       │               │                   │
       ▼               ▼                   ▼
┌──────────┐    ┌──────────┐        ┌──────────┐
│PostgreSQL│    │  Redis   │        │ Privy    │
│  (Data)  │    │ (Queues) │        │ (Wallets)│
└──────────┘    └──────────┘        └──────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│                  Blockchain (Base/Ethereum)               │
│                     via viem + 1inch                      │
└──────────────────────────────────────────────────────────┘
```

---

## Environment Variables

See `.env.example` for all required environment variables. Key variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret for JWT token signing | Yes |
| `PRIVY_APP_ID` | Privy application ID | Yes |
| `PRIVY_APP_SECRET` | Privy application secret | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes |
| `ONEINCH_API_KEY` | 1inch API key for swaps | Yes |
| `BASE_RPC_URL` | Base chain RPC endpoint | Yes |
| `REDIS_URL` | Redis connection URL | Yes |

---

## Support

- GitHub Issues: [Report bugs or request features]
- Documentation: This folder
- API Reference: [API-REFERENCE.md](./API-REFERENCE.md)
