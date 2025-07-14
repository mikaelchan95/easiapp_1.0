-- ============================================================================
-- Billing System Tables Migration
-- Creates comprehensive billing, payments, and real-time monitoring infrastructure
-- ============================================================================

-- Company Invoices Table
CREATE TABLE IF NOT EXISTS company_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    remaining_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'outstanding' CHECK (status IN ('outstanding', 'partial_paid', 'paid', 'overdue', 'cancelled')),
    due_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Company Payments Table
CREATE TABLE IF NOT EXISTS company_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference VARCHAR(100) NOT NULL,
    bank_reference VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Allocations Table (linking payments to specific invoices)
CREATE TABLE IF NOT EXISTS payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES company_payments(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES company_invoices(id) ON DELETE CASCADE,
    allocated_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(payment_id, invoice_id)
);

-- Balance Updates Table (for real-time tracking)
CREATE TABLE IF NOT EXISTS balance_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    update_type VARCHAR(50) NOT NULL CHECK (update_type IN ('payment_received', 'payment_allocated', 'credit_adjustment', 'invoice_created')),
    amount DECIMAL(10,2) NOT NULL,
    new_balance DECIMAL(10,2) NOT NULL,
    transaction_id UUID,
    invoice_id UUID REFERENCES company_invoices(id),
    reference VARCHAR(100),
    description TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Company Billing Preferences Table
CREATE TABLE IF NOT EXISTS company_billing_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id)
);

-- Real-time Subscriptions Table (for monitoring active connections)
CREATE TABLE IF NOT EXISTS realtime_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    subscription_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    connection_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, subscription_id)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Company Invoices Indexes
CREATE INDEX IF NOT EXISTS idx_company_invoices_company_id ON company_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_company_invoices_status ON company_invoices(status);
CREATE INDEX IF NOT EXISTS idx_company_invoices_due_date ON company_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_company_invoices_invoice_number ON company_invoices(invoice_number);

-- Company Payments Indexes
CREATE INDEX IF NOT EXISTS idx_company_payments_company_id ON company_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_company_payments_status ON company_payments(status);
CREATE INDEX IF NOT EXISTS idx_company_payments_created_at ON company_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_company_payments_reference ON company_payments(reference);

-- Payment Allocations Indexes
CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment_id ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_invoice_id ON payment_allocations(invoice_id);

-- Balance Updates Indexes
CREATE INDEX IF NOT EXISTS idx_balance_updates_company_id ON balance_updates(company_id);
CREATE INDEX IF NOT EXISTS idx_balance_updates_timestamp ON balance_updates(timestamp);
CREATE INDEX IF NOT EXISTS idx_balance_updates_type ON balance_updates(update_type);

-- Real-time Subscriptions Indexes
CREATE INDEX IF NOT EXISTS idx_realtime_subscriptions_company_id ON realtime_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_realtime_subscriptions_status ON realtime_subscriptions(status);

-- ============================================================================
-- Triggers for Automatic Updates
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_company_invoices_updated_at 
    BEFORE UPDATE ON company_invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_payments_updated_at 
    BEFORE UPDATE ON company_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_billing_preferences_updated_at 
    BEFORE UPDATE ON company_billing_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_realtime_subscriptions_updated_at 
    BEFORE UPDATE ON realtime_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update invoice remaining amount
CREATE OR REPLACE FUNCTION update_invoice_remaining_amount()
RETURNS TRIGGER AS $$
BEGIN
    NEW.remaining_amount = NEW.total_amount - NEW.paid_amount;
    
    -- Update status based on remaining amount
    IF NEW.remaining_amount <= 0 THEN
        NEW.status = 'paid';
    ELSIF NEW.paid_amount > 0 THEN
        NEW.status = 'partial_paid';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply remaining amount trigger
CREATE TRIGGER update_invoice_remaining_amount_trigger
    BEFORE INSERT OR UPDATE ON company_invoices
    FOR EACH ROW EXECUTE FUNCTION update_invoice_remaining_amount();

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number = 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                           LPAD(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 10, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply invoice number trigger
CREATE TRIGGER generate_invoice_number_trigger
    BEFORE INSERT ON company_invoices
    FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE company_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_billing_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_subscriptions ENABLE ROW LEVEL SECURITY;

-- Company Invoices Policies
CREATE POLICY "company_invoices_select_policy" ON company_invoices
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_permissions 
            WHERE user_id = auth.uid() 
            AND permission_type IN ('admin', 'manager', 'member', 'viewer')
        )
    );

CREATE POLICY "company_invoices_insert_policy" ON company_invoices
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_permissions 
            WHERE user_id = auth.uid() 
            AND permission_type IN ('admin', 'manager')
        )
    );

CREATE POLICY "company_invoices_update_policy" ON company_invoices
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_permissions 
            WHERE user_id = auth.uid() 
            AND permission_type IN ('admin', 'manager')
        )
    );

