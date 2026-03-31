-- Migration: Add performance indexes for frequently queried columns

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_business_id_status ON public.loans(business_id, status);

CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON public.payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_payments_business_id_status ON public.payments(business_id, status);

CREATE INDEX IF NOT EXISTS idx_kyc_records_user_id ON public.kyc_records(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_records_business_id_status ON public.kyc_records(business_id, status);

CREATE INDEX IF NOT EXISTS idx_ledger_loan_id_created ON public.ledger(loan_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_business_memberships_user_id ON public.business_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_business_memberships_business_id ON public.business_memberships(business_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_business_id ON public.audit_logs(business_id);
