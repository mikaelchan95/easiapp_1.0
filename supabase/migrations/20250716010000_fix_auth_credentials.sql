-- Fix authentication credentials for Mikael and Vincent Hong
-- This ensures both users can sign in and access team management

DO $$
BEGIN
    -- Update or create Mikael's auth.users entry with proper password
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        email_change_confirm_status,
        is_sso_user
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '2a163380-6934-4f19-b2ff-f6a15081cfe2'::uuid,
        'authenticated',
        'authenticated',
        'mikael@thewinery.com.sg',
        crypt('password123', gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"first_name":"Mikael","last_name":"Chan","phone":"+65 9123 4567"}',
        false,
        NOW(),
        NOW(),
        '+65 9123 4567',
        NOW(),
        0,
        false
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = EXCLUDED.email_confirmed_at,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data,
        phone = EXCLUDED.phone,
        phone_confirmed_at = EXCLUDED.phone_confirmed_at,
        updated_at = NOW();

    -- Create or update Mikael's auth.identities entry
    INSERT INTO auth.identities (
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        '2a163380-6934-4f19-b2ff-f6a15081cfe2',
        '2a163380-6934-4f19-b2ff-f6a15081cfe2'::uuid,
        '{"sub":"2a163380-6934-4f19-b2ff-f6a15081cfe2","email":"mikael@thewinery.com.sg","email_verified":true,"phone_verified":true}',
        'email',
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (provider_id, provider) DO UPDATE SET
        identity_data = EXCLUDED.identity_data,
        updated_at = NOW();

    -- Update or create Vincent's auth.users entry (if it exists)
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        email_change_confirm_status,
        is_sso_user
    ) 
    SELECT 
        '00000000-0000-0000-0000-000000000000'::uuid,
        u.id,
        'authenticated',
        'authenticated',
        u.email,
        crypt('VincentWinery123!', gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"first_name":"Vincent","last_name":"Hong","phone":"+65 90221220"}',
        false,
        NOW(),
        NOW(),
        u.phone,
        NOW(),
        0,
        false
    FROM users u
    WHERE u.email = 'vincent@thewinery.com.sg'
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = EXCLUDED.email_confirmed_at,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data,
        phone = EXCLUDED.phone,
        phone_confirmed_at = EXCLUDED.phone_confirmed_at,
        updated_at = NOW();

    -- Create or update Vincent's auth.identities entry (if user exists)
    INSERT INTO auth.identities (
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    )
    SELECT 
        u.id::text,
        u.id,
        jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', true),
        'email',
        NOW(),
        NOW(),
        NOW()
    FROM users u
    WHERE u.email = 'vincent@thewinery.com.sg'
    ON CONFLICT (provider_id, provider) DO UPDATE SET
        identity_data = EXCLUDED.identity_data,
        updated_at = NOW();

    RAISE NOTICE 'Authentication credentials fixed for both users';
END $$;

-- Verify both users can now authenticate
SELECT 
    u.id,
    u.email,
    u.name,
    u.account_type,
    u.company_id,
    u.role,
    au.email as auth_email,
    au.email_confirmed_at IS NOT NULL as email_confirmed
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email IN ('mikael@thewinery.com.sg', 'vincent@thewinery.com.sg')
ORDER BY u.email;