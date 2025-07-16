-- Fix Mikael's account to be a company user in the same company as Vincent Hong
-- This ensures both users appear in team management

DO $$
DECLARE
    the_winery_company_id UUID;
BEGIN
    -- Get or create The Organic Winery company
    SELECT id INTO the_winery_company_id
    FROM companies
    WHERE name = 'The Organic Winery'
    LIMIT 1;

    -- If no company exists, create one
    IF the_winery_company_id IS NULL THEN
        INSERT INTO companies (
            id,
            name,
            company_name,
            uen,
            address,
            phone,
            email,
            status,
            credit_limit,
            current_credit,
            payment_terms,
            created_at,
            updated_at
        ) VALUES (
            'f1234567-8901-2345-6789-012345678901'::uuid,
            'The Organic Winery',
            'The Organic Winery Pte Ltd',
            '202012345B',
            '456 Organic Street, Singapore 654321',
            '+65 6234 5678',
            'info@theorganicwinery.com.sg',
            'active',
            200000.00,
            200000.00,
            'NET30',
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
        
        the_winery_company_id := 'f1234567-8901-2345-6789-012345678901'::uuid;
    END IF;

    -- Update Mikael to be a company user
    UPDATE users 
    SET 
        account_type = 'company',
        company_id = the_winery_company_id,
        role = 'superadmin',
        position = 'CEO',
        department = 'Executive',
        updated_at = NOW()
    WHERE id = '2a163380-6934-4f19-b2ff-f6a15081cfe2';

    -- Update Vincent to be in the same company (if he exists)
    UPDATE users 
    SET 
        company_id = the_winery_company_id,
        updated_at = NOW()
    WHERE email = 'vincent@thewinery.com.sg';

    -- Update auth.users metadata for Mikael
    UPDATE auth.users 
    SET 
        raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'),
            '{company_id}',
            to_jsonb(the_winery_company_id::text)
        ),
        updated_at = NOW()
    WHERE id = '2a163380-6934-4f19-b2ff-f6a15081cfe2';

    -- Update auth.users metadata for Vincent (if he exists)
    UPDATE auth.users 
    SET 
        raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'),
            '{company_id}',
            to_jsonb(the_winery_company_id::text)
        ),
        updated_at = NOW()
    WHERE email = 'vincent@thewinery.com.sg';

    -- Create company points records for both users
    INSERT INTO user_company_points (
        user_id,
        company_id,
        points_earned,
        points_redeemed,
        lifetime_points_earned,
        current_balance,
        tier_level,
        created_at,
        updated_at
    ) VALUES (
        '2a163380-6934-4f19-b2ff-f6a15081cfe2',
        the_winery_company_id,
        291119,
        0,
        291119,
        291119,
        'Gold',
        NOW(),
        NOW()
    ) ON CONFLICT (user_id, company_id) DO UPDATE SET
        points_earned = EXCLUDED.points_earned,
        lifetime_points_earned = EXCLUDED.lifetime_points_earned,
        current_balance = EXCLUDED.current_balance,
        tier_level = EXCLUDED.tier_level,
        updated_at = NOW();

    -- Create company points for Vincent if he exists
    INSERT INTO user_company_points (
        user_id,
        company_id,
        points_earned,
        points_redeemed,
        lifetime_points_earned,
        current_balance,
        tier_level,
        created_at,
        updated_at
    )
    SELECT 
        u.id,
        the_winery_company_id,
        50000,
        0,
        50000,
        50000,
        'Silver',
        NOW(),
        NOW()
    FROM users u
    WHERE u.email = 'vincent@thewinery.com.sg'
    ON CONFLICT (user_id, company_id) DO UPDATE SET
        points_earned = EXCLUDED.points_earned,
        lifetime_points_earned = EXCLUDED.lifetime_points_earned,
        current_balance = EXCLUDED.current_balance,
        tier_level = EXCLUDED.tier_level,
        updated_at = NOW();

    RAISE NOTICE 'Fixed user assignments - both users now in company: %', the_winery_company_id;
END $$;

-- Verify both users are now in the same company
SELECT 
    u.id,
    u.email,
    u.name,
    u.account_type,
    u.role,
    u.position,
    u.department,
    c.name as company_name,
    c.company_name as legal_name,
    up.can_manage_users,
    up.can_invite_users,
    up.can_edit_company_info
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
LEFT JOIN user_permissions up ON u.id = up.user_id
WHERE u.email IN ('mikael@thewinery.com.sg', 'vincent@thewinery.com.sg')
ORDER BY u.email;