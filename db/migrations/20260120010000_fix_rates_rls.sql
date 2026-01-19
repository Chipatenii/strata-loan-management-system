-- Fix: Allow Authenticated Users (Customers) to select rates for active products of their business

-- Drop existing policy if it's too restrictive or causing issues logic-wise
drop policy if exists "Customers can view rates" on public.loan_product_rates;

-- Re-create policy with simplified logic to ensuring readability
-- Logic: Allow SELECT if:
-- 1. The user is authenticated.
-- 2. The rate belongs to a product that is ACTIVE.
-- 3. The product belongs to the SAME business as the user.

create policy "Customers can view rates" on public.loan_product_rates
  for select using (
    exists (
      select 1 from public.loan_products lp
      join public.users u on u.business_id = lp.business_id
      where lp.id = public.loan_product_rates.product_id
      and lp.is_active = true
      and u.id = auth.uid()
    )
  );
