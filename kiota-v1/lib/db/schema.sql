-- Kiota Database Schema for Supabase (PostgreSQL)
-- Version 1.0 - Foundation Phase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  name TEXT,
  profile_photo TEXT,
  wallet_address TEXT NOT NULL UNIQUE,

  -- Profile data
  monthly_income DECIMAL(12, 2), -- in KES
  current_savings DECIMAL(12, 2), -- in USD
  investment_experience TEXT CHECK (investment_experience IN ('complete_beginner', 'know_basics', 'somewhat_experienced', 'very_experienced')),
  risk_tolerance TEXT CHECK (risk_tolerance IN ('very_conservative', 'somewhat_conservative', 'moderate', 'aggressive')),

  -- Gamification
  level INTEGER DEFAULT 1,
  points INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT '{}', -- Array of badge IDs
  streak INTEGER DEFAULT 0,
  last_activity_date TIMESTAMP WITH TIME ZONE,

  -- Membership
  membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'premium', 'whale')),
  kyc_status TEXT DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'in_progress', 'pending_review', 'approved', 'rejected')),
  kyc_completed_at TIMESTAMP WITH TIME ZONE,

  -- Settings
  preferred_currency TEXT DEFAULT 'KES' CHECK (preferred_currency IN ('KES', 'USD')),
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications_enabled BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INVESTMENT STRATEGIES TABLE
-- ============================================
CREATE TABLE investment_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  expected_return DECIMAL(5, 2), -- annual percentage
  risk_level TEXT CHECK (risk_level IN ('low', 'low-medium', 'medium', 'medium-high', 'high')),

  -- Asset allocation (percentages)
  allocation_usdm DECIMAL(5, 2) DEFAULT 0,
  allocation_bcspx DECIMAL(5, 2) DEFAULT 0,
  allocation_paxg DECIMAL(5, 2) DEFAULT 0,
  allocation_btc DECIMAL(5, 2) DEFAULT 0,
  allocation_eth DECIMAL(5, 2) DEFAULT 0,
  allocation_ousg DECIMAL(5, 2) DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT allocation_sum CHECK (
    allocation_usdm + allocation_bcspx + allocation_paxg +
    COALESCE(allocation_btc, 0) + COALESCE(allocation_eth, 0) +
    COALESCE(allocation_ousg, 0) = 100
  )
);

-- ============================================
-- PORTFOLIOS TABLE
-- ============================================
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  total_value_usd DECIMAL(12, 2) DEFAULT 0,
  total_value_kes DECIMAL(12, 2) DEFAULT 0,

  -- Performance
  all_time_return_percent DECIMAL(8, 4) DEFAULT 0,
  all_time_return_usd DECIMAL(12, 2) DEFAULT 0,
  monthly_return_percent DECIMAL(8, 4) DEFAULT 0,
  monthly_return_usd DECIMAL(12, 2) DEFAULT 0,

  -- Allocation tracking
  current_allocation JSONB,
  target_allocation JSONB,
  drift_percentage DECIMAL(5, 2) DEFAULT 0,
  needs_rebalancing BOOLEAN DEFAULT false,

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ASSET HOLDINGS TABLE
-- ============================================
CREATE TABLE asset_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,

  asset TEXT NOT NULL CHECK (asset IN ('USDM', 'USDY', 'bCSPX', 'PAXG', 'BTC', 'ETH', 'OUSG')),

  amount_usd DECIMAL(12, 2) NOT NULL,
  amount_tokens DECIMAL(18, 8) NOT NULL,
  percentage_of_portfolio DECIMAL(5, 2),

  entry_price_usd DECIMAL(12, 4),
  current_price_usd DECIMAL(12, 4),

  unrealized_gain_usd DECIMAL(12, 2),
  unrealized_gain_percent DECIMAL(8, 4),

  daily_change_usd DECIMAL(12, 2),
  daily_change_percent DECIMAL(8, 4),
  monthly_yield DECIMAL(12, 2), -- for yield-bearing assets

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(portfolio_id, asset)
);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'swap', 'rebalance', 'yield_earned')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

  -- Amounts
  amount_kes DECIMAL(12, 2),
  amount_usd DECIMAL(12, 2) NOT NULL,
  fee_kes DECIMAL(12, 2),
  fee_usd DECIMAL(12, 2),

  -- Asset details
  asset TEXT NOT NULL,
  token_amount DECIMAL(18, 8),
  price_per_token DECIMAL(12, 4),

  -- Transaction IDs
  transaction_hash TEXT,
  mpesa_transaction_id TEXT,

  description TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- ============================================
