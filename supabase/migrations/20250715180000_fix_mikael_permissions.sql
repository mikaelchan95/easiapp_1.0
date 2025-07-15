-- Give Mikael (existing user) full superadmin permissions
-- This fixes the permission loading error

-- Update user role to superadmin
UPDATE public.users 
SET role = 'superadmin' 
WHERE id = '2a163380-6934-4f19-b2ff-f6a15081cfe2';

-- Create user permissions with full superadmin access
INSERT INTO public.user_permissions (
    user_id,
    can_create_orders,
    can_approve_orders,
    can_view_all_orders,
    order_limit,
    can_manage_users,
    can_invite_users,
    can_set_permissions,
    can_edit_company_info,
    can_manage_billing,
    can_view_reports,
    can_view_trade_price,
    can_access_exclusive_products,
    created_at,
    updated_at
) VALUES (
    '2a163380-6934-4f19-b2ff-f6a15081cfe2',
    true,   -- can_create_orders
    true,   -- can_approve_orders
    true,   -- can_view_all_orders
    NULL,   -- order_limit (no limit for superadmin)
    true,   -- can_manage_users
    true,   -- can_invite_users
    true,   -- can_set_permissions
    true,   -- can_edit_company_info
    true,   -- can_manage_billing
    true,   -- can_view_reports
    true,   -- can_view_trade_price
    true,   -- can_access_exclusive_products
    NOW(),  -- created_at
    NOW()   -- updated_at
) ON CONFLICT (user_id) DO UPDATE SET
    can_create_orders = true,
    can_approve_orders = true,
    can_view_all_orders = true,
    order_limit = NULL,
    can_manage_users = true,
    can_invite_users = true,
    can_set_permissions = true,
    can_edit_company_info = true,
    can_manage_billing = true,
    can_view_reports = true,
    can_view_trade_price = true,
    can_access_exclusive_products = true,
    updated_at = NOW();

-- Ensure RLS policies allow users to access their own permissions
DROP POLICY IF EXISTS "Users can insert their own permissions" ON public.user_permissions;
CREATE POLICY "Users can insert their own permissions" 
    ON public.user_permissions 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own permissions" ON public.user_permissions;
CREATE POLICY "Users can update their own permissions" 
    ON public.user_permissions 
    FOR UPDATE 
    USING (auth.uid() = user_id);