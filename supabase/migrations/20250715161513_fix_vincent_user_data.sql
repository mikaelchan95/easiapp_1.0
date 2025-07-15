-- Fix Vincent's user data - ensure all fields are populated correctly

-- First, let's check if Vincent's user record exists and get the company info
DO $$
DECLARE
    vincent_user_id UUID := 'a1234567-8901-2345-6789-012345678901'::uuid;
    mikael_company_id UUID;
BEGIN
    -- Get Mikael's company ID to ensure we use the right one
    SELECT company_id INTO mikael_company_id
    FROM users 
    WHERE email = 'mikael@thewinery.com.sg' 
    LIMIT 1;

    -- Update or insert Vincent's user record with proper data
    INSERT INTO users (
        id,
        email,
        name,
        phone,
        account_type,
        company_id,
        role,
        position,
        created_at,
        updated_at
    ) VALUES (
        vincent_user_id,
        'vincent@thewinery.com.sg',
        'Vincent Hong',
        '+65 90221220',
        'company',
        mikael_company_id,
        'admin',
        'Director',
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        account_type = EXCLUDED.account_type,
        company_id = EXCLUDED.company_id,
        role = EXCLUDED.role,
        position = EXCLUDED.position,
        updated_at = NOW();

    -- Ensure Vincent has proper permissions
    INSERT INTO user_permissions (
        user_id,
        can_create_orders,
        can_approve_orders,
        can_view_all_orders,
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
        vincent_user_id,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        can_create_orders = EXCLUDED.can_create_orders,
        can_approve_orders = EXCLUDED.can_approve_orders,
        can_view_all_orders = EXCLUDED.can_view_all_orders,
        can_manage_users = EXCLUDED.can_manage_users,
        can_invite_users = EXCLUDED.can_invite_users,
        can_set_permissions = EXCLUDED.can_set_permissions,
        can_edit_company_info = EXCLUDED.can_edit_company_info,
        can_manage_billing = EXCLUDED.can_manage_billing,
        can_view_reports = EXCLUDED.can_view_reports,
        can_view_trade_price = EXCLUDED.can_view_trade_price,
        can_access_exclusive_products = EXCLUDED.can_access_exclusive_products,
        updated_at = NOW();

    -- Remove the incorrectly created company if it exists and no users reference it
    DELETE FROM companies 
    WHERE id = 'e1234567-8901-2345-6789-012345678901'::uuid
    AND NOT EXISTS (
        SELECT 1 FROM users 
        WHERE company_id = 'e1234567-8901-2345-6789-012345678901'::uuid
    );

END $$;

-- Verify Vincent's complete setup
SELECT 
    u.id,
    u.email,
    u.name,
    u.phone,
    u.account_type,
    u.role,
    u.position,
    c.name as company_name,
    c.company_name as legal_name,
    c.id as company_id,
    up.can_edit_company_info,
    up.can_manage_billing,
    up.can_manage_users,
    up.can_approve_orders
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
LEFT JOIN user_permissions up ON u.id = up.user_id
WHERE u.email = 'vincent@thewinery.com.sg';

-- Also verify both Vincent and Mikael are in the same company
SELECT 
    u.email,
    u.name,
    u.role,
    c.name as company_name,
    c.id as company_id
FROM users u
JOIN companies c ON u.company_id = c.id
WHERE u.email IN ('vincent@thewinery.com.sg', 'mikael@thewinery.com.sg')
ORDER BY u.email;