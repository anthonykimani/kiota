# Kiota Product Plan

**Version**: 1.0
**Last Updated**: January 6, 2026
**Status**: Phase 1 - Foundation Development

## Executive Summary

Kiota is a wealth preservation platform designed for Kenya's emerging middle class, enabling users to save in USD-denominated tokenized assets through seamless M-Pesa integration. The platform addresses the core challenge of currency devaluation by providing access to dollar-based yields and global assets previously unavailable to this market segment.

### Key Value Proposition

- **Preserve wealth** against KES devaluation (~8% annual depreciation)
- **Earn yields** from US Treasury-backed stablecoins (5% APY on USDM)
- **Access global assets** (S&P 500, Gold) through tokenization
- **Seamless deposits** via M-Pesa (no international banking required)
- **AI-powered guidance** for investment strategy selection

## Target Market

### Primary Audience

**Kenya's Emerging Middle Class**
- Age: 25-45 years old
- Income: KES 50,000 - 150,000/month ($350-$1,050)
- Tech-savvy smartphone users
- M-Pesa active users
- Concerned about savings depreciation
- Limited access to dollar accounts

### Market Size

- **Addressable Market**: 2.5M Kenyans in middle-income bracket
- **Initial Target**: 10,000 users by Month 6
- **Phase 1 Goal**: 50,000 users by Month 18
- **Average Account Size**: $100-$500 initial, growing to $1,000-$3,000

## Core Problems Solved

### 1. Currency Devaluation
**Problem**: KES has depreciated 8% annually against USD over 5 years
**Solution**: Save in USD-denominated assets that maintain dollar value

### 2. Low Yields
**Problem**: Traditional KES savings accounts offer 2-4% yields (negative real returns with 7% inflation)
**Solution**: 5% USD yield on USDM (Mountain Protocol) backed by US Treasuries

### 3. Limited Access
**Problem**: Dollar accounts require minimum balances ($1,000+) and complex documentation
**Solution**: Start with as little as $5 via M-Pesa, no minimums, no paperwork

### 4. Complex Investing
**Problem**: Traditional investing requires financial knowledge and high fees
**Solution**: AI-powered guidance, pre-built strategies, automatic portfolio management

## Product Features

### Phase 1: Foundation (Months 1-3)

#### 1. Smart Onboarding
- **Strategy Quiz**: 8 questions to determine investment profile
- **AI Recommendations**: Claude-powered strategy generation
- **Social Auth**: Privy integration (Google, phone number, email)
- **Embedded Wallets**: Non-custodial Base wallets created automatically

#### 2. Three Deposit Pathways

**A. Smart Batching (Recommended for most users)**
- Deposit any amount in KES via M-Pesa
- Funds accumulate in escrow until reaching $10+ batch threshold
- Automatic conversion to USDM when threshold reached
- Saves on transaction fees (2.5% vs 5%+ for small deposits)

**B. Automated Deposits**
- Set up recurring M-Pesa deposits (daily, weekly, monthly)
- Round-up rules (round purchases to nearest KES 100/500/1000)
- Savings commitments with automatic enforcement

**C. Goal-Driven Savings**
- Create specific savings goals (emergency fund, education, home down payment)
- AI calculates required monthly deposits
- Track progress with milestones
- Celebrate achievements with badges/NFTs

#### 3. Asset Strategy (Phase 1: USDM Only)

**Mountain Protocol USDM**
- **Type**: Tokenized US Treasury fund
- **Yield**: ~5% APY
- **Backing**: Short-term US Treasury bonds
- **Regulation**: SEC-registered RIC fund
- **Chain**: Base (Ethereum L2)
- **Contract**: 0x59D9356E565Ab3A36dD77763Fc0d87fEaf85508C
- **Liquidity**: Daily redemptions

**Why USDM First:**
- Lowest risk profile for conservative savers
- Regulatory clarity (SEC-registered)
- Predictable 5% yield
- Daily liquidity (no lock-ups)
- Backed 1:1 by US Treasuries

#### 4. AI Investment Advisor

**Powered by Claude API**

**Strategy Generation:**
- Analyzes user quiz responses
- Considers age, income, goals, risk tolerance
- Generates personalized asset allocation
- Explains rationale in simple Swahili/English

