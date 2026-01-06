# Screen Specifications

**Version**: 1.0
**Last Updated**: January 6, 2026
**Total Screens**: 30 (18 Phase 1, 12 Phase 2)

## Navigation Structure

```
Landing Page
│
├── Onboarding Flow (Screens 1-5)
│   ├── Sign Up
│   ├── Strategy Quiz
│   ├── Strategy Recommendation
│   ├── Account Creation
│   └── Welcome Tutorial
│
├── Main App (Screens 6-30)
│   │
│   ├── Dashboard (Screen 6)
│   │
│   ├── Portfolio (Screens 7-10)
│   │   ├── Overview
│   │   ├── Asset Details
│   │   ├── Transaction History
│   │   └── Performance Analytics
│   │
│   ├── Deposit (Screens 11-15)
│   │   ├── Deposit Hub
│   │   ├── Smart Batch
│   │   ├── Automated Rules
│   │   ├── M-Pesa Payment
│   │   └── Confirmation
│   │
│   ├── Goals (Screens 16-18)
│   │   ├── Goals Overview
│   │   ├── Create Goal
│   │   └── Goal Details
│   │
│   ├── Withdraw (Screens 19-20)
│   │   ├── Withdrawal Form
│   │   └── Confirmation
│   │
│   ├── Chama (Screens 21-25) [Phase 3]
│   │   ├── Chama List
│   │   ├── Create Chama
│   │   ├── Chama Dashboard
│   │   ├── Member Management
│   │   └── Loan Request
│   │
│   └── Learn (Screens 26-30) [Phase 3]
│       ├── Academy Home
│       ├── Track Selection
│       ├── Module View
│       ├── Lesson Player
│       └── Achievements
```

---

## Phase 1 Screens (18 screens)

### Onboarding Flow

#### Screen 1: Landing Page

**Route**: `/`

**Purpose**: First impression, value proposition, social proof

**Components**:
- Hero Section
  - Headline: "Protect Your Wealth. Save in Dollars. Earn 5% Yields."
  - Subheadline: "Join 10,000+ Kenyans preserving wealth through tokenized US assets"
  - CTA Buttons: "Get Started Free" (primary), "Watch Demo" (secondary)
  - Live Demo Widget: Animated portfolio showing real yields

- Trust Indicators
  - "Backed by US Treasury Bonds"
  - "Secured by Base Blockchain"
  - "5% Annual Yield"
  - User testimonials with photos

- How It Works (3 steps)
  1. "Deposit with M-Pesa" - Icon + description
  2. "AI Picks Your Strategy" - Icon + description
  3. "Watch Your Wealth Grow" - Icon + description

- Stats Section
  - Total Value Preserved
  - Active Savers
  - Average Monthly Yield

- FAQ Accordion (5 questions)
  - "How is this different from a bank?"
  - "Is my money safe?"
  - "How do I withdraw?"
  - "What fees do you charge?"
  - "Do I need to understand crypto?"

**State**:
- Authenticated: Redirect to /dashboard
- New User: Show full landing page

**CTA Actions**:
- "Get Started" → Screen 2 (Sign Up)
- "Watch Demo" → Video modal
- "Learn More" → Scroll to features

---

#### Screen 2: Sign Up

**Route**: `/signup`

**Purpose**: User authentication via Privy

**Components**:
- Privy Auth Widget
  - Google Sign-In button
  - Phone number input + OTP
  - Email + magic link option

- Value Prop Sidebar
  - "Your wallet is created automatically"
  - "No passwords to remember"
  - "Recover with email or phone"

- Legal Links
  - Terms of Service
  - Privacy Policy
  - Risk Disclosure

**Flow**:
1. User selects auth method (Google/Phone/Email)
2. Privy handles authentication
3. Embedded wallet created automatically
4. → Screen 3 (Strategy Quiz)

**State**:
- Loading during auth
- Error handling (invalid phone, etc.)
- Success → auto-redirect

---

#### Screen 3: Strategy Quiz

**Route**: `/onboarding/quiz`

**Purpose**: Collect information for AI strategy generation

**Components**:
- Progress Bar (8 steps)
- Question Cards (one at a time)

**Questions**:

1. **Age**
   - "How old are you?"
   - Options: 18-25, 26-35, 36-45, 46-55, 56+

2. **Income**
   - "What's your monthly income?"
   - Options: <50K, 50-100K, 100-150K, 150-250K, 250K+
   - Note: "This helps us recommend appropriate deposit amounts"

3. **Savings Goal**
   - "What are you saving for?"
   - Options: Emergency Fund, Education, Home Purchase, Retirement, General Wealth
   - Allow multiple selection

4. **Time Horizon**
   - "When do you need this money?"
   - Options: <1 year, 1-3 years, 3-5 years, 5-10 years, 10+ years

5. **Risk Tolerance**
   - "How would you react if your portfolio dropped 10% in a month?"
   - Options:
     - "Sell everything" (Very Conservative)
     - "Feel worried but hold" (Conservative)
     - "Not concerned, it's temporary" (Moderate)
     - "Buy more, it's on sale!" (Aggressive)

6. **Investment Experience**
   - "Have you invested before?"
   - Options: Never, Bank savings only, Stocks/bonds, Crypto, All of the above

7. **Monthly Deposit**
   - "How much can you save monthly?"
   - Options: <5K, 5-10K, 10-20K, 20-50K, 50K+
   - Slider input with KES and USD display

8. **Priorities**
   - "What matters most to you?"
   - Options (rank top 3):
     - High yields
     - Low risk
     - Easy access to money
     - Protection from inflation
     - Learning about investing

**Actions**:
- "Back" button (except first question)
- "Next" button (disabled until answer selected)
- "Skip Quiz" link → Conservative default strategy
- Submit → Screen 4 (AI Recommendation)

**State**:
- Answers saved in real-time
- Can navigate back to change answers
- Loading animation while AI generates strategy

---

#### Screen 4: Strategy Recommendation

**Route**: `/onboarding/strategy`

**Purpose**: Display AI-generated investment strategy

**Components**:

**Header**:
- "Your Personalized Strategy"
- "Generated by Claude AI based on your answers"

