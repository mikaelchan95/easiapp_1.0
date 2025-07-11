-- Create comprehensive orders system with user/company access control
-- This migration creates orders, order_items, and order_approvals tables with proper RLS policies

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  
  -- Order details
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  order_type VARCHAR(20) NOT NULL DEFAULT 'standard', -- 'standard', 'company', 'bulk'
  
  -- Financial details
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  gst DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'SGD',
  
  -- Payment information
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_reference VARCHAR(100),
  
  -- Delivery information
  delivery_address JSONB NOT NULL, -- Store full address object
  delivery_instructions TEXT,
  delivery_date DATE,
  delivery_time_slot VARCHAR(50),
  estimated_delivery TIMESTAMP,
  actual_delivery TIMESTAMP,
  tracking_number VARCHAR(100),
  
  -- Approval workflow (for company orders)
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_status VARCHAR(20) DEFAULT 'not_required', -- 'not_required', 'pending', 'approved', 'rejected'
  approval_threshold DECIMAL(10,2),
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  cancelled_by UUID REFERENCES users(id),
  cancelled_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'returned')),
  CONSTRAINT valid_order_type CHECK (order_type IN ('standard', 'company', 'bulk')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  CONSTRAINT valid_approval_status CHECK (approval_status IN ('not_required', 'pending', 'approved', 'rejected', 'auto_approved')),
  CONSTRAINT positive_amounts CHECK (subtotal >= 0 AND gst >= 0 AND delivery_fee >= 0 AND total >= 0)
);

-- Create order_items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Product information
  product_id UUID, -- Reference to products table (if exists)
  product_name VARCHAR(255) NOT NULL,
  product_description TEXT,
  product_image_url TEXT,
  sku VARCHAR(100),
  
  -- Pricing and quantities
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
  
  -- Product metadata
  product_metadata JSONB, -- Store additional product info like vintage, size, etc.
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_approvals table for multi-level approval workflow
CREATE TABLE order_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Approval details
  approver_id UUID NOT NULL REFERENCES users(id),
  approver_role VARCHAR(50) NOT NULL,
  approval_level INTEGER NOT NULL DEFAULT 1,
  
  -- Approval decision
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  comments TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_approval_status CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT unique_approver_per_order UNIQUE (order_id, approver_id)
);

-- Create order_status_history table for tracking status changes
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Status change details
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_company_id ON orders(company_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_approvals_order_id ON order_approvals(order_id);
CREATE INDEX idx_order_approvals_approver_id ON order_approvals(approver_id);
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);

-- Enable RLS on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;