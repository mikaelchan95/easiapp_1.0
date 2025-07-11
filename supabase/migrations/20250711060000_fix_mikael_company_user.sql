-- Fix Mikael's user profile to be a company user
-- Update the users table to use the correct auth ID and set as company user

-- First, delete the old user entry if it exists
DELETE FROM public.users WHERE id = '33333333-3333-3333-3333-333333333333';

-- Insert/Update Mikael with the correct auth ID and as company user
INSERT INTO public.users (
  id,
  name,
  email,
  phone,
  account_type,
  company_id,
  role,
  position,
  department,
  member_since,
  total_orders,
  total_spent,
  created_at,
  updated_at
) VALUES (
  '654ae924-3d69-40e2-83dc-1141aa3e4081',  -- Match auth.users ID
  'Mikael Chan',
  'mikael@thewinery.com.sg',
  '+65 96998961',
  'company',
  '11111111-1111-1111-1111-111111111111',  -- The Winery company ID
  'superadmin',
  'Manager',
  'Operations',
  12,
  2450.75,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  account_type = EXCLUDED.account_type,
  company_id = EXCLUDED.company_id,
  role = EXCLUDED.role,
  position = EXCLUDED.position,
  department = EXCLUDED.department,
  total_orders = EXCLUDED.total_orders,
  total_spent = EXCLUDED.total_spent,
  updated_at = NOW();

-- Create the company entry for The Winery
INSERT INTO public.companies (
  id,
  name,
  company_name,
  uen,
  address,
  phone,
  email,
  credit_limit,
  current_credit,
  payment_terms,
  require_approval,
  approval_threshold,
  multi_level_approval,
  auto_approve_below,
  status,
  verified_at,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'The Winery Tapas Bar',
  'THE ORGANIC WINERY PTE. LTD.',
  '201816133N',
  '30 Victoria Street #B1-05 Chijmes, Singapore 187996',
  '+65 6338 9685',
  'orders@thewinery.com.sg',
  50000,
  35000,
  'NET30',
  true,
  5000,
  false,
  1000,
  'active',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  company_name = EXCLUDED.company_name,
  uen = EXCLUDED.uen,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  credit_limit = EXCLUDED.credit_limit,
  current_credit = EXCLUDED.current_credit,
  payment_terms = EXCLUDED.payment_terms,
  require_approval = EXCLUDED.require_approval,
  approval_threshold = EXCLUDED.approval_threshold,
  multi_level_approval = EXCLUDED.multi_level_approval,
  auto_approve_below = EXCLUDED.auto_approve_below,
  status = EXCLUDED.status,
  verified_at = EXCLUDED.verified_at,
  updated_at = NOW();

-- Create user permissions for Mikael
INSERT INTO public.user_permissions (
  user_id,
  can_view_orders,
  can_create_orders,
  can_edit_orders,
  can_delete_orders,
  can_approve_orders,
  can_view_analytics,
  can_manage_team,
  can_manage_company,
  can_manage_billing,
  can_export_data,
  created_at,
  updated_at
) VALUES (
  '654ae924-3d69-40e2-83dc-1141aa3e4081',
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
  can_view_orders = EXCLUDED.can_view_orders,
  can_create_orders = EXCLUDED.can_create_orders,
  can_edit_orders = EXCLUDED.can_edit_orders,
  can_delete_orders = EXCLUDED.can_delete_orders,
  can_approve_orders = EXCLUDED.can_approve_orders,
  can_view_analytics = EXCLUDED.can_view_analytics,
  can_manage_team = EXCLUDED.can_manage_team,
  can_manage_company = EXCLUDED.can_manage_company,
  can_manage_billing = EXCLUDED.can_manage_billing,
  can_export_data = EXCLUDED.can_export_data,
  updated_at = NOW();