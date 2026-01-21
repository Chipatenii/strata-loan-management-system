-- Migration: Business RLS Updates
-- Adds UPDATE policy for businesses table and ensures proper access control

-- Business UPDATE policy (owner/admin only)
DROP POLICY IF EXISTS "Admins can update own business" ON public.businesses;
CREATE POLICY "Admins can update own business" ON public.businesses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.user_id = auth.uid()
      AND bm.business_id = id
      AND bm.role IN ('admin', 'owner')
    )
  );

-- Ensure business_memberships has role enforcement
-- Add constraint to validate role values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'business_memberships_role_check'
  ) THEN
    ALTER TABLE public.business_memberships 
    ADD CONSTRAINT business_memberships_role_check 
    CHECK (role IN ('owner', 'admin', 'loan_officer', 'finance_officer'));
  END IF;
END $$;
