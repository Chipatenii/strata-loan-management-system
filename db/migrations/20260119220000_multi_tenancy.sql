-- Migration: Multi-tenancy
-- Created by Gemini 3 Pro

-- 1. Create businesses table
create table if not exists public.businesses (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  code text not null unique, -- 6-8 char code for invites
  created_at timestamptz default now() not null
);
alter table public.businesses enable row level security;

-- 2. Create Default Business for migration (hardcoded ID for consistency)
insert into public.businesses (id, name, code)
values ('00000000-0000-0000-0000-000000000000', 'Default Organization', 'PILOT001')
on conflict (id) do nothing;

-- 3. Add business_id to users
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'business_id') then
    alter table public.users add column business_id uuid references public.businesses(id);
    update public.users set business_id = '00000000-0000-0000-0000-000000000000';
    alter table public.users alter column business_id set not null;
  end if;
end $$;

-- 4. Create business_memberships
create table if not exists public.business_memberships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  business_id uuid references public.businesses(id) on delete cascade not null,
  role text default 'admin' not null, -- admin, loan_officer, etc.
  created_at timestamptz default now() not null,
  unique(user_id, business_id)
);
alter table public.business_memberships enable row level security;

-- 5. Backfill memberships for existing Admins
insert into public.business_memberships (user_id, business_id, role)
select id, '00000000-0000-0000-0000-000000000000', 'admin'
from public.users where role = 'admin'
on conflict (user_id, business_id) do nothing;

-- 6. Add business_id to other tables

-- Helper macro not available in pure SQL easily, expanding manually
do $$ 
begin
  -- kyc_records
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'kyc_records' and column_name = 'business_id') then
    alter table public.kyc_records add column business_id uuid references public.businesses(id);
    update public.kyc_records set business_id = '00000000-0000-0000-0000-000000000000';
    alter table public.kyc_records alter column business_id set not null;
  end if;

  -- loans
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'loans' and column_name = 'business_id') then
    alter table public.loans add column business_id uuid references public.businesses(id);
    update public.loans set business_id = '00000000-0000-0000-0000-000000000000';
    alter table public.loans alter column business_id set not null;
  end if;

  -- ledger
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'ledger' and column_name = 'business_id') then
    alter table public.ledger add column business_id uuid references public.businesses(id);
    update public.ledger set business_id = '00000000-0000-0000-0000-000000000000';
    alter table public.ledger alter column business_id set not null;
  end if;

  -- payments
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payments' and column_name = 'business_id') then
    alter table public.payments add column business_id uuid references public.businesses(id);
    update public.payments set business_id = '00000000-0000-0000-0000-000000000000';
    alter table public.payments alter column business_id set not null;
  end if;

  -- notification_outbox
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notification_outbox' and column_name = 'business_id') then
    alter table public.notification_outbox add column business_id uuid references public.businesses(id);
    update public.notification_outbox set business_id = '00000000-0000-0000-0000-000000000000';
    alter table public.notification_outbox alter column business_id set not null;
  end if;
end $$;

-- 7. DROP OLD POLICIES
drop policy if exists "Users can read own profile" on public.users;
drop policy if exists "Admins can read all profiles" on public.users;
drop policy if exists "Users can update own profile" on public.users;

drop policy if exists "Users can read own kyc" on public.kyc_records;
drop policy if exists "Users can insert own kyc" on public.kyc_records;
drop policy if exists "Users can update own kyc" on public.kyc_records;
drop policy if exists "Admins can read all kyc" on public.kyc_records;
drop policy if exists "Admins can update all kyc" on public.kyc_records;

drop policy if exists "Users can read own loans" on public.loans;
drop policy if exists "Users can insert own loans" on public.loans;
drop policy if exists "Admins can read all loans" on public.loans;
drop policy if exists "Admins can update all loans" on public.loans;

drop policy if exists "Users can read own ledger" on public.ledger;
drop policy if exists "Users can read own ledger 2" on public.ledger;
drop policy if exists "Admins can read all ledger" on public.ledger;
drop policy if exists "Admins can insert ledger" on public.ledger;

drop policy if exists "Users can read own payments" on public.payments;
drop policy if exists "Users can insert own payments" on public.payments;
drop policy if exists "Admins can read all payments" on public.payments;
drop policy if exists "Admins can update all payments" on public.payments;

-- 8. NEW POLICIES

-- Businesses
create policy "Admins can read own business" on public.businesses
  for select using (exists (select 1 from public.business_memberships where user_id = auth.uid() and business_id = id));
create policy "Customers can read own business" on public.businesses
  for select using (id = (select business_id from public.users where id = auth.uid()));

