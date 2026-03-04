-- Canonicalize synchronous balance RPC functions that were previously maintained manually.
-- This migration keeps backward compatibility across older balance_updates/company schemas.

-- Ensure companies has credit_used for billing math used by app services.
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS credit_used DECIMAL(10,2) DEFAULT 0;

UPDATE public.companies
SET credit_used = COALESCE(credit_used, current_credit, 0)
WHERE credit_used IS NULL;

-- Ensure balance_updates has the columns required by synchronous balance services.
ALTER TABLE public.balance_updates
ADD COLUMN IF NOT EXISTS previous_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_changed DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS change_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_id UUID,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS update_type VARCHAR(50) DEFAULT 'balance_change',
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Backfill interoperability fields for legacy rows.
UPDATE public.balance_updates
SET
  amount_changed = CASE
    WHEN amount_changed IS NULL THEN COALESCE(amount, 0)
    WHEN amount_changed = 0 AND COALESCE(amount, 0) <> 0 THEN amount
    ELSE amount_changed
  END,
  change_type = COALESCE(
    change_type,
    CASE update_type
      WHEN 'payment_received' THEN 'payment_applied'
      WHEN 'payment_allocated' THEN 'payment_applied'
      WHEN 'credit_adjustment' THEN 'adjustment'
      WHEN 'invoice_created' THEN 'order_charge'
      ELSE 'adjustment'
    END
  ),
  previous_balance = CASE
    WHEN previous_balance IS NULL THEN COALESCE(new_balance, 0) - COALESCE(NULLIF(amount_changed, 0), amount, 0)
    WHEN previous_balance = 0 AND (COALESCE(new_balance, 0) <> 0 OR COALESCE(amount, 0) <> 0)
      THEN COALESCE(new_balance, 0) - COALESCE(NULLIF(amount_changed, 0), amount, 0)
    ELSE previous_balance
  END,
  amount = CASE
    WHEN amount IS NULL THEN COALESCE(amount_changed, 0)
    WHEN amount = 0 AND COALESCE(amount_changed, 0) <> 0 THEN amount_changed
    ELSE amount
  END,
  update_type = COALESCE(update_type, 'balance_change'),
  created_at = COALESCE(created_at, timestamp, CURRENT_TIMESTAMP),
  updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP),
  timestamp = COALESCE(timestamp, created_at, CURRENT_TIMESTAMP)
WHERE
  amount_changed IS NULL
  OR (amount_changed = 0 AND COALESCE(amount, 0) <> 0)
  OR change_type IS NULL
  OR previous_balance IS NULL
  OR (previous_balance = 0 AND (COALESCE(new_balance, 0) <> 0 OR COALESCE(amount, 0) <> 0))
  OR amount IS NULL
  OR (amount = 0 AND COALESCE(amount_changed, 0) <> 0)
  OR update_type IS NULL
  OR created_at IS NULL
  OR updated_at IS NULL
  OR timestamp IS NULL;

