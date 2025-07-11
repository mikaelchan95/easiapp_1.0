-- Create Mikael user in the users table
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
  updated_at
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Mikael Chan',
  'mikael@thewinery.com.sg',
  '+65 9123 4567',
  'individual',
  12,
  2450.75,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  account_type = EXCLUDED.account_type,
  total_orders = EXCLUDED.total_orders,
  total_spent = EXCLUDED.total_spent,
  updated_at = NOW();

-- Create Demo user in the users table
INSERT INTO public.users (
  id,
  name,
  email,
  phone,
  account_type,
  total_orders,
  total_spent,
  created_at,
  updated_at
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  'Demo User',
  'demo@easiapp.com',
  '+65 9000 0000',
  'individual',
  3,
  450.25,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  account_type = EXCLUDED.account_type,
  total_orders = EXCLUDED.total_orders,
  total_spent = EXCLUDED.total_spent,
  updated_at = NOW();