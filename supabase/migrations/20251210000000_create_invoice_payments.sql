-- Create invoice_payments table
CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES company_invoices(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bank_transfer', 'cheque', 'cash', 'credit_card', 'other')),
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update invoice status and outstanding amount
CREATE OR REPLACE FUNCTION update_invoice_status_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_total_paid DECIMAL(10,2);
    v_billing_amount DECIMAL(10,2);
    v_invoice_status VARCHAR(20);
BEGIN
    -- Calculate total paid for the invoice
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM invoice_payments
    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);

    -- Get invoice billing amount
    SELECT billing_amount INTO v_billing_amount
    FROM company_invoices
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

    -- Determine new status
    IF v_total_paid >= v_billing_amount THEN
        v_invoice_status := 'paid';
    ELSIF v_total_paid > 0 THEN
        v_invoice_status := 'partial_paid';
    ELSE
        -- If due date is passed, it might be overdue, but let's stick to basic logic first
        -- We can have a separate cron job for overdue status
        v_invoice_status := 'pending';
    END IF;

    -- Update invoice
    UPDATE company_invoices
    SET 
        outstanding_amount = GREATEST(0, v_billing_amount - v_total_paid),
        status = CASE 
            WHEN status = 'overdue' AND v_total_paid < v_billing_amount THEN 'overdue' -- Keep overdue if not fully paid
            ELSE v_invoice_status
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS tr_update_invoice_status_on_payment ON invoice_payments;
CREATE TRIGGER tr_update_invoice_status_on_payment
AFTER INSERT OR UPDATE OR DELETE ON invoice_payments
FOR EACH ROW
EXECUTE FUNCTION update_invoice_status_on_payment();

-- Add RLS policies for invoice_payments
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users (admin and company users)
CREATE POLICY "Allow read access for authenticated users" ON invoice_payments
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow write access only to admins (we can refine this later with is_admin check)
CREATE POLICY "Allow write access for admins" ON invoice_payments
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );
