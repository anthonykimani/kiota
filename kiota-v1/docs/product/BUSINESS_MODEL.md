# Business Model & Financial Projections

**Version**: 1.0
**Last Updated**: January 6, 2026
**Planning Horizon**: 36 months (3 years)

## Executive Summary

Kiota operates on a dual-revenue model combining asset management fees (0.5% annually on AUM) and deposit fee revenue sharing (0.5% of on-ramp fees). The business model prioritizes user growth and Total Value Preserved (TVP) over short-term revenue, with a path to profitability by Month 18.

**Key Metrics (Month 18 - Base Case)**:
- Users: 50,000
- Total Value Preserved: $25M
- Monthly Revenue: $27,917
- Monthly Costs: $25,000
- Monthly Profit: $2,917
- **Profitability**: Month 18

---

## Revenue Model

### Revenue Stream 1: Asset Management Fee

**Structure**:
- **Rate**: 0.5% annually on Assets Under Management (AUM)
- **Billing**: Monthly (0.0417% per month)
- **Calculation**: Based on average daily balance
- **Asset Type**: Applies to all holdings (USDM, bCSPX, PAXG)

**Rationale**:
- **Competitive**: Traditional fund managers charge 1-2%
- **Low friction**: Small enough users don't notice
- **Scalable**: Grows with AUM automatically
- **Recurring**: Predictable monthly revenue

**Example Calculation**:
```
User has $1,000 average balance
Annual fee: $1,000 × 0.5% = $5.00
Monthly fee: $5.00 / 12 = $0.42
```

**Revenue Projection (Month 18)**:
```
50,000 users × $500 avg balance = $25M TVP
Annual revenue: $25M × 0.5% = $125,000
Monthly revenue: $125,000 / 12 = $10,417
```

---

### Revenue Stream 2: Deposit Fee Revenue Share

**Structure**:
- **On-Ramp Provider**: Paycrest (primary)
- **Provider Fee**: 2.5% on KES→USDC conversion
- **Kiota Share**: 0.5% (20% of provider fee)
- **User Pays**: Still 2.5% total (no additional cost to user)

**Rationale**:
- **Win-Win**: Provider gets volume, we get revenue share
- **Volume Play**: More deposits = more revenue
- **Zero Marginal Cost**: No additional cost to users
- **Growth Incentive**: Aligns with getting users to deposit

**Example Calculation**:
```
User deposits KES 15,000 (~$100 USD)
Paycrest fee: $100 × 2.5% = $2.50
Kiota share: $100 × 0.5% = $0.50
```

**Revenue Projection (Month 18)**:
```
Assumptions:
- 50,000 users
- 40% deposit monthly
- $125 average deposit

Monthly deposits: 50,000 × 40% × $125 = $2.5M
Monthly deposit revenue: $2.5M × 0.5% = $12,500
```

---

### Revenue Stream 3: Premium Features (Phase 3+)

**Launch Timeline**: Month 12+

**Tier Structure**:

**Free Tier** (Default):
- Single USDM strategy
- Basic portfolio dashboard
- AI strategy quiz (once)
- M-Pesa deposits
- Standard support (email, 48h response)

**Pro Tier** ($5/month or $50/year):
- Multi-asset portfolios (USDM, bCSPX, PAXG)
- Advanced analytics & charting
- Quarterly AI portfolio reviews
- Export reports (PDF, CSV)
- Priority support (24h response)

**Premium Tier** ($10/month or $100/year):
- Everything in Pro
- Unlimited AI chats with Claude
- Custom investment strategies
- Tax reporting tools
- Dedicated account manager
- Early access to new features

**Enterprise (Chama Tier)** ($20/month per group):
- All Premium features for group admin
- Batch deposit optimization
- Loan management tools
- Member analytics
- Governance features
- API access (future)

**Adoption Assumptions**:
- 10% convert to Pro within 6 months of launch
- 2% convert to Premium
- 5% of users create/join chamas

**Revenue Projection (Month 24)**:
```
Users: 75,000
Pro (10%): 7,500 × $5 = $37,500/month
Premium (2%): 1,500 × $10 = $15,000/month
Chama (5%): 3,750 groups × $20 = $75,000/month (if in 10-person groups)

Total Premium Revenue: $127,500/month
```

