-- =============================================================================
-- Migration: Sales & Driver Infrastructure for EasiSales and EasiDriver apps
-- Creates tables for staff profiles, delivery management, digital handshakes,
-- and customer onboarding — sharing the same Supabase backend as the EASI app.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. staff_profiles — Salesmen and drivers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_role TEXT NOT NULL CHECK (staff_role IN ('salesman', 'driver')),
  employee_id TEXT,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  territory TEXT,
  delivery_zone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT staff_profiles_user_id_unique UNIQUE (user_id)
);

-- ---------------------------------------------------------------------------
-- 2. delivery_assignments — Link orders to drivers with status tracking
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES staff_profiles(id),
  delivery_zone TEXT CHECK (delivery_zone IN ('north', 'south', 'east', 'west')),
  status TEXT NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'dispatched', 'en_route', 'arrived', 'delivered', 'failed')),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  dispatched_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. delivery_proofs — Photo/signature proof of delivery
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_assignment_id UUID NOT NULL REFERENCES delivery_assignments(id) ON DELETE CASCADE,
  photo_url TEXT,
  signature_url TEXT,
  recipient_name TEXT,
  notes TEXT,
  captured_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 4. digital_handshakes — Two-sided delivery confirmation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS digital_handshakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_confirmed BOOLEAN DEFAULT false,
  customer_confirmed_at TIMESTAMPTZ,
  driver_confirmed BOOLEAN DEFAULT false,
  driver_confirmed_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT digital_handshakes_order_id_unique UNIQUE (order_id)
);

