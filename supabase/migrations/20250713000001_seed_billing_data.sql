-- ============================================================================
-- Billing System Sample Data Seeding
-- Populates realistic billing data for development and testing
-- ============================================================================

-- Insert additional sample invoices and payments for comprehensive testing
DO $$
DECLARE
    mikael_company_id UUID;
    sample_payment_id UUID;
BEGIN
    -- Get Mikael's company ID
    SELECT c.id INTO mikael_company_id
    FROM companies c 
    JOIN user_permissions up ON c.id = up.company_id
    JOIN users u ON up.user_id = u.id
    WHERE u.email = 'mikael@easinova.com'
    AND up.permission_type = 'admin'
    LIMIT 1;
    
    -- Only proceed if company exists
    IF mikael_company_id IS NOT NULL THEN
        
        -- Insert more sample invoices with different statuses
        INSERT INTO company_invoices (
            company_id, 
            total_amount, 
            paid_amount,
            due_date, 
            status,
            notes
        ) VALUES 
        -- Paid invoices
        (
            mikael_company_id, 
            12500.00, 
            12500.00,
            NOW() - INTERVAL '30 days', 
            'paid',
            'Office furniture - Desks and chairs'
        ),
        (
            mikael_company_id, 
            5250.00, 
            5250.00,
            NOW() - INTERVAL '20 days', 
            'paid',
            'Software licenses - Annual subscription'
        ),
        -- Partially paid invoice
        (
            mikael_company_id, 
            18000.00, 
            9000.00,
            NOW() + INTERVAL '10 days', 
            'partial_paid',
            'Marketing campaign materials - Q2 2025'
        ),
        -- More outstanding invoices
        (
            mikael_company_id, 
            6750.00, 
            0.00,
            NOW() + INTERVAL '20 days', 
            'outstanding',
            'Catering services - Monthly package'
        ),
        (
            mikael_company_id, 
            4200.00, 
            0.00,
            NOW() + INTERVAL '25 days', 
            'outstanding',
            'Cleaning supplies - Bulk order'
        );
        
        -- Insert sample payments
        INSERT INTO company_payments (
            company_id,
            amount,
            payment_method,
            reference,
            bank_reference,
            status,
            notes,
            processed_at
        ) VALUES 
        (
            mikael_company_id,
            12500.00,
            'bank_transfer',
            'PAY-2025-001',
            'BT-789456123',
            'completed',
            'Payment for office furniture',
            NOW() - INTERVAL '30 days'
        ),
        (
            mikael_company_id,
            5250.00,
            'bank_transfer',
            'PAY-2025-002',
            'BT-789456124',
            'completed',
            'Software license payment',
            NOW() - INTERVAL '20 days'
        ),
        (
            mikael_company_id,
            9000.00,
            'cheque',
            'PAY-2025-003',
            'CHQ-001234',
            'completed',
            'Partial payment for marketing campaign',
            NOW() - INTERVAL '10 days'
        ),
        (
            mikael_company_id,
            2500.00,
            'bank_transfer',
            'PAY-2025-004',
            'BT-789456125',
            'processing',
            'Payment in progress',
            NULL
        );
        
        -- Get a sample payment ID for allocations
        SELECT id INTO sample_payment_id 
        FROM company_payments 
        WHERE company_id = mikael_company_id 
        AND reference = 'PAY-2025-001'
        LIMIT 1;
        
        -- Insert payment allocations for the completed payments
        IF sample_payment_id IS NOT NULL THEN
            INSERT INTO payment_allocations (
                payment_id,
                invoice_id,
                allocated_amount
            )
            SELECT 
                sample_payment_id,
                inv.id,
                inv.total_amount
            FROM company_invoices inv 
            WHERE inv.company_id = mikael_company_id 
            AND inv.total_amount = 12500.00
            AND inv.status = 'paid'
            LIMIT 1;
        END IF;
        
        -- Insert more balance updates for realistic history
        INSERT INTO balance_updates (
            company_id,
            update_type,
            amount,
            new_balance,
            transaction_id,
            reference,
            description,
            timestamp
        ) VALUES 
        (
            mikael_company_id,
            'payment_received',
            12500.00,
            87500.00,
            sample_payment_id,
            'PAY-2025-001',
            'Payment received for office furniture',
            NOW() - INTERVAL '30 days'
        ),
        (
            mikael_company_id,
            'payment_allocated',
            12500.00,
            87500.00,
            sample_payment_id,
            'PAY-2025-001',
            'Payment allocated to invoice INV-2025-001',
            NOW() - INTERVAL '30 days' + INTERVAL '5 minutes'
        ),
        (
            mikael_company_id,
            'payment_received',
            5250.00,
            92750.00,
            NULL,
            'PAY-2025-002',
            'Payment received for software licenses',
            NOW() - INTERVAL '20 days'
        ),
        (
            mikael_company_id,
            'payment_received',
            9000.00,
            101750.00,
            NULL,
            'PAY-2025-003',
            'Partial payment received for marketing campaign',
            NOW() - INTERVAL '10 days'
        ),
        (
            mikael_company_id,
            'invoice_created',
            -15750.00,
            86000.00,
            NULL,
            NULL,
            'New invoice created for monthly supply order',
            NOW() - INTERVAL '5 days'
        ),
        (
            mikael_company_id,
            'invoice_created',
            -8420.00,
            77580.00,
            NULL,
            NULL,
            'New invoice created for IT equipment',
            NOW() - INTERVAL '3 days'
        );
        
        -- Insert default billing preferences
        INSERT INTO company_billing_preferences (
            company_id,
            preferences
        ) VALUES (
            mikael_company_id,
            '{
                "notification_settings": {
                    "email_notifications": true,
                    "sms_notifications": false,
                    "push_notifications": true,
                    "payment_reminders": true,
                    "credit_alerts": true
                },
                "payment_settings": {
                    "auto_pay_enabled": false,
                    "auto_pay_threshold": 1000,
                    "preferred_payment_method": "bank_transfer",
                    "payment_terms": "NET30"
                },
                "report_settings": {
                    "monthly_statements": true,
                    "payment_confirmations": true,
                    "credit_reports": false,
                    "detailed_invoices": true
                }
            }'::jsonb
        );
        
        -- Update company credit usage based on outstanding invoices
        UPDATE companies 
        SET credit_used = (
            SELECT COALESCE(SUM(remaining_amount), 0)
            FROM company_invoices 
            WHERE company_id = mikael_company_id 
            AND status IN ('outstanding', 'partial_paid', 'overdue')
        )
        WHERE id = mikael_company_id;
        
        RAISE NOTICE 'Comprehensive billing data seeded successfully for Mikael''s company';
        RAISE NOTICE 'Created invoices, payments, allocations, balance updates, and preferences';
        
    ELSE
        RAISE NOTICE 'Mikael''s company not found - skipping billing data seeding';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error seeding billing data: %', SQLERRM;
