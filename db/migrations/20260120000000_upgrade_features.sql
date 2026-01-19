-- Migration: Upgrade Features (Loan Products, Rates, Payment Config)
-- Created by Gemini 3 Pro

-- 1. Add payment_config to businesses
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'businesses' and column_name = 'payment_config') then
    alter table public.businesses add column payment_config jsonb default '{}'::jsonb;
  end if;
end $$;

-- 2. Create loan_products table
create table if not exists public.loan_products (
  id uuid default gen_random_uuid() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  name text not null,
  description text,
  min_amount decimal(12, 2),
  max_amount decimal(12, 2),
  requires_collateral boolean default false not null,
  requires_kyc boolean default true not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table public.loan_products enable row level security;

-- 3. Create loan_product_rates table
create table if not exists public.loan_product_rates (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.loan_products(id) on delete cascade not null,
  duration_unit text not null check (duration_unit in ('month', 'week')),
  duration_value integer not null check (duration_value > 0),
  interest_rate decimal(5, 2) not null, -- Period rate (e.g., 15% per month)
  created_at timestamptz default now() not null
);
alter table public.loan_product_rates enable row level security;

-- 4. Add product_id to loans
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'loans' and column_name = 'product_id') then
    alter table public.loans add column product_id uuid references public.loan_products(id);
    alter table public.loans add column applied_rate decimal(5, 2); -- Snapshot rate
  end if;
end $$;

-- 5. RLS Policies

-- Loan Products
create policy "Admins can manage own products" on public.loan_products
  for all using (
    exists (
      select 1 from public.business_memberships bm
      where bm.user_id = auth.uid() 
      and bm.role = 'admin' 
      and bm.business_id = public.loan_products.business_id
    )
  );

create policy "Customers can view active products" on public.loan_products
  for select using (
    is_active = true and
    business_id = (select business_id from public.users where id = auth.uid())
  );

-- Loan Product Rates
create policy "Admins can manage own rates" on public.loan_product_rates
  for all using (
    exists (
      select 1 from public.loan_products lp
      join public.business_memberships bm on lp.business_id = bm.business_id
      where lp.id = public.loan_product_rates.product_id
      and bm.user_id = auth.uid()
      and bm.role = 'admin'
    )
  );

create policy "Customers can view rates" on public.loan_product_rates
  for select using (
    exists (
      select 1 from public.loan_products lp
      where lp.id = public.loan_product_rates.product_id
      and lp.is_active = true
      and lp.business_id = (select business_id from public.users where id = auth.uid())
    )
  );

-- 6. Indexes
create index if not exists idx_loan_products_business_id on public.loan_products(business_id);
create index if not exists idx_loan_product_rates_product_id on public.loan_product_rates(product_id);
create index if not exists idx_loans_product_id on public.loans(product_id);
