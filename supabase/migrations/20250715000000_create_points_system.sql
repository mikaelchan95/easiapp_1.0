-- Create comprehensive points system tables and audit trails
-- This migration adds all missing tables required for the points system

-- Create user_company_points table
CREATE TABLE user_company_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  points_earned DECIMAL(10,2) DEFAULT 0,
  points_redeemed DECIMAL(10,2) DEFAULT 0,
  lifetime_points_earned DECIMAL(10,2) DEFAULT 0,
  current_balance DECIMAL(10,2) DEFAULT 0,
  tier_level VARCHAR(20) DEFAULT 'Bronze',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_tier_level CHECK (tier_level IN ('Bronze', 'Silver', 'Gold')),
  CONSTRAINT positive_points_earned CHECK (points_earned >= 0),
  CONSTRAINT positive_points_redeemed CHECK (points_redeemed >= 0),
  CONSTRAINT positive_lifetime_points CHECK (lifetime_points_earned >= 0),
  CONSTRAINT valid_current_balance CHECK (current_balance = points_earned - points_redeemed),
  UNIQUE(user_id, company_id)
);

-- Create points_audit_log table
CREATE TABLE points_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL,
  points_change INTEGER NOT NULL,
  points_before INTEGER NOT NULL,
  points_after INTEGER NOT NULL,
  order_id UUID,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN (
    'earned_purchase', 'redeemed_voucher', 'bonus', 'expired', 'adjustment'
  ))
);

-- Create audit_log table for general system events
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255),
  previous_value JSONB,
  new_value JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  CONSTRAINT valid_entity_type CHECK (entity_type IN (
    'points', 'order', 'user', 'company', 'voucher', 'system'
  ))
);

-- Add missing points column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS points DECIMAL(10,2) DEFAULT 0;

-- Add missing totalPoints column to companies table (for aggregate tracking)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS total_points DECIMAL(10,2) DEFAULT 0;

-- Create indexes for performance
CREATE INDEX idx_user_company_points_user_id ON user_company_points(user_id);
CREATE INDEX idx_user_company_points_company_id ON user_company_points(company_id);
CREATE INDEX idx_user_company_points_tier_level ON user_company_points(tier_level);
CREATE INDEX idx_points_audit_log_user_id ON points_audit_log(user_id);
CREATE INDEX idx_points_audit_log_company_id ON points_audit_log(company_id);
CREATE INDEX idx_points_audit_log_created_at ON points_audit_log(created_at);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_company_id ON audit_log(company_id);
CREATE INDEX idx_audit_log_entity_type ON audit_log(entity_type);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Enable RLS
ALTER TABLE user_company_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_company_points
CREATE POLICY "Users can view their own company points" ON user_company_points
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own company points" ON user_company_points
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert company points" ON user_company_points
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create RLS policies for points_audit_log
CREATE POLICY "Users can view their own points audit log" ON points_audit_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert points audit log" ON points_audit_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create RLS policies for audit_log
CREATE POLICY "Users can view their own audit log" ON audit_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert audit log" ON audit_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Seed initial data for existing user (Mikael)
INSERT INTO user_company_points (
  user_id, 
  company_id, 
  points_earned, 
  points_redeemed, 
  lifetime_points_earned, 
  current_balance, 
  tier_level,
  created_at,
  updated_at
) VALUES (
  '2a163380-6934-4f19-b2ff-f6a15081cfe2', -- Mikael's actual user ID
  '11111111-1111-1111-1111-111111111111', -- The Winery company ID
  291119, -- Current points earned (from logs)
  0, -- Points redeemed
  291119, -- Lifetime points earned
  291119, -- Current balance
  'Gold', -- Tier level (>200,000 lifetime points)
  NOW(),
  NOW()
) ON CONFLICT (user_id, company_id) DO UPDATE SET
  points_earned = EXCLUDED.points_earned,
  lifetime_points_earned = EXCLUDED.lifetime_points_earned,
  current_balance = EXCLUDED.current_balance,
  tier_level = EXCLUDED.tier_level,
  updated_at = NOW();

-- Enable real-time subscriptions for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_company_points;
ALTER PUBLICATION supabase_realtime ADD TABLE points_audit_log;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_log;