**Portfolio Reviews:**
- Quarterly check-ins
- Performance analysis
- Rebalancing recommendations
- Market updates in context

**Educational Content:**
- Answers investment questions
- Explains concepts (yields, diversification, etc.)
- Provides market context
- Swahili language support

#### 5. Portfolio Dashboard

**Key Metrics:**
- Total value (USD + KES display)
- 24h/7d/30d performance
- Yield earned
- Cost basis vs current value

**Asset Breakdown:**
- USDM holdings
- Pending batched deposits
- Transaction history
- Yield accrual timeline

**Insights:**
- AI-generated highlights
- Goal progress
- Optimization suggestions

### Phase 2: Multi-Asset Expansion (Months 4-9)

#### Additional Assets

**bCSPX (Backed Finance S&P 500 Token)**
- **Type**: Tokenized S&P 500 index fund
- **Expected Return**: 10-12% annually
- **Risk**: Medium
- **Target Allocation**: 30-50% for growth-oriented users
- **Chain**: Base

**PAXG (Paxos Gold)**
- **Type**: Gold-backed token (1 PAXG = 1 oz gold)
- **Purpose**: Inflation hedge, stability
- **Risk**: Low-Medium
- **Target Allocation**: 10-20% for conservative diversification
- **Chain**: Ethereum (bridge to Base)

#### Dynamic Portfolios

**Conservative (Age 50+, Low Risk Tolerance)**
- 80% USDM (stability + yield)
- 10% bCSPX (growth)
- 10% PAXG (hedge)
- Expected Return: 5-6% annually
- Risk Level: Low

**Balanced (Age 35-50, Medium Risk Tolerance)**
- 50% USDM (stability)
- 40% bCSPX (growth)
- 10% PAXG (hedge)
- Expected Return: 7-9% annually
- Risk Level: Medium

**Growth (Age 25-35, High Risk Tolerance)**
- 30% USDM (stability)
- 60% bCSPX (growth)
- 10% PAXG (hedge)
- Expected Return: 9-11% annually
- Risk Level: Medium-High

#### Automatic Rebalancing
- Quarterly portfolio rebalancing
- Maintains target allocations
- Tax-loss harvesting (future)
- Gas-optimized transactions

### Phase 3: Community Features (Months 10-18)

#### Chama Integration

**What are Chamas?**
- Traditional Kenyan savings groups
- 10-30 members pooling monthly contributions
- Rotating loans to members
- Strong social accountability

**Kiota Chama Features:**

**Group Creation**
- Invite members via phone number
- Set contribution amounts and frequency
- Define loan rules and interest rates
- Assign admin roles

**Batch Deposit Optimization**
- Members deposit individually via M-Pesa
- Funds accumulate in group wallet
- Single batch conversion when threshold reached
- Significant fee savings (2.5% vs 5%+ individual)

**Loan Management**
- Request loans up to 3x contribution
- Automated repayment schedules
- Interest payments to group treasury
- Default handling mechanisms

**Governance**
- Vote on rule changes
- Approve large withdrawals
- Transparent transaction history
- Member activity tracking

**Benefits:**
- Lower fees through batching
- Social accountability increases savings consistency
- Loan access without banks
- Transparent, immutable record-keeping

#### Kiota Academy

**Learning Tracks:**

1. **Basics** (4 modules, 12 lessons)
   - What is blockchain?
   - Understanding stablecoins
   - How yields work
   - Kiota platform tutorial

2. **Investing** (5 modules, 15 lessons)
   - Asset allocation strategies
   - Risk management
   - Diversification principles
   - Market cycles

3. **Advanced** (4 modules, 12 lessons)
   - DeFi concepts
   - Smart contract basics
   - Tax implications
   - Estate planning

**Gamification:**
- Earn badges for completing modules
- NFT certificates for track completion
- Leaderboard rankings
- Unlock advanced features with progress

**Language:**
- Full Swahili support
- English and Swahili toggle
- Audio lessons (future)
- Community discussions

## Technical Architecture

### Blockchain Infrastructure

**Base Network (Ethereum L2)**
- **Why Base**:
  - Low fees ($0.01-0.10 per transaction)
  - Fast finality (2 seconds)
  - Ethereum security
  - Coinbase backing
  - Growing DeFi ecosystem