-- ---------------------------------------------------------------------------
-- 5. customer_onboarding_requests — Salesman-initiated B2B customer signup
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_onboarding_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesman_id UUID NOT NULL REFERENCES staff_profiles(id),
  company_name TEXT NOT NULL,
  uen TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  proposed_credit_limit DECIMAL(12,2),
  proposed_payment_terms TEXT
    CHECK (proposed_payment_terms IN ('CBD', 'COD', 'NET7', 'NET14', 'NET30', 'NET45', 'NET60')),
  proposed_pricing_tier INTEGER CHECK (proposed_pricing_tier BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 6. Add staff/delivery columns to existing orders table
-- ---------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS placed_by_staff_id UUID REFERENCES staff_profiles(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_zone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_driver_id UUID REFERENCES staff_profiles(id);

-- ---------------------------------------------------------------------------
-- 7. Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_staff_profiles_user_id ON staff_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_staff_role ON staff_profiles(staff_role);

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_driver_id ON delivery_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order_id ON delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status ON delivery_assignments(status);

CREATE INDEX IF NOT EXISTS idx_customer_onboarding_requests_salesman_id ON customer_onboarding_requests(salesman_id);
CREATE INDEX IF NOT EXISTS idx_customer_onboarding_requests_status ON customer_onboarding_requests(status);

-- ---------------------------------------------------------------------------
-- 8. Enable Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_handshakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_onboarding_requests ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 9. RLS Policies — staff_profiles
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staff_profiles' AND policyname = 'Staff can read own profile'
  ) THEN
    CREATE POLICY "Staff can read own profile"
      ON staff_profiles FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staff_profiles' AND policyname = 'Service role full access to staff_profiles'
  ) THEN
    CREATE POLICY "Service role full access to staff_profiles"
      ON staff_profiles FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 10. RLS Policies — delivery_assignments
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'delivery_assignments' AND policyname = 'Drivers can read own assignments'
  ) THEN
    CREATE POLICY "Drivers can read own assignments"
      ON delivery_assignments FOR SELECT
      USING (
        driver_id IN (
          SELECT id FROM staff_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'delivery_assignments' AND policyname = 'Drivers can update own assignments'
  ) THEN
    CREATE POLICY "Drivers can update own assignments"
      ON delivery_assignments FOR UPDATE
      USING (
        driver_id IN (
          SELECT id FROM staff_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'delivery_assignments' AND policyname = 'Service role full access to delivery_assignments'
  ) THEN
    CREATE POLICY "Service role full access to delivery_assignments"
      ON delivery_assignments FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 11. RLS Policies — delivery_proofs
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'delivery_proofs' AND policyname = 'Drivers can insert proofs for own assignments'
  ) THEN
    CREATE POLICY "Drivers can insert proofs for own assignments"
      ON delivery_proofs FOR INSERT
      WITH CHECK (
        delivery_assignment_id IN (
          SELECT da.id FROM delivery_assignments da
          JOIN staff_profiles sp ON da.driver_id = sp.id
          WHERE sp.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'delivery_proofs' AND policyname = 'Drivers can read own delivery proofs'
  ) THEN
    CREATE POLICY "Drivers can read own delivery proofs"
      ON delivery_proofs FOR SELECT
      USING (
        delivery_assignment_id IN (
          SELECT da.id FROM delivery_assignments da
          JOIN staff_profiles sp ON da.driver_id = sp.id
          WHERE sp.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'delivery_proofs' AND policyname = 'Service role full access to delivery_proofs'
  ) THEN
    CREATE POLICY "Service role full access to delivery_proofs"
      ON delivery_proofs FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 12. RLS Policies — digital_handshakes
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'digital_handshakes' AND policyname = 'Authenticated users can read handshakes for own orders'
  ) THEN
    CREATE POLICY "Authenticated users can read handshakes for own orders"
      ON digital_handshakes FOR SELECT
      USING (
        order_id IN (
          SELECT id FROM orders WHERE user_id = auth.uid()
        )
        OR
        order_id IN (
          SELECT da.order_id FROM delivery_assignments da
          JOIN staff_profiles sp ON da.driver_id = sp.id
          WHERE sp.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'digital_handshakes' AND policyname = 'Authenticated users can update handshakes for own orders'
  ) THEN
    CREATE POLICY "Authenticated users can update handshakes for own orders"
      ON digital_handshakes FOR UPDATE
      USING (
        order_id IN (
          SELECT id FROM orders WHERE user_id = auth.uid()
        )
        OR
        order_id IN (
          SELECT da.order_id FROM delivery_assignments da
          JOIN staff_profiles sp ON da.driver_id = sp.id
          WHERE sp.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'digital_handshakes' AND policyname = 'Service role full access to digital_handshakes'
  ) THEN
    CREATE POLICY "Service role full access to digital_handshakes"
      ON digital_handshakes FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 13. RLS Policies — customer_onboarding_requests
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_onboarding_requests' AND policyname = 'Salesmen can read own onboarding requests'
  ) THEN
    CREATE POLICY "Salesmen can read own onboarding requests"
      ON customer_onboarding_requests FOR SELECT
      USING (
        salesman_id IN (
          SELECT id FROM staff_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_onboarding_requests' AND policyname = 'Salesmen can insert onboarding requests'
  ) THEN
    CREATE POLICY "Salesmen can insert onboarding requests"
      ON customer_onboarding_requests FOR INSERT
      WITH CHECK (
        salesman_id IN (
          SELECT id FROM staff_profiles
          WHERE user_id = auth.uid() AND staff_role = 'salesman'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_onboarding_requests' AND policyname = 'Service role full access to customer_onboarding_requests'
  ) THEN
    CREATE POLICY "Service role full access to customer_onboarding_requests"
      ON customer_onboarding_requests FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 14. Triggers — auto-update updated_at
--     Reuses the existing update_updated_at_column() function from base schema
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_staff_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_staff_profiles_updated_at
      BEFORE UPDATE ON staff_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_delivery_assignments_updated_at'
  ) THEN
    CREATE TRIGGER update_delivery_assignments_updated_at
      BEFORE UPDATE ON delivery_assignments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_customer_onboarding_requests_updated_at'
  ) THEN
    CREATE TRIGGER update_customer_onboarding_requests_updated_at
      BEFORE UPDATE ON customer_onboarding_requests
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
