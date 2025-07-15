-- Manual SQL to create balance_updates table
-- Run this in Supabase Dashboard > SQL Editor

-- Create balance_updates table for tracking company credit balance changes
CREATE TABLE IF NOT EXISTS public.balance_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    previous_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    new_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_changed DECIMAL(10,2) NOT NULL DEFAULT 0,
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('credit_increase', 'credit_decrease', 'payment_applied', 'order_charge', 'adjustment', 'refund')),
    description TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    payment_id UUID,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Add columns that might be expected by the RealTimeBalanceWidget
    update_type VARCHAR(50) DEFAULT 'balance_change',
    amount DECIMAL(10,2) DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_balance_updates_company_id ON public.balance_updates(company_id);
CREATE INDEX IF NOT EXISTS idx_balance_updates_created_at ON public.balance_updates(created_at);
CREATE INDEX IF NOT EXISTS idx_balance_updates_timestamp ON public.balance_updates(timestamp);
CREATE INDEX IF NOT EXISTS idx_balance_updates_change_type ON public.balance_updates(change_type);
CREATE INDEX IF NOT EXISTS idx_balance_updates_order_id ON public.balance_updates(order_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.balance_updates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'balance_updates' 
        AND policyname = 'Companies can view their own balance updates'
    ) THEN
        CREATE POLICY "Companies can view their own balance updates"
            ON public.balance_updates
            FOR SELECT
            USING (
                company_id IN (
                    SELECT id FROM public.companies 
                    WHERE id = company_id 
                    AND id = (
                        SELECT company_id FROM public.users 
                        WHERE id = auth.uid()
                    )
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'balance_updates' 
        AND policyname = 'System can insert balance updates'
    ) THEN
        CREATE POLICY "System can insert balance updates"
            ON public.balance_updates
            FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'balance_updates' 
        AND policyname = 'System can update balance updates'
    ) THEN
        CREATE POLICY "System can update balance updates"
            ON public.balance_updates
            FOR UPDATE
            USING (true);
    END IF;
END $$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_balance_updates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_balance_updates_updated_at ON public.balance_updates;
CREATE TRIGGER trigger_balance_updates_updated_at
    BEFORE UPDATE ON public.balance_updates
    FOR EACH ROW
    EXECUTE FUNCTION update_balance_updates_updated_at();

-- Insert some sample data for testing
INSERT INTO public.balance_updates (
    company_id, 
    previous_balance, 
    new_balance, 
    amount_changed, 
    change_type, 
    description,
    update_type,
    amount
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    0,
    -134093.78,
    -134093.78,
    'order_charge',
    'Initial credit usage from historical orders',
    'balance_change',
    -134093.78
) ON CONFLICT DO NOTHING;

-- Also create a company_credit_alerts table if it doesn't exist
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

-- Create indexes for company_credit_alerts
CREATE INDEX IF NOT EXISTS idx_company_credit_alerts_company_id ON public.company_credit_alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_company_credit_alerts_acknowledged ON public.company_credit_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_company_credit_alerts_severity ON public.company_credit_alerts(severity);

-- Enable RLS for company_credit_alerts
ALTER TABLE public.company_credit_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company_credit_alerts
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_credit_alerts' 
        AND policyname = 'Companies can view their own credit alerts'
    ) THEN
        CREATE POLICY "Companies can view their own credit alerts"
            ON public.company_credit_alerts
            FOR SELECT
            USING (
                company_id IN (
                    SELECT company_id FROM public.users 
                    WHERE id = auth.uid()
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_credit_alerts' 
        AND policyname = 'System can manage credit alerts'
    ) THEN
        CREATE POLICY "System can manage credit alerts"
            ON public.company_credit_alerts
            FOR ALL
            USING (true);
    END IF;
END $$;