**Strategy Card**:
- **Strategy Name**: e.g., "Conservative Growth Portfolio"
- **Risk Level**: Visual indicator (Low/Medium/High)
- **Expected Return**: "5-6% annually"
- **Asset Allocation** (Phase 1: 100% USDM)
  - Pie chart visualization
  - 100% USDM (Mountain Protocol)
  - Phase 2 will show: e.g., 60% USDM, 30% bCSPX, 10% PAXG

**AI Explanation**:
- Text box with Claude's reasoning
- Example: "Based on your conservative risk tolerance and 3-5 year timeline, I recommend starting with 100% USDM. This gives you a stable 5% yield backed by US Treasury bonds, protecting you from KES devaluation while you build confidence. As you grow more comfortable, we can add S&P 500 exposure for higher growth potential."

**Recommended Monthly Deposit**:
- "Based on your KES 15,000 monthly savings capacity"
- "Deposit: KES 15,000 (~$100 USD) per month"
- "Projected in 3 years: KES 813,000 ($5,420 USD)"
- Chart showing growth projection

**Next Steps Card**:
1. ✅ Create account (done)
2. ✅ Get strategy (current)
3. ⏭️ Make first deposit
4. ⏭️ Set up automation

**Actions**:
- "Accept Strategy" (primary) → Screen 5 (Account Creation)
- "Adjust Strategy" (secondary) → Back to Screen 3
- "Talk to AI" → Chat modal with Claude

**State**:
- Loading while strategy generates (10-15 seconds)
- Error handling if API fails → Default conservative strategy
- Strategy saved to user profile

---

#### Screen 5: Welcome Tutorial

**Route**: `/onboarding/welcome`

**Purpose**: Quick interactive tutorial (skippable)

**Components**:
- Welcome Message
  - "Welcome to Kiota, [Name]!"
  - "Let's take a quick tour (1 minute)"

**Tutorial Steps** (4 slides with animations):

1. **Your Dashboard**
   - Screenshot with hotspots
   - "Track your total wealth in USD and KES"
   - "See your yields update daily"

2. **Smart Batching**
   - Animation showing deposits accumulating
   - "Deposit any amount from KES 100"
   - "We batch to $10+ to save you fees"

3. **Goals & Automation**
   - Goal creation demo
   - "Set goals and automate your savings"
   - "We'll remind you and track progress"

4. **AI Advisor**
   - Chat interface preview
   - "Ask Claude anything about investing"
   - "Get portfolio reviews every quarter"

**Actions**:
- "Next" button (slides 1-3)
- "Go to Dashboard" (slide 4) → Screen 6
- "Skip Tutorial" link (all slides) → Screen 6
- Dots indicator showing progress (1/4, 2/4, etc.)

**State**:
- Tutorial completion tracked
- Can revisit from settings
- Auto-skip if user returns from /dashboard

---

### Main Application

#### Screen 6: Dashboard

**Route**: `/dashboard`

**Purpose**: Primary hub, portfolio overview, quick actions

**Layout**:
- Header with user menu
- Main content area
- Bottom navigation (mobile)

**Components**:

**Header Bar**:
- Kiota logo (top left)
- User profile (top right)
  - Avatar
  - Name
  - Dropdown menu:
    - Settings
    - Help & Support
    - Log Out

**Portfolio Summary Card**:
- **Total Value**
  - Large display: "$2,885.43"
  - Secondary: "KES 433,281"
  - Toggle between USD/KES primary
- **24h Change**
  - "+$12.34 (+0.43%)" in green
  - Mini sparkline chart
- **Yield Earned**
  - "This month: $12.14"
  - "All time: $45.89"

**Quick Actions** (4 buttons):
- 💰 Deposit
- 📤 Withdraw
- 🎯 Create Goal
- 🤖 Ask AI

**Recent Activity**:
- List of last 5 transactions
- Each showing:
  - Icon (deposit/withdrawal/yield)
  - Description: "Deposited via M-Pesa"
  - Amount: "+$50.00"
  - Date: "2 days ago"
- "View All" link → Screen 9 (Transaction History)

**Goals Progress** (if user has goals):
- Horizontal scrollable cards
- Each goal showing:
  - Goal name: "Emergency Fund"
  - Progress bar: "67% complete"
  - "$6,700 / $10,000"
  - Days remaining: "124 days left"
- "Create Goal" CTA if no goals

**AI Insights Card**:
- Latest AI-generated insight
- Example: "Great progress! You're on track to reach your emergency fund goal 2 months early. Consider increasing your education fund contributions."
- "Chat with Claude" button

**Portfolio Allocation** (Phase 2):
- Donut chart showing asset breakdown
- 100% USDM in Phase 1
- Click asset → Screen 8 (Asset Details)

**Bottom Navigation** (Mobile):
- Icons with labels:
  - 🏠 Home (Dashboard)
  - 📊 Portfolio
  - ➕ Deposit (center, larger)
  - 🎯 Goals
  - 👤 Profile

**State**:
- Real-time balance updates
- Pull-to-refresh
- Loading skeletons for async data

---

### Portfolio Screens

#### Screen 7: Portfolio Overview

**Route**: `/portfolio`

**Purpose**: Detailed portfolio view and analytics

**Components**:

**Header**:
- Total Portfolio Value (large)
- Time period selector: 24H / 1W / 1M / 3M / 1Y / ALL
- Portfolio performance chart
  - Line chart showing value over time
  - Green area fill for gains
  - Markers for deposits/withdrawals

**Performance Metrics**:
- **Total Return**
  - Dollar amount: "+$385.43"
  - Percentage: "+15.4%"
  - Since account creation

- **Yield Earned**
  - Month-to-date: "$12.14"
  - All-time: "$45.89"
  - APY: "5.2%"

- **Cost Basis**
  - "Total Deposited: $2,500.00"
  - "Total Withdrawn: $0.00"
  - "Net Investment: $2,500.00"

**Asset Breakdown**:
- **Phase 1**: Single card
  - USDM (Mountain Protocol)
  - Balance: "$2,885.43"
  - 100% allocation
  - 24h change: "+$0.43"
  - Yield: "5.0% APY"
  - Click → Screen 8 (Asset Details)

