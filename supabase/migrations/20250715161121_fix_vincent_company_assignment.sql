-- Fix Vincent Hong's company assignment
-- Move Vincent to The Organic Winery (same company as Mikael)

-- First, get Mikael's company ID to use for Vincent
DO $$
DECLARE
    mikael_company_id UUID;
BEGIN
    -- Get Mikael's company ID
    SELECT company_id INTO mikael_company_id
    FROM users 
    WHERE email = 'mikael@thewinery.com.sg';
    
    -- Update Vincent's user record to use the same company
    UPDATE users 
    SET company_id = mikael_company_id,
        updated_at = NOW()
    WHERE email = 'vincent@thewinery.com.sg';
    
    -- Also update the auth.users metadata to reflect the correct company
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_set(
        raw_user_meta_data,
        '{company_id}',
        to_jsonb(mikael_company_id::text)
    ),
    updated_at = NOW()
    WHERE email = 'vincent@thewinery.com.sg';
END $$;

-- Remove the incorrectly created "The Winery" company if it exists and has no other users
DELETE FROM companies 
WHERE id = 'e1234567-8901-2345-6789-012345678901'::uuid
AND NOT EXISTS (
    SELECT 1 FROM users 
    WHERE company_id = 'e1234567-8901-2345-6789-012345678901'::uuid
);

-- Verify Vincent is now under the same company as Mikael
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
    up.can_edit_company_info,
    up.can_manage_billing
FROM users u
JOIN companies c ON u.company_id = c.id
JOIN user_permissions up ON u.id = up.user_id
WHERE u.email IN ('vincent@thewinery.com.sg', 'mikael@thewinery.com.sg')
ORDER BY u.email;