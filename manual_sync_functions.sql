-- Manual SQL for Synchronous Balance Functions with ACID Compliance
-- Run this in Supabase Dashboard > SQL Editor

-- First, ensure the balance_updates table exists with all required columns
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
    -- Additional columns for compatibility
    update_type VARCHAR(50) DEFAULT 'balance_change',
    amount DECIMAL(10,2) DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'balance_updates' AND column_name = 'update_type') THEN
        ALTER TABLE balance_updates ADD COLUMN update_type VARCHAR(50) DEFAULT 'balance_change';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'balance_updates' AND column_name = 'amount') THEN
        ALTER TABLE balance_updates ADD COLUMN amount DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'balance_updates' AND column_name = 'timestamp') THEN
        ALTER TABLE balance_updates ADD COLUMN timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Create or update the atomic balance update function
CREATE OR REPLACE FUNCTION update_company_balance_atomic(
    p_company_id UUID,
    p_amount_change DECIMAL(10,2),
    p_transaction_type TEXT,
    p_description TEXT DEFAULT '',
    p_order_id UUID DEFAULT NULL,
    p_payment_id UUID DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_current_balance DECIMAL(10,2);
    v_new_balance DECIMAL(10,2);
    v_credit_limit DECIMAL(10,2);
    v_transaction_id UUID;
    v_result JSON;
BEGIN
    -- Lock company record and get current balance
    SELECT credit_limit, (credit_limit - COALESCE(credit_used, 0)) INTO v_credit_limit, v_current_balance
    FROM companies 
    WHERE id = p_company_id
    FOR UPDATE;
    
    -- Check if company exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Company not found: %', p_company_id;
    END IF;
    
    -- Calculate new balance
    v_new_balance := v_current_balance + p_amount_change;
    
    -- Update company credit_used (inverse of available credit)
    UPDATE companies 
    SET credit_used = v_credit_limit - v_new_balance,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_company_id;
    
    -- Insert balance update record
    INSERT INTO balance_updates (
        company_id,
        previous_balance,
        new_balance,
        amount_changed,
        change_type,
        description,
        order_id,
        payment_id,
        created_by,
        update_type,
        amount,
        timestamp
    ) VALUES (
        p_company_id,
        v_current_balance,
        v_new_balance,
        p_amount_change,
        p_transaction_type,
        p_description,
        p_order_id,
        p_payment_id,
        p_created_by,
        'balance_change',
        p_amount_change,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO v_transaction_id;
    
    -- Build result
    v_result := json_build_object(
        'transaction', json_build_object(
            'id', v_transaction_id,
            'company_id', p_company_id,
            'previous_balance', v_current_balance,
            'new_balance', v_new_balance,
            'amount_changed', p_amount_change,
            'transaction_type', p_transaction_type,
            'description', p_description,
            'order_id', p_order_id,
            'payment_id', p_payment_id,
            'created_by', p_created_by,
            'created_at', CURRENT_TIMESTAMP
        ),
        'new_balance', v_new_balance,
        'credit_limit', v_credit_limit,
        'credit_used', v_credit_limit - v_new_balance,
        'credit_utilization', CASE 
            WHEN v_credit_limit > 0 THEN ((v_credit_limit - v_new_balance) / v_credit_limit * 100)
            ELSE 0 
        END
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create balance summary function
CREATE OR REPLACE FUNCTION get_company_balance_summary(
    p_company_id UUID
) RETURNS JSON AS $$
DECLARE
    v_company_data companies%ROWTYPE;
    v_recent_updates JSON;
    v_result JSON;
BEGIN
    -- Get company data
    SELECT * INTO v_company_data
    FROM companies 
    WHERE id = p_company_id;
    
    -- Check if company exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Company not found: %', p_company_id;
    END IF;
    
    -- Get recent balance updates
    SELECT json_agg(
        json_build_object(
            'id', id,
            'amount_changed', amount_changed,
            'change_type', change_type,
            'description', description,
            'created_at', created_at
        ) ORDER BY created_at DESC
    ) INTO v_recent_updates
    FROM balance_updates
    WHERE company_id = p_company_id
    AND created_at >= NOW() - INTERVAL '7 days'
    LIMIT 10;
    
    -- Build comprehensive result
    v_result := json_build_object(
        'company_id', p_company_id,
        'company_name', v_company_data.company_name,
        'credit_limit', COALESCE(v_company_data.credit_limit, 0),
        'credit_used', COALESCE(v_company_data.credit_used, 0),
        'available_credit', COALESCE(v_company_data.credit_limit, 0) - COALESCE(v_company_data.credit_used, 0),
        'credit_utilization', CASE 
            WHEN COALESCE(v_company_data.credit_limit, 0) > 0 THEN (COALESCE(v_company_data.credit_used, 0) / v_company_data.credit_limit * 100)
            ELSE 0 
        END,
        'status', CASE 
            WHEN (COALESCE(v_company_data.credit_limit, 0) - COALESCE(v_company_data.credit_used, 0)) < 0 THEN 'overlimit'
            WHEN COALESCE(v_company_data.credit_limit, 0) > 0 AND COALESCE(v_company_data.credit_used, 0) / v_company_data.credit_limit >= 0.9 THEN 'critical'
            WHEN COALESCE(v_company_data.credit_limit, 0) > 0 AND COALESCE(v_company_data.credit_used, 0) / v_company_data.credit_limit >= 0.75 THEN 'warning'
            ELSE 'good_standing'
        END,
        'recent_updates', COALESCE(v_recent_updates, '[]'::json),
        'last_updated', CURRENT_TIMESTAMP
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_company_balance_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_balance_summary TO authenticated;

-- Enable RLS on balance_updates if not already enabled
ALTER TABLE public.balance_updates ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies
DROP POLICY IF EXISTS "Companies can view their own balance updates" ON public.balance_updates;
CREATE POLICY "Companies can view their own balance updates"
    ON public.balance_updates
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can insert balance updates" ON public.balance_updates;
CREATE POLICY "System can insert balance updates"
    ON public.balance_updates
    FOR INSERT
    WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_balance_updates_company_id ON public.balance_updates(company_id);
CREATE INDEX IF NOT EXISTS idx_balance_updates_created_at ON public.balance_updates(created_at);
CREATE INDEX IF NOT EXISTS idx_balance_updates_timestamp ON public.balance_updates(timestamp);

-- Test the function with sample data
INSERT INTO public.balance_updates (
    company_id, 
    previous_balance, 
    new_balance, 
    amount_changed, 
    change_type, 
    description,
    update_type,
    amount,
    timestamp
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    0,
    -134093.78,
    -134093.78,
    'order_charge',
    'Initial balance from historical orders',
    'balance_change',
    -134093.78,
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;