-- Migration: Fix security and schema issues
-- 1. Add missing uploaded_by column to loan_collateral
-- 2. Enable admin authorization check in reconcile_payment RPC
-- 3. Restrict business creation to service role

-- 1. Add uploaded_by column to loan_collateral
DO $$
BEGIN
    ALTER TABLE public.loan_collateral ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES public.users(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 2. Recreate reconcile_payment RPC with authorization check enabled
CREATE OR REPLACE FUNCTION reconcile_payment(
  p_payment_id uuid,
  p_admin_id uuid,
  p_reject boolean default false,
  p_reason text default null
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_loan_id uuid;
  v_amount decimal;
  v_current_balance decimal;
  v_new_balance decimal;
  v_payment_status payment_status;
  v_business_id uuid;
  v_admin_role text;
BEGIN
  -- 1. Lock Payment Row
  SELECT loan_id, amount, status, business_id INTO v_loan_id, v_amount, v_payment_status, v_business_id
  FROM payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Payment not found');
  END IF;

  IF v_payment_status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Payment already processed');
  END IF;

  -- Verify Admin Membership (DB-level security)
  SELECT role INTO v_admin_role FROM business_memberships WHERE user_id = p_admin_id AND business_id = v_business_id;
  IF v_admin_role IS NULL OR v_admin_role NOT IN ('admin', 'owner') THEN
     RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF p_reject THEN
    UPDATE payments SET
      status = 'rejected',
      rejection_reason = p_reason,
      reviewed_by = p_admin_id,
      reviewed_at = now()
    WHERE id = p_payment_id;
    RETURN json_build_object('success', true, 'status', 'rejected');
  END IF;

  -- 2. Lock Loan (to serialize ledger access for this loan)
  PERFORM 1 FROM loans WHERE id = v_loan_id FOR UPDATE;

  -- 3. Get Current Balance (Latest Ledger)
  SELECT balance_after INTO v_current_balance
  FROM ledger
  WHERE loan_id = v_loan_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_current_balance IS NULL THEN
    SELECT amount INTO v_current_balance FROM loans WHERE id = v_loan_id;
  END IF;

  v_new_balance := v_current_balance - v_amount;

  -- 4. Insert Ledger
  INSERT INTO ledger (
    loan_id, business_id, type, amount, balance_after, description, reference_id
  ) VALUES (
    v_loan_id, v_business_id, 'payment_received', v_amount, v_new_balance, 'Payment Reconciled', p_payment_id
  );

  -- 5. Update Payment
  UPDATE payments SET
    status = 'approved',
    reviewed_by = p_admin_id,
    reviewed_at = now()
  WHERE id = p_payment_id;

  RETURN json_build_object('success', true, 'new_balance', v_new_balance);
EXCEPTION WHEN others THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 3. Restrict business creation - drop overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create businesses" ON public.businesses;

-- 4. Fix storage policies - scope admin access by business membership
DROP POLICY IF EXISTS "Admins can read all kyc-docs" ON storage.objects;
CREATE POLICY "Admins can read all kyc-docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'kyc-docs'
    AND EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.user_id = auth.uid()
      AND bm.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Admins can read all collateral" ON storage.objects;
CREATE POLICY "Admins can read all collateral" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'collateral'
    AND EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.user_id = auth.uid()
      AND bm.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Admins can read all payment-proofs" ON storage.objects;
CREATE POLICY "Admins can read all payment-proofs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.user_id = auth.uid()
      AND bm.role IN ('admin', 'owner')
    )
  );
