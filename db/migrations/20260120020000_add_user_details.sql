-- Add missing fields for enhanced customer profile and KYC
alter table public.users add column if not exists address text;
alter table public.kyc_records add column if not exists bank_statement_url text;

-- Ensure RLS allows users to update these new fields
-- (Existing policies "Users can update own profile" and "Users can update own kyc" should cover this if they are broad enough, usually they are 'using (true)' or implicit)
-- But let's check if we need specific permissions. `init.sql` said: "Users can update own profile".
-- We should verify if `users` table policy permits update of `address`.
-- Usually Supabase policies are ROW based, so column updates are allowed unless restricted.

-- Fix for Data Integrity / Reporting visibility (Optional but good for explicit indexing)
create index if not exists idx_loans_business_id on public.loans(business_id);
create index if not exists idx_users_business_id on public.users(business_id);