- **Phase 2**: Multiple cards
  - USDM: "$1,731.26" (60%)
  - bCSPX: "$865.63" (30%)
  - PAXG: "$288.54" (10%)
  - Each clickable → Asset Details

**Rebalancing Alert** (Phase 2):
- Shows if portfolio drifted >5% from target
- "Your portfolio needs rebalancing"
  - Current: 55% USDM, 35% bCSPX, 10% PAXG
  - Target: 60% USDM, 30% bCSPX, 10% PAXG
- "Rebalance Now" button → AI-powered rebalancing flow

**Pending Deposits**:
- If user has batched deposits waiting
- "Pending Batch: $8.50 / $10.00"
- Progress bar
- "Add $1.50 more to trigger conversion"

**Actions**:
- "Add Funds" button → Screen 11
- "Withdraw" button → Screen 19
- "Export Report" → PDF download
- "Share Performance" → Social share

**Filters**:
- "All Assets" / "USDM" / "bCSPX" / "PAXG" (Phase 2)

---

#### Screen 8: Asset Details

**Route**: `/portfolio/[assetId]`

**Example**: `/portfolio/usdm`

**Purpose**: Deep dive into specific asset

**Components**:

**Asset Header**:
- Asset logo and name: "Mountain Protocol (USDM)"
- Asset type badge: "Stablecoin" / "Equity Index" / "Commodity"
- Your balance: "$2,885.43"
- Percentage of portfolio: "100%"

**Price Chart** (for non-stablecoins):
- USDM: Shows $1.00 stable line
- bCSPX/PAXG: Price chart with time periods
- Price: Current USD price
- 24h change

**Your Holdings**:
- **Quantity**: "2,885.43 USDM"
- **Current Value**: "$2,885.43"
- **Cost Basis**: "$2,500.00"
- **Unrealized Gain**: "+$385.43 (+15.4%)"
- **Yield Earned**: "$45.89" (USDM only)

**Asset Information**:
Expandable sections:

1. **About**
   - Description of the asset
   - USDM: "USDM is a yield-bearing stablecoin backed 1:1 by US Treasury bills. It's issued by Mountain Protocol, a regulated fund manager. Each USDM token represents ownership in a diversified portfolio of short-term US government bonds."

2. **Key Facts**
   - Issuer: Mountain Protocol
   - Blockchain: Base (Ethereum L2)
   - Contract: 0x59D9...508C
   - Yield: ~5% APY
   - Liquidity: Daily redemptions
   - Regulatory Status: SEC-registered RIC

3. **Backing & Security**
   - Collateral: US Treasury bills
   - Custodian: [Name]
   - Auditor: [Firm]
   - Last audit: [Date]
   - Audit report link

4. **Risks**
   - List of potential risks
   - Regulatory risk
   - Smart contract risk
   - Counterparty risk
   - Liquidity risk

**Transaction History**:
- Filtered to this asset
- Last 10 transactions
- Buy/Sell/Yield events
- "View All Transactions" → Screen 9

**Actions**:
- "Buy More" → Screen 11 (Deposit)
- "Sell" → Screen 19 (Withdraw)
- "Learn More" → External link to asset website
- "Add to Watchlist" (Phase 2, for assets not held)

**AI Insights**:
- Claude-generated analysis
- "USDM is performing as expected with steady 5% yields. The US Treasury backing makes it a safe foundation for your portfolio."
- "Ask Claude" button → Chat modal

---

#### Screen 9: Transaction History

**Route**: `/portfolio/transactions`

**Purpose**: Complete transaction log

**Components**:

**Filters**:
- **Time Range**: Last 7 days / 30 days / 90 days / 1 year / All time
- **Transaction Type**: All / Deposits / Withdrawals / Yields / Swaps (Phase 2)
- **Asset**: All / USDM / bCSPX / PAXG
- **Status**: All / Completed / Pending / Failed

**Search Bar**:
- Search by amount, date, or transaction ID

**Transaction List**:
Each transaction card shows:
- **Icon**: Type-specific (↓ deposit, ↑ withdrawal, 💰 yield, 🔄 swap)
- **Title**: "M-Pesa Deposit" / "Yield Accrued" / "Withdrawal to M-Pesa"
- **Asset**: "USDM" with logo
- **Amount**: "+$50.00" / "-$100.00"
  - Secondary: KES equivalent
- **Date & Time**: "Jan 5, 2026 at 3:42 PM"
- **Status Badge**: ✅ Completed / ⏳ Pending / ❌ Failed
- **Transaction Hash**: "0x7f3a...c91d" (clickable → BaseScan)

**Expandable Details** (click transaction):
- Full transaction ID
- Block number
- Gas fee (if applicable)
- From/To addresses
- Confirmations
- "View on BaseScan" link
- "Download Receipt" button

**Summary Stats** (top of page):
- **Total Deposits**: "$2,500.00" (15 transactions)
- **Total Withdrawals**: "$0.00" (0 transactions)
- **Total Yields**: "$45.89"
- **Net Position**: "+$2,545.89"

**Export**:
- "Export to CSV" button
- Date range selector
- Useful for tax reporting

**Pagination**:
- Load more as user scrolls
- "Showing 50 of 243 transactions"

---

#### Screen 10: Performance Analytics

**Route**: `/portfolio/analytics`

**Purpose**: Advanced portfolio insights (Phase 2)

**Components**:

**Performance Overview**:
- Multiple time period charts
  - 1 Month performance
  - 3 Month performance
  - 1 Year performance
  - All-time performance

**Returns Breakdown**:
- **By Asset**:
  - USDM: +$45.89 (yield)
  - bCSPX: +$285.43 (price appreciation)
  - PAXG: +$54.11 (price appreciation)
  - Total: +$385.43

- **By Source**:
  - Yields/Interest: $45.89
  - Price Appreciation: $339.54
  - Total: $385.43

**Risk Metrics**:
- **Portfolio Volatility**: "Low" / "Medium" / "High"
- **Sharpe Ratio**: 1.85 (risk-adjusted returns)
- **Max Drawdown**: "-2.3%" (largest peak-to-trough decline)
- **Standard Deviation**: Annualized volatility percentage

**Correlation Matrix** (Phase 2):
- Shows how assets move together
- USDM vs bCSPX correlation: 0.05 (low)
- Diversification score

**Deposit Patterns**:
- Chart showing deposit frequency
- Average deposit size: "$83.33"
- Most common deposit day: "15th of month" (payday)
- Consistency score: "Excellent - 95%"

**Yield History**:
- Chart showing yield accrual over time
- Month-by-month breakdown
- Projected next month yield

**AI Analysis**:
- Claude-generated portfolio review
- Strengths and opportunities
- Optimization suggestions
- Risk assessment

**Comparison Tools**:
- Compare performance to:
  - KES savings account
  - USD savings account
  - S&P 500 index
  - Gold
- Visual comparison chart

**Actions**:
- "Schedule AI Review" → Calendar picker
- "Download Report" → PDF with all analytics
- "Share" → Anonymized performance share

---

### Deposit Screens

#### Screen 11: Deposit Hub

**Route**: `/deposit`

**Purpose**: Choose deposit method

**Components**:

**Header**:
- "Add Funds to Your Portfolio"
- Current balance display
- Pending batch status (if applicable)

**Three Deposit Pathways** (cards):

**1. Smart Batch (Recommended)**
- **Title**: "Smart Batching"
- **Badge**: "Recommended - Lowest Fees"
- **Description**: "Deposit any amount. We batch to $10+ to minimize fees."
- **Fee**: "2.5% (vs 5%+ for small deposits)"
- **Best For**: "Regular savers, any amount"
- **Icon**: 📦
- **CTA**: "Deposit Now" → Screen 12

**2. Automated Deposits**
- **Title**: "Automate Your Savings"
- **Description**: "Set up recurring deposits or round-up rules"
- **Types**:
  - Daily/Weekly/Monthly schedules
  - Round-up spare change
  - Percentage of income
- **Best For**: "Consistent savers who want to set and forget"
- **Icon**: 🤖
- **CTA**: "Set Up Automation" → Screen 13

**3. Goal-Driven**
- **Title**: "Save Toward a Goal"
- **Description**: "Create a goal and fund it automatically"
- **Examples**: Emergency Fund, Education, Home
- **Best For**: "Saving for something specific"
- **Icon**: 🎯
- **CTA**: "Create Goal" → Screen 17

**Quick Deposit** (if user has method saved):
- "Quick deposit with saved M-Pesa number"
- Amount input
- "Deposit KES [amount]" button
- Skips to M-Pesa payment flow

**Pending Batch Status** (if applicable):
- Card showing current batch
- "Current Batch: $8.50 / $10.00"
- Progress bar (85%)
- "Add $1.50 to trigger conversion"
- ETA: "Converts in ~2 hours or when threshold reached"

**Deposit History**:
- "Recent Deposits" section
- Last 3 deposit transactions
- "View All" → Screen 9 (filtered to deposits)

**Info Cards**:
- **How M-Pesa Works**
  - Explanation of process
  - Expected settlement time: 5-15 minutes

- **Fees Breakdown**
  - Paycrest fee: 2.5%
  - Network fee: Sponsored (free)
  - Example: "Deposit KES 1,500 → Receive $9.75 USD"

---

#### Screen 12: Smart Batch Deposit

**Route**: `/deposit/batch`

**Purpose**: Single deposit that goes into batch queue

**Components**:

**Amount Input**:
- **KES Input** (primary)
  - Large input field
  - "Enter amount in KES"
  - Quick amount buttons: +500, +1000, +5000

- **USD Equivalent** (real-time)
  - "≈ $10.00 USD"
  - Updates as user types
  - Exchange rate: "1 USD = 150 KES"

**Batch Status Preview**:
- **Current Batch**: "$8.50"
- **Your Deposit**: "+$10.00"
- **New Batch Total**: "$18.50"
- **Status**: "✅ Will trigger conversion!" (if >$10 total)
  - OR "Waits in batch (need $1.50 more)"

**Timeline Visualization**:
```
Current Batch: $8.50
     │
     ├── Your Deposit: +$10.00
     │
Total: $18.50 ✅
     │
     └── Converts to USDM in ~5-15 min
         │
         └── Appears in your portfolio
```

**Fee Breakdown**:
- **Paycrest Fee**: "2.5% (KES 37.50)"
- **You Receive**: "$9.75 USD in USDM"
- **Savings vs Instant**: "~KES 25 saved"

**M-Pesa Number**:
- Input field for phone number
- Format: "07XX XXX XXX"
- Checkbox: "Save for future deposits"

**Terms Acceptance**:
- Checkbox: "I understand this is a crypto transaction"
- Links to Terms, Privacy Policy, Risk Disclosure

**Actions**:
- "Continue to M-Pesa" (primary) → Screen 14
- "Back" (secondary) → Screen 11
- "Need help?" → FAQ modal

**Savings Calculator** (expandable):
- "See how batching saves you money"
- Comparison:
  - Instant $10 deposit: 5% fee = $0.50
  - Batched $10 deposit: 2.5% fee = $0.25
  - **Savings: $0.25 (50% less fees!)**

---

#### Screen 13: Automated Deposit Rules

**Route**: `/deposit/automate`

**Purpose**: Set up recurring deposits or rules

**Components**:

**Tabs**:
1. Recurring Deposits
2. Round-Up Rules
3. Percentage Rules

**Tab 1: Recurring Deposits**

- **Frequency Selector**:
  - Daily
  - Weekly (choose day of week)
  - Bi-Weekly (choose days)
  - Monthly (choose date: 1st, 15th, etc.)
  - Custom interval

- **Amount**:
  - Fixed amount in KES
  - Quick presets: 1000, 2500, 5000, 10000
  - USD equivalent shown

- **Start Date**:
  - Date picker
  - "Start next payday" option

- **End Condition**:
  - Never (ongoing)
  - After X deposits
  - On specific date
  - When goal reached

- **M-Pesa Authorization**:
  - Phone number
  - Consent to recurring charges
  - Can cancel anytime

- **Preview**:
  - "KES 5,000 every 1st & 15th of month"
  - "≈ $33 USD per deposit"
  - "Estimated annual deposit: $800"

**Tab 2: Round-Up Rules**

