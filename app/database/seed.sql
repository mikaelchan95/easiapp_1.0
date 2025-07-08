-- Insert mock companies
INSERT INTO companies (
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
) VALUES 
(
  'company-1',
  'The Winery Tapas Bar',
  'THE ORGANIC WINERY PTE. LTD.',
  '201816133N',
  '30 Victoria Street #B1-05 Chijmes, Singapore 187996',
  '+65 6338 9685',
  'orders@thewinery.com.sg',
  50000.00,
  35000.00,
  'NET30',
  true,
  5000.00,
  false,
  1000.00,
  'active',
  '2023-01-15T08:00:00Z',
  '2023-01-10T08:00:00Z',
  '2024-01-01T08:00:00Z'
),
(
  'company-2',
  'Marina Bay Restaurant Group',
  'MARINA BAY F&B PTE. LTD.',
  '202012345G',
  '1 Marina Boulevard #01-01, Singapore 018989',
  '+65 6888 8888',
  'procurement@marinabaygroup.sg',
  100000.00,
  45000.00,
  'NET60',
  true,
  10000.00,
  true,
  2000.00,
  'active',
  '2022-06-01T08:00:00Z',
  '2022-05-15T08:00:00Z',
  '2024-01-01T08:00:00Z'
);

-- Insert mock company users
INSERT INTO users (
  id,
  name,
  email,
  phone,
  account_type,
  company_id,
  role,
  department,
  position,
  joined_company_at,
  profile_image,
  created_at,
  last_login
) VALUES 
(
  'user-mikael',
  'Mikael Chan',
  'mikael@thewinery.com.sg',
  '+65 96998961',
  'company',
  'company-1',
  'superadmin',
  'Operations',
  'Manager',
  '2023-01-10T08:00:00Z',
  'https://example.com/mikael-avatar.jpg',
  '2023-01-10T08:00:00Z',
  '2024-01-20T14:30:00Z'
),
(
  'user-sarah',
  'Sarah Lim',
  'sarah@thewinery.com.sg',
  '+65 91234567',
  'company',
  'company-1',
  'manager',
  'Bar Operations',
  'Bar Manager',
  '2023-03-15T08:00:00Z',
  null,
  '2023-03-15T08:00:00Z',
  '2024-01-19T18:00:00Z'
),
(
  'user-john',
  'John Tan',
  'john@thewinery.com.sg',
  '+65 98765432',
  'company',
  'company-1',
  'staff',
  'Bar Operations',
  'Bartender',
  '2023-06-01T08:00:00Z',
  null,
  '2023-06-01T08:00:00Z',
  '2024-01-20T10:00:00Z'
),
(
  'user-david',
  'David Wong',
  'david@marinabaygroup.sg',
  '+65 92223333',
  'company',
  'company-2',
  'superadmin',
  'Procurement',
  'Group Purchasing Manager',
  '2022-05-15T08:00:00Z',
  null,
  '2022-05-15T08:00:00Z',
  '2024-01-20T09:00:00Z'
);

-- Insert mock individual users
INSERT INTO users (
  id,
  name,
  email,
  phone,
  account_type,
  member_since,
  total_orders,
  total_spent,
  profile_image,
  created_at,
  last_login
) VALUES 
(
  'user-jane',
  'Jane Doe',
  'jane@example.com',
  '+65 8123 4567',
  'individual',
  'March 2023',
  12,
  3450.50,
  'https://example.com/jane-avatar.jpg',
  '2023-03-01T08:00:00Z',
  '2024-01-20T15:00:00Z'
),
(
  'user-alex',
  'Alex Chen',
  'alex.chen@gmail.com',
  '+65 9876 5432',
  'individual',
  'January 2024',
  3,
  890.00,
  null,
  '2024-01-05T08:00:00Z',
  '2024-01-18T20:00:00Z'
);

-- Note: User permissions will be automatically created by the trigger
-- But we need to update the custom order limit for John Tan
UPDATE user_permissions 
SET order_limit = 3000.00 
WHERE user_id = 'user-john'; 