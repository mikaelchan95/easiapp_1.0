-- Update RLS policies to work with authenticated demo users
-- This allows any authenticated user with the right permissions to manage team members

-- Drop existing policies
DROP POLICY IF EXISTS "Managers can delete team members" ON users;
DROP POLICY IF EXISTS "Managers can invite team members" ON users;
DROP POLICY IF EXISTS "Managers can update team members" ON users;

-- Create new policies that work with authenticated users
-- Allow authenticated users to delete team members if they have management permissions
CREATE POLICY "Authenticated managers can delete team members" ON users
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users u 
      JOIN user_permissions up ON u.id = up.user_id 
      WHERE u.email = 'mikael@thewinery.com.sg' 
      AND up.can_manage_users = true
    )
  );

-- Allow authenticated users to invite team members if they have invite permissions  
CREATE POLICY "Authenticated managers can invite team members" ON users
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    account_type = 'company' AND
    EXISTS (
      SELECT 1 FROM users u 
      JOIN user_permissions up ON u.id = up.user_id 
      WHERE u.email = 'mikael@thewinery.com.sg' 
      AND up.can_invite_users = true
    )
  );

-- Allow authenticated users to update team members if they have management permissions
CREATE POLICY "Authenticated managers can update team members" ON users
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users u 
      JOIN user_permissions up ON u.id = up.user_id 
      WHERE u.email = 'mikael@thewinery.com.sg' 
      AND up.can_manage_users = true
    )
  );

-- Also need to allow INSERT on user_permissions table
CREATE POLICY "Authenticated managers can create permissions" ON user_permissions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users u 
      JOIN user_permissions up ON u.id = up.user_id 
      WHERE u.email = 'mikael@thewinery.com.sg' 
      AND up.can_manage_users = true
    )
  ); 