- **Round-Up Amount**:
  - Round to nearest KES 100 / 500 / 1000
  - Example: "Purchase of KES 850 → Round up KES 150"

- **Source**:
  - M-Pesa transactions
  - Linked bank account (future)

- **Cap**:
  - Maximum round-up per transaction: KES 100-1000
  - Daily limit: KES 500-2000
  - Monthly limit

- **Example Visualization**:
  ```
  Jan 5: Lunch KES 750 → Round up KES 250 to KES 1000
  Jan 6: Transport KES 300 → Round up KES 200 to KES 500
  Jan 7: Groceries KES 2,100 → Round up KES 400 to KES 2,500

  Week Total: KES 850 rounded up (~$5.67 saved)
  ```

- **Batch Integration**:
  - "Round-ups go into your batch"
  - "Convert when batch reaches $10+"

**Tab 3: Percentage Rules**

- **Income Percentage**:
  - "Save X% of income deposits"
  - Slider: 5% - 50%
  - Detects income deposits (>KES 20,000)

- **Example**:
  - "Save 10% of salary"
  - Salary: KES 80,000
  - Auto-save: KES 8,000 (~$53)

- **Bonus Savings**:
  - "Save X% of bonuses"
  - Higher percentage option

**Active Rules List**:
- Shows all active automation rules
- Toggle on/off
- Edit or delete
- Pause temporarily

**Actions**:
- "Activate Rule" (primary)
- "Preview First" → Show calculation
- "Save as Draft"

---

#### Screen 14: M-Pesa Payment

**Route**: `/deposit/mpesa`

**Purpose**: Complete M-Pesa payment

**Components**:

**Payment Summary**:
- **Amount to Pay**: "KES 1,500" (large, bold)
- **You'll Receive**: "$9.75 USD in USDM"
- **Fee**: "KES 37.50 (2.5%)"

**Instructions**:
Step-by-step M-Pesa process:

1. **Enter PIN**
   - "Check your phone for M-Pesa prompt"
   - Phone number displayed: "0712 345 678"

2. **Approve Payment**
   - "Enter your M-Pesa PIN to confirm"
   - Amount: "KES 1,500"
   - To: "Kiota Savings"

3. **Wait for Confirmation**
   - "This usually takes 30 seconds"
   - Loading animation

**Status Tracking**:
Real-time status updates:
- ⏳ Waiting for M-Pesa confirmation...
- ✅ M-Pesa payment received!
- ⏳ Converting to USDC...
- ⏳ Swapping to USDM...
- ✅ USDM deposited to your wallet!
- ⏳ Adding to batch queue...
- ✅ Complete!

**Timeout Handling**:
- If no payment after 5 minutes:
  - "Haven't received payment yet"
  - "Did you approve the M-Pesa prompt?"
  - "Try Again" button
  - "Cancel Deposit" option

**Error Handling**:
- Insufficient M-Pesa balance
  - "Insufficient funds. Please top up M-Pesa and try again."
- Invalid PIN
  - "Payment failed. Check your PIN and try again."
- Network error
  - "Connection issue. Retrying..."

**Actions**:
- "I've Paid" button (if stuck)
- "Cancel" button (before payment)
- "Contact Support" link

**Success** → Screen 15 (Confirmation)

---

#### Screen 15: Deposit Confirmation

**Route**: `/deposit/success`

**Purpose**: Confirm successful deposit

**Components**:

**Success Animation**:
- Checkmark animation
- Confetti effect (first deposit)

**Confirmation Message**:
- "Deposit Successful!"
- "Your funds are on the way"

**Transaction Details**:
- **Amount Deposited**: "$9.75 USD"
- **Transaction ID**: "TXN-20260105-A7F2"
  - Copyable
- **Timestamp**: "January 5, 2026 at 3:42 PM"
- **Status**: "✅ Completed"
- **Batch Status**:
  - "Added to batch: $18.50 / $10.00"
  - "Converting to USDM now!"
  - OR "Waiting in batch ($8.50 / $10.00)"

**What's Next**:
- **If batch converting**:
  - "Your USDM will appear in your portfolio in 5-15 minutes"
  - "You'll receive a notification when complete"

- **If waiting in batch**:
  - "Your deposit is safely in queue"
  - "Batch converts when it reaches $10 or in 48 hours"
  - "Add more to trigger faster conversion"

**Receipt**:
- "Email receipt sent to [email]"
- "Download Receipt" button (PDF)

**Actions**:
- "View Portfolio" (primary) → Screen 7
- "Deposit More" (secondary) → Screen 11
- "Go to Dashboard" → Screen 6
- "Share Achievement" (first deposit) → Social share

**First Deposit Special**:
- "Welcome Bonus Unlocked!"
- Badge/NFT earned
- "You've taken your first step toward wealth preservation"
- Confetti animation

**M-Pesa SMS**:
Preview of M-Pesa confirmation SMS:
```
KES 1,500 paid to Kiota Savings.
New M-Pesa balance: KES 3,200.
Transaction ID: QA12B3C4D5
```

---

### Goals Screens

#### Screen 16: Goals Overview

**Route**: `/goals`

**Purpose**: View and manage all savings goals

**Components**:

**Header**:
- "Your Savings Goals"
- Total saved toward goals: "$1,250 / $25,000"
- Overall progress: "5% complete"

**Create Goal CTA** (if no goals):
- Illustration of goal achievement
- "Set your first savings goal"
- "Whether it's an emergency fund or dream vacation, goals help you stay on track"
- "Create Goal" button

**Active Goals** (if user has goals):
Scrollable list of goal cards:

**Goal Card Components**:
- **Goal Icon**: Emoji or icon (🏠 📚 ✈️ 💰)
- **Goal Name**: "Emergency Fund"
- **Progress Bar**: Visual bar with percentage
- **Amount**: "$6,700 / $10,000 (67%)"
- **Status Badge**:
  - "On Track" (green) - ahead of schedule
  - "At Risk" (yellow) - behind schedule
  - "Paused" (gray) - deposits paused
- **Time Remaining**: "124 days until target date"
- **Monthly Deposit**: "Saving KES 5,000/month"
- **Next Milestone**: "75% → In 45 days"

Click goal card → Screen 18 (Goal Details)