---

### Revenue Stream 4: Affiliate & Partnerships (Future)

**Launch Timeline**: Month 18+

**Potential Partners**:

1. **Asset Issuers**:
   - Mountain Protocol (USDM)
   - Backed Finance (bCSPX)
   - Paxos (PAXG)
   - Revenue share for bringing users to their platforms

2. **Financial Services**:
   - Insurance products (Jubilee, Britam)
   - Referral fees for users who want traditional insurance

3. **Educational Content**:
   - Sponsored lessons in Kiota Academy
   - Partner courses (e.g., CFA Institute basics)

4. **Other Fintech**:
   - Credit products (for users needing loans)
   - Remittance services (diaspora market)

**Conservative Estimate**:
- $5,000-$10,000/month by Month 24
- Grows as user base scales

---

## Cost Structure

### Fixed Costs (Monthly)

#### 1. Personnel (Month 1-18)

**Phase 1 Team (Months 1-6)**:
- **Founder/CEO** (part-time): $0 (sweat equity)
- **CTO/Tech Lead** (full-time): $3,000/month
- **Product Designer** (contractor): $1,500/month
- **Marketing Lead** (part-time): $1,000/month
- **Customer Support** (contractor): $500/month

**Total Phase 1**: $6,000/month

**Phase 2 Team (Months 7-18)**:
- Previous team: $6,000
- **Full-Stack Developer**: +$2,500/month
- **Growth Marketer** (full-time): +$1,500/month
- **Customer Success Manager**: +$1,500/month
- **Operations/Finance** (part-time): +$1,000/month

**Total Phase 2**: $12,500/month

---

#### 2. Infrastructure & Services

**SaaS & Cloud Services**:
- **Vercel** (hosting): $200/month (Pro plan)
- **Supabase** (database): $300/month (Pro plan, scales with usage)
- **Privy** (embedded wallets): $0-500/month (usage-based)
  - $0.05 per monthly active wallet
  - Month 6: 10,000 users × $0.05 = $500
- **Alchemy** (RPC provider): $200/month (Growth plan)
- **Claude API** (Anthropic): $500/month
  - $15 per 1M input tokens
  - ~33K strategy generations/month at Month 18
- **Email** (SendGrid): $100/month
- **Analytics** (PostHog, Mixpanel): $100/month
- **Monitoring** (Sentry): $50/month

**Total Infrastructure**: ~$2,000/month (Month 18)

---

#### 3. Legal & Compliance

**Ongoing Legal**:
- **Legal Counsel** (retainer): $1,500/month
- **Compliance Monitoring**: $500/month
- **Audits** (quarterly): $5,000/quarter = $1,667/month
- **Insurance** (E&O, D&O): $500/month

**Total Legal**: $4,167/month

---

#### 4. Office & Admin

- **Co-working Space** (Nairobi): $500/month
- **Software Tools** (Notion, Figma, etc.): $200/month
- **Accounting Services**: $300/month
- **Miscellaneous**: $500/month

**Total Admin**: $1,500/month

---

### Variable Costs

#### 1. Customer Acquisition Cost (CAC)

**Blended CAC by Phase**:

**Phase 1 (Months 1-6)**: Organic + Low Spend
- **CAC Target**: $15 per user
- **Channels**: Social media, content, referrals
- **Monthly User Target**: 1,667 users (to reach 10,000 by Month 6)
- **Monthly Marketing Spend**: $15 × 1,667 = $25,000/month

**Phase 2 (Months 7-18)**: Paid Growth
- **CAC Target**: $25 per user
- **Channels**: Paid ads, partnerships, PR
- **Monthly User Target**: 3,333 users (to reach 50,000 by Month 18)
- **Monthly Marketing Spend**: $25 × 3,333 = $83,333/month

**Note**: High CAC in early months, but justified by LTV

---

#### 2. Customer Support

**Scalable Support Model**:
- **Months 1-6**: 1 support agent (contractor) = $500/month
- **Months 7-12**: 2 agents = $1,000/month
- **Months 13-18**: 3 agents + 1 manager = $2,500/month

