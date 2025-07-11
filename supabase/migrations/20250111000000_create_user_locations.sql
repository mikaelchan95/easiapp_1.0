-- Create user locations table for real-time location management
-- This stores user-specific location preferences and history

CREATE TABLE user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Location details
  location_id TEXT NOT NULL, -- e.g. 'marina-bay', 'orchard-road'
  title TEXT NOT NULL,
  subtitle TEXT,
  location_type TEXT NOT NULL DEFAULT 'suggestion', -- 'suggestion', 'recent', 'favorite', 'work', 'home'
  
  -- Coordinates
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Location metadata
  address TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Singapore',
  
  -- User preferences
  is_favorite BOOLEAN DEFAULT false,
  is_current BOOLEAN DEFAULT false, -- Only one location per user should be current
  
  -- Usage tracking
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, location_id),
  
  -- Ensure only one current location per user
  EXCLUDE (user_id WITH =) WHERE (is_current = true)
);

-- Create indexes for better performance
CREATE INDEX idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX idx_user_locations_current ON user_locations(user_id, is_current) WHERE is_current = true;
CREATE INDEX idx_user_locations_favorites ON user_locations(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_user_locations_recent ON user_locations(user_id, last_used_at DESC);

-- Row Level Security (RLS)
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own locations
CREATE POLICY "Users can view own locations" ON user_locations
  FOR SELECT USING (auth.uid() = user_id OR user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- Users can insert their own locations
CREATE POLICY "Users can insert own locations" ON user_locations
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- Users can update their own locations
CREATE POLICY "Users can update own locations" ON user_locations
  FOR UPDATE USING (auth.uid() = user_id OR user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- Users can delete their own locations
CREATE POLICY "Users can delete own locations" ON user_locations
  FOR DELETE USING (auth.uid() = user_id OR user_id IN (
    SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_locations_updated_at
  BEFORE UPDATE ON user_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_locations_updated_at();

-- Function to ensure only one current location per user
CREATE OR REPLACE FUNCTION ensure_single_current_location()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this location as current, unset all other current locations for this user
  IF NEW.is_current = true THEN
    UPDATE user_locations 
    SET is_current = false, updated_at = NOW()
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_current = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single current location
CREATE TRIGGER ensure_single_current_location
  BEFORE INSERT OR UPDATE ON user_locations
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_current_location();