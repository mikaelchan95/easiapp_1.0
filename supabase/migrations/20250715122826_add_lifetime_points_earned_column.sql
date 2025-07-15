-- Add missing columns to user_company_points table
-- Check and add columns that don't exist

-- Add lifetime_points_earned column if it doesn't exist
ALTER TABLE user_company_points 
ADD COLUMN IF NOT EXISTS lifetime_points_earned DECIMAL(10,2) DEFAULT 0;

-- Add tier_level column if it doesn't exist
ALTER TABLE user_company_points 
ADD COLUMN IF NOT EXISTS tier_level VARCHAR(20) DEFAULT 'Bronze';

-- Add current_balance column if it doesn't exist
ALTER TABLE user_company_points 
ADD COLUMN IF NOT EXISTS current_balance DECIMAL(10,2) DEFAULT 0;

-- Add created_at and updated_at columns if they don't exist
ALTER TABLE user_company_points 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE user_company_points 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add constraint for tier_level if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_tier_level') THEN
        ALTER TABLE user_company_points 
        ADD CONSTRAINT valid_tier_level CHECK (tier_level IN ('Bronze', 'Silver', 'Gold'));
    END IF;
END $$;

-- Update existing records to populate missing columns
UPDATE user_company_points 
SET 
    lifetime_points_earned = COALESCE(points_earned, 0),
    current_balance = COALESCE(points_earned, 0) - COALESCE(points_redeemed, 0),
    tier_level = CASE 
        WHEN COALESCE(points_earned, 0) >= 200000 THEN 'Gold'
        WHEN COALESCE(points_earned, 0) >= 50000 THEN 'Silver'
        ELSE 'Bronze'
    END,
    created_at = COALESCE(created_at, NOW()),
    updated_at = NOW()
WHERE lifetime_points_earned IS NULL OR lifetime_points_earned = 0 OR current_balance IS NULL;

-- Ensure Mikael's data is correct (insert or update)
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
    '2a163380-6934-4f19-b2ff-f6a15081cfe2',
    '11111111-1111-1111-1111-111111111111',
    291119,
    0,
    291119,
    291119,
    'Gold',
    NOW(),
    NOW()
) ON CONFLICT (user_id, company_id) DO UPDATE SET
    points_earned = GREATEST(EXCLUDED.points_earned, user_company_points.points_earned),
    lifetime_points_earned = GREATEST(EXCLUDED.lifetime_points_earned, user_company_points.lifetime_points_earned),
    current_balance = GREATEST(EXCLUDED.current_balance, user_company_points.current_balance),
    tier_level = CASE 
        WHEN GREATEST(EXCLUDED.lifetime_points_earned, user_company_points.lifetime_points_earned) >= 200000 THEN 'Gold'
        WHEN GREATEST(EXCLUDED.lifetime_points_earned, user_company_points.lifetime_points_earned) >= 50000 THEN 'Silver'
        ELSE 'Bronze'
    END,
    updated_at = NOW();