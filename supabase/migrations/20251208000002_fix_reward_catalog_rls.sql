-- Enable write access for authenticated users on reward_catalog
-- This is required for the admin dashboard to manage rewards

DROP POLICY IF EXISTS "Authenticated users can manage rewards" ON reward_catalog;

CREATE POLICY "Authenticated users can manage rewards" ON reward_catalog
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
