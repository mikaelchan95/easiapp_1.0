-- Create Vincent Hong auth user properly
-- This removes the existing auth record and creates a new one with proper setup

-- First, clean up any existing auth records for Vincent
DELETE FROM auth.identities WHERE email = 'vincent@thewinery.com.sg';
DELETE FROM auth.users WHERE email = 'vincent@thewinery.com.sg';

-- Create Vincent Hong auth user with proper structure
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a1234567-8901-2345-6789-012345678901'::uuid,
  'authenticated',
  'authenticated',
  'vincent@thewinery.com.sg',
  crypt('VincentWinery123!', gen_salt('bf')),
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Vincent","last_name":"Hong","phone":"+65 90221220"}',
  false,
  NOW(),
  NOW(),
  '+65 90221220',
  NOW(),
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL,
  false
);

-- Create auth.identities entry for Vincent Hong
INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at,
  id
) VALUES (
  'a1234567-8901-2345-6789-012345678901',
  'a1234567-8901-2345-6789-012345678901'::uuid,
  '{"sub":"a1234567-8901-2345-6789-012345678901","email":"vincent@thewinery.com.sg","email_verified":true,"phone_verified":true}',
  'email',
  NOW(),
  NOW(),
  NOW(),
  'a1234567-8901-2345-6789-012345678901'::uuid
);

-- Verify Vincent's auth setup
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  au.phone,
  au.phone_confirmed_at,
  au.raw_user_meta_data,
  ai.provider,
  ai.identity_data->>'email_verified' as email_verified
FROM auth.users au
LEFT JOIN auth.identities ai ON au.id = ai.user_id
WHERE au.email = 'vincent@thewinery.com.sg';