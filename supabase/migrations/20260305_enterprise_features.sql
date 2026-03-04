-- ENTERPRISE FEATURES: Audit Logs, Granular Tax, Shift Management

-- 1. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id uuid REFERENCES public.branches(id),
    user_id uuid REFERENCES auth.users(id),
    action_type text NOT NULL, 
    resource_id text,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_branch ON public.audit_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

CREATE OR REPLACE FUNCTION log_audit_event(
    p_action_type text,
    p_resource_id text,
    p_details jsonb,
    p_branch_id uuid DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO audit_logs (branch_id, user_id, action_type, resource_id, details)
    VALUES (p_branch_id, auth.uid(), p_action_type, p_resource_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. SHIFT MANAGEMENT (Z-REPORTS)
CREATE TABLE IF NOT EXISTS public.shift_closings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id uuid REFERENCES public.branches(id),
    opened_by uuid REFERENCES auth.users(id),
    opened_at timestamptz DEFAULT now(),
    opening_cash numeric DEFAULT 0,
    closed_at timestamptz,
    cash_sales numeric DEFAULT 0,
    card_sales numeric DEFAULT 0,
    expected_cash numeric DEFAULT 0,
    actual_cash numeric DEFAULT 0,
    variance numeric DEFAULT 0,
    notes text
);

CREATE INDEX IF NOT EXISTS idx_shifts_open ON public.shift_closings(branch_id) WHERE closed_at IS NULL;

-- RPC: Close Shift
CREATE OR REPLACE FUNCTION close_shift(
    shift_id uuid,
    actual_cash_counted numeric,
    notes text DEFAULT ''
) RETURNS jsonb AS $$
DECLARE
    v_shift record;
    v_cash_sales numeric := 0;
    v_card_sales numeric := 0;
    v_expected numeric := 0;
    v_variance numeric := 0;
BEGIN
    SELECT * INTO v_shift FROM shift_closings WHERE id = shift_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Shift not found';
    END IF;
    
    IF v_shift.closed_at IS NOT NULL THEN
        RAISE EXCEPTION 'Shift is already closed';
    END IF;

    -- Calculate Sales since opened_at
    SELECT 
        COALESCE(SUM(CASE WHEN payment_method = 'CASH' THEN total_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method = 'CARD' THEN total_amount ELSE 0 END), 0)
    INTO v_cash_sales, v_card_sales
    FROM orders 
    WHERE created_at >= v_shift.opened_at 
      AND status = 'COMPLETED';
      -- Ideally filter by user too: AND user_id = auth.uid()

    v_expected := v_shift.opening_cash + v_cash_sales;
    v_variance := actual_cash_counted - v_expected;

    UPDATE shift_closings 
    SET 
        closed_at = now(),
        cash_sales = v_cash_sales,
        card_sales = v_card_sales,
        expected_cash = v_expected,
        actual_cash = actual_cash_counted,
        variance = v_variance,
        notes = close_shift.notes
    WHERE id = shift_id;

    RETURN jsonb_build_object(
        'shift_id', shift_id,
        'closed_at', now(),
        'opening_cash', v_shift.opening_cash,
        'cash_sales', v_cash_sales,
        'card_sales', v_card_sales,
        'expected_cash', v_expected,
        'actual_cash', actual_cash_counted,
        'variance', v_variance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. TAX RULES
CREATE TABLE IF NOT EXISTS public.tax_rules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id uuid REFERENCES public.branches(id),
    name text NOT NULL, 
    rate numeric NOT NULL, 
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Seed Default Tax
INSERT INTO tax_rules (name, rate, is_default)
SELECT 'Standard VAT', 10, true
WHERE NOT EXISTS (SELECT 1 FROM tax_rules);
