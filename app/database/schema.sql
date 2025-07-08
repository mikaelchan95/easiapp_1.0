-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE account_type AS ENUM ('individual', 'company');
CREATE TYPE company_user_role AS ENUM ('superadmin', 'manager', 'approver', 'staff');
CREATE TYPE company_status AS ENUM ('active', 'suspended', 'pending_verification');
CREATE TYPE payment_terms AS ENUM ('COD', 'NET7', 'NET30', 'NET60');

-- Companies table
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  uen TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  logo TEXT,
  
  -- Billing & Credit
  credit_limit DECIMAL(10,2),
  current_credit DECIMAL(10,2) DEFAULT 0,
  payment_terms payment_terms DEFAULT 'COD',
  
  -- Order Settings
  require_approval BOOLEAN DEFAULT false,
  approval_threshold DECIMAL(10,2),
  multi_level_approval BOOLEAN DEFAULT false,
  auto_approve_below DECIMAL(10,2),
  
  status company_status DEFAULT 'pending_verification',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  account_type account_type NOT NULL DEFAULT 'individual',
  
  -- Company user fields
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  role company_user_role,
  department TEXT,
  position TEXT,
  joined_company_at TIMESTAMPTZ,
  
  -- Individual user fields
  member_since TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  
  -- Common fields
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User permissions table
CREATE TABLE user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Order Permissions
  can_create_orders BOOLEAN DEFAULT false,
  can_approve_orders BOOLEAN DEFAULT false,
  can_view_all_orders BOOLEAN DEFAULT false,
  order_limit DECIMAL(10,2),
  
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Order approvals table (for tracking approval workflows)
CREATE TABLE order_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL, -- This would reference an orders table when implemented
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  role company_user_role NOT NULL,
  action TEXT CHECK (action IN ('approved', 'rejected', 'pending')) NOT NULL,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_companies_uen ON companies(uen);
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_order_approvals_order_id ON order_approvals(order_id);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Users can view their own company" ON companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can update their company" ON companies
  FOR UPDATE USING (
    id IN (
      SELECT u.company_id 
      FROM users u 
      JOIN user_permissions up ON u.id = up.user_id 
      WHERE u.id = auth.uid() AND up.can_edit_company_info = true
    )
  );

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can view company team members" ON users
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Managers can update team members" ON users
  FOR UPDATE USING (
    company_id IN (
      SELECT u.company_id 
      FROM users u 
      JOIN user_permissions up ON u.id = up.user_id 
      WHERE u.id = auth.uid() AND up.can_manage_users = true
    )
  );

CREATE POLICY "Managers can delete team members" ON users
  FOR DELETE USING (
    company_id IN (
      SELECT u.company_id 
      FROM users u 
      JOIN user_permissions up ON u.id = up.user_id 
      WHERE u.id = auth.uid() AND up.can_manage_users = true
    )
  );

CREATE POLICY "Managers can invite team members" ON users
  FOR INSERT WITH CHECK (
    account_type = 'company' AND
    company_id IN (
      SELECT u.company_id 
      FROM users u 
      JOIN user_permissions up ON u.id = up.user_id 
      WHERE u.id = auth.uid() AND up.can_invite_users = true
    )
  );

-- RLS Policies for user_permissions
CREATE POLICY "Users can view their own permissions" ON user_permissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view team permissions" ON user_permissions
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE company_id = (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Managers can update team permissions" ON user_permissions
  FOR ALL USING (
    user_id IN (
      SELECT u.id 
      FROM users u 
      JOIN users manager ON u.company_id = manager.company_id
      JOIN user_permissions mp ON manager.id = mp.user_id
      WHERE manager.id = auth.uid() AND mp.can_set_permissions = true
    )
  );

-- Functions to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON user_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default permissions for new company users
CREATE OR REPLACE FUNCTION create_default_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.account_type = 'company' AND NEW.role IS NOT NULL THEN
    INSERT INTO user_permissions (
      user_id,
      can_create_orders,
      can_approve_orders,
      can_view_all_orders,
      order_limit,
      can_manage_users,
      can_invite_users,
      can_set_permissions,
      can_edit_company_info,
      can_manage_billing,
      can_view_reports,
      can_view_trade_price,
      can_access_exclusive_products
    ) VALUES (
      NEW.id,
      CASE NEW.role 
        WHEN 'superadmin' THEN true
        WHEN 'manager' THEN true
        WHEN 'approver' THEN false
        WHEN 'staff' THEN true
        ELSE false
      END,
      CASE NEW.role 
        WHEN 'superadmin' THEN true
        WHEN 'manager' THEN true
        WHEN 'approver' THEN true
        WHEN 'staff' THEN false
        ELSE false
      END,
      CASE NEW.role 
        WHEN 'superadmin' THEN true
        WHEN 'manager' THEN true
        WHEN 'approver' THEN true
        WHEN 'staff' THEN false
        ELSE false
      END,
      CASE NEW.role 
        WHEN 'staff' THEN 5000.00
        ELSE NULL
      END,
      CASE NEW.role 
        WHEN 'superadmin' THEN true
        WHEN 'manager' THEN true
        WHEN 'approver' THEN false
        WHEN 'staff' THEN false
        ELSE false
      END,
      CASE NEW.role 
        WHEN 'superadmin' THEN true
        WHEN 'manager' THEN true
        WHEN 'approver' THEN false
        WHEN 'staff' THEN false
        ELSE false
      END,
      CASE NEW.role 
        WHEN 'superadmin' THEN true
        WHEN 'manager' THEN false
        WHEN 'approver' THEN false
        WHEN 'staff' THEN false
        ELSE false
      END,
      CASE NEW.role 
        WHEN 'superadmin' THEN true
        WHEN 'manager' THEN false
        WHEN 'approver' THEN false
        WHEN 'staff' THEN false
        ELSE false
      END,
      CASE NEW.role 
        WHEN 'superadmin' THEN true
        WHEN 'manager' THEN false
        WHEN 'approver' THEN false
        WHEN 'staff' THEN false
        ELSE false
      END,
      CASE NEW.role 
        WHEN 'superadmin' THEN true
        WHEN 'manager' THEN true
        WHEN 'approver' THEN false
        WHEN 'staff' THEN false
        ELSE false
      END,
      CASE NEW.role 
        WHEN 'superadmin' THEN true
        WHEN 'manager' THEN true
        WHEN 'approver' THEN true
        WHEN 'staff' THEN true
        ELSE false
      END,
      CASE NEW.role 
        WHEN 'superadmin' THEN true
        WHEN 'manager' THEN true
        WHEN 'approver' THEN false
        WHEN 'staff' THEN false
        ELSE false
      END
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for default permissions
CREATE TRIGGER create_user_permissions_trigger
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_default_permissions(); 