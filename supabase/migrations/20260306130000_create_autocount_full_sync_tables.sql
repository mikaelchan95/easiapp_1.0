-- Full AutoCount sync infrastructure.
-- Creates mirror tables for all AutoCount entities beyond Debtor.
-- All ac_* tables use service-only RLS (bridge uses service_role key).

-- ============================================================
-- 1. Link columns on existing tables
-- ============================================================

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS autocount_item_code VARCHAR(30);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_ac_item_code
    ON public.products (autocount_item_code)
    WHERE autocount_item_code IS NOT NULL;

ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS autocount_group_code VARCHAR(30);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_ac_group_code
    ON public.categories (autocount_group_code)
    WHERE autocount_group_code IS NOT NULL;

-- ============================================================
-- 2. Creditors (suppliers/vendors)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ac_creditors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acc_no VARCHAR(30) NOT NULL UNIQUE,
    company_name VARCHAR(200),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(200),
    contact_person VARCHAR(100),
    credit_limit DECIMAL(18,2) DEFAULT 0,
    credit_term VARCHAR(50),
    currency_code VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    raw_data JSONB DEFAULT '{}',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ac_creditors_active ON public.ac_creditors (is_active);

-- ============================================================
-- 3. AR Invoices (Accounts Receivable)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ac_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_no VARCHAR(50) NOT NULL UNIQUE,
    debtor_code VARCHAR(30),
    debtor_name VARCHAR(200),
    doc_date DATE,
    due_date DATE,
    amount DECIMAL(18,2) DEFAULT 0,
    outstanding_amount DECIMAL(18,2) DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,
    currency_code VARCHAR(10),
    description TEXT,
    salesman_code VARCHAR(30),
    is_cancelled BOOLEAN DEFAULT false,
    raw_data JSONB DEFAULT '{}',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ac_invoices_debtor ON public.ac_invoices (debtor_code);
CREATE INDEX IF NOT EXISTS idx_ac_invoices_date ON public.ac_invoices (doc_date DESC);

CREATE TABLE IF NOT EXISTS public.ac_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_no VARCHAR(50) NOT NULL,
    item_code VARCHAR(30),
    description VARCHAR(500),
    qty DECIMAL(18,4) DEFAULT 0,
    unit_price DECIMAL(18,4) DEFAULT 0,
    amount DECIMAL(18,2) DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,
    uom VARCHAR(20),
    seq INT DEFAULT 0,
    raw_data JSONB DEFAULT '{}',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice_items_doc FOREIGN KEY (doc_no) REFERENCES public.ac_invoices(doc_no) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ac_invoice_items_doc ON public.ac_invoice_items (doc_no);

-- ============================================================
-- 4. AR Official Receipts (payments received)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ac_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_no VARCHAR(50) NOT NULL UNIQUE,
    debtor_code VARCHAR(30),
    debtor_name VARCHAR(200),
    doc_date DATE,
    amount DECIMAL(18,2) DEFAULT 0,
    payment_method VARCHAR(50),
    cheque_no VARCHAR(50),
    bank_account VARCHAR(50),
    currency_code VARCHAR(10),
    description TEXT,
    is_cancelled BOOLEAN DEFAULT false,
    raw_data JSONB DEFAULT '{}',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ac_receipts_debtor ON public.ac_receipts (debtor_code);
CREATE INDEX IF NOT EXISTS idx_ac_receipts_date ON public.ac_receipts (doc_date DESC);

CREATE TABLE IF NOT EXISTS public.ac_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_no VARCHAR(50) NOT NULL,
    invoice_doc_no VARCHAR(50),
    amount DECIMAL(18,2) DEFAULT 0,
    description VARCHAR(500),
    seq INT DEFAULT 0,
    raw_data JSONB DEFAULT '{}',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_receipt_items_doc FOREIGN KEY (doc_no) REFERENCES public.ac_receipts(doc_no) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ac_receipt_items_doc ON public.ac_receipt_items (doc_no);

-- ============================================================
-- 5. Sales Orders
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ac_sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_no VARCHAR(50) NOT NULL UNIQUE,
    debtor_code VARCHAR(30),
    debtor_name VARCHAR(200),
    doc_date DATE,
    delivery_date DATE,
    amount DECIMAL(18,2) DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,
    currency_code VARCHAR(10),
    description TEXT,
    salesman_code VARCHAR(30),
    status VARCHAR(30),
    is_cancelled BOOLEAN DEFAULT false,
    raw_data JSONB DEFAULT '{}',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ac_sales_orders_debtor ON public.ac_sales_orders (debtor_code);