**Privy (Embedded Wallets)**
- Social login (Google, phone, email)
- Non-custodial wallet creation
- Email recovery
- Gas sponsorship for small transactions
- Smart account support

### On-Ramp Integration

**Paycrest (Primary)**
- M-Pesa → USDC conversion
- Fee: 2-2.5%
- Settlement: 5-15 minutes
- P2P decentralized network
- No KYC for small amounts (<$1,000/month)

**Kotani Pay (Future)**
- Licensed PSP (Payment Service Provider)
- Fee: 1.3-1.5%
- Settlement: Instant
- Full KYC for larger amounts
- Bank-grade compliance

### AI Integration

**Claude API (Anthropic)**
- **Model**: Claude 3 Opus (highest reasoning)
- **Use Cases**:
  - Strategy generation
  - Portfolio reviews
  - Educational Q&A
  - Market analysis
  - Risk assessment

**Context Management:**
- User profile and history
- Portfolio composition
- Market conditions
- Kenyan financial context
- Swahili language support

### Backend Infrastructure

**Supabase (PostgreSQL)**
- User profiles and authentication
- Portfolio data
- Transaction history
- Goals and milestones
- Learning progress
- Chama records

**Next.js API Routes**
- RESTful endpoints
- Server actions for mutations
- Edge runtime for speed
- Middleware for auth

**DeBank Cloud API**
- Portfolio aggregation
- Real-time balance tracking
- Multi-chain support
- Transaction indexing

## User Flows

### 1. New User Onboarding

```
Landing Page → Sign Up (Google/Phone) → Strategy Quiz (8 questions) →
AI Recommendation → Review Strategy → Create Account →
Embedded Wallet Created → Dashboard
```

**Time to Complete**: 3-5 minutes

### 2. First Deposit

```
Dashboard → "Deposit" Button → Select Pathway (Smart Batch/Auto/Goal) →
Enter Amount (KES) → M-Pesa Payment → Confirmation →
Track Batch Status → Conversion Complete → Portfolio Updated
```

**Time to Complete**: 5-15 minutes (includes M-Pesa settlement)

### 3. Goal Creation

```
Dashboard → Goals Tab → "New Goal" → Select Type (Emergency/Education/Home/Custom) →
Set Target Amount → Set Timeline → AI calculates monthly deposit →
Choose deposit method → Activate Goal → Track Progress
```

**Time to Complete**: 2-3 minutes

### 4. Chama Creation (Phase 3)

```
Dashboard → Chama Tab → "Create Chama" → Name + Description →
Invite Members (phone numbers) → Set Rules (contribution, frequency, loans) →
Assign Roles → Activate Chama → Members Join → Start Contributing
```

**Time to Complete**: 10-15 minutes

## Monetization Strategy

### Revenue Streams

**1. Asset Management Fee**
- **Rate**: 0.5% annually on AUM (Assets Under Management)
- **Calculation**: Charged monthly (0.0417% per month)
- **Example**: User has $1,000 → $5/year fee → $0.42/month
- **Competitive**: Lower than traditional fund fees (1-2%)

**2. Deposit Fee Sharing**
- **Paycrest Fee**: 2.5% on M-Pesa conversions
- **Revenue Share**: 0.5% goes to Kiota
- **Example**: $100 deposit → $2.50 Paycrest fee → $0.50 Kiota revenue
- **Volume Play**: High transaction frequency

**3. Premium Features (Future)**
- Advanced analytics dashboard: $5/month
- Priority customer support: $3/month
- Custom portfolio strategies: $10/month
- Tax reporting tools: $15/year

**4. Chama Enterprise (Future)**
- Chama management tools: $20/month per group
- Advanced governance features: $50/month
- Integration APIs: Custom pricing
- White-label solutions: Revenue share

### Financial Projections

**Month 6 Targets:**
- Users: 10,000
- Average AUM per user: $150
- Total AUM: $1.5M
- Management Fee Revenue: $7,500/year ($625/month)
- Deposit Fee Revenue: ~$2,000/month (assuming $100 avg deposit, 40% monthly deposit rate)
- **Total Monthly Revenue**: ~$2,625

**Month 12 Targets:**
- Users: 25,000
- Average AUM per user: $300
- Total AUM: $7.5M
- Management Fee Revenue: $37,500/year ($3,125/month)
- Deposit Fee Revenue: ~$6,250/month
- **Total Monthly Revenue**: ~$9,375

