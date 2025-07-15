-- Create balance_updates table for tracking company credit balance changes
-- Note: This migration only creates the balance_updates table
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_balance_updates_company_id ON public.balance_updates(company_id);
CREATE INDEX IF NOT EXISTS idx_balance_updates_created_at ON public.balance_updates(created_at);
CREATE INDEX IF NOT EXISTS idx_balance_updates_change_type ON public.balance_updates(change_type);
CREATE INDEX IF NOT EXISTS idx_balance_updates_order_id ON public.balance_updates(order_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.balance_updates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

CREATE POLICY "System can insert balance updates"
    ON public.balance_updates
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update balance updates"
    ON public.balance_updates
    FOR UPDATE
    USING (true);

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
INSERT INTO public.balance_updates (company_id, previous_balance, new_balance, amount_changed, change_type, description) 
VALUES 
    (
        '11111111-1111-1111-1111-111111111111',
        0,
        -134093.78,
        -134093.78,
        'order_charge',
        'Initial credit usage from historical orders'
    )
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.balance_updates IS 'Tracks all changes to company credit balances for audit and history purposes';
COMMENT ON COLUMN public.balance_updates.change_type IS 'Type of balance change: credit_increase, credit_decrease, payment_applied, order_charge, adjustment, refund';
COMMENT ON COLUMN public.balance_updates.amount_changed IS 'Amount of change (positive for increases, negative for decreases)';
COMMENT ON COLUMN public.balance_updates.description IS 'Human-readable description of the balance change';