-- Company Payments Policies
CREATE POLICY "company_payments_select_policy" ON company_payments
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_permissions 
            WHERE user_id = auth.uid() 
            AND permission_type IN ('admin', 'manager', 'member', 'viewer')
        )
    );

CREATE POLICY "company_payments_insert_policy" ON company_payments
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_permissions 
            WHERE user_id = auth.uid() 
            AND permission_type IN ('admin', 'manager')
        )
    );

CREATE POLICY "company_payments_update_policy" ON company_payments
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_permissions 
            WHERE user_id = auth.uid() 
            AND permission_type IN ('admin', 'manager')
        )
    );

-- Payment Allocations Policies (based on payment access)
CREATE POLICY "payment_allocations_select_policy" ON payment_allocations
    FOR SELECT USING (
        payment_id IN (
            SELECT id FROM company_payments 
            WHERE company_id IN (
                SELECT company_id FROM user_permissions 
                WHERE user_id = auth.uid() 
                AND permission_type IN ('admin', 'manager', 'member', 'viewer')
            )
        )
    );

CREATE POLICY "payment_allocations_insert_policy" ON payment_allocations
    FOR INSERT WITH CHECK (
        payment_id IN (
            SELECT id FROM company_payments 
            WHERE company_id IN (
                SELECT company_id FROM user_permissions 
                WHERE user_id = auth.uid() 
                AND permission_type IN ('admin', 'manager')
            )
        )
    );

-- Balance Updates Policies
CREATE POLICY "balance_updates_select_policy" ON balance_updates
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_permissions 
            WHERE user_id = auth.uid() 
            AND permission_type IN ('admin', 'manager', 'member', 'viewer')
        )
    );

CREATE POLICY "balance_updates_insert_policy" ON balance_updates
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_permissions 
            WHERE user_id = auth.uid() 
            AND permission_type IN ('admin', 'manager')
        )
    );

-- Billing Preferences Policies
CREATE POLICY "billing_preferences_select_policy" ON company_billing_preferences
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_permissions 
            WHERE user_id = auth.uid() 
            AND permission_type IN ('admin', 'manager', 'member', 'viewer')
        )
    );

CREATE POLICY "billing_preferences_upsert_policy" ON company_billing_preferences
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_permissions 
            WHERE user_id = auth.uid() 
            AND permission_type IN ('admin', 'manager')
        )
    );

-- Real-time Subscriptions Policies
CREATE POLICY "realtime_subscriptions_select_policy" ON realtime_subscriptions
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_permissions 
            WHERE user_id = auth.uid() 
            AND permission_type IN ('admin', 'manager', 'member', 'viewer')
        )
    );

CREATE POLICY "realtime_subscriptions_upsert_policy" ON realtime_subscriptions
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_permissions 
            WHERE user_id = auth.uid() 
            AND permission_type IN ('admin', 'manager', 'member', 'viewer')
        )
    );

-- ============================================================================
-- Enable Real-time for Balance Updates
-- ============================================================================

-- Enable real-time subscriptions for balance updates
ALTER PUBLICATION supabase_realtime ADD TABLE balance_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE company_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE company_invoices;

-- ============================================================================
-- Sample Data for Development
-- ============================================================================

-- Insert sample invoices for Mikael's company (if company exists)
DO $$
DECLARE
    mikael_company_id UUID;
BEGIN
    -- Get Mikael's company ID
    SELECT c.id INTO mikael_company_id
    FROM companies c 
    JOIN user_permissions up ON c.id = up.company_id
    JOIN users u ON up.user_id = u.id
    WHERE u.email = 'mikael@easinova.com'
    AND up.permission_type = 'admin'
    LIMIT 1;
    
    -- Insert sample invoices if company exists
    IF mikael_company_id IS NOT NULL THEN
        -- Outstanding invoice
        INSERT INTO company_invoices (
            company_id, 
            total_amount, 
            due_date, 
            status,
            notes
        ) VALUES 
        (
            mikael_company_id, 
            15750.00, 
            NOW() + INTERVAL '15 days', 
            'outstanding',
            'Monthly supply order - Office supplies and equipment'
        ),
        (
            mikael_company_id, 
            8420.00, 
            NOW() + INTERVAL '7 days', 
            'outstanding',
            'IT equipment purchase - Laptops and accessories'
        ),
        (
            mikael_company_id, 
            3280.50, 
            NOW() - INTERVAL '5 days', 
            'overdue',
            'Stationary supplies - Q1 order'
        );
        
        -- Add a balance update record
        INSERT INTO balance_updates (
            company_id,
            update_type,
            amount,
            new_balance,
            description
        ) VALUES (
            mikael_company_id,
            'invoice_created',
            15750.00,
            (SELECT credit_limit - credit_used FROM companies WHERE id = mikael_company_id),
            'New invoice created for monthly supply order'
        );
        
        RAISE NOTICE 'Sample billing data created for Mikael''s company';
    ELSE
        RAISE NOTICE 'Mikael''s company not found - skipping sample data';
    END IF;
END $$;