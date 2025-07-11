-- Fix user_locations RLS policies to allow service role operations
-- This allows our app's server-side functions to manage user locations

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own locations" ON user_locations;
DROP POLICY IF EXISTS "Users can insert own locations" ON user_locations;
DROP POLICY IF EXISTS "Users can update own locations" ON user_locations;
DROP POLICY IF EXISTS "Users can delete own locations" ON user_locations;

-- Create new policies that allow both user operations and service role operations

-- Users can view their own locations + service role can view all
CREATE POLICY "Users can view own locations" ON user_locations
  FOR SELECT USING (
    auth.uid() = user_id 
    OR user_id IN (
      SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
    OR auth.role() = 'service_role'
  );

-- Users can insert their own locations + service role can insert for any user
CREATE POLICY "Users can insert own locations" ON user_locations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    OR user_id IN (
      SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
    OR auth.role() = 'service_role'
  );

-- Users can update their own locations + service role can update any
CREATE POLICY "Users can update own locations" ON user_locations
  FOR UPDATE USING (
    auth.uid() = user_id 
    OR user_id IN (
      SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
    OR auth.role() = 'service_role'
  );

-- Users can delete their own locations + service role can delete any
CREATE POLICY "Users can delete own locations" ON user_locations
  FOR DELETE USING (
    auth.uid() = user_id 
    OR user_id IN (
      SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
    OR auth.role() = 'service_role'
  );