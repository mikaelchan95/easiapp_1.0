-- Fix auth schema by ensuring auth tables exist
-- This migration recreates the auth schema if it's missing

-- Enable auth extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "auth";

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Grant usage on auth schema
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO anon;

-- Create auth.users table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID,
    aud VARCHAR(255),
    role VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    encrypted_password VARCHAR(255),
    email_confirmed_at TIMESTAMPTZ,
    invited_at TIMESTAMPTZ,
    confirmation_token VARCHAR(255),
    confirmation_sent_at TIMESTAMPTZ,
    recovery_token VARCHAR(255),
    recovery_sent_at TIMESTAMPTZ,
    email_change_token_new VARCHAR(255),
    email_change VARCHAR(255),
    email_change_sent_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    raw_app_meta_data JSONB,
    raw_user_meta_data JSONB,
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    phone VARCHAR(255),
    phone_confirmed_at TIMESTAMPTZ,
    phone_change VARCHAR(255),
    phone_change_token VARCHAR(255),
    phone_change_sent_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    email_change_token_current VARCHAR(255),
    email_change_confirm_status SMALLINT DEFAULT 0,
    banned_until TIMESTAMPTZ,
    reauthentication_token VARCHAR(255),
    reauthentication_sent_at TIMESTAMPTZ,
    is_sso_user BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    is_anonymous BOOLEAN DEFAULT FALSE
);

-- Create auth.identities table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(255) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    identity_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_sign_in_at TIMESTAMPTZ,
    email VARCHAR(255),
    UNIQUE(provider, provider_id)
);

-- Create auth.refresh_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    parent VARCHAR(255),
    session_id UUID
);

-- Create auth.sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    factor_id UUID,
    aal VARCHAR(255),
    not_after TIMESTAMPTZ,
    refreshed_at TIMESTAMPTZ,
    user_agent TEXT,
    ip INET,
    tag VARCHAR(255)
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.identities TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.refresh_tokens TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.sessions TO service_role;

-- Create basic auth user for Mikael using proper auth format
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmed_at
) VALUES (
    '654ae924-3d69-40e2-83dc-1141aa3e4081',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'mikael@thewinery.com.sg',
    '$2a$10$mAyKbZUTbPNBjN5TZdRdKOJkp1JQjkAUXz1pLzJpVBGQvzJ8gVpUK', -- hashed version of password
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Mikael Chan","account_type":"company"}',
    false,
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW(),
    raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- Create identity for Mikael
INSERT INTO auth.identities (
    id,
    user_id,
    provider,
    provider_id,
    identity_data,
    created_at,
    updated_at,
    email
) VALUES (
    '654ae924-3d69-40e2-83dc-1141aa3e4081',
    '654ae924-3d69-40e2-83dc-1141aa3e4081',
    'email',
    '654ae924-3d69-40e2-83dc-1141aa3e4081',
    '{"sub":"654ae924-3d69-40e2-83dc-1141aa3e4081","email":"mikael@thewinery.com.sg","name":"Mikael Chan"}',
    NOW(),
    NOW(),
    'mikael@thewinery.com.sg'
) ON CONFLICT (id) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = NOW();

-- Create basic auth user for Demo
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmed_at
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'demo@easiapp.com',
    '$2a$10$mAyKbZUTbPNBjN5TZdRdKOJkp1JQjkAUXz1pLzJpVBGQvzJ8gVpUK', -- hashed version of password
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Demo User","account_type":"individual"}',
    false,
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW(),
    raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- Create identity for Demo
INSERT INTO auth.identities (
    id,
    user_id,
    provider,
    provider_id,
    identity_data,
    created_at,
    updated_at,
    email
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    'email',
    '44444444-4444-4444-4444-444444444444',
    '{"sub":"44444444-4444-4444-4444-444444444444","email":"demo@easiapp.com","name":"Demo User"}',
    NOW(),
    NOW(),
    'demo@easiapp.com'
) ON CONFLICT (id) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = NOW();