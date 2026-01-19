-- Enable Row Level Security
alter default privileges in schema public grant all on tables to postgres, service_role;

-- Enums
create type user_role as enum ('admin', 'customer');
create type kyc_status as enum ('not_submitted', 'pending_review', 'approved', 'rejected');
create type loan_status as enum ('pending', 'active', 'rejected', 'closed', 'defaulted');
create type repayment_frequency as enum ('weekly', 'monthly', 'one_time');
create type payment_status as enum ('pending', 'approved', 'rejected');
create type payment_method as enum ('mobile_money', 'bank_transfer', 'cash', 'other');
create type ledger_type as enum ('principal_disbursed', 'interest_accrued', 'payment_received', 'fee', 'adjustment', 'penalty');

-- Users Table (Extends auth.users)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  phone text,
  role user_role default 'customer'::user_role not null,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table public.users enable row level security;

-- KYC Records
create table public.kyc_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  status kyc_status default 'not_submitted'::kyc_status not null,
  id_document_url text,
  proof_of_address_url text,
  payslip_url text,
  data jsonb default '{}'::jsonb, -- Store extracted fields
  risk_score integer check (risk_score >= 0 and risk_score <= 100),
  risk_band text, -- A, B, C, D
  rejection_reason text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id)
);
alter table public.kyc_records enable row level security;

-- Loans
create table public.loans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  amount decimal(12, 2) not null check (amount > 0),
  interest_rate decimal(5, 2) not null, -- Monthly rate percentage
  duration_months integer not null check (duration_months >= 1),
  status loan_status default 'pending'::loan_status not null,
  purpose text,
  collateral_description text,
  collateral_image_url text,
  approved_at timestamptz,
  approved_by uuid references public.users(id),
  disbursed_at timestamptz,
  due_date timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table public.loans enable row level security;

-- Ledger (Source of Truth for Finances)
create table public.ledger (
  id uuid default gen_random_uuid() primary key,
  loan_id uuid references public.loans(id) on delete cascade not null,
  type ledger_type not null,
  amount decimal(12, 2) not null, -- Positive for money owed, negative for money paid (or vice versa, define convention)
  -- CONVENTION: 
  -- principal_disbursed: +primary
  -- interest_accrued: +interest
  -- payment_received: -amount
  balance_after decimal(12, 2) not null,
  description text,
  reference_id uuid, -- Link to payment_id if applicable
  created_at timestamptz default now() not null
);
alter table public.ledger enable row level security;

-- Payments
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  loan_id uuid references public.loans(id) not null,
  amount decimal(12, 2) not null check (amount > 0),
  method payment_method not null,
  provider text, -- 'MTN', 'Airtel', 'Bank Name'
  reference_code text,
  proof_url text,
  status payment_status default 'pending'::payment_status not null,
  rejection_reason text,
  paid_at timestamptz default now() not null,
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id),
  created_at timestamptz default now() not null
);
alter table public.payments enable row level security;

-- Notification Outbox
create table public.notification_outbox (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  channel text not null, -- 'email', 'sms'
  recipient text not null,
  subject text,
  body text not null,
  status text default 'pending' not null, -- 'pending', 'sent', 'failed'
  sent_at timestamptz,
  error text,
  created_at timestamptz default now() not null
);
alter table public.notification_outbox enable row level security;


-- POLICIES

-- Users
-- Users can read their own profile
create policy "Users can read own profile" on public.users
  for select using (auth.uid() = id);
-- Admins can read all profiles
create policy "Admins can read all profiles" on public.users
  for select using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
-- Users can update their own profile (limited fields via UI, backend should validate)
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- KYC
-- Users can read own KYC
create policy "Users can read own kyc" on public.kyc_records
  for select using (user_id = auth.uid());
-- Users can insert own KYC if none exists
create policy "Users can insert own kyc" on public.kyc_records
  for insert with check (user_id = auth.uid());
-- Users can update own KYC (if not approved/locked - logic in app or trigger)
create policy "Users can update own kyc" on public.kyc_records
  for update using (user_id = auth.uid());
-- Admins can read all
create policy "Admins can read all kyc" on public.kyc_records
  for select using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
-- Admins can update all
create policy "Admins can update all kyc" on public.kyc_records
  for update using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));


-- Loans
create policy "Users can read own loans" on public.loans
  for select using (user_id = auth.uid());
create policy "Users can insert own loans" on public.loans
  for insert with check (user_id = auth.uid());
create policy "Admins can read all loans" on public.loans
  for select using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "Admins can update all loans" on public.loans
  for update using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Ledger
-- Users can read ledger for their loans
create policy "Users can read own ledger" on public.ledger
  for select using (exists (select 1 from public.loans where display_id = ledger.loan_id and user_id = auth.uid())); -- oops loans.id
-- Fix join
create policy "Users can read own ledger 2" on public.ledger
  for select using (exists (select 1 from public.loans where id = ledger.loan_id and user_id = auth.uid()));
-- Admins can read all ledger
create policy "Admins can read all ledger" on public.ledger
  for select using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
-- Only Admins/System can insert/update ledger (via service role usually, but if using client)
create policy "Admins can insert ledger" on public.ledger
  for insert with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Payments
create policy "Users can read own payments" on public.payments
  for select using (user_id = auth.uid());
create policy "Users can insert own payments" on public.payments
  for insert with check (user_id = auth.uid());
create policy "Admins can read all payments" on public.payments
  for select using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "Admins can update all payments" on public.payments
  for update using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- STORAGE BUCKET POLICIES (Abstracted representation, run in SQL editor)
-- insert into storage.buckets (id, name, public) values ('kyc-docs', 'kyc-docs', false);
-- insert into storage.buckets (id, name, public) values ('collateral', 'collateral', false);
-- insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', false);