-- SAVINGS GOALS TABLE
-- ============================================
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('house', 'car', 'education', 'wedding', 'travel', 'emergency_fund', 'business', 'retirement', 'other')),
  icon TEXT,

  target_amount_usd DECIMAL(12, 2) NOT NULL,
  current_amount_usd DECIMAL(12, 2) DEFAULT 0,
  progress_percentage DECIMAL(5, 2) DEFAULT 0,

  target_date TIMESTAMP WITH TIME ZONE NOT NULL,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  on_track BOOLEAN DEFAULT true,
  projected_completion_date TIMESTAMP WITH TIME ZONE,
  months_remaining INTEGER,

  recommended_monthly_deposit DECIMAL(12, 2),
  recommended_allocation JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_goals_user_id ON savings_goals(user_id);

-- ============================================
-- GOAL MILESTONES TABLE
-- ============================================
CREATE TABLE goal_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,

  milestone_number INTEGER NOT NULL,
  target_amount_usd DECIMAL(12, 2) NOT NULL,
  target_date TIMESTAMP WITH TIME ZONE NOT NULL,

  actual_paid_usd DECIMAL(12, 2) DEFAULT 0,
  actual_date TIMESTAMP WITH TIME ZONE,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'committed', 'completed', 'missed', 'late')),
  commitment_date TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(goal_id, milestone_number)
);

-- ============================================
-- AUTO-SAVE RULES TABLE
-- ============================================
CREATE TABLE auto_save_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  amount_kes DECIMAL(12, 2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),

  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  next_trigger_date TIMESTAMP WITH TIME ZONE NOT NULL,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failed', 'cancelled')),
  failed_attempts INTEGER DEFAULT 0,
  last_execution_date TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paused_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- AUTO-SAVE EXECUTIONS TABLE
-- ============================================
CREATE TABLE auto_save_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES auto_save_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  executed_date TIMESTAMP WITH TIME ZONE,

  amount_kes DECIMAL(12, 2) NOT NULL,
  mpesa_transaction_id TEXT,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROUNDUP TRACKER TABLE
-- ============================================
CREATE TABLE roundup_tracker (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,

  total_spent_kes DECIMAL(12, 2) DEFAULT 0,
  total_rounded_up_kes DECIMAL(12, 2) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,

  status TEXT DEFAULT 'tracking' CHECK (status IN ('tracking', 'committed', 'completed', 'missed')),
  committed_amount_kes DECIMAL(12, 2),
  commitment_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,

  paid_amount_kes DECIMAL(12, 2),
  paid_date TIMESTAMP WITH TIME ZONE,
  mpesa_transaction_id TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SAVINGS COMMITMENTS TABLE
-- ============================================
CREATE TABLE savings_commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  amount_kes DECIMAL(12, 2) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reminded', 'paid', 'missed', 'cancelled')),
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,

  goal_id UUID REFERENCES savings_goals(id) ON DELETE SET NULL,
  pathway_type TEXT CHECK (pathway_type IN ('smart_batching', 'automated', 'milestone')),

  paid_amount_kes DECIMAL(12, 2),
  paid_date TIMESTAMP WITH TIME ZONE,
  mpesa_transaction_id TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- LEARNING TRACKS TABLE
-- ============================================
CREATE TABLE learning_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  order_index INTEGER NOT NULL,

  total_lessons INTEGER DEFAULT 0,
  estimated_minutes INTEGER DEFAULT 0,

  required_track_id UUID REFERENCES learning_tracks(id),
  required_points INTEGER DEFAULT 0,

  points_reward INTEGER DEFAULT 0,
  badge_id TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MODULES TABLE
-- ============================================
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES learning_tracks(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,

  total_lessons INTEGER DEFAULT 0,
  estimated_minutes INTEGER DEFAULT 0,

  has_quiz BOOLEAN DEFAULT false,
  quiz_passing_score INTEGER DEFAULT 70,

  points_reward INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(track_id, slug)
);

-- ============================================
-- LESSONS TABLE
-- ============================================
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  order_index INTEGER NOT NULL,

  content JSONB NOT NULL, -- Array of lesson content blocks
  estimated_minutes INTEGER DEFAULT 0,

  video_url TEXT,
  video_duration_seconds INTEGER,

  completed_by_count INTEGER DEFAULT 0,
  points_reward INTEGER DEFAULT 10,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(module_id, slug)
);

-- ============================================
-- USER LEARNING PROGRESS TABLE
-- ============================================
CREATE TABLE user_learning_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES learning_tracks(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,

  lessons_completed INTEGER DEFAULT 0,
  total_lessons INTEGER NOT NULL,
  progress_percentage DECIMAL(5, 2) DEFAULT 0,

  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_at TIMESTAMP WITH TIME ZONE,

  total_time_spent_minutes INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(user_id, track_id)
);

