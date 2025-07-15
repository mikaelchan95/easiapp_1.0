-- Create Vincent Hong as super admin user
-- First Name: Vincent, Last Name: Hong

-- First, create the company "The Winery"
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
  'e1234567-8901-2345-6789-012345678901'::uuid,
  'The Winery',
  'The Winery Pte Ltd',
  '202012345A',
  '123 Wine Street, Singapore 123456',
  '+65 6123 4567',
  'info@thewinery.com.sg',
  'active',
  100000.00,
  100000.00,
  'NET30',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create Vincent Hong user account
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
  'a1234567-8901-2345-6789-012345678901'::uuid,
  'vincent@thewinery.com.sg',
  'Vincent Hong',
  '+65 90221220',
  'company',
  'e1234567-8901-2345-6789-012345678901'::uuid,
  'admin',
  'Director',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Set up super admin permissions for Vincent
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
  'a1234567-8901-2345-6789-012345678901'::uuid,
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

-- Create auth.users entry for Vincent Hong
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
  'a1234567-8901-2345-6789-012345678901'::uuid,
  'authenticated',
  'authenticated',
  'vincent@thewinery.com.sg',
  crypt('VincentWinery123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Vincent","last_name":"Hong","phone":"+65 90221220"}',
  false,
  NOW(),
  NOW(),
  '+65 90221220',
  NOW(),
  0,
  false
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- Create auth.identities entry for Vincent Hong
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'a1234567-8901-2345-6789-012345678901'::uuid,
  'a1234567-8901-2345-6789-012345678901'::uuid,
  '{"sub":"a1234567-8901-2345-6789-012345678901","email":"vincent@thewinery.com.sg","email_verified":true,"phone_verified":true}',
  'email',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  identity_data = EXCLUDED.identity_data,
  updated_at = NOW();

-- Update Mikael's metadata to have proper first/last names
UPDATE auth.users 
SET raw_user_meta_data = '{"first_name":"Mikael","last_name":"Chan","phone":"+65 90221220"}'
WHERE email = 'mikael@thewinery.com.sg';

-- Verify the user was created
SELECT 
  u.id,
  u.email,
  u.name,
  u.phone,
  u.account_type,
  u.role,
  u.position,
  c.name as company_name,
  up.can_edit_company_info,
  up.can_manage_billing
FROM users u
JOIN companies c ON u.company_id = c.id
JOIN user_permissions up ON u.id = up.user_id
WHERE u.email = 'vincent@thewinery.com.sg';