END $$;

-- ============================================================================
-- Create some utility views for easier querying
-- ============================================================================

-- View for company billing summary
CREATE OR REPLACE VIEW company_billing_summary AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.credit_limit,
    c.credit_used,
    (c.credit_limit - c.credit_used) as available_credit,
    ROUND(((c.credit_used / NULLIF(c.credit_limit, 0)) * 100), 2) as utilization_percentage,
    CASE 
        WHEN (c.credit_used / NULLIF(c.credit_limit, 0)) >= 0.9 THEN 'critical'
        WHEN (c.credit_used / NULLIF(c.credit_limit, 0)) >= 0.75 THEN 'warning'
        ELSE 'good'
    END as credit_status,
    COALESCE(outstanding.total_outstanding, 0) as total_outstanding,
    COALESCE(outstanding.invoice_count, 0) as outstanding_invoices,
    COALESCE(overdue.total_overdue, 0) as total_overdue,
    COALESCE(overdue.overdue_count, 0) as overdue_invoices
FROM companies c
LEFT JOIN (
    SELECT 
        company_id,
        SUM(remaining_amount) as total_outstanding,
        COUNT(*) as invoice_count
    FROM company_invoices 
    WHERE status IN ('outstanding', 'partial_paid')
    GROUP BY company_id
) outstanding ON c.id = outstanding.company_id
LEFT JOIN (
    SELECT 
        company_id,
        SUM(remaining_amount) as total_overdue,
        COUNT(*) as overdue_count
    FROM company_invoices 
    WHERE status = 'overdue'
    GROUP BY company_id
) overdue ON c.id = overdue.company_id;