CREATE INDEX IF NOT EXISTS idx_ac_sales_orders_date ON public.ac_sales_orders (doc_date DESC);

CREATE TABLE IF NOT EXISTS public.ac_sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_no VARCHAR(50) NOT NULL,
    item_code VARCHAR(30),
    description VARCHAR(500),
    qty DECIMAL(18,4) DEFAULT 0,
    unit_price DECIMAL(18,4) DEFAULT 0,
    amount DECIMAL(18,2) DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,
    uom VARCHAR(20),
    seq INT DEFAULT 0,
    raw_data JSONB DEFAULT '{}',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_so_items_doc FOREIGN KEY (doc_no) REFERENCES public.ac_sales_orders(doc_no) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ac_so_items_doc ON public.ac_sales_order_items (doc_no);

-- ============================================================
-- 6. Delivery Orders
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ac_delivery_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_no VARCHAR(50) NOT NULL UNIQUE,
    debtor_code VARCHAR(30),
    debtor_name VARCHAR(200),
    doc_date DATE,
    so_doc_no VARCHAR(50),
    amount DECIMAL(18,2) DEFAULT 0,
    currency_code VARCHAR(10),
    description TEXT,
    salesman_code VARCHAR(30),
    is_cancelled BOOLEAN DEFAULT false,
    raw_data JSONB DEFAULT '{}',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ac_do_debtor ON public.ac_delivery_orders (debtor_code);
CREATE INDEX IF NOT EXISTS idx_ac_do_date ON public.ac_delivery_orders (doc_date DESC);

CREATE TABLE IF NOT EXISTS public.ac_delivery_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_no VARCHAR(50) NOT NULL,
    item_code VARCHAR(30),
    description VARCHAR(500),
    qty DECIMAL(18,4) DEFAULT 0,
    unit_price DECIMAL(18,4) DEFAULT 0,
    amount DECIMAL(18,2) DEFAULT 0,
    uom VARCHAR(20),
    seq INT DEFAULT 0,
    raw_data JSONB DEFAULT '{}',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_do_items_doc FOREIGN KEY (doc_no) REFERENCES public.ac_delivery_orders(doc_no) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ac_do_items_doc ON public.ac_delivery_order_items (doc_no);

-- ============================================================
-- 7. Reference Data Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ac_credit_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(200),
    days INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    raw_data JSONB DEFAULT '{}',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.ac_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(200),
    payment_type VARCHAR(50),
    bank_account VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    raw_data JSONB DEFAULT '{}',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.ac_tax_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(200),
    tax_rate DECIMAL(8,4) DEFAULT 0,
    tax_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    raw_data JSONB DEFAULT '{}',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.ac_currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    description VARCHAR(100),
    symbol VARCHAR(5),
    exchange_rate DECIMAL(18,6) DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    raw_data JSONB DEFAULT '{}',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.ac_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acc_no VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(200),
    acc_type VARCHAR(30),
    special_acc_type VARCHAR(30),
    currency_code VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    raw_data JSONB DEFAULT '{}',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.ac_account_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(200),
    raw_data JSONB DEFAULT '{}',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.ac_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    raw_data JSONB DEFAULT '{}',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.ac_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    raw_data JSONB DEFAULT '{}',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 8. RLS: all ac_* tables are service-only
-- ============================================================

ALTER TABLE public.ac_creditors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_delivery_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_credit_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_tax_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_account_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_departments ENABLE ROW LEVEL SECURITY;

-- Read-only access for authenticated users on reference/transactional data
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'ac_creditors', 'ac_invoices', 'ac_invoice_items',
        'ac_receipts', 'ac_receipt_items',
        'ac_sales_orders', 'ac_sales_order_items',
        'ac_delivery_orders', 'ac_delivery_order_items',
        'ac_credit_terms', 'ac_payment_methods', 'ac_tax_codes',
        'ac_currencies', 'ac_accounts', 'ac_account_types',
        'ac_branches', 'ac_departments'
    ] LOOP
        EXECUTE format(
            'CREATE POLICY "Authenticated read %s" ON public.%I FOR SELECT TO authenticated USING (true)',
            tbl, tbl
        );
    END LOOP;
END $$;

-- ============================================================
-- 9. updated_at triggers for tables that have the column
-- ============================================================

CREATE OR REPLACE FUNCTION public.ac_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'ac_creditors', 'ac_invoices', 'ac_receipts',
        'ac_sales_orders', 'ac_delivery_orders'
    ] LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I', tbl, tbl
        );
        EXECUTE format(
            'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.ac_set_updated_at()',
            tbl, tbl
        );
    END LOOP;
END $$;
