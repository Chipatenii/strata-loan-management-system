-- Migration: Fix Admin RLS and Add Product Policies
-- Created by Gemini 3 Pro

-- 1. Loan Products RLS
alter table public.loan_products enable row level security;

-- Admin: Full Access to their business products
drop policy if exists "Admins can manage business products" on public.loan_products;
create policy "Admins can manage business products" on public.loan_products
  for all using (
    exists (
      select 1 from public.business_memberships bm
      where bm.user_id = auth.uid() 
      and bm.business_id = public.loan_products.business_id
    )
  );

-- Customer: Read Only (Active & Same Business)
drop policy if exists "Customers can read business products" on public.loan_products;
create policy "Customers can read business products" on public.loan_products
  for select using (
    is_active = true 
    and 
    business_id = (select business_id from public.users where id = auth.uid())
  );

-- 2. Loan Product Rates RLS
alter table public.loan_product_rates enable row level security;

-- Admin: Full Access (via Product -> Business)
drop policy if exists "Admins can manage business product rates" on public.loan_product_rates;
create policy "Admins can manage business product rates" on public.loan_product_rates
  for all using (
    exists (
      select 1 from public.loan_products lp
      join public.business_memberships bm on bm.business_id = lp.business_id
      where lp.id = public.loan_product_rates.product_id
      and bm.user_id = auth.uid()
    )
  );

-- Customer: Read Only (via Product -> Business & Active)
drop policy if exists "Customers can read business product rates" on public.loan_product_rates;
create policy "Customers can read business product rates" on public.loan_product_rates
  for select using (
    exists (
      select 1 from public.loan_products lp
      join public.users u on u.business_id = lp.business_id
      where lp.id = public.loan_product_rates.product_id
      and u.id = auth.uid()
      and lp.is_active = true
    )
  );

-- 3. Fix KYC/Loans visibility (Re-asserting Admin policies)
-- Sometimes RLS policies need to be distinct for Select vs Update if logic differs, but here we want broad Select.

-- Ensure KYC Select
drop policy if exists "Admins can read business kyc" on public.kyc_records;
create policy "Admins can read business kyc" on public.kyc_records
  for select using (
    exists (
      select 1 from public.business_memberships bm
      where bm.user_id = auth.uid()
      and bm.business_id = public.kyc_records.business_id
    )
  );

-- Ensure Loans Select
drop policy if exists "Admins can read business loans" on public.loans;
create policy "Admins can read business loans" on public.loans
  for select using (
    exists (
      select 1 from public.business_memberships bm
      where bm.user_id = auth.uid()
      and bm.business_id = public.loans.business_id
    )
  );

-- Ensure Users Select (for Customer List)
drop policy if exists "Admins can read business profiles" on public.users;
create policy "Admins can read business profiles" on public.users
  for select using (
    exists (
      select 1 from public.business_memberships bm
      where bm.user_id = auth.uid()
      and bm.business_id = public.users.business_id
    )
  );
