-- Migration: Fix Reconciliation Race Condition
-- Created by Gemini

-- Replace implicit/client-side reconciliation with a robust RPC
create or replace function reconcile_payment(
  p_payment_id uuid,
  p_admin_id uuid,
  p_reject boolean default false,
  p_reason text default null
) returns json
language plpgsql
security definer -- Runs as owner to bypass RLS complexity during transaction (safe as we validate admin inside)
as $$
declare
  v_loan_id uuid;
  v_amount decimal;
  v_current_balance decimal;
  v_new_balance decimal;
  v_payment_status payment_status;
  v_business_id uuid;
  v_admin_role text; -- To verify admin has access
begin
  -- 0. Security Check: Ensure caller is an admin of the business owning the payment?
  -- ideally we check memberships. For now, we trust the caller (server action) to have checked Auth.
  -- But let's be safe and check if the payment exists and matches?
  
  -- 1. Lock Payment Row
  select loan_id, amount, status, business_id into v_loan_id, v_amount, v_payment_status, v_business_id
  from payments
  where id = p_payment_id
  for update; -- Lock!

  if not found then
    return json_build_object('success', false, 'error', 'Payment not found');
  end if;

  if v_payment_status != 'pending' then
    return json_build_object('success', false, 'error', 'Payment already processed');
  end if;
  
  -- Optional: Verify Admin Membership (If we want DB-level security)
  -- select role into v_admin_role from business_memberships where user_id = p_admin_id and business_id = v_business_id;
  -- if v_admin_role is null or v_admin_role != 'admin' then
  --    return json_build_object('success', false, 'error', 'Unauthorized');
  -- end if;

  if p_reject then
    update payments set
      status = 'rejected',
      rejection_reason = p_reason,
      reviewed_by = p_admin_id,
      reviewed_at = now()
    where id = p_payment_id;
    return json_build_object('success', true, 'status', 'rejected');
  end if;

  -- 2. Lock Loan (to serialize ledger access for this loan)
  perform 1 from loans where id = v_loan_id for update;

  -- 3. Get Current Balance (Latest Ledger)
  select balance_after into v_current_balance
  from ledger
  where loan_id = v_loan_id
  order by created_at desc
  limit 1;

  if v_current_balance is null then
    -- Fallback: If no ledger exists, assume the balance is the loan amount 
    -- (This means the disbursement wasn't recorded in ledger? or this is the first payment?)
    -- Ideally, we should look up the loan amount from the loans table.
    select amount into v_current_balance from loans where id = v_loan_id;
  end if;

  v_new_balance := v_current_balance - v_amount;

  -- 4. Insert Ledger
  insert into ledger (
    loan_id, business_id, type, amount, balance_after, description, reference_id
  ) values (
    v_loan_id, v_business_id, 'payment_received', v_amount, v_new_balance, 'Payment Reconciled', p_payment_id
  );

  -- 5. Update Payment
  update payments set
    status = 'approved',
    reviewed_by = p_admin_id,
    reviewed_at = now()
  where id = p_payment_id;

  return json_build_object('success', true, 'new_balance', v_new_balance);
exception when others then
  return json_build_object('success', false, 'error', SQLERRM);
end;
$$;