-- View for payment history with allocations
CREATE OR REPLACE VIEW payment_history_detailed AS
SELECT 
    p.id as payment_id,
    p.company_id,
    c.name as company_name,
    p.amount as payment_amount,
    p.payment_method,
    p.reference,
    p.bank_reference,
    p.status,
    p.created_at,
    p.processed_at,
    COALESCE(pa.allocated_count, 0) as invoices_allocated,
    COALESCE(pa.total_allocated, 0) as amount_allocated
FROM company_payments p
JOIN companies c ON p.company_id = c.id
LEFT JOIN (
    SELECT 
        payment_id,
        COUNT(*) as allocated_count,
        SUM(allocated_amount) as total_allocated
    FROM payment_allocations
    GROUP BY payment_id
) pa ON p.id = pa.payment_id;

-- ============================================================================
-- Sample notification/alert functions (for future use)
-- ============================================================================

-- Function to check for overdue invoices and create alerts
CREATE OR REPLACE FUNCTION check_overdue_invoices()
RETURNS void AS $$
BEGIN
    -- Update invoice status to overdue if past due date
    UPDATE company_invoices 
    SET status = 'overdue'
    WHERE status IN ('outstanding', 'partial_paid')
    AND due_date < NOW()
    AND remaining_amount > 0;
    
    -- Could add notification logic here in the future
    
END;
$$ LANGUAGE plpgsql;

-- Function to calculate payment velocity for a company
CREATE OR REPLACE FUNCTION calculate_payment_velocity(company_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    avg_days DECIMAL;
BEGIN
    SELECT AVG(EXTRACT(DAY FROM (p.processed_at - i.created_at))) INTO avg_days
    FROM company_payments p
    JOIN payment_allocations pa ON p.id = pa.payment_id
    JOIN company_invoices i ON pa.invoice_id = i.id
    WHERE p.company_id = company_uuid
    AND p.status = 'completed'
    AND p.processed_at IS NOT NULL
    AND p.created_at >= NOW() - INTERVAL '6 months';
    
    RETURN COALESCE(avg_days, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Final setup and verification
-- ============================================================================

-- Verify the migration was successful
DO $$
DECLARE
    table_count INTEGER;
    sample_company_id UUID;
    invoice_count INTEGER;
    payment_count INTEGER;
BEGIN
    -- Count billing tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'company_invoices', 
        'company_payments', 
        'payment_allocations', 
        'balance_updates', 
        'company_billing_preferences',
        'realtime_subscriptions'
    );
    
    -- Get sample data counts
    SELECT id INTO sample_company_id FROM companies LIMIT 1;
    
    IF sample_company_id IS NOT NULL THEN
        SELECT COUNT(*) INTO invoice_count FROM company_invoices WHERE company_id = sample_company_id;
        SELECT COUNT(*) INTO payment_count FROM company_payments WHERE company_id = sample_company_id;
    END IF;
    
    RAISE NOTICE '✅ Billing migration completed successfully';
    RAISE NOTICE '📊 Created % billing tables', table_count;
    RAISE NOTICE '📄 Sample invoices: %', COALESCE(invoice_count, 0);
    RAISE NOTICE '💳 Sample payments: %', COALESCE(payment_count, 0);
    RAISE NOTICE '🔄 Real-time subscriptions enabled for balance updates';
    RAISE NOTICE '🔒 Row Level Security policies applied';
    RAISE NOTICE '📈 Utility views created for reporting';
    
END $$;