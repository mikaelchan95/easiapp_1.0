-- Create comprehensive redemption system tables
-- This migration adds redemption tracking, voucher management, and reward catalog

-- Create reward_catalog table (dynamic reward management)
CREATE TABLE reward_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL CHECK (points_required > 0),
  reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('voucher', 'bundle', 'swag', 'experience')),
  reward_value DECIMAL(10,2), -- For vouchers, the discount amount
  validity_days INTEGER DEFAULT 30, -- How long voucher is valid after redemption
  stock_quantity INTEGER, -- For limited items
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  terms_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reward_redemptions table (tracks all redemption activities)
CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES reward_catalog(id) ON DELETE RESTRICT,
  points_used INTEGER NOT NULL CHECK (points_used > 0),
  redemption_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (redemption_status IN ('pending', 'confirmed', 'failed', 'cancelled')),
  confirmation_code VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_vouchers table (manages voucher lifecycle)
CREATE TABLE user_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  redemption_id UUID NOT NULL REFERENCES reward_redemptions(id) ON DELETE CASCADE,
  voucher_code VARCHAR(50) NOT NULL UNIQUE,
  voucher_value DECIMAL(10,2) NOT NULL CHECK (voucher_value > 0),
  voucher_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (voucher_status IN ('active', 'used', 'expired', 'cancelled')),
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  used_in_order_id UUID, -- Reference to orders table
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_reward_catalog_type ON reward_catalog(reward_type);
CREATE INDEX idx_reward_catalog_active ON reward_catalog(is_active);
CREATE INDEX idx_reward_catalog_points ON reward_catalog(points_required);

CREATE INDEX idx_reward_redemptions_user_id ON reward_redemptions(user_id);
CREATE INDEX idx_reward_redemptions_company_id ON reward_redemptions(company_id);
CREATE INDEX idx_reward_redemptions_reward_id ON reward_redemptions(reward_id);
CREATE INDEX idx_reward_redemptions_status ON reward_redemptions(redemption_status);
CREATE INDEX idx_reward_redemptions_created_at ON reward_redemptions(created_at);

CREATE INDEX idx_user_vouchers_user_id ON user_vouchers(user_id);
CREATE INDEX idx_user_vouchers_company_id ON user_vouchers(company_id);
CREATE INDEX idx_user_vouchers_redemption_id ON user_vouchers(redemption_id);
CREATE INDEX idx_user_vouchers_code ON user_vouchers(voucher_code);
CREATE INDEX idx_user_vouchers_status ON user_vouchers(voucher_status);
CREATE INDEX idx_user_vouchers_expires_at ON user_vouchers(expires_at);
CREATE INDEX idx_user_vouchers_used_order ON user_vouchers(used_in_order_id);

-- Enable RLS
ALTER TABLE reward_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vouchers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reward_catalog (public read access)
CREATE POLICY "Anyone can view active rewards" ON reward_catalog
  FOR SELECT USING (is_active = true);

-- Create RLS policies for reward_redemptions
CREATE POLICY "Users can view their own redemptions" ON reward_redemptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own redemptions" ON reward_redemptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own redemptions" ON reward_redemptions
  FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for user_vouchers
CREATE POLICY "Users can view their own vouchers" ON user_vouchers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own vouchers" ON user_vouchers
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own vouchers" ON user_vouchers
  FOR UPDATE USING (user_id = auth.uid());

-- Create function to generate voucher codes
CREATE OR REPLACE FUNCTION generate_voucher_code()
RETURNS VARCHAR(50) AS $$
BEGIN
  RETURN 'VOUCHER-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-generate voucher code
CREATE OR REPLACE FUNCTION auto_generate_voucher_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.voucher_code IS NULL OR NEW.voucher_code = '' THEN
    NEW.voucher_code := generate_voucher_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating voucher codes
CREATE TRIGGER trigger_auto_generate_voucher_code
  BEFORE INSERT ON user_vouchers
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_voucher_code();

-- Create function to auto-set voucher expiry
CREATE OR REPLACE FUNCTION auto_set_voucher_expiry()
RETURNS TRIGGER AS $$
DECLARE
  validity_days INTEGER;
BEGIN
  -- Get validity days from reward catalog
  SELECT rc.validity_days INTO validity_days
  FROM reward_catalog rc
  JOIN reward_redemptions rr ON rc.id = rr.reward_id
  WHERE rr.id = NEW.redemption_id;
  
  -- Set expiry date if not already set
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '1 day' * COALESCE(validity_days, 30);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-setting voucher expiry
CREATE TRIGGER trigger_auto_set_voucher_expiry
  BEFORE INSERT ON user_vouchers
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_voucher_expiry();

-- Create function to update voucher status on expiry
CREATE OR REPLACE FUNCTION update_expired_vouchers()
RETURNS VOID AS $$
BEGIN
  UPDATE user_vouchers
  SET voucher_status = 'expired',
      updated_at = NOW()
  WHERE voucher_status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Seed reward catalog with existing mock data
INSERT INTO reward_catalog (
  title, 
  description, 
  points_required, 
  reward_type, 
  reward_value, 
  validity_days,
  image_url,
  terms_conditions
) VALUES
('S$500 Voucher', 'Redeem S$500 off your next order', 20000, 'voucher', 500.00, 30, NULL, 'Valid for 30 days from redemption. Cannot be combined with other offers.'),
('S$1,500 Voucher', 'Redeem S$1,500 off your next order', 50000, 'voucher', 1500.00, 30, NULL, 'Valid for 30 days from redemption. Cannot be combined with other offers.'),
('Volume Bundle Deal', 'Buy 120 get 12 free on select products', 100000, 'bundle', NULL, 60, NULL, 'Valid for 60 days from redemption. Apply to select products only.'),
('Premium Bar Tool Set', 'Professional-grade bar tools with custom engraving', 30000, 'swag', NULL, NULL, NULL, 'Limited stock available. Allow 2-3 weeks for delivery.')
ON CONFLICT DO NOTHING;

-- Enable real-time subscriptions for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE reward_catalog;
ALTER PUBLICATION supabase_realtime ADD TABLE reward_redemptions;
ALTER PUBLICATION supabase_realtime ADD TABLE user_vouchers;

-- Create view for voucher summary
CREATE VIEW voucher_summary AS
SELECT 
  uv.user_id,
  uv.company_id,
  uv.voucher_status,
  COUNT(*) as voucher_count,
  SUM(uv.voucher_value) as total_value
FROM user_vouchers uv
GROUP BY uv.user_id, uv.company_id, uv.voucher_status;

-- Grant permissions on the view
GRANT SELECT ON voucher_summary TO authenticated;