Costs included in Personnel above.

---

#### 3. Transaction Costs

**Blockchain Gas Fees**:
- **Assumption**: Kiota sponsors gas for small transactions
- **Average Gas**: $0.05 per transaction (Base network)
- **Transactions per User per Month**: 2 (deposit + yield distribution)
- **Month 6**: 10,000 users × 2 × $0.05 = $1,000/month
- **Month 18**: 50,000 users × 2 × $0.05 = $5,000/month

**Note**: May implement fee thresholds (e.g., free under $100, 1% fee above)

---

### Total Cost Summary (Month 18)

| Category | Amount |
|----------|--------|
| Personnel | $12,500 |
| Infrastructure | $2,000 |
| Legal & Compliance | $4,167 |
| Office & Admin | $1,500 |
| Gas Sponsorship | $5,000 |
| **Total Fixed Costs** | **$25,167** |
| | |
| Marketing (CAC) | $83,333 |
| **Total Variable Costs** | **$83,333** |
| | |
| **Total Monthly Costs** | **$108,500** |

**Note**: Marketing is highest variable cost but scales with funding

---

## Financial Projections (Base Case)

### Month 6 Projections

**Users & Engagement**:
- Total Users: 10,000
- Monthly Active Users (MAU): 8,000 (80%)
- Average Balance: $150
- Total Value Preserved: $1.5M
- Monthly Deposit Rate: 40% of users
- Average Deposit: $50

**Revenue**:
- **Management Fees**: $1.5M × 0.5% / 12 = $625/month
- **Deposit Fees**: 10,000 × 40% × $50 × 0.5% = $1,000/month
- **Total Revenue**: $1,625/month

**Costs**:
- **Fixed Costs**: $14,167 (personnel + infra + legal + admin)
- **Marketing**: $25,000
- **Total Costs**: $39,167/month

**Burn Rate**: -$37,542/month

**Cumulative Funding Needed**: ~$225,000 (6 months burn)

---

### Month 12 Projections

**Users & Engagement**:
- Total Users: 25,000
- MAU: 20,000 (80%)
- Average Balance: $300
- Total Value Preserved: $7.5M
- Monthly Deposit Rate: 40%
- Average Deposit: $75

**Revenue**:
- **Management Fees**: $7.5M × 0.5% / 12 = $3,125/month
- **Deposit Fees**: 25,000 × 40% × $75 × 0.5% = $3,750/month
- **Premium Subs** (new): 2,500 × 10% × $5 = $1,250/month
- **Total Revenue**: $8,125/month

**Costs**:
- **Fixed Costs**: $20,167
- **Marketing**: $60,000 (scaling user acquisition)
- **Total Costs**: $80,167/month

**Burn Rate**: -$72,042/month

**Cumulative Funding Needed**: ~$650,000

---

### Month 18 Projections (Profitability Target)

**Users & Engagement**:
- Total Users: 50,000
- MAU: 40,000 (80%)
- Average Balance: $500
- Total Value Preserved: $25M
- Monthly Deposit Rate: 40%
- Average Deposit: $125

**Revenue**:
- **Management Fees**: $25M × 0.5% / 12 = $10,417/month
- **Deposit Fees**: 50,000 × 40% × $125 × 0.5% = $12,500/month
- **Premium Subs**: 5,000 × 10% × $5 = $2,500/month
- **Premium Tier**: 1,000 × 2% × $10 = $200/month
- **Chama Tier**: 2,500 groups × $20 = $2,500/month (500 groups)
- **Total Revenue**: $28,117/month

**Costs**:
- **Fixed Costs**: $25,167
- **Marketing**: $30,000 (reduced as referrals kick in)
- **Total Costs**: $55,167/month

**Profit/Loss**: -$27,050/month (still burning, but close)

**Path to Profitability**: Reduce marketing spend or hit 60,000 users

---

### Month 24 Projections (Profitable)

**Users & Engagement**:
- Total Users: 75,000
- MAU: 60,000 (80%)
- Average Balance: $700
- Total Value Preserved: $52.5M
- Monthly Deposit Rate: 40%
- Average Deposit: $150

