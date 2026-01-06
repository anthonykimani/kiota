# Kiota v1 - Wealth Preservation Platform

A fintech platform enabling Kenya's emerging middle class to preserve and grow wealth through tokenized dollar assets.

## Overview

Kiota provides access to:
- **USDM**: 5% USD yield (Mountain Protocol)
- **bCSPX**: S&P 500 exposure (~10% avg return)
- **PAXG**: Gold-backed hedge
- **AI-powered** investment strategies
- **M-Pesa** integration for deposits
- **Educational** content (Kiota Academy)

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Blockchain**: Base (Ethereum L2)
- **Authentication**: Privy (embedded wallets)
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude API (Anthropic)
- **On-Ramps**: Paycrest, Kotani Pay

## Project Structure

```
kiota-v1/
├── app/                    # Next.js app router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── features/           # Feature-specific components
│   └── layouts/            # Layout components
├── lib/                    # Business logic & utilities
│   ├── db/                 # Database schema & queries
│   ├── utils/              # Utility functions
│   ├── api/                # API integration
│   └── mock/               # Mock data providers
├── types/                  # TypeScript type definitions
│   ├── models/             # Data models
│   └── api/                # API types
└── public/                 # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- (Optional) API keys for Supabase, Privy, Anthropic, Paycrest

### Installation

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Using Mock Data

By default, the app uses mock data (no API keys required).

To enable real integrations, add API keys to `.env.local`:

```bash
cp .env.local.example .env.local
# Edit .env.local with your API keys
```

## Development Phases

### Phase 1: Foundation (Current)

✅ **Completed:**
- Project setup (Next.js 14, TypeScript, Tailwind)
- Type definitions for all data models
- Database schema (Supabase ready)
- Utility functions (currency, dates, calculations)
- Mock data providers
- Global styles & theming

🚧 **In Progress:**
- UI component library (shadcn/ui)
- Authentication flow
- Dashboard screens

📋 **Next:**
- Investment strategy quiz
- Portfolio tracking
- Goals management
- Deposit flow

### Phase 2: MVP Features (Months 1-4)

- Pre-authentication screens
- Investment strategy quiz (AI-powered)
- Dashboard & portfolio views
- Basic deposit flow (M-Pesa)
- Goals creation & tracking
- Learning academy (5 lessons)

### Phase 3: Advanced Features (Months 5-9)

- Multi-asset support (bCSPX, PAXG)
- KYC integration
- Automated deposits
- Rebalancing
- Gamification (badges, leaderboards)
- Chama (group) features

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler checks

## Database Schema

The complete database schema is in `lib/db/schema.sql`.

To apply to Supabase:
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Paste contents of `lib/db/schema.sql`
4. Run the migration

## Environment Variables

See `.env.local.example` for all required variables.

Key variables:
- `NEXT_PUBLIC_USE_MOCK_DATA` - Use mock data (true/false)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `ANTHROPIC_API_KEY` - Claude API key
- `PAYCREST_API_KEY` - Paycrest on-ramp API key

## Architecture Decisions

### Backend-First Approach

We're building with a **backend-first** philosophy:
1. Define types and data models first
2. Create database schema and mock data
3. Build API layer
4. Build UI on top

### Mock Data Strategy

Mock data allows rapid development without API dependencies. All data providers check `NEXT_PUBLIC_USE_MOCK_DATA` and fall back to mock implementations.

### TypeScript Strict Mode

We use strict TypeScript to catch errors early and improve code quality.

## Contributing

This is a solo development project. For questions or feedback, open an issue.

## License

MIT

---

**Built with 💚 for Kenya's savers**
