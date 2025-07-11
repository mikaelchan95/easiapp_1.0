-- Create RLS policies and triggers for orders system
-- This migration sets up comprehensive access control and automation

-- RLS Policies for orders table

-- Policy: Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Policy: Company users can view orders from their company (based on permissions)
CREATE POLICY "Company users can view company orders" ON orders
FOR SELECT TO authenticated
USING (
  company_id IS NOT NULL 
  AND company_id IN (
    SELECT company_id FROM users 
    WHERE id = auth.uid() 
    AND account_type = 'company'
  )
  AND EXISTS (
    SELECT 1 FROM user_permissions up
    JOIN users u ON u.id = up.user_id
    WHERE u.id = auth.uid()
    AND (up.can_view_all_orders = true OR up.can_approve_orders = true)
  )
);

-- Policy: Superadmins and managers can view all company orders
CREATE POLICY "Admins can view all company orders" ON orders
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND account_type = 'company'
    AND role IN ('superadmin', 'manager')
  )
);

-- Policy: Users can create their own orders
CREATE POLICY "Users can create own orders" ON orders
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own pending orders
CREATE POLICY "Users can update own pending orders" ON orders
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND status IN ('pending', 'confirmed'))
WITH CHECK (user_id = auth.uid());

-- Policy: Approvers can update approval status
CREATE POLICY "Approvers can update approval status" ON orders
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_permissions up
    JOIN users u ON u.id = up.user_id
    WHERE u.id = auth.uid()
    AND up.can_approve_orders = true
    AND (
      orders.company_id = u.company_id 
      OR u.role IN ('superadmin', 'manager')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_permissions up
    JOIN users u ON u.id = up.user_id
    WHERE u.id = auth.uid()
    AND up.can_approve_orders = true
  )
);

-- RLS Policies for order_items table

-- Policy: Users can view order items for orders they can access
CREATE POLICY "Users can view accessible order items" ON order_items
FOR SELECT TO authenticated
USING (
  order_id IN (
    SELECT id FROM orders 
    WHERE user_id = auth.uid()
    OR (
      company_id IS NOT NULL 
      AND company_id IN (
        SELECT company_id FROM users 
        WHERE id = auth.uid() 
        AND account_type = 'company'
      )
      AND EXISTS (
        SELECT 1 FROM user_permissions up
        JOIN users u ON u.id = up.user_id
        WHERE u.id = auth.uid()
        AND (up.can_view_all_orders = true OR up.can_approve_orders = true)
      )
    )
  )
);

-- Policy: Users can create order items for their own orders
CREATE POLICY "Users can create order items for own orders" ON order_items
FOR INSERT TO authenticated
WITH CHECK (
  order_id IN (
    SELECT id FROM orders 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can update order items for their own pending orders
CREATE POLICY "Users can update order items for own pending orders" ON order_items
FOR UPDATE TO authenticated
USING (
  order_id IN (
    SELECT id FROM orders 
    WHERE user_id = auth.uid() 
    AND status IN ('pending', 'confirmed')
  )
)
WITH CHECK (
  order_id IN (
    SELECT id FROM orders 
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for order_approvals table

-- Policy: Users can view approvals for orders they can access
CREATE POLICY "Users can view accessible order approvals" ON order_approvals
FOR SELECT TO authenticated
USING (
  order_id IN (
    SELECT id FROM orders 
    WHERE user_id = auth.uid()
    OR (
      company_id IS NOT NULL 
      AND company_id IN (
        SELECT company_id FROM users 
        WHERE id = auth.uid() 
        AND account_type = 'company'
      )
    )
  )
);

-- Policy: Approvers can create and update approvals
CREATE POLICY "Approvers can manage approvals" ON order_approvals
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_permissions up
    JOIN users u ON u.id = up.user_id
    WHERE u.id = auth.uid()
    AND up.can_approve_orders = true
  )
)
WITH CHECK (
  approver_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_permissions up
    JOIN users u ON u.id = up.user_id
    WHERE u.id = auth.uid()
    AND up.can_approve_orders = true
  )
);

-- RLS Policies for order_status_history table

-- Policy: Users can view status history for orders they can access
CREATE POLICY "Users can view accessible order status history" ON order_status_history
FOR SELECT TO authenticated
USING (
  order_id IN (
    SELECT id FROM orders 
    WHERE user_id = auth.uid()
    OR (
      company_id IS NOT NULL 
      AND company_id IN (
        SELECT company_id FROM users 
        WHERE id = auth.uid() 
        AND account_type = 'company'
      )
      AND EXISTS (
        SELECT 1 FROM user_permissions up
        JOIN users u ON u.id = up.user_id
        WHERE u.id = auth.uid()
        AND (up.can_view_all_orders = true OR up.can_approve_orders = true)
      )
    )
  )
);

-- Policy: System can create status history entries
CREATE POLICY "System can create status history" ON order_status_history
FOR INSERT TO authenticated
WITH CHECK (true); -- Allow all authenticated users to create status history