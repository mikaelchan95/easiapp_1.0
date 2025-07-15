-- Enable company-wide voucher sharing
-- This migration updates RLS policies to allow company users to share vouchers

-- Drop existing user-specific policies
DROP POLICY IF EXISTS "Users can view their own vouchers" ON user_vouchers;
DROP POLICY IF EXISTS "Users can insert their own vouchers" ON user_vouchers;
DROP POLICY IF EXISTS "Users can update their own vouchers" ON user_vouchers;

-- Create company-wide policies for vouchers
CREATE POLICY "Company users can view company vouchers" ON user_vouchers
  FOR SELECT USING (
    company_id IS NOT NULL AND 
    company_id = (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Individual users can view their own vouchers" ON user_vouchers
  FOR SELECT USING (
    company_id IS NULL AND 
    user_id = auth.uid()
  );

CREATE POLICY "Company users can insert company vouchers" ON user_vouchers
  FOR INSERT WITH CHECK (
    company_id IS NOT NULL AND 
    company_id = (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Individual users can insert their own vouchers" ON user_vouchers
  FOR INSERT WITH CHECK (
    company_id IS NULL AND 
    user_id = auth.uid()
  );

CREATE POLICY "Company users can update company vouchers" ON user_vouchers
  FOR UPDATE USING (
    company_id IS NOT NULL AND 
    company_id = (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Individual users can update their own vouchers" ON user_vouchers
  FOR UPDATE USING (
    company_id IS NULL AND 
    user_id = auth.uid()
  );

-- Add voucher usage tracking columns
ALTER TABLE user_vouchers 
ADD COLUMN IF NOT EXISTS used_by_user_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS used_by_user_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for voucher usage tracking
CREATE INDEX IF NOT EXISTS idx_user_vouchers_used_by ON user_vouchers(used_by_user_id);

-- Create function to track voucher usage
CREATE OR REPLACE FUNCTION track_voucher_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- When voucher status changes to 'used', record who used it
  IF OLD.voucher_status != 'used' AND NEW.voucher_status = 'used' THEN
    -- Get current user's name
    SELECT name INTO NEW.used_by_user_name
    FROM users
    WHERE id = auth.uid();
    
    -- Set the user who used the voucher
    NEW.used_by_user_id := auth.uid();
    NEW.used_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for voucher usage tracking
DROP TRIGGER IF EXISTS trigger_track_voucher_usage ON user_vouchers;
CREATE TRIGGER trigger_track_voucher_usage
  BEFORE UPDATE ON user_vouchers
  FOR EACH ROW
  EXECUTE FUNCTION track_voucher_usage();

-- Create view for company voucher management
CREATE OR REPLACE VIEW company_voucher_management AS
SELECT 
  uv.id,
  uv.voucher_code,
  uv.voucher_value,
  uv.voucher_status,
  uv.issued_at,
  uv.expires_at,
  uv.used_at,
  uv.used_by_user_id,
  uv.used_by_user_name,
  uv.used_in_order_id,
  uv.notes,
  uv.company_id,
  rc.title as reward_title,
  rc.description as reward_description,
  rc.reward_type,
  rr.points_used,
  rr.redemption_status,
  redeemed_by.name as redeemed_by_name,
  redeemed_by.id as redeemed_by_user_id
FROM user_vouchers uv
JOIN reward_redemptions rr ON uv.redemption_id = rr.id
JOIN reward_catalog rc ON rr.reward_id = rc.id
LEFT JOIN users redeemed_by ON rr.user_id = redeemed_by.id
WHERE uv.company_id IS NOT NULL;

-- Grant permissions on the view
GRANT SELECT ON company_voucher_management TO authenticated;

-- Create function to use company voucher
CREATE OR REPLACE FUNCTION use_company_voucher(
  p_voucher_id UUID,
  p_order_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_voucher user_vouchers%ROWTYPE;
  v_user_company_id UUID;
  v_result JSONB;
BEGIN
  -- Get current user's company
  SELECT company_id INTO v_user_company_id
  FROM users
  WHERE id = auth.uid();
  
  -- Get voucher details
  SELECT * INTO v_voucher
  FROM user_vouchers
  WHERE id = p_voucher_id;
  
  -- Validate voucher exists and belongs to user's company
  IF v_voucher.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Voucher not found'
    );
  END IF;
  
  IF v_voucher.company_id != v_user_company_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Voucher does not belong to your company'
    );
  END IF;
  
  -- Check if voucher is available
  IF v_voucher.voucher_status != 'active' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Voucher is not available (status: ' || v_voucher.voucher_status || ')'
    );
  END IF;
  
  -- Check if voucher is expired
  IF v_voucher.expires_at < NOW() THEN
    -- Auto-expire the voucher
    UPDATE user_vouchers
    SET voucher_status = 'expired',
        updated_at = NOW()
    WHERE id = p_voucher_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Voucher has expired'
    );
  END IF;
  
  -- Use the voucher
  UPDATE user_vouchers
  SET voucher_status = 'used',
      used_in_order_id = p_order_id,
      notes = p_notes,
      updated_at = NOW()
  WHERE id = p_voucher_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'voucher_code', v_voucher.voucher_code,
    'voucher_value', v_voucher.voucher_value,
    'message', 'Voucher used successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to extend voucher expiry (for admins)
CREATE OR REPLACE FUNCTION extend_voucher_expiry(
  p_voucher_id UUID,
  p_new_expiry_date TIMESTAMP WITH TIME ZONE
)
RETURNS JSONB AS $$
DECLARE
  v_voucher user_vouchers%ROWTYPE;
  v_user_company_id UUID;
  v_user_role VARCHAR(50);
BEGIN
  -- Get current user's company and role
  SELECT company_id, role INTO v_user_company_id, v_user_role
  FROM users
  WHERE id = auth.uid();
  
  -- Check if user has admin privileges
  IF v_user_role NOT IN ('admin', 'superadmin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient permissions'
    );
  END IF;
  
  -- Get voucher details
  SELECT * INTO v_voucher
  FROM user_vouchers
  WHERE id = p_voucher_id;
  
  -- Validate voucher exists and belongs to user's company
  IF v_voucher.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Voucher not found'
    );
  END IF;
  
  IF v_voucher.company_id != v_user_company_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Voucher does not belong to your company'
    );
  END IF;
  
  -- Extend expiry date
  UPDATE user_vouchers
  SET expires_at = p_new_expiry_date,
      updated_at = NOW()
  WHERE id = p_voucher_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Voucher expiry extended successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to cancel voucher (for admins)
CREATE OR REPLACE FUNCTION cancel_voucher(
  p_voucher_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_voucher user_vouchers%ROWTYPE;
  v_user_company_id UUID;
  v_user_role VARCHAR(50);
BEGIN
  -- Get current user's company and role
  SELECT company_id, role INTO v_user_company_id, v_user_role
  FROM users
  WHERE id = auth.uid();
  
  -- Check if user has admin privileges
  IF v_user_role NOT IN ('admin', 'superadmin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient permissions'
    );
  END IF;
  
  -- Get voucher details
  SELECT * INTO v_voucher
  FROM user_vouchers
  WHERE id = p_voucher_id;
  
  -- Validate voucher exists and belongs to user's company
  IF v_voucher.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Voucher not found'
    );
  END IF;
  
  IF v_voucher.company_id != v_user_company_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Voucher does not belong to your company'
    );
  END IF;
  
  -- Cancel voucher
  UPDATE user_vouchers
  SET voucher_status = 'cancelled',
      notes = COALESCE(p_reason, 'Cancelled by admin'),
      updated_at = NOW()
  WHERE id = p_voucher_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Voucher cancelled successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;