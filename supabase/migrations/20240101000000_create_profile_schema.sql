-- Create custom types
CREATE TYPE account_type AS ENUM ('individual', 'company');
CREATE TYPE user_role AS ENUM ('superadmin', 'manager', 'approver', 'staff');
CREATE TYPE company_status AS ENUM ('active', 'suspended', 'pending_verification');
CREATE TYPE payment_terms AS ENUM ('COD', 'NET7', 'NET30', 'NET60');
CREATE TYPE approval_action AS ENUM ('approved', 'rejected', 'pending');

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  uen TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  logo TEXT,
  
  -- Billing & Credit
  credit_limit DECIMAL(12,2),
  current_credit DECIMAL(12,2),
  payment_terms payment_terms DEFAULT 'NET30',
  
  -- Order Settings
  require_approval BOOLEAN DEFAULT true,
  approval_threshold DECIMAL(12,2),
  multi_level_approval BOOLEAN DEFAULT false,
  auto_approve_below DECIMAL(12,2),
  
  -- Company Status
  status company_status DEFAULT 'pending_verification',
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  account_type account_type NOT NULL DEFAULT 'individual',
  
  -- Company user fields
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role user_role,
  department TEXT,
  position TEXT,
  joined_company_at TIMESTAMPTZ,
  
  -- Individual user fields
  member_since TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  
  -- Common fields
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User permissions table
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Order Permissions
  can_create_orders BOOLEAN DEFAULT false,
  can_approve_orders BOOLEAN DEFAULT false,
  can_view_all_orders BOOLEAN DEFAULT false,
  order_limit DECIMAL(12,2),
  
  -- User Management
  can_manage_users BOOLEAN DEFAULT false,
  can_invite_users BOOLEAN DEFAULT false,
  can_set_permissions BOOLEAN DEFAULT false,
  
  -- Company Settings
  can_edit_company_info BOOLEAN DEFAULT false,
  can_manage_billing BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,
  
  -- Product Access
  can_view_trade_price BOOLEAN DEFAULT false,
  can_access_exclusive_products BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order approvals table
CREATE TABLE order_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  role user_role NOT NULL,
  action approval_action DEFAULT 'pending',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  comments TEXT
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_companies_uen ON companies(uen);
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_order_approvals_order_id ON order_approvals(order_id);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_approvals ENABLE ROW LEVEL SECURITY;

-- Very simple RLS Policies (no joins or subqueries)
-- For now, allow all authenticated users to read everything
-- This prevents infinite recursion while we test

-- Companies: Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read companies" ON companies
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to update companies" ON companies
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Users: Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read users" ON users
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to update users" ON users
  FOR UPDATE USING (auth.role() = 'authenticated');

-- User permissions: Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read permissions" ON user_permissions
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to update permissions" ON user_permissions
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Order approvals: Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read approvals" ON order_approvals
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to insert approvals" ON order_approvals
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update approvals" ON order_approvals
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Function to automatically create user permissions
CREATE OR REPLACE FUNCTION create_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create permissions for company users
  IF NEW.account_type = 'company' AND NEW.role IS NOT NULL THEN
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
      order_limit
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.role IN ('superadmin', 'manager', 'staff') THEN true 
        ELSE false 
      END,
      CASE 
        WHEN NEW.role IN ('superadmin', 'manager', 'approver') THEN true 
        ELSE false 
      END,
      CASE 
        WHEN NEW.role IN ('superadmin', 'manager', 'approver') THEN true 
        ELSE false 
      END,
      CASE 
        WHEN NEW.role IN ('superadmin', 'manager') THEN true 
        ELSE false 
      END,
      CASE 
        WHEN NEW.role IN ('superadmin', 'manager') THEN true 
        ELSE false 
      END,
      CASE 
        WHEN NEW.role = 'superadmin' THEN true 
        ELSE false 
      END,
      CASE 
        WHEN NEW.role = 'superadmin' THEN true 
        ELSE false 
      END,
      CASE 
        WHEN NEW.role = 'superadmin' THEN true 
        ELSE false 
      END,
      CASE 
        WHEN NEW.role IN ('superadmin', 'manager') THEN true 
        ELSE false 
      END,
      CASE 
        WHEN NEW.role != 'staff' THEN true 
        ELSE true 
      END,
      CASE 
        WHEN NEW.role IN ('superadmin', 'manager') THEN true 
        ELSE false 
      END,
      CASE 
        WHEN NEW.role = 'staff' THEN 5000 
        ELSE NULL 
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create permissions on user creation
CREATE TRIGGER create_user_permissions_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_permissions();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 