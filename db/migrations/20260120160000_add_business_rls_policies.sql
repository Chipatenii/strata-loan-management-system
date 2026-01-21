-- Migration: Add Missing RLS Policies for Businesses Table
-- Created: 2026-01-20

-- The businesses table currently only has SELECT policies
-- We need to add UPDATE and INSERT policies for proper business management

-- 1. Add UPDATE policy for admins to update their own business
DROP POLICY IF EXISTS "Admins can update own business" ON public.businesses;
CREATE POLICY "Admins can update own business" ON public.businesses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.business_memberships
      WHERE user_id = auth.uid()
      AND business_id = public.businesses.id
      AND role = 'admin'
    )
  );

-- 2. Add INSERT policy for authenticated users to create businesses
-- (This supports future multi-business functionality)
DROP POLICY IF EXISTS "Authenticated users can create businesses" ON public.businesses;
CREATE POLICY "Authenticated users can create businesses" ON public.businesses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Verify RLS is enabled
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
