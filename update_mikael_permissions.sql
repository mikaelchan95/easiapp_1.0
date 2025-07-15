-- Update Mikael to have full superadmin permissions
-- Run this in Supabase Dashboard > SQL Editor

-- First, ensure the user has superadmin role
UPDATE public.users 
SET role = 'superadmin' 
WHERE id = '2a163380-6934-4f19-b2ff-f6a15081cfe2';

-- Insert or update user permissions to give full superadmin access
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
    role,
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
    'admin', -- role
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
    role = 'admin',
    updated_at = NOW();

-- Verify the update
SELECT 
    u.id,
    u.name,
    u.email,
    u.account_type,
    u.role as user_role,
    up.role as permissions_role,
    up.can_create_orders,
    up.can_approve_orders,
    up.can_view_all_orders,
    up.can_manage_users,
    up.can_view_trade_price,
    up.can_manage_billing,
    up.can_set_permissions,
    up.can_edit_company_info,
    up.can_access_exclusive_products
FROM public.users u
LEFT JOIN public.user_permissions up ON u.id = up.user_id
WHERE u.id = '2a163380-6934-4f19-b2ff-f6a15081cfe2';