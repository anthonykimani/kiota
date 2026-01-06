# Technical Architecture

## System Overview

Kiota is a full-stack web application built with Next.js 14, designed to provide wealth preservation services to Kenyan users through tokenized dollar assets.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                │
├─────────────────────────────────────────────────────────┤
│  App Router  │  React 19  │  TypeScript  │  Tailwind v4 │
└─────────────────────┬───────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
┌────────▼─────────┐    ┌─────────▼──────────┐
│   UI Components   │    │   Business Logic    │
├──────────────────┤    ├────────────────────┤
│ • shadcn/ui (10) │    │ • Utilities         │
│ • Kiota (4)      │    │ • Calculations      │
│ • lucide-react   │    │ • Formatters        │
└────────┬─────────┘    └─────────┬──────────┘
         │                         │
         └────────────┬────────────┘
                      │
         ┌────────────▼────────────┐
         │      Data Layer         │
         ├─────────────────────────┤
         │ • Mock Data (Phase 1)   │
         │ • Supabase (Phase 2)    │
         │ • API Routes (Phase 2)  │
         └────────────┬────────────┘
                      │
         ┌────────────▼────────────┐
         │   External Services      │
         ├─────────────────────────┤
         │ • Privy (Auth)          │
         │ • Claude API (AI)       │
         │ • Paycrest (On-ramp)    │
         │ • Alchemy (RPC)         │
         │ • Base Network          │
         └─────────────────────────┘
```

## Tech Stack

### Frontend

#### Framework
- **Next.js 16.1.1** - React framework with App Router
  - Server Components by default
  - Server Actions for mutations
  - Built-in optimization
  - TypeScript support

#### UI Layer
- **React 19.2.3** - UI library
- **Tailwind CSS 4.1.18** - Utility-first CSS
- **shadcn/ui** - Component library (10 components)
- **lucide-react** - Icon library
- **Custom Components** - 4 Kiota-specific components

#### State Management
- **React Server Components** - Server-side state
- **React Hooks** - Client-side state (useState, useEffect)
- **URL State** - Navigation state (Next.js router)
- *(Future)* **Zustand** - Global client state (if needed)

#### Styling
- **Tailwind CSS v4** - Utility classes
- **CSS Variables** - Design tokens (shadcn/ui)
- **HSL Color Space** - Consistent colors
- **Responsive Design** - Mobile-first

### Backend

#### API Layer (Phase 2)
- **Next.js API Routes** - RESTful endpoints
- **Server Actions** - Form submissions
- **Edge Runtime** - Fast responses
- **Middleware** - Authentication, CORS

#### Database
- **Supabase (PostgreSQL)** - Primary database
  - Row-level security
  - Real-time subscriptions
  - Built-in auth
  - RESTful API

#### Schema
- **20+ Tables** - Complete data model
- **Relationships** - Foreign keys, constraints
- **Indexes** - Performance optimization
- **Triggers** - Auto-updated timestamps

### Blockchain

#### Network
- **Base (Ethereum L2)** - Primary chain
  - Low gas fees ($0.01-0.10)
  - Fast finality (2 seconds)
  - Ethereum security
  - Coinbase backing

#### Infrastructure
- **Alchemy** - RPC provider
- **Privy** - Embedded wallets
  - Social login
  - Email recovery
  - Gas sponsorship
  - Smart accounts

#### Smart Contracts
- **USDM** - Mountain Protocol (0x59D9...508C on Base)
- **bCSPX** - Backed Finance S&P 500
- **PAXG** - Paxos Gold (Ethereum)
- **Badge NFT** - Soulbound achievement tokens (custom)

### External Services

#### Authentication
- **Privy** - Wallet-based auth
  - Social login (Google)
  - Phone number login
  - Email recovery
  - Embedded wallets

#### AI
- **Claude API (Anthropic)** - Investment advisor
  - Strategy generation
  - Portfolio reviews
  - Market alerts
  - Educational content

#### On-Ramp
- **Paycrest** - M-Pesa → USDC
  - 2-2.5% fee
  - 5-15 minute settlement
  - P2P decentralized
- *(Future)* **Kotani Pay** - Licensed PSP (1.3-1.5% fee)

#### Data & Analytics
- **DeBank Cloud API** - Portfolio aggregation
  - Asset balances
  - Transaction history
  - Price data
  - Protocol integration

## File Structure

```
kiota-v1/
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   ├── globals.css              # Global styles
│   ├── manifest.json            # PWA manifest
│   └── [feature]/               # Feature folders
│       ├── page.tsx             # Route page
│       └── components/          # Route-specific components
│
├── components/
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── features/                # Kiota components
│   │   ├── currency-display.tsx
│   │   ├── asset-badge.tsx
│   │   ├── progress-bar.tsx
│   │   └── stat-card.tsx
│   └── layouts/                 # Layout components
│       ├── header.tsx
│       ├── footer.tsx
│       └── navigation.tsx
│
├── lib/
│   ├── db/                      # Database
│   │   ├── schema.sql           # PostgreSQL schema
│   │   └── client.ts            # Supabase client
│   ├── utils/                   # Utilities
│   │   ├── currency.ts          # Currency formatting
│   │   ├── dates.ts             # Date utilities
│   │   ├── calculations.ts      # Financial calculations
│   │   └── index.ts             # Common utils
│   ├── api/                     # API integrations
│   │   ├── claude.ts            # Claude API
│   │   ├── paycrest.ts          # Paycrest API
│   │   └── blockchain.ts        # Blockchain interactions
│   └── mock/                    # Mock data
│       ├── users.ts
│       ├── portfolio.ts
│       └── goals.ts
│
├── types/
│   ├── models/                  # Data models
│   │   ├── user.ts
│   │   ├── portfolio.ts
│   │   ├── goals.ts
│   │   ├── deposits.ts
│   │   ├── learning.ts
│   │   └── chama.ts
│   └── api/                     # API types
│       ├── claude.ts
│       └── paycrest.ts
│
├── public/                      # Static assets
│   ├── icons/
│   └── images/
│
├── docs/                        # Documentation
│   ├── product/
│   ├── technical/
│   ├── screens/
│   └── guides/
│
└── scripts/                     # Utility scripts
    └── check-setup.js