**Goal Categories Filter**:
- All Goals
- Emergency Fund
- Education
- Home/Property
- Travel
- Retirement
- Custom

**Sort Options**:
- Progress (highest first)
- Target date (soonest first)
- Amount (largest first)
- Recently created

**Completed Goals** (expandable section):
- Shows goals that reached 100%
- Celebration animation on first view
- "Goal achieved on [date]"
- Option to archive or set new target

**Stats Summary**:
- **Total Goals**: 3 active, 1 completed
- **Total Target**: $25,000
- **Total Saved**: $6,700
- **Monthly Contribution**: KES 15,000 ($100)
- **On Track**: 2 goals
- **At Risk**: 1 goal

**AI Insights**:
- Claude-generated goal optimization
- "You're $200 ahead on your Emergency Fund! Consider allocating extra to your Education goal which is slightly behind."
- "Ask Claude" button

**Actions**:
- "Create New Goal" (primary) → Screen 17
- "Adjust All" → Batch edit deposits
- "Pause All" → Temporary pause
- "Goal Settings" → Configure automation

---

#### Screen 17: Create Goal

**Route**: `/goals/new`

**Purpose**: Create new savings goal

**Components**:

**Progress Indicator**: "Step 1 of 4"

**Step 1: Goal Type**

Choose from templates or custom:

**Templates**:
- **Emergency Fund** 🚨
  - "Recommended: 3-6 months expenses"
  - Pre-filled: KES 450,000 ($3,000)
  - Timeline: 18 months

- **Education Fund** 📚
  - "School fees, courses, training"
  - Suggested: KES 300,000+ ($2,000+)

- **Home Down Payment** 🏠
  - "Save for property purchase"
  - Typical: KES 1.5M - 3M ($10K-$20K)

- **Vacation** ✈️
  - "Dream trip fund"
  - Typical: KES 150,000 - 450,000 ($1K-$3K)

- **Retirement** 🎯
  - "Long-term wealth building"
  - Timeline: 10-30 years

- **Custom** ⚙️
  - "Set your own goal"

**Step 2: Goal Details**

- **Goal Name**:
  - Text input
  - Character limit: 30
  - Example: "Emergency Fund - 6 Months"

- **Target Amount**:
  - Input in KES or USD
  - Real-time conversion
  - Suggested amounts based on goal type

- **Target Date**:
  - Date picker
  - Or "In X months/years"
  - Minimum: 1 month
  - Maximum: 30 years (retirement)

- **Priority**:
  - High / Medium / Low
  - Affects automation recommendations

**Step 3: Funding Strategy**

AI calculates required deposits:

- **AI Recommendation**:
  - "To reach $3,000 in 18 months with 5% APY:"
  - "Deposit KES 5,500 ($37) monthly"
  - OR "Deposit KES 1,375 ($9) weekly"

- **Deposit Method**:
  - Manual deposits
  - Automated recurring (link to Screen 13)
  - Percentage of income
  - Round-ups

- **Starting Deposit** (optional):
  - "Kickstart with initial deposit"
  - Amount input

**Projection Chart**:
- Line chart showing:
  - Monthly deposits (blue bars)
  - Yield growth (green area)
  - Target line (dashed)
  - Milestone markers

**Milestones**:
Auto-generated or custom:
- 25% - "Strong start"
- 50% - "Halfway there"
- 75% - "Almost there"
- 100% - "Goal achieved!"

**Step 4: Review & Create**

Summary of goal setup:
- Goal name
- Target: $3,000
- Timeline: 18 months
- Monthly deposit: KES 5,500
- Automation: Recurring on 1st & 15th
- Expected completion: July 2027

**Actions**:
- "Create Goal" (primary) → Success message → Screen 18
- "Back" → Previous step
- "Save as Draft"

**First Goal Celebration**:
- "Your first goal created!"
- Badge/NFT earned: "Goal Setter"
- Motivational message

---

#### Screen 18: Goal Details

**Route**: `/goals/[goalId]`

**Purpose**: Detailed view and management of single goal

**Components**:

**Goal Header**:
- Goal icon + name: "🚨 Emergency Fund"
- Edit name (pencil icon)
- Status: "On Track" with color coding

**Progress Section**:
- **Large Progress Ring**: 67% complete
- **Amount**: "$6,700 / $10,000"
- **Time**: "124 of 365 days elapsed"
- **Pace**:
  - "You're 12 days ahead of schedule!"
  - OR "You're 8 days behind schedule"

**Timeline Visualization**:
```
Created         25%          50%          75%          Target
Dec 2025        Feb 2026     May 2026     Aug 2026     Nov 2026
   ├──────────────┼────────────┼────────────┼────────────┤
   └─────────────────● You are here (Jan 2026)
                    67% complete
```

**Milestones**:
List of milestones with status:
- ✅ 25% - "Strong Start" (Achieved Feb 2, 2026)
- ✅ 50% - "Halfway There" (Achieved Apr 15, 2026)
- ⏳ 75% - "Almost There" (Estimated Jul 1, 2026)
- 🎯 100% - "Goal Achieved!" (Target: Nov 30, 2026)

**Deposit Schedule**:
- Current automation:
  - "KES 5,000 on 1st of month"
  - "KES 5,000 on 15th of month"
  - Total: "KES 10,000/month (~$67)"
- "Edit Schedule" button
- Next deposit: "Tomorrow, Jan 15"

**Transaction History** (Goal-specific):
- Filtered to this goal's deposits
- Last 10 transactions
- Yield accruals allocated to this goal
- "View All" → Screen 9 (filtered)

**AI Insights**:
- Goal-specific recommendations
- "Great progress! You're ahead of schedule. Consider:"
  - "Increasing deposits to finish 2 months early"
  - "Starting your next goal (Education Fund)"
  - "Maintaining current pace - you're doing great!"

**Projections**:
Interactive calculator:
- **Current Pace**: "Complete by Sep 2026 (2 months early)"
- **If increase by 10%**: "Complete by Aug 2026"
- **If decrease by 10%**: "Complete by Nov 2026"

Slider to adjust monthly deposit and see impact

**Actions**:
- "Make Deposit" → Screen 11 (auto-allocate to this goal)
- "Edit Goal" → Modal with:
  - Change target amount
  - Change target date
  - Change priority
  - Rename goal