-- ============================================
-- LESSON COMPLETIONS TABLE
-- ============================================
CREATE TABLE lesson_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,

  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_spent_minutes INTEGER,

  quiz_score DECIMAL(5, 2),
  quiz_attempts INTEGER DEFAULT 0,

  UNIQUE(user_id, lesson_id)
);

-- ============================================
-- BADGES TABLE
-- ============================================
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('milestone', 'streak', 'learning', 'behavioral', 'special')),

  icon TEXT NOT NULL,
  color TEXT,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),

  requirement_type TEXT NOT NULL,
  requirement_threshold INTEGER NOT NULL,
  requirement_description TEXT,

  contract_address TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER BADGES TABLE
-- ============================================
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id),

  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0,

  nft_minted BOOLEAN DEFAULT false,
  nft_transaction_hash TEXT,
  nft_minted_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(user_id, badge_id)
);

-- ============================================
-- CHAMAS TABLE
-- ============================================
CREATE TABLE chamas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES users(id),

  member_count INTEGER DEFAULT 1,
  max_members INTEGER,
  invite_code TEXT NOT NULL UNIQUE,

  has_group_goal BOOLEAN DEFAULT false,
  group_goal_id UUID REFERENCES savings_goals(id),

  total_value_usd DECIMAL(12, 2) DEFAULT 0,
  total_deposits_usd DECIMAL(12, 2) DEFAULT 0,
  average_member_balance DECIMAL(12, 2) DEFAULT 0,

  is_public BOOLEAN DEFAULT false,
  allow_invites BOOLEAN DEFAULT true,
  require_approval BOOLEAN DEFAULT false,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CHAMA MEMBERS TABLE
-- ============================================
CREATE TABLE chama_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'member')),

  total_contributed_usd DECIMAL(12, 2) DEFAULT 0,
  current_balance_usd DECIMAL(12, 2) DEFAULT 0,
  rank_in_chama INTEGER,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'left', 'removed')),

  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(chama_id, user_id)
);

-- ============================================
-- CHAMA ACTIVITY TABLE
-- ============================================
CREATE TABLE chama_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chama_id UUID NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN ('member_joined', 'member_left', 'deposit_made', 'goal_created', 'goal_completed', 'lesson_completed', 'badge_earned')),
  description TEXT NOT NULL,
  amount_usd DECIMAL(12, 2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chama_activity_chama_id ON chama_activity(chama_id, created_at DESC);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON investment_strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chamas_updated_at BEFORE UPDATE ON chamas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_save_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE chama_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Similar policies for other tables...
-- (We'll add these when connecting to actual Supabase)

-- ============================================
-- SEED DATA FOR BADGES
-- ============================================
INSERT INTO badges (id, title, description, category, icon, color, rarity, requirement_type, requirement_threshold, requirement_description) VALUES
  ('first_100', 'First $100', 'Reached $100 balance', 'milestone', '🏆', '#FFD700', 'common', 'balance_reached', 100, 'Save your first $100'),
  ('first_1000', 'First $1,000', 'Reached $1,000 balance', 'milestone', '🏆', '#FFD700', 'rare', 'balance_reached', 1000, 'Save your first $1,000'),
  ('first_10000', 'First $10,000', 'Reached $10,000 balance', 'milestone', '🏆', '#FFD700', 'epic', 'balance_reached', 10000, 'Save your first $10,000'),
  ('streak_30', '30-Day Streak', 'Deposited 30 days straight', 'streak', '🔥', '#FF6B6B', 'rare', 'streak_days', 30, 'Maintain a 30-day deposit streak'),
  ('streak_90', '90-Day Streak', 'Deposited 90 days straight', 'streak', '🔥', '#FF6B6B', 'epic', 'streak_days', 90, 'Maintain a 90-day deposit streak'),
  ('streak_365', '365-Day Streak', 'Deposited for a full year', 'streak', '🔥', '#FF6B6B', 'legendary', 'streak_days', 365, 'Maintain a full year deposit streak'),
  ('foundation_graduate', 'Foundation Graduate', 'Completed Learning Track 1', 'learning', '📚', '#4ECDC4', 'common', 'track_completed', 1, 'Complete Beginner learning track'),
  ('strategy_master', 'Strategy Master', 'Completed Learning Track 2', 'learning', '📚', '#4ECDC4', 'rare', 'track_completed', 2, 'Complete Intermediate learning track'),
  ('expert_investor', 'Expert Investor', 'Completed Learning Track 3', 'learning', '📚', '#4ECDC4', 'epic', 'track_completed', 3, 'Complete Advanced learning track');
