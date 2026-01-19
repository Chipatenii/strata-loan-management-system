-- SEED DATA
-- This script assumes you have created users in Supabase Auth.
-- You can run this in the Supabase SQL Editor.

-- 1. Set a user as Admin
-- Replace 'USER_UUID_HERE' with the actual UUID from auth.users
-- insert into public.users (id, email, full_name, role)
-- values ('USER_UUID_HERE', 'admin@strata.com', 'Admin User', 'admin')
-- on conflict (id) do update set role = 'admin';


-- 2. Sample Customer (for local dev, if auth.users entry exists)
-- Replace 'CUSTOMER_UUID_HERE' with a real UUID
/*
insert into public.users (id, email, full_name, role)
values ('CUSTOMER_UUID_HERE', 'customer@strata.com', 'John Doe', 'customer')
on conflict (id) do nothing;

insert into public.kyc_records (user_id, status, risk_score, risk_band)
values ('CUSTOMER_UUID_HERE', 'approved', 85, 'A');

insert into public.loans (user_id, amount, interest_rate, duration_months, status, approved_at, due_date)
values 
('CUSTOMER_UUID_HERE', 5000, 15, 1, 'active', now(), now() + interval '30 days');
*/