**Revenue**:
- **Management Fees**: $52.5M × 0.5% / 12 = $21,875/month
- **Deposit Fees**: 75,000 × 40% × $150 × 0.5% = $22,500/month
- **Premium Subs**: 7,500 × 10% × $5 = $3,750/month
- **Premium Tier**: 1,500 × 2% × $10 = $300/month
- **Chama Tier**: 750 groups × $20 = $15,000/month
- **Affiliate Revenue**: $5,000/month
- **Total Revenue**: $68,425/month

**Costs**:
- **Fixed Costs**: $30,000 (team expansion)
- **Marketing**: $40,000 (maintaining growth)
- **Total Costs**: $70,000/month

**Profit/Loss**: -$1,575/month (near breakeven)

---

### Month 36 Projections (Scaling Profitably)

**Users & Engagement**:
- Total Users: 150,000
- MAU: 120,000 (80%)
- Average Balance: $1,000
- Total Value Preserved: $150M
- Monthly Deposit Rate: 35% (more mature users)
- Average Deposit: $200

**Revenue**:
- **Management Fees**: $150M × 0.5% / 12 = $62,500/month
- **Deposit Fees**: 150,000 × 35% × $200 × 0.5% = $52,500/month
- **Premium Subs**: 15,000 × 10% × $5 = $7,500/month
- **Premium Tier**: 3,000 × 2% × $10 = $600/month
- **Chama Tier**: 1,500 groups × $20 = $30,000/month
- **Affiliate Revenue**: $15,000/month
- **Total Revenue**: $168,100/month

**Costs**:
- **Fixed Costs**: $50,000 (15-person team)
- **Marketing**: $60,000 (expanding to new markets)
- **Total Costs**: $110,000/month

**Profit/Loss**: +$58,100/month

**Annual Profit**: ~$697,000

**Margin**: 34.5%

---

## Unit Economics

### Customer Lifetime Value (LTV)

**Assumptions**:
- **Average User Lifespan**: 36 months
- **Average Balance Growth**: $200 → $1,000 over 3 years
- **Churn Rate**: 15% annually
- **Premium Conversion**: 10% by Month 12

**Revenue per User (3 years)**:

**Year 1**:
- Avg Balance: $200
- Management Fees: $200 × 0.5% = $1.00
- Deposit Fees: $50/month × 12 months × 0.5% = $3.00
- **Year 1 Revenue**: $4.00

**Year 2**:
- Avg Balance: $500
- Management Fees: $500 × 0.5% = $2.50
- Deposit Fees: $100/month × 12 months × 0.5% = $6.00
- Premium Sub (10% convert): $5/month × 12 × 10% = $6.00
- **Year 2 Revenue**: $14.50

**Year 3**:
- Avg Balance: $1,000
- Management Fees: $1,000 × 0.5% = $5.00
- Deposit Fees: $150/month × 12 months × 0.5% = $9.00
- Premium Sub: $5/month × 12 × 10% = $6.00
- **Year 3 Revenue**: $20.00

**Total 3-Year LTV**: $38.50

**Adjusted for Churn** (15% annually):
- Year 1: $4.00 × 100% = $4.00
- Year 2: $14.50 × 85% = $12.33
- Year 3: $20.00 × 72% = $14.40

**Actual LTV**: ~$30.73

---

### Customer Acquisition Cost (CAC)

**Blended CAC**:
- **Phase 1** (organic focus): $15
- **Phase 2** (paid focus): $25
- **Weighted Average**: ~$22

---

### LTV:CAC Ratio

**Target**: 3:1 (healthy SaaS benchmark)

**Kiota**:
- LTV: $30.73
- CAC: $22
- **Ratio**: 1.4:1

**Analysis**: Below target initially, but improving factors:
1. **Churn Reduction**: As product matures, churn drops from 15% → 10%, increasing LTV to $40+
2. **Premium Conversion**: As features launch, premium conversion could hit 15%, increasing LTV
3. **Referral Growth**: Viral coefficient >0.3 reduces effective CAC
4. **Balance Growth**: As users trust platform, average balances grow faster