-- Atomic balance mutation with row-level lock and permission checks.
CREATE OR REPLACE FUNCTION public.update_company_balance_atomic(
  p_company_id UUID,
  p_amount_change DECIMAL(10,2),
  p_transaction_type TEXT,
  p_description TEXT DEFAULT '',
  p_order_id UUID DEFAULT NULL,
  p_payment_id UUID DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_actor_id UUID;
  v_credit_limit DECIMAL(10,2);
  v_credit_used DECIMAL(10,2);
  v_current_available DECIMAL(10,2);
  v_new_available DECIMAL(10,2);
  v_new_credit_used DECIMAL(10,2);
  v_transaction_id UUID;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_transaction_type NOT IN (
    'credit_increase',
    'credit_decrease',
    'payment_applied',
    'order_charge',
    'adjustment',
    'refund'
  ) THEN
    RAISE EXCEPTION 'Invalid transaction type: %', p_transaction_type;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = v_actor_id
      AND (u.company_id = p_company_id OR u.role IN ('admin', 'superadmin'))
  ) THEN
    RAISE EXCEPTION 'Permission denied for company: %', p_company_id;
  END IF;

  SELECT
    COALESCE(c.credit_limit, 0),
    COALESCE(c.credit_used, c.current_credit, 0)
  INTO
    v_credit_limit,
    v_credit_used
  FROM public.companies c
  WHERE c.id = p_company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Company not found: %', p_company_id;
  END IF;

  v_current_available := v_credit_limit - v_credit_used;
  v_new_available := v_current_available + p_amount_change;
  v_new_credit_used := v_credit_limit - v_new_available;

  UPDATE public.companies
  SET
    credit_used = v_new_credit_used,
    current_credit = v_new_credit_used,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_company_id;

  INSERT INTO public.balance_updates (
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
    v_current_available,
    v_new_available,
    p_amount_change,
    p_transaction_type,
    p_description,
    p_order_id,
    p_payment_id,
    COALESCE(p_created_by, v_actor_id),
    'balance_change',
    p_amount_change,
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'transaction', json_build_object(
      'id', v_transaction_id,
      'company_id', p_company_id,
      'previous_balance', v_current_available,
      'new_balance', v_new_available,
      'amount_changed', p_amount_change,
      'transaction_type', p_transaction_type,
      'description', p_description,
      'order_id', p_order_id,
      'payment_id', p_payment_id,
      'created_by', COALESCE(p_created_by, v_actor_id),
      'created_at', CURRENT_TIMESTAMP
    ),
    'new_balance', v_new_available,
    'credit_limit', v_credit_limit,
    'credit_used', v_new_credit_used,
    'credit_utilization', CASE
      WHEN v_credit_limit > 0 THEN (v_new_credit_used / v_credit_limit) * 100
      ELSE 0
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Summary RPC for billing dashboards.
CREATE OR REPLACE FUNCTION public.get_company_balance_summary(
  p_company_id UUID
) RETURNS JSON AS $$
DECLARE
  v_actor_id UUID;
  v_company_name TEXT;
  v_credit_limit DECIMAL(10,2);
  v_credit_used DECIMAL(10,2);
  v_available_credit DECIMAL(10,2);
  v_recent_updates JSON;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = v_actor_id
      AND (u.company_id = p_company_id OR u.role IN ('admin', 'superadmin'))
  ) THEN
    RAISE EXCEPTION 'Permission denied for company: %', p_company_id;
  END IF;

  SELECT
    c.company_name,
    COALESCE(c.credit_limit, 0),
    COALESCE(c.credit_used, c.current_credit, 0)
  INTO
    v_company_name,
    v_credit_limit,
    v_credit_used
  FROM public.companies c
  WHERE c.id = p_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Company not found: %', p_company_id;
  END IF;

  v_available_credit := v_credit_limit - v_credit_used;

  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', b.id,
        'amount_changed', b.amount_changed,
        'change_type', b.change_type,
        'description', b.description,
        'created_at', b.created_at
      )
      ORDER BY b.created_at DESC
    ),
    '[]'::json
  )
  INTO v_recent_updates
  FROM (
    SELECT id, amount_changed, change_type, description, created_at
    FROM public.balance_updates
    WHERE company_id = p_company_id
    ORDER BY created_at DESC
    LIMIT 10
  ) b;

  RETURN json_build_object(
    'company_id', p_company_id,
    'company_name', v_company_name,
    'credit_limit', v_credit_limit,
    'credit_used', v_credit_used,
    'available_credit', v_available_credit,
    'credit_utilization', CASE
      WHEN v_credit_limit > 0 THEN (v_credit_used / v_credit_limit) * 100
      ELSE 0
    END,
    'status', CASE
      WHEN v_available_credit < 0 THEN 'overlimit'
      WHEN v_credit_limit > 0 AND (v_credit_used / v_credit_limit) >= 0.9 THEN 'critical'
      WHEN v_credit_limit > 0 AND (v_credit_used / v_credit_limit) >= 0.75 THEN 'warning'
      ELSE 'good_standing'
    END,
    'recent_updates', v_recent_updates,
    'last_updated', CURRENT_TIMESTAMP
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Locked read RPC used by synchronous balance client to avoid stale writes.
CREATE OR REPLACE FUNCTION public.get_company_balance_locked(
  p_company_id UUID
) RETURNS JSON AS $$
DECLARE
  v_actor_id UUID;
  v_credit_limit DECIMAL(10,2);
  v_credit_used DECIMAL(10,2);
  v_available_credit DECIMAL(10,2);
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = v_actor_id
      AND (u.company_id = p_company_id OR u.role IN ('admin', 'superadmin'))
  ) THEN
    RAISE EXCEPTION 'Permission denied for company: %', p_company_id;
  END IF;

  SELECT
    COALESCE(c.credit_limit, 0),
    COALESCE(c.credit_used, c.current_credit, 0)
  INTO
    v_credit_limit,
    v_credit_used
  FROM public.companies c
  WHERE c.id = p_company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Company not found: %', p_company_id;
  END IF;

  v_available_credit := v_credit_limit - v_credit_used;

  RETURN json_build_object(
    'balance', v_available_credit,
    'credit_limit', v_credit_limit,
    'credit_used', v_credit_used
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.update_company_balance_atomic(UUID, DECIMAL, TEXT, TEXT, UUID, UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_company_balance_summary(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_company_balance_locked(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.update_company_balance_atomic(UUID, DECIMAL, TEXT, TEXT, UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_balance_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_balance_locked(UUID) TO authenticated;
