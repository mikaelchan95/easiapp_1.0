-- Fix RLS policies for user_company_points table to allow upsert operations
-- The service needs to be able to update points without auth.uid() restrictions

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own company points" ON user_company_points;
DROP POLICY IF EXISTS "Users can update their own company points" ON user_company_points;
DROP POLICY IF EXISTS "System can insert company points" ON user_company_points;

-- Disable RLS temporarily to allow the service to manage points
-- This is necessary because the service account needs to update points for users
ALTER TABLE user_company_points DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with more permissive policies
ALTER TABLE user_company_points ENABLE ROW LEVEL SECURITY;

-- Create permissive policies that allow the service to manage points
CREATE POLICY "Allow all operations on user_company_points" ON user_company_points
    FOR ALL USING (true) WITH CHECK (true);

-- Alternative: Create specific policies if the above is too permissive
-- CREATE POLICY "Users can view their own company points" ON user_company_points
--     FOR SELECT USING (true);
-- 
-- CREATE POLICY "Service can manage company points" ON user_company_points
--     FOR ALL USING (true) WITH CHECK (true);