- "Pause Goal" → Temporarily stop deposits
- "Delete Goal" → Confirmation modal
- "Share Progress" → Social share (anonymized)

**Celebration Mode** (when goal reached):
- Confetti animation
- "Goal Achieved!" message
- Achievement badge/NFT
- Summary statistics:
  - "Completed in 285 days"
  - "Total deposited: $9,500"
  - "Yield earned: $500"
  - "Final value: $10,000"
- Options:
  - "Withdraw Funds"
  - "Set New Goal"
  - "Keep Growing (no target)"

**Warning States**:
- If significantly behind schedule:
  - "You may miss your target date"
  - AI recommendation: "Increase deposits by KES 2,000/month to stay on track"
  - "Adjust Goal" button

- If no deposits in 30 days:
  - "No recent deposits detected"
  - "Your goal is falling behind"
  - "Make a deposit" CTA

---

### Withdrawal Screens

#### Screen 19: Withdrawal Form

**Route**: `/withdraw`

**Purpose**: Withdraw funds to M-Pesa

**Components**:

**Warning Banner** (first withdrawal):
- "First withdrawal? Please note:"
  - Processing time: 1-2 business days
  - Fees may apply for amounts <$20
  - Funds sent to M-Pesa as KES

**Available Balance**:
- Total portfolio value: "$2,885.43"
- Available to withdraw: "$2,885.43"
  - OR reduced if funds locked in goals
- "Locked in goals: $1,250" (if applicable)

**Asset Selection** (Phase 2):
- Choose which asset to sell:
  - USDM: "$1,731.26 available"
  - bCSPX: "$865.63 available"
  - PAXG: "$288.54 available"
- Phase 1: Auto-selects USDM

**Amount Input**:
- **USD Input** (primary)
  - "Amount to withdraw (USD)"
  - Max button: "Withdraw All"

- **KES Equivalent** (auto-calculated)
  - "You'll receive ≈ KES 300,000"
  - Exchange rate shown
  - Updates in real-time

**Withdrawal Method**:
- M-Pesa (only option initially)
  - Phone number input
  - "Send to registered M-Pesa: 0712 XXX XXX"
  - Or "Different M-Pesa number"

- Future: Bank account, crypto wallet

**Fee Breakdown**:
- **Amount**: "$200.00"
- **Conversion Fee**: "$5.00 (2.5%)"
- **M-Pesa Fee**: "KES 50"
- **You Receive**: "KES 29,200 (~$195)"
- **Note**: "Fees waived for withdrawals >$100"

**Reason** (optional dropdown):
- Helps improve product
- Options:
  - Emergency expense
  - Goal achieved
  - Need cash
  - Switching platforms
  - Other

**Goal Impact Warning** (if applicable):
- "This withdrawal affects your goals:"
  - Emergency Fund: Set back 45 days
  - Education Fund: Set back 20 days
- "Proceed anyway?" checkbox

**Tax Note**:
- "You may owe taxes on capital gains"
- "Download tax report" link
- Consult tax advisor disclaimer

**Confirmation Checkbox**:
- "I understand this withdrawal may take 1-2 business days"
- "I understand fees apply"
- "I understand this may affect my goals"

**Actions**:
- "Review Withdrawal" (primary) → Screen 20
- "Cancel" → Back to dashboard
- "Partial Withdrawal" → Calculate custom amount

**Restrictions**:
- Minimum withdrawal: $10
- Daily limit: $5,000 (increased with KYC)
- Display if limits exceeded

---

#### Screen 20: Withdrawal Confirmation

**Route**: `/withdraw/confirm`

**Purpose**: Final confirmation before withdrawal

**Components**:

**Confirmation Summary**:
- "Confirm Your Withdrawal"
- Large amount display: "KES 29,200"
- "($195.00 USD)"

**Transaction Details**:
Table format:
- **Withdraw from**: USDM (Mountain Protocol)
- **Amount**: $200.00 USD
- **Exchange Rate**: 1 USD = 150 KES
- **Fees**: $5.00
- **You Receive**: KES 29,200
- **To M-Pesa**: 0712 345 678
- **Processing Time**: 1-2 business days
- **Estimated Arrival**: January 7-8, 2026

**Final Checks**:
- Review M-Pesa number
- "Is this correct? We can't reverse transactions."
- Edit button

**Two-Factor Confirmation**:
- Email code sent to: user@example.com
- "Enter 6-digit code"
- Input field
- "Resend code" link
- Expires in 10 minutes

**What Happens Next**:
1. ✅ USDM converted to USDC
2. ✅ USDC converted to KES via Paycrest
3. ✅ KES sent to your M-Pesa
4. ✅ You receive SMS confirmation

**Actions**:
- "Confirm Withdrawal" (primary, disabled until 2FA entered)
- "Cancel" → Return to Screen 19
- "Edit Details" → Back to Screen 19

**Processing** (after confirmation):
- Loading animation
- Status updates:
  - ⏳ Processing withdrawal...
  - ✅ USDM sold
  - ⏳ Converting to KES...
  - ✅ Sent to M-Pesa
  - ✅ Complete!

**Success Message**:
- "Withdrawal Submitted!"
- "Transaction ID: WTH-20260105-B3C2"
- "Expected in your M-Pesa: Jan 7-8"
- "We'll email you when complete"

**Receipt**:
- "Email receipt sent"
- "Download PDF" button

**Updated Balance**:
- "New portfolio balance: $2,685.43"
- "Available to withdraw: $1,435.43" (if goals locked)

**Actions** (post-success):
- "Go to Dashboard" → Screen 6
- "View Transaction" → Screen 9
- "Close"

**Error Handling**:
- If withdrawal fails:
  - Clear error message
  - Reason (insufficient liquidity, M-Pesa issue, etc.)
  - "Try Again" button
  - "Contact Support" link
  - Funds remain in portfolio

---

## Phase 2 & 3 Screens (12 screens)

*(Coming in Phase 2 & 3 development)*

### Chama Screens (5 screens)

#### Screen 21: Chama List
**Route**: `/chama`
- Overview of user's chamas
- Create new chama button
- Join chama with code
- Pending invitations

#### Screen 22: Create Chama
**Route**: `/chama/new`
- Chama name and description
- Member invitations (phone numbers)
- Contribution rules (amount, frequency)
- Loan rules (max amount, interest, terms)
- Admin settings

#### Screen 23: Chama Dashboard
**Route**: `/chama/[chamaId]`
- Chama total savings
- Your contribution vs target
- Member list with stats
- Upcoming deposits
- Pending loans
- Transaction history

#### Screen 24: Member Management
**Route**: `/chama/[chamaId]/members`
- Add/remove members (admin only)
- Member roles (admin, member, treasurer)
- Contribution tracking
- Performance leaderboard
- Penalties for missed deposits

#### Screen 25: Loan Request
**Route**: `/chama/[chamaId]/loan`
- Loan amount (up to 3x contributions)
- Loan purpose
- Repayment schedule
- Interest calculation
- Member voting (if required)
- Approval status

### Learning Screens (5 screens)

#### Screen 26: Academy Home
**Route**: `/learn`
- Learning tracks overview
- Progress summary
- Recommended next lesson
- Achievements/badges earned
- Leaderboard

#### Screen 27: Track Selection
**Route**: `/learn/tracks`
- Basics Track (4 modules, 12 lessons)
- Investing Track (5 modules, 15 lessons)
- Advanced Track (4 modules, 12 lessons)
- Track details and requirements
- Completion status

#### Screen 28: Module View
**Route**: `/learn/tracks/[trackId]/modules/[moduleId]`
- Module overview
- Lesson list
- Estimated time
- Prerequisites
- Module quiz
- Discussion forum

#### Screen 29: Lesson Player
**Route**: `/learn/lessons/[lessonId]`
- Video/text content
- Interactive exercises
- Progress tracking
- Bookmarks/notes
- Quiz at end
- Next lesson button

#### Screen 30: Achievements
**Route**: `/learn/achievements`
- All badges/NFTs earned
- Badge details (rarity, requirements)
- Share achievements
- Leaderboard position
- Unlock special features

---

## Design System Reference

### Colors

**Primary Palette**:
- Primary: Blue (#2563EB) - CTAs, links
- Success: Green (#10B981) - Positive changes, completed
- Warning: Yellow (#F59E0B) - Alerts, cautions
- Error: Red (#EF4444) - Errors, losses
- Info: Blue (#3B82F6) - Information, neutral

**Neutral Palette**:
- Background: White (#FFFFFF)
- Surface: Gray 50 (#F9FAFB)
- Border: Gray 200 (#E5E7EB)
- Text Primary: Gray 900 (#111827)
- Text Secondary: Gray 600 (#4B5563)

**Asset Colors** (for badges, charts):
- USDM: Blue (#2563EB)
- bCSPX: Purple (#8B5CF6)
- PAXG: Yellow (#F59E0B)

### Typography

**Font Family**: Inter (system fallback)

**Sizes**:
- Display: 48px / 3rem - Landing page hero
- H1: 36px / 2.25rem - Page titles
- H2: 24px / 1.5rem - Section headers
- H3: 20px / 1.25rem - Card titles
- Body: 16px / 1rem - Normal text
- Small: 14px / 0.875rem - Secondary text
- Tiny: 12px / 0.75rem - Labels, captions

**Weights**:
- Bold: 700 - Headings, emphasis
- Semibold: 600 - Subheadings
- Medium: 500 - Buttons
- Regular: 400 - Body text

### Spacing

**Scale** (Tailwind default):
- 1 = 4px
- 2 = 8px
- 3 = 12px
- 4 = 16px
- 6 = 24px
- 8 = 32px
- 12 = 48px
- 16 = 64px

**Common Usage**:
- Card padding: 24px (p-6)
- Section spacing: 48px (space-y-12)
- Button padding: 12px 24px (px-6 py-3)
- Input padding: 12px 16px (px-4 py-3)

### Components

**Buttons**:
- Primary: Blue background, white text
- Secondary: White background, blue border
- Destructive: Red background, white text
- Ghost: Transparent, colored text
- Sizes: Small (32px), Medium (40px), Large (48px)

**Cards**:
- Border: 1px solid Gray 200
- Border radius: 8px (rounded-lg)
- Shadow: Subtle (shadow-sm)
- Hover: Lift effect (shadow-md)

**Inputs**:
- Border: 1px solid Gray 300
- Focus: 2px blue ring
- Error: Red border + error message
- Disabled: Gray background, no pointer

**Badges**:
- Pill shape (rounded-full)
- Sizes: Small (24px), Medium (28px)
- Colors match status (success green, warning yellow, etc.)

### Responsive Breakpoints

- **Mobile**: < 640px (default)
- **Tablet**: 640px - 1024px (sm/md)
- **Desktop**: > 1024px (lg/xl)

**Layout**:
- Mobile: Single column, bottom navigation
- Tablet: Sidebar navigation, 2-column layouts
- Desktop: Fixed sidebar, multi-column dashboards

### Icons

**Library**: Lucide React

**Common Icons**:
- Deposit: ArrowDownCircle
- Withdraw: ArrowUpCircle
- Goal: Target
- Settings: Settings
- Help: HelpCircle
- Close: X
- Menu: Menu
- Check: Check
- Alert: AlertCircle

---

## Interaction Patterns

### Loading States
- Skeleton screens for initial page load
- Spinners for action completion
- Progress bars for multi-step processes
- Optimistic UI updates where safe

### Error Handling
- Inline validation (forms)
- Toast notifications (actions)
- Error pages (404, 500)
- Retry mechanisms
- Support contact always available

### Feedback
- Success animations (confetti, checkmarks)
- Sound effects (optional, user toggle)
- Haptic feedback (mobile)
- Push notifications (important events)
- Email confirmations (transactions)

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast ratios
- Focus indicators
- Alt text for images

---

**Document Status**: Complete
**Next Review**: February 2026
**Owner**: Design & Product Team

**Related Documents**:
- [Product Plan](./PRODUCT_PLAN.md)
- [Component Showcase](http://localhost:3000/showcase)
- [Design System](../technical/DESIGN_SYSTEM.md) (Coming soon)
