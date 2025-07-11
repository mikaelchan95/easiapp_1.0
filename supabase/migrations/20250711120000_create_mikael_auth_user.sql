-- Create authenticated user for Mikael
-- This migration creates the user in both auth.users and public.users tables

-- First, create the user in auth.users table (this is the authentication table)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token,
    email_change_token_new,
    email_change_token_current,
    recovery_token
) VALUES (
    '654ae924-3d69-40e2-83dc-1141aa3e4081',
    '00000000-0000-0000-0000-000000000000',
    'mikael@thewinery.com.sg',
    '$2a$10$rJGkLQJzLjH4GgNqAMTCWOgC9LgYaVXlOgVEwQfhQqoJzlJXkMxOW', -- bcrypt hash of 'mikael123'
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Mikael", "account_type": "individual"}',
    false,
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    updated_at = NOW();

-- Create the user profile in public.users table
INSERT INTO public.users (
    id,
    name,
    email,
    phone,
    account_type,
    member_since,
    total_orders,
    total_spent,
    created_at,
    updated_at,
    last_login
) VALUES (
    '654ae924-3d69-40e2-83dc-1141aa3e4081',
    'Mikael',
    'mikael@thewinery.com.sg',
    '+65 9123 4567',
    'individual',
    'January 2025',
    3,
    450.75,
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    account_type = EXCLUDED.account_type,
    updated_at = NOW();

-- Create an identity record for the user
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    '654ae924-3d69-40e2-83dc-1141aa3e4081',
    '654ae924-3d69-40e2-83dc-1141aa3e4081',
    '{"email": "mikael@thewinery.com.sg", "sub": "654ae924-3d69-40e2-83dc-1141aa3e4081"}',
    'email',
    '654ae924-3d69-40e2-83dc-1141aa3e4081',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    last_sign_in_at = EXCLUDED.last_sign_in_at,
    updated_at = NOW();