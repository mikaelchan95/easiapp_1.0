-- Create company_invoices table
CREATE TABLE IF NOT EXISTS public.company_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_date DATE NOT NULL,
    payment_due_date DATE NOT NULL,
    billing_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    outstanding_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    payment_terms VARCHAR(20) NOT NULL DEFAULT 'NET30',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create company_payments table
CREATE TABLE IF NOT EXISTS public.company_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.company_invoices(id) ON DELETE SET NULL,
    payment_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('bank_transfer', 'credit_card', 'debit_card', 'paypal', 'cheque', 'cash')),
    payment_date DATE NOT NULL,
    payment_reference VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create company_billing_settings table
CREATE TABLE IF NOT EXISTS public.company_billing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    billing_frequency VARCHAR(20) NOT NULL DEFAULT 'monthly',
    billing_day_of_month INTEGER NOT NULL DEFAULT 1 CHECK (billing_day_of_month >= 1 AND billing_day_of_month <= 28),
    auto_billing_enabled BOOLEAN NOT NULL DEFAULT false,
    billing_email VARCHAR(255),
    cc_emails TEXT[], -- Array of email addresses
    send_reminders BOOLEAN NOT NULL DEFAULT true,
    reminder_days_before INTEGER[] DEFAULT ARRAY[7,3,1],
    late_fee_enabled BOOLEAN NOT NULL DEFAULT false,
    late_fee_type VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (late_fee_type IN ('percentage', 'fixed')),
    late_fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    grace_period_days INTEGER NOT NULL DEFAULT 7,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id)
);

-- Create company_credit_alerts table
CREATE TABLE IF NOT EXISTS public.company_credit_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    category VARCHAR(30) NOT NULL CHECK (category IN ('credit_limit', 'payment_overdue', 'invoice_generated', 'payment_failed')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    message TEXT NOT NULL,
    action_required BOOLEAN NOT NULL DEFAULT false,
    acknowledged BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_invoices_company_id ON public.company_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_company_invoices_status ON public.company_invoices(status);
CREATE INDEX IF NOT EXISTS idx_company_invoices_invoice_date ON public.company_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_company_invoices_payment_due_date ON public.company_invoices(payment_due_date);

CREATE INDEX IF NOT EXISTS idx_company_payments_company_id ON public.company_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_company_payments_invoice_id ON public.company_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_company_payments_payment_date ON public.company_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_company_payments_status ON public.company_payments(status);

CREATE INDEX IF NOT EXISTS idx_company_credit_alerts_company_id ON public.company_credit_alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_company_credit_alerts_acknowledged ON public.company_credit_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_company_credit_alerts_severity ON public.company_credit_alerts(severity);

-- Enable Row Level Security (RLS)
ALTER TABLE public.company_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_credit_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company_invoices
CREATE POLICY "Companies can view their own invoices"
    ON public.company_invoices
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "System can manage company invoices"
    ON public.company_invoices
    FOR ALL
    USING (true);

-- Create RLS policies for company_payments
CREATE POLICY "Companies can view their own payments"
    ON public.company_payments
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "System can manage company payments"
    ON public.company_payments
    FOR ALL
    USING (true);

-- Create RLS policies for company_billing_settings
CREATE POLICY "Companies can view their own billing settings"
    ON public.company_billing_settings
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Companies can update their own billing settings"
    ON public.company_billing_settings
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "System can manage billing settings"
    ON public.company_billing_settings
    FOR ALL
    USING (true);

-- Create RLS policies for company_credit_alerts
CREATE POLICY "Companies can view their own credit alerts"
    ON public.company_credit_alerts
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Companies can update their own credit alerts"
    ON public.company_credit_alerts
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "System can manage credit alerts"
    ON public.company_credit_alerts
    FOR ALL
    USING (true);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_company_billing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS trigger_company_invoices_updated_at ON public.company_invoices;
CREATE TRIGGER trigger_company_invoices_updated_at
    BEFORE UPDATE ON public.company_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_company_billing_updated_at();

DROP TRIGGER IF EXISTS trigger_company_payments_updated_at ON public.company_payments;
CREATE TRIGGER trigger_company_payments_updated_at
    BEFORE UPDATE ON public.company_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_company_billing_updated_at();

DROP TRIGGER IF EXISTS trigger_company_billing_settings_updated_at ON public.company_billing_settings;
CREATE TRIGGER trigger_company_billing_settings_updated_at
    BEFORE UPDATE ON public.company_billing_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_company_billing_updated_at();

-- Insert default billing settings for existing company
INSERT INTO public.company_billing_settings (company_id, billing_frequency, billing_day_of_month, auto_billing_enabled, send_reminders, reminder_days_before, late_fee_enabled, late_fee_type, late_fee_amount, grace_period_days)
VALUES 
    (
        '11111111-1111-1111-1111-111111111111',
        'monthly',
        1,
        false,
        true,
        ARRAY[7,3,1],
        false,
        'percentage',
        5.00,
        7
    )
ON CONFLICT (company_id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE public.company_invoices IS 'Stores company invoices for billing tracking';
COMMENT ON TABLE public.company_payments IS 'Stores company payments and payment history';
COMMENT ON TABLE public.company_billing_settings IS 'Stores company-specific billing configuration';
COMMENT ON TABLE public.company_credit_alerts IS 'Stores credit and billing alerts for companies';