```

## Data Flow

### Authentication Flow
```
User → Privy Login → Wallet Created → User Record in DB → Authenticated
```

### Deposit Flow
```
User → M-Pesa Payment → Paycrest → USDC → Base Network → User Wallet → DB Update
```

### Portfolio Flow
```
User Wallet → Blockchain (Base) → DeBank API → Portfolio Data → React Components
```

### AI Strategy Flow
```
User Answers → Claude API → Strategy Generated → DB Saved → Portfolio Allocated
```

## Security

### Authentication
- **Privy** - Secure wallet management
- **Row-Level Security** - Database level
- **API Keys** - Environment variables
- **HTTPS Only** - TLS encryption

### Blockchain
- **Non-Custodial** - Users control private keys
- **Gas Sponsorship** - Controlled paymasters
- **Smart Contract Audits** - Verified contracts only
- **Transaction Signing** - User approval required

### Data Protection
- **Environment Variables** - Secrets in .env.local
- **Input Validation** - Zod schemas
- **SQL Injection** - Parameterized queries
- **XSS Protection** - React auto-escaping

## Performance

### Frontend Optimization
- **Server Components** - Reduced JavaScript
- **Code Splitting** - Automatic by Next.js
- **Image Optimization** - next/image
- **Font Optimization** - next/font
- **Lazy Loading** - Dynamic imports

### Backend Optimization
- **Edge Runtime** - Fast responses
- **Database Indexes** - Query performance
- **Connection Pooling** - Supabase
- **Caching** - React cache, SWR
- **CDN** - Vercel Edge Network

### Blockchain Optimization
- **Base Network** - Low gas fees
- **Batch Transactions** - Multiple operations
- **Gas Sponsorship** - Free for users
- **RPC Caching** - Alchemy caching

## Scalability

### Horizontal Scaling
- **Serverless Functions** - Auto-scaling
- **Edge Network** - Global distribution
- **Database Read Replicas** - Supabase (future)
- **CDN** - Static asset distribution

### Vertical Scaling
- **Efficient Queries** - Indexed database
- **Optimized Components** - React memoization
- **Lazy Loading** - On-demand loading
- **Code Splitting** - Smaller bundles

## Monitoring & Logging

### Application Monitoring (Future)
- **Vercel Analytics** - Performance metrics
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **PostHog** - Product analytics

### Blockchain Monitoring
- **Alchemy Webhooks** - Transaction events
- **Block Explorer** - Base Scan
- **Gas Tracker** - Cost monitoring

## Development Workflow

### Local Development
```bash
npm run dev          # Start development server
npm run type-check   # TypeScript validation
npm run check        # Setup verification
```

### Testing (Future)
```bash
npm run test         # Run tests
npm run test:e2e     # End-to-end tests
npm run test:coverage # Coverage report
```

### Deployment
```bash
npm run build        # Production build
npm run start        # Production server
```

## Environment Variables

### Required
```env
# Database
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_SECRET=

# AI
ANTHROPIC_API_KEY=

# On-Ramp
PAYCREST_API_KEY=

# Blockchain
NEXT_PUBLIC_ALCHEMY_API_KEY=
```

### Optional
```env
# Feature Flags
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_ENABLE_KYC=false
NEXT_PUBLIC_ENABLE_CHAMA=false
```

## Deployment Architecture

### Hosting
- **Vercel** - Frontend & API routes
  - Auto-scaling
  - Edge network
  - Preview deployments
  - Analytics

### Database
- **Supabase** - PostgreSQL
  - Auto-backups
  - Point-in-time recovery
  - Replication

### Blockchain
- **Base Mainnet** - Production
- **Base Sepolia** - Testing

## Future Enhancements

### Phase 2 (Months 4-9)
- [ ] Multi-asset support (bCSPX, PAXG)
- [ ] KYC integration (Fractal ID)
- [ ] Real-time portfolio updates
- [ ] Push notifications
- [ ] Advanced charting

### Phase 3 (Months 10-18)
- [ ] Chama features (group savings)
- [ ] Batch deposit optimization
- [ ] Automated rebalancing
- [ ] Tax reporting
- [ ] Mobile app (React Native)

---

**Last Updated**: January 6, 2026
**Architecture Version**: 1.0