**Month 18 Targets:**
- Users: 50,000
- Average AUM per user: $500
- Total AUM: $25M
- Management Fee Revenue: $125,000/year ($10,417/month)
- Deposit Fee Revenue: ~$12,500/month
- Premium Subscriptions: ~$5,000/month (10% adoption)
- **Total Monthly Revenue**: ~$27,917

## Competitive Landscape

### Direct Competitors

**1. Bitmama**
- Pan-African crypto exchange
- Strengths: Brand recognition, multiple countries
- Weaknesses: Generic exchange, no investment guidance, high fees

**2. Cowrywise**
- Nigerian savings/investment app
- Strengths: Strong product, good UX
- Weaknesses: Nigeria-focused, limited Kenya presence, no crypto

**3. Hisa**
- Kenyan investment app (stocks, bonds)
- Strengths: Local market knowledge, regulated
- Weaknesses: KES-denominated, no USD exposure, complex onboarding

### Kiota's Differentiation

**1. USD-Denominated Savings**
- Only platform offering dollar-based yields via tokenized assets
- Direct protection against KES devaluation

**2. AI-Powered Guidance**
- Claude API for personalized strategies
- Swahili language support
- Continuous portfolio optimization

**3. M-Pesa Integration**
- Seamless local currency on-ramp
- No need for dollar bank accounts
- Lower barriers to entry

**4. Social Features (Chama)**
- Culturally relevant group savings
- Batch optimization reduces fees
- Community accountability

**5. Educational Focus**
- Kiota Academy with gamification
- Financial literacy building
- Long-term user empowerment

## Risk Mitigation

### Technical Risks

**Smart Contract Risk**
- **Mitigation**: Only use audited contracts (USDM, bCSPX, PAXG)
- **Insurance**: Explore coverage options (Nexus Mutual)
- **Diversification**: Multi-asset reduces single-point failure

**Blockchain Risk (Base Network)**
- **Mitigation**: Base backed by Coinbase, Optimism stack
- **Contingency**: Multi-chain strategy (Polygon, Arbitrum) if needed
- **Monitoring**: Real-time network status tracking

### Regulatory Risks

**Crypto Regulation in Kenya**
- **Current Status**: Unregulated but not illegal
- **Mitigation**:
  - Work with local legal counsel
  - Implement KYC/AML for larger amounts
  - Partner with licensed entities (Kotani Pay)
  - Transparent operations

**Securities Classification**
- **Risk**: Tokenized assets may be classified as securities
- **Mitigation**:
  - Use only compliant assets (USDM is SEC-registered)
  - Legal structure as platform, not fund manager
  - Users self-custody assets

### Market Risks

**Asset Price Volatility**
- **Mitigation**:
  - USDM is stable (US Treasury-backed)
  - Clear risk disclosures for bCSPX, PAXG
  - Conservative default allocations
  - Stop-loss mechanisms (future)

**Liquidity Risk**
- **Mitigation**:
  - USDM has daily redemptions
  - Maintain reserve fund for withdrawals
  - Batch withdrawal optimization

### Operational Risks

**M-Pesa Integration Failure**
- **Mitigation**: Dual on-ramp providers (Paycrest + Kotani Pay)
- **Monitoring**: Real-time status checks
- **Communication**: Transparent user notifications

**AI Service Downtime (Claude API)**
- **Mitigation**: Fallback to pre-generated strategies
- **Caching**: Store common recommendations
- **Alternative**: OpenAI GPT-4 as backup

## Success Metrics (KPIs)

### Growth Metrics
- **User Acquisition**: New sign-ups per month
- **Activation Rate**: % completing first deposit
- **Monthly Active Users**: Users with activity in 30 days
- **User Retention**: 30-day, 90-day, 180-day cohorts

### Financial Metrics
- **Total Value Preserved (TVP)**: Total AUM
- **Average Account Size**: TVP / Total Users
- **Deposit Frequency**: Transactions per user per month
- **Revenue per User**: Monthly revenue / MAU

### Engagement Metrics
- **Goal Completion Rate**: % of goals reached
- **Learning Engagement**: Academy lessons completed
- **AI Interactions**: Strategy reviews, Q&A sessions
- **Chama Participation**: % of users in chamas (Phase 3)

