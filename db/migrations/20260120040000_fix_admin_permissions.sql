-- Migration: Fix Admin Permissions and Memberships
-- Created by Gemini 3 Pro
-- Date: 2026-01-20T10:45:00

-- 1. Backfill missing Business Memberships for Admins
-- This ensures that any user marked as 'admin' in the users table 
-- has the corresponding RLS permission row in business_memberships.
DO $$
BEGIN
  INSERT INTO public.business_memberships (user_id, business_id, role)
  SELECT id, business_id, 'admin'
  FROM public.users
  WHERE role = 'admin'
  AND business_id IS NOT NULL
  ON CONFLICT (user_id, business_id) DO NOTHING;
END $$;

-- 2. Create helper is_admin() function for simplified checks (requested by user)
-- Uses business_memberships instead of non-existent user_roles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_memberships bm
    WHERE bm.user_id = auth.uid()
      AND bm.role IN ('admin', 'loan_officer', 'finance_officer', 'auditor')
  );
$$;

-- 3. Ensure Status Consistency (Optional)
-- If there are loans with 'pending' status but we want 'pending' to be visible,
-- code change handles it.
-- If we wanted to migrate data to 'submitted', we could:
-- UPDATE public.loans SET status = 'submitted' WHERE status = 'pending';
-- But we will respect legacy 'pending' for now.

