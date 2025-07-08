-- Add missing DELETE and INSERT policies for users table

-- Allow managers to delete team members
CREATE POLICY "Managers can delete team members" ON users
  FOR DELETE USING (
    company_id IN (
      SELECT u.company_id 
      FROM users u 
      JOIN user_permissions up ON u.id = up.user_id 
      WHERE u.id = auth.uid() AND up.can_manage_users = true
    )
  );

-- Allow managers to invite team members
CREATE POLICY "Managers can invite team members" ON users
  FOR INSERT WITH CHECK (
    account_type = 'company' AND
    company_id IN (
      SELECT u.company_id 
      FROM users u 
      JOIN user_permissions up ON u.id = up.user_id 
      WHERE u.id = auth.uid() AND up.can_invite_users = true
    )
  ); 