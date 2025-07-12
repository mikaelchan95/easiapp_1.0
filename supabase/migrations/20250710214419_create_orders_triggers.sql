-- Create triggers and functions for orders system automation
-- This migration sets up automated order number generation and status tracking

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('order_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Create trigger for order number generation
CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();

-- Create function to automatically create status history entries
CREATE OR REPLACE FUNCTION create_order_status_history()
RETURNS TRIGGER AS $$
BEGIN
    -- On INSERT, create initial status history
    IF TG_OP = 'INSERT' THEN
        INSERT INTO order_status_history (order_id, from_status, to_status, changed_by)
        VALUES (NEW.id, NULL, NEW.status, NEW.created_by);
        RETURN NEW;
    END IF;
    
    -- On UPDATE, create status history if status changed
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO order_status_history (order_id, from_status, to_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for status history tracking
CREATE TRIGGER order_status_history_trigger
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_order_status_history();

-- Create function to automatically set approval requirements
CREATE OR REPLACE FUNCTION set_order_approval_requirements()
RETURNS TRIGGER AS $$
DECLARE
    company_settings RECORD;
BEGIN
    -- Only apply to company orders
    IF NEW.company_id IS NOT NULL THEN
        -- Get company approval settings
        SELECT require_approval, approval_threshold, auto_approve_below
        INTO company_settings
        FROM companies
        WHERE id = NEW.company_id;
        
        -- Set approval requirements based on company settings and order total
        IF company_settings.require_approval = true THEN
            NEW.requires_approval := true;
            NEW.approval_threshold := company_settings.approval_threshold;
            
            -- Auto-approve if order total is below auto-approve threshold
            IF company_settings.auto_approve_below IS NOT NULL 
               AND NEW.total <= company_settings.auto_approve_below THEN
                NEW.approval_status := 'auto_approved';
                NEW.approved_at := NOW();
                NEW.approved_by := NEW.user_id;
            ELSE
                NEW.approval_status := 'pending';
            END IF;
        ELSE
            NEW.requires_approval := false;
            NEW.approval_status := 'not_required';
        END IF;
    ELSE
        -- Individual orders don't require approval
        NEW.requires_approval := false;
        NEW.approval_status := 'not_required';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for approval requirements
CREATE TRIGGER set_approval_requirements_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_approval_requirements();