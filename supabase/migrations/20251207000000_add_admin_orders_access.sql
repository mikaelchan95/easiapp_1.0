-- Add RLS policies to allow admin users to view all orders
-- This is needed for the admin-web panel

-- First, let's add a policy that allows viewing all orders for users with is_admin flag
-- or users with specific admin roles

-- Policy: Admin users can view all orders
CREATE POLICY IF NOT EXISTS "Admin users can view all orders" ON orders
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (
      is_admin = true 
      OR role IN ('admin', 'super_admin', 'superadmin')
    )
  )
);

-- Policy: Admin users can view all order items
CREATE POLICY IF NOT EXISTS "Admin users can view all order items" ON order_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (
      is_admin = true 
      OR role IN ('admin', 'super_admin', 'superadmin')
    )
  )
);

-- Policy: Admin users can view all order approvals
CREATE POLICY IF NOT EXISTS "Admin users can view all order approvals" ON order_approvals
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (
      is_admin = true 
      OR role IN ('admin', 'super_admin', 'superadmin')
    )
  )
);

-- Policy: Admin users can view all order status history
CREATE POLICY IF NOT EXISTS "Admin users can view all order status history" ON order_status_history
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (
      is_admin = true 
      OR role IN ('admin', 'super_admin', 'superadmin')
    )
  )
);

-- Policy: Admin users can update orders
CREATE POLICY IF NOT EXISTS "Admin users can update orders" ON orders
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (
      is_admin = true 
      OR role IN ('admin', 'super_admin', 'superadmin')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (
      is_admin = true 
      OR role IN ('admin', 'super_admin', 'superadmin')
    )
  )
);

-- Add is_admin column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Update existing admin users (Mikael and Vincent) to have is_admin flag
UPDATE public.users 
SET is_admin = true 
WHERE email IN ('mikael@thewinery.com.sg', 'vincent@thewinery.com.sg')
OR role IN ('admin', 'super_admin', 'superadmin');

COMMENT ON COLUMN public.users.is_admin IS 'Flag to identify admin users who have access to the admin panel';