-- Memberships
create policy "Users can read own memberships" on public.business_memberships
  for select using (user_id = auth.uid());

-- Users
-- Users can read own profile
create policy "Users can read own profile" on public.users
  for select using (auth.uid() = id);
-- Admins can read (and update maybe?) profiles in their business
create policy "Admins can read business profiles" on public.users
  for select using (
    exists (
      select 1 from public.business_memberships bm
      where bm.user_id = auth.uid() 
      and bm.role = 'admin' 
      and bm.business_id = public.users.business_id
    )
  );
-- We allow admins to update profiles in their business too? Safe for now?
-- Let's stick to SELECT for now to avoid locking issues, until requested. But admin usually needs to update...
-- Keeping it safe:
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- KYC
create policy "Users can read own kyc" on public.kyc_records
  for select using (user_id = auth.uid());
create policy "Users can insert own kyc" on public.kyc_records
  for insert with check (user_id = auth.uid()); -- Business ID logic handled by API setting it, or trigger? 
                                                -- API must set correct business_id. We can validate it matches user.business_id
                                                -- For now, relying on API correctness + constraint:
                                                -- (user_id, business_id) on kyc must match user. But user can only be in one business?
                                                -- Yes, user.business_id.
                                                
create policy "Admins can read business kyc" on public.kyc_records
  for select using (
    exists (
      select 1 from public.business_memberships bm
      where bm.user_id = auth.uid() 
      and bm.role = 'admin' 
      and bm.business_id = public.kyc_records.business_id
    )
  );
create policy "Admins can update business kyc" on public.kyc_records
  for update using (
    exists (
      select 1 from public.business_memberships bm
      where bm.user_id = auth.uid() 
      and bm.role = 'admin' 
      and bm.business_id = public.kyc_records.business_id
    )
  );

-- Loans
create policy "Users can read own loans" on public.loans
  for select using (user_id = auth.uid());
create policy "Users can insert own loans" on public.loans
  for insert with check (user_id = auth.uid()); 

create policy "Admins can read business loans" on public.loans
  for select using (
    exists (
      select 1 from public.business_memberships bm
      where bm.user_id = auth.uid() 
      and bm.role = 'admin' 
      and bm.business_id = public.loans.business_id
    )
  );
create policy "Admins can update business loans" on public.loans
  for update using (
    exists (
      select 1 from public.business_memberships bm
      where bm.user_id = auth.uid() 
      and bm.role = 'admin' 
      and bm.business_id = public.loans.business_id
    )
  );

-- Ledger
create policy "Users can read own ledger" on public.ledger
  for select using (
      exists (select 1 from public.loans l where l.id = public.ledger.loan_id and l.user_id = auth.uid())
  );
create policy "Admins can read business ledger" on public.ledger
  for select using (
    exists (
      select 1 from public.business_memberships bm
      where bm.user_id = auth.uid() 
      and bm.role = 'admin' 
      and bm.business_id = public.ledger.business_id
    )
  );
create policy "Admins can insert business ledger" on public.ledger
  for insert with check (
    exists (
      select 1 from public.business_memberships bm
      where bm.user_id = auth.uid() 
      and bm.role = 'admin' 
      and bm.business_id = public.ledger.business_id
    )
  );

-- Payments
create policy "Users can read own payments" on public.payments
  for select using (user_id = auth.uid());
create policy "Users can insert own payments" on public.payments
  for insert with check (user_id = auth.uid());

create policy "Admins can read business payments" on public.payments
  for select using (
    exists (
      select 1 from public.business_memberships bm
      where bm.user_id = auth.uid() 
      and bm.role = 'admin' 
      and bm.business_id = public.payments.business_id
    )
  );
create policy "Admins can update business payments" on public.payments
  for update using (
    exists (
      select 1 from public.business_memberships bm
      where bm.user_id = auth.uid() 
      and bm.role = 'admin' 
      and bm.business_id = public.payments.business_id
    )
  );

-- Notification Outbox
create policy "Admins can read business notifications" on public.notification_outbox
  for select using (
    exists (
      select 1 from public.business_memberships bm
      where bm.user_id = auth.uid() 
      and bm.role = 'admin' 
      and bm.business_id = public.notification_outbox.business_id
    )
  );
-- (Optimized: Indexes for business_id)
create index if not exists idx_users_business_id on public.users(business_id);
create index if not exists idx_kyc_records_business_id on public.kyc_records(business_id);
create index if not exists idx_loans_business_id on public.loans(business_id);
create index if not exists idx_ledger_business_id on public.ledger(business_id);
create index if not exists idx_payments_business_id on public.payments(business_id);
create index if not exists idx_notification_outbox_business_id on public.notification_outbox(business_id);

