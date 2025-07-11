-- Create base schema with users and companies tables
-- This must run before any other migrations

-- Create companies table first (users references it)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  uen VARCHAR(50) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  logo TEXT,
  credit_limit DECIMAL(10,2),
  current_credit DECIMAL(10,2) DEFAULT 0,
  payment_terms VARCHAR(10) DEFAULT 'COD',
  require_approval BOOLEAN DEFAULT false,
  approval_threshold DECIMAL(10,2),
  multi_level_approval BOOLEAN DEFAULT false,
  auto_approve_below DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'active',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'pending_verification')),
  CONSTRAINT valid_payment_terms CHECK (payment_terms IN ('COD', 'NET7', 'NET30', 'NET60'))
);

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  account_type VARCHAR(20) NOT NULL DEFAULT 'individual',
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  role VARCHAR(20),
  department VARCHAR(100),
  position VARCHAR(100),
  joined_company_at TIMESTAMP WITH TIME ZONE,
  member_since VARCHAR(50),
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_account_type CHECK (account_type IN ('individual', 'company')),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'manager', 'staff', 'viewer', 'superadmin'))
);

-- Create user_permissions table
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  can_create_orders BOOLEAN DEFAULT true,
  can_approve_orders BOOLEAN DEFAULT false,
  can_view_all_orders BOOLEAN DEFAULT false,
  order_limit DECIMAL(10,2),
  can_manage_users BOOLEAN DEFAULT false,
  can_invite_users BOOLEAN DEFAULT false,
  can_set_permissions BOOLEAN DEFAULT false,
  can_edit_company_info BOOLEAN DEFAULT false,
  can_manage_billing BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,
  can_view_trade_price BOOLEAN DEFAULT false,
  can_access_exclusive_products BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_companies_uen ON companies(uen);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Company users can view company data" ON companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM users WHERE auth.uid() = id
    )
  );

CREATE POLICY "Users can view their own permissions" ON user_permissions
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Insert some initial data
INSERT INTO companies (
  id, name, company_name, uen, address, phone, email, status, created_at, updated_at
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  'The Winery',
  'The Winery Pte Ltd',
  '201234567A',
  '123 Marina Bay, Singapore 018956',
  '+65 6123 4567',
  'info@thewinery.com.sg',
  'active',
  NOW(),
  NOW()
);

-- Insert initial users
INSERT INTO users (
  id, name, email, phone, account_type, company_id, role, department, position, 
  joined_company_at, member_since, total_orders, total_spent, created_at, updated_at
) VALUES 
(
  '654ae924-3d69-40e2-83dc-1141aa3e4081',
  'Mikael',
  'mikael@thewinery.com.sg',
  '+65 9123 4567',
  'individual',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'January 2025',
  0,
  0,
  NOW(),
  NOW()
),
(
  '44444444-4444-4444-4444-444444444444',
  'Demo User',
  'demo@easiapp.com',
  '+65 9999 9999',
  'individual',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'January 2025',
  0,
  0,
  NOW(),
  NOW()
);