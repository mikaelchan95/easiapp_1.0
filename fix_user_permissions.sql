-- Fix missing user permissions for existing user
-- Run this in Supabase Dashboard > SQL Editor

-- First, let's check if the user exists but has no permissions
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Get the current user info
    SELECT id, account_type, role, company_id 
    INTO user_record
    FROM public.users 
    WHERE id = '2a163380-6934-4f19-b2ff-f6a15081cfe2';
    
    -- Check if user exists
    IF FOUND THEN
        RAISE NOTICE 'User found: % (type: %, role: %, company: %)', 
            user_record.id, user_record.account_type, user_record.role, user_record.company_id;
        
        -- Check if permissions exist
        IF NOT EXISTS (SELECT 1 FROM public.user_permissions WHERE user_id = user_record.id) THEN
            RAISE NOTICE 'No permissions found for user, creating default permissions...';
            
            -- Create default permissions based on user type and role
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
                user_record.id,
                true,  -- can_create_orders
                CASE 
                    WHEN user_record.account_type = 'company' AND user_record.role IN ('superadmin', 'admin', 'manager') THEN true
                    ELSE false
                END,  -- can_approve_orders
                CASE 
                    WHEN user_record.account_type = 'company' AND user_record.role IN ('superadmin', 'admin', 'manager') THEN true
                    ELSE false
                END,  -- can_view_all_orders
                CASE 
                    WHEN user_record.account_type = 'company' AND user_record.role = 'staff' THEN 5000
                    ELSE NULL
                END,  -- order_limit
                CASE 
                    WHEN user_record.account_type = 'company' AND user_record.role IN ('superadmin', 'admin', 'manager') THEN true
                    ELSE false
                END,  -- can_manage_users
                CASE 
                    WHEN user_record.account_type = 'company' AND user_record.role IN ('superadmin', 'admin', 'manager') THEN true
                    ELSE false
                END,  -- can_invite_users
                CASE 
                    WHEN user_record.account_type = 'company' AND user_record.role IN ('superadmin', 'admin') THEN true
                    ELSE false
                END,  -- can_set_permissions
                CASE 
                    WHEN user_record.account_type = 'company' AND user_record.role IN ('superadmin', 'admin') THEN true
                    ELSE false
                END,  -- can_edit_company_info
                CASE 
                    WHEN user_record.account_type = 'company' AND user_record.role IN ('superadmin', 'admin') THEN true
                    ELSE false
                END,  -- can_manage_billing
                CASE 
                    WHEN user_record.account_type = 'company' AND user_record.role IN ('superadmin', 'admin', 'manager') THEN true
                    ELSE false
                END,  -- can_view_reports
                CASE 
                    WHEN user_record.account_type = 'company' THEN true
                    ELSE false
                END,  -- can_view_trade_price
                CASE 
                    WHEN user_record.account_type = 'company' AND user_record.role IN ('superadmin', 'admin', 'manager') THEN true
                    ELSE false
                END,  -- can_access_exclusive_products
                CASE 
                    WHEN user_record.account_type = 'company' AND user_record.role IN ('superadmin', 'admin') THEN 'admin'
                    WHEN user_record.account_type = 'company' AND user_record.role = 'manager' THEN 'manager'
                    ELSE 'member'
                END,  -- role
                NOW(),  -- created_at
                NOW()   -- updated_at
            );
            
            RAISE NOTICE 'Created default permissions for user: %', user_record.id;
        ELSE
            RAISE NOTICE 'User permissions already exist';
        END IF;
    ELSE
        RAISE NOTICE 'User not found: 2a163380-6934-4f19-b2ff-f6a15081cfe2';
    END IF;
END $$;

-- Also check and fix RLS policies for user_permissions
-- Drop and recreate RLS policies to ensure they work with auth.uid()
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;
CREATE POLICY "Users can view their own permissions" 
    ON public.user_permissions 
    FOR SELECT 
    USING (auth.uid() = user_id);

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

-- Grant necessary permissions
GRANT ALL ON public.user_permissions TO authenticated;

-- Check the final result
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
    up.can_manage_billing
FROM public.users u
LEFT JOIN public.user_permissions up ON u.id = up.user_id
WHERE u.id = '2a163380-6934-4f19-b2ff-f6a15081cfe2';