**Projected Year 3 LTV:CAC**: 2.5:1 (healthier)

---

### Payback Period

**Time to Recover CAC**:

**Calculation**:
- CAC: $22
- Month 1-12 Revenue per User: $4.00 + ($14.50 / 12 × 12) = $18.50
- **Payback**: ~14 months

**Target**: <12 months (SaaS best practice)

**Improvement Strategies**:
1. Increase initial deposit amounts (onboarding incentives)
2. Earlier premium conversion (free trial → paid)
3. Referral bonuses (reduce CAC)

---

## Funding Requirements

### Seed Round (Pre-Launch)

**Amount**: $300,000
**Use**: Product development, initial team, 6-month runway

**Allocation**:
- Product Development: $100,000 (CTO, designer, dev)
- Initial Marketing: $75,000 (launch campaign, content)
- Legal & Compliance: $50,000 (incorporation, licenses, audits)
- Infrastructure: $25,000 (cloud, services, tools)
- Operations: $50,000 (working capital, reserve)

**Milestones**:
- Beta launch with 500 users
- Product-market fit validation
- $500K TVP
- 60%+ activation rate

---

### Series A (Post-PMF)

**Timing**: Month 9-12
**Amount**: $1.5M
**Use**: Scale user acquisition, team expansion, 18-month runway

**Allocation**:
- Marketing & Growth: $750,000 (CAC, partnerships, PR)
- Team Expansion: $400,000 (engineers, support, ops)
- Product Development: $200,000 (Phase 2 features, mobile)
- Infrastructure: $100,000 (scaling, security, compliance)
- Reserve: $50,000

**Milestones**:
- 30,000+ users
- $10M TVP
- Multi-asset platform launch
- Path to profitability clear
- 50%+ 90-day retention

---

### Series B (Scale & Expansion)

**Timing**: Month 24+
**Amount**: $5M+
**Use**: Regional expansion, profitability, market leadership

**Allocation**:
- Geographic Expansion: $2M (Uganda, Tanzania, Rwanda)
- Product Innovation: $1M (mobile app, new features)
- Marketing: $1M (brand building, enterprise sales)
- Team: $700K (20+ person team)
- Reserve: $300K

**Milestones**:
- 150,000+ users
- $150M TVP
- Profitable (breakeven at minimum)
- Multi-country presence
- Strong brand recognition

---

## Key Metrics & KPIs

### North Star Metric

**Total Value Preserved (TVP)**
- Represents user trust and platform value
- Combines user growth + balance growth
- Directly correlates with revenue

**Targets**:
- Month 6: $1.5M
- Month 12: $7.5M
- Month 18: $25M
- Month 24: $52.5M
- Month 36: $150M

---

### Acquisition Metrics

1. **Monthly New Users**: Growth rate
2. **CAC**: Should trend down over time (referrals)
3. **Conversion Rate**: Landing page → signup (target: 15%)
4. **Activation Rate**: Signup → first deposit (target: 60%)
5. **Time to First Deposit**: Should be <24 hours

---

### Engagement Metrics

1. **Monthly Active Users (MAU)**: Target 80% of total
2. **Weekly Active Users (WAU)**: Track engagement frequency
3. **Deposit Frequency**: % users depositing monthly (target: 40%)
4. **Average Deposit**: Should grow as users trust platform
5. **Goal Creation Rate**: % users with active goals (target: 60%)

---

### Retention Metrics

1. **30-Day Retention**: Target 50%+
2. **90-Day Retention**: Target 40%+
3. **12-Month Retention**: Target 30%+
4. **Churn Rate**: Target <15% annually
5. **Reactivation Rate**: % of churned users who return

---

### Financial Metrics

1. **Monthly Recurring Revenue (MRR)**: Track growth
2. **Annual Recurring Revenue (ARR)**: TVP × 0.5%
3. **Revenue Growth Rate**: Month-over-month
4. **Burn Multiple**: Cash burned / Net new ARR (target: <1.5)
5. **Gross Margin**: Should be 85%+ (low COGS)
6. **LTV:CAC Ratio**: Target 3:1 by Year 2

---

