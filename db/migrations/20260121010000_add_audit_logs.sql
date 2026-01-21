-- Migration: Add Audit Logs Table
-- Tracks admin actions for compliance and debugging

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.businesses(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL, -- e.g., 'loan_approved', 'kyc_rejected', 'profile_updated'
  entity_type text, -- e.g., 'loan', 'kyc_record', 'business'
  entity_id uuid,
  details jsonb, -- Additional context (e.g., reason, old values, new values)
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_id ON public.audit_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can read audit logs for their business
DROP POLICY IF EXISTS "Admins can read business audit logs" ON public.audit_logs;
CREATE POLICY "Admins can read business audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.user_id = auth.uid()
      AND bm.role IN ('admin', 'owner')
      AND bm.business_id = public.audit_logs.business_id
    )
  );

-- RLS Policy: Admins can insert audit logs for their business
DROP POLICY IF EXISTS "Admins can create audit logs" ON public.audit_logs;
CREATE POLICY "Admins can create audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.user_id = auth.uid()
      AND bm.role IN ('admin', 'owner')
      AND bm.business_id = public.audit_logs.business_id
    )
  );