### Phase 1 Success Criteria (Month 6)
- ✅ 10,000 registered users
- ✅ $1.5M Total Value Preserved
- ✅ 60%+ activation rate (first deposit)
- ✅ 50%+ 30-day retention
- ✅ <5 minute average onboarding time
- ✅ <15 minute average deposit time
- ✅ 4.5+ App Store rating

## Roadmap

### Phase 1: Foundation (Months 1-3)
- ✅ Core infrastructure setup
- ✅ USDM integration
- ✅ M-Pesa on-ramp (Paycrest)
- ✅ AI strategy quiz
- ✅ Basic portfolio dashboard
- ✅ Smart batching deposits
- ✅ Goal tracking
- 🚧 Privy auth integration
- 🚧 Landing page + onboarding
- 📋 Web app launch

### Phase 2: Multi-Asset (Months 4-9)
- 📋 bCSPX integration (S&P 500)
- 📋 PAXG integration (Gold)
- 📋 Dynamic portfolio rebalancing
- 📋 Advanced analytics
- 📋 KYC integration (Fractal ID)
- 📋 Withdrawal flows
- 📋 Push notifications
- 📋 Mobile PWA optimization

### Phase 3: Community (Months 10-18)
- 📋 Chama group creation
- 📋 Batch deposit optimization
- 📋 Loan management
- 📋 Kiota Academy launch
- 📋 Badge NFT system
- 📋 Leaderboards
- 📋 Referral program
- 📋 Premium tier launch

### Phase 4: Scale (Months 18+)
- 📋 React Native mobile app
- 📋 Additional countries (Uganda, Tanzania)
- 📋 Additional assets (OUSG, BTC, ETH)
- 📋 Tax reporting tools
- 📋 Estate planning features
- 📋 Institutional partnerships
- 📋 White-label solutions

**Legend**: ✅ Complete | 🚧 In Progress | 📋 Planned

---

## Appendix

### Asset Details

**USDM (Mountain Protocol)**
- Contract: 0x59D9356E565Ab3A36dD77763Fc0d87fEaf85508C
- Chain: Base
- Decimals: 18
- Issuer: Mountain Protocol
- Regulatory Status: SEC-registered RIC fund
- Backing: US Treasury bills
- Yield: ~5% APY (variable based on Fed rates)
- Redemption: T+1 business day
- Minimum: No minimum
- Audit: Regular attestations by third-party auditors

**bCSPX (Backed Finance)**
- Product: Tokenized S&P 500 index
- Issuer: Backed Finance (Swiss regulated)
- Expected Return: 10-12% annually (tracks S&P 500)
- Management Fee: 0.95% annually
- Rebalancing: Quarterly to match S&P 500 composition
- Liquidity: Daily trading
- Minimum: No minimum

**PAXG (Paxos Gold)**
- Product: Gold-backed token
- Backing: 1 PAXG = 1 troy ounce gold
- Issuer: Paxos Trust Company (NY-regulated)
- Storage: London vaults
- Audit: Monthly third-party verification
- Redemption: Physical gold delivery available (400 oz minimum)
- Liquidity: 24/7 trading

### Glossary

**AUM (Assets Under Management)**: Total value of assets managed by platform

**APY (Annual Percentage Yield)**: Annualized rate of return including compounding

**Base**: Ethereum Layer 2 blockchain built by Coinbase

**Chama**: Traditional Kenyan savings group (plural: Chamas)

**KYC (Know Your Customer)**: Identity verification process

**M-Pesa**: Kenya's mobile money platform (40M+ users)

**On-Ramp**: Service converting fiat currency to cryptocurrency

**RIC (Regulated Investment Company)**: SEC-regulated fund structure

**Stablecoin**: Cryptocurrency pegged to fiat currency (usually USD)

**TVP (Total Value Preserved)**: Total amount users have saved on platform

**Yield**: Return generated by holding an asset (interest, dividends, etc.)

---

**Document Status**: Complete
**Next Review**: February 2026
**Owner**: Product Team

**Related Documents**:
- [Screen Specifications](./SCREENS.md)
- [Market Analysis](./MARKET.md)
- [Business Model](./BUSINESS_MODEL.md)
- [Technical Architecture](../technical/ARCHITECTURE.md)