## Risks & Mitigation

### Revenue Risks

**Risk 1: Lower Than Expected Deposits**
- **Impact**: Reduces deposit fee revenue
- **Mitigation**:
  - Focus on management fees (more stable)
  - Incentivize deposits (bonuses, streaks)
  - Automated deposit features

**Risk 2: Premium Tier Low Adoption**
- **Impact**: Misses revenue targets
- **Mitigation**:
  - Free trials to convert users
  - Value-based pricing (show ROI)
  - Bundle features strategically

**Risk 3: AUM Growth Slower Than Projected**
- **Impact**: Management fee revenue lags
- **Mitigation**:
  - Focus on user activation
  - Goal-based deposit automation
  - Referral programs to grow users

---

### Cost Risks

**Risk 1: CAC Higher Than Expected**
- **Impact**: Burn rate increases, funding needs grow
- **Mitigation**:
  - Test channels rigorously
  - Optimize funnels continuously
  - Double down on referrals (lower CAC)
  - Content marketing for organic

**Risk 2: Infrastructure Costs Scale Faster**
- **Impact**: Margins compressed
- **Mitigation**:
  - Negotiate volume discounts with providers
  - Optimize database queries
  - Use caching aggressively
  - Consider self-hosting at scale

**Risk 3: Legal/Compliance Costs Increase**
- **Impact**: Fixed costs higher than planned
- **Mitigation**:
  - Work with regulators proactively
  - Join industry associations (shared advocacy)
  - Build compliance into product (reduce manual work)

---

## Exit Scenarios (5-7 Years)

### Scenario 1: Acquisition by Bank/Fintech

**Potential Acquirers**:
- Kenyan banks (KCB, Equity, Co-op)
- African fintechs (Flutterwave, Chipper Cash)
- Global crypto platforms (Coinbase, Binance)

**Valuation**:
- 3-5x Revenue or 0.5-1% of TVP
- If $500M TVP at Year 5: $2.5M - $5M valuation
- If $300M in annual revenue: $900M - $1.5B valuation (unlikely)
- **Realistic**: $10M - $50M exit by Year 5

---

### Scenario 2: IPO / Public Listing

**Requirements**:
- $100M+ in revenue
- Profitable for 2+ years
- Strong growth trajectory
- Regional expansion complete

**Timeline**: 7-10 years minimum
**Valuation**: $500M - $1B+ (if successful)

---

### Scenario 3: Strategic Partnership / Majority Sale

**Partners**:
- Asset issuers (Mountain Protocol, Backed Finance)
- Mobile money providers (Safaricom/M-Pesa)
- Global payment companies (Stripe, Mastercard)

**Structure**:
- Sell majority stake (60-80%)
- Founders retain equity and operational role
- Access to partner's distribution/resources

**Valuation**: $20M - $100M (Year 4-5)

---

## Conclusion

Kiota's business model is designed for sustainable growth with clear paths to profitability by Month 18-24. The dual-revenue model (management fees + deposit fees) provides stability, while premium tiers and partnerships offer upside.

**Key Success Factors**:
1. **User Growth**: Hitting acquisition targets (50K by Month 18)
2. **Engagement**: High activation and retention rates
3. **Balance Growth**: Users increasing deposits over time
4. **Premium Conversion**: 10%+ of users upgrading by Year 2
5. **Cost Discipline**: Keeping CAC under $25, optimizing burn

**Investment Thesis**:
Kiota addresses a massive, underserved market (Kenya's 2.5M middle class) with a unique product (USD yields + blockchain + AI) and a proven distribution channel (M-Pesa). With $1.8M in funding over 18 months, Kiota can reach profitability and establish market leadership in East Africa's digital wealth preservation space.

---

**Document Status**: Complete
**Next Review**: Quarterly (March, June, September, December 2026)
**Owner**: Finance & Strategy Team

**Related Documents**:
- [Product Plan](./PRODUCT_PLAN.md)
- [Market Analysis](./MARKET.md)
- [Financial Model](../financial/MODEL.xlsx) (Coming soon)
- [Pitch Deck](../fundraising/PITCH_DECK.pdf) (Coming soon)
