-- Migration: Add Loan Features
-- Created by Gemini 3 Pro

-- 1. LOANS TABLE: Add Snapshot & Disbursement Columns
DO $$
BEGIN
    ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS interest_rate_pct_used numeric(5,2);
    ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS principal_amount numeric(14,2);
    ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS interest_amount numeric(14,2);
    ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS total_payable_amount numeric(14,2);
    ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS disbursement_method text; -- mobile_money, bank_transfer
    ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS disbursement_details jsonb DEFAULT '{}'::jsonb;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 2. COLLATERAL: Create table for multiple images
CREATE TABLE IF NOT EXISTS public.loan_collateral (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    loan_id uuid REFERENCES public.loans(id) ON DELETE CASCADE NOT NULL,
    image_url text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.loan_collateral ENABLE ROW LEVEL SECURITY;

-- RLS for Collateral
-- Users can manage their own collateral (Insert/Select/Delete)
DROP POLICY IF EXISTS "Users can manage own collateral" ON public.loan_collateral;
CREATE POLICY "Users can manage own collateral" ON public.loan_collateral
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.loans WHERE id = public.loan_collateral.loan_id AND user_id = auth.uid())
    );

-- Admins can read collateral for their business loans
DROP POLICY IF EXISTS "Admins can read business collateral" ON public.loan_collateral;
CREATE POLICY "Admins can read business collateral" ON public.loan_collateral
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.loans l
            JOIN public.business_memberships bm ON bm.business_id = l.business_id
            WHERE l.id = public.loan_collateral.loan_id
            AND bm.user_id = auth.uid()
            AND bm.role IN ('admin', 'loan_officer')
        )
    );

-- 3. KYC RECORDS: Add Extended KYC & Next of Kin
DO $$
BEGIN
    ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS dob date;
    ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS nrc_passport_number text;
    ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS gender text;
    ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS marital_status text;
    ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS residential_address text;
    ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS city_town text;
    ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS employment_status text;
    ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS employer_name text;
    ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS job_title text;
    ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS monthly_income numeric(14,2);
    ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS pay_day text;
    ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS bank_name text;
    ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS account_number text;
    -- Next of Kin
    ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS nok_full_name text;
    ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS nok_relationship text;
    ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS nok_phone text;
    ALTER TABLE public.kyc_records ADD COLUMN IF NOT EXISTS nok_address text;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 4. MIGRATE EXISTING COLLATERAL
-- One-time migration of existing legacy data
INSERT INTO public.loan_collateral (loan_id, image_url, description)
SELECT id, collateral_image_url, collateral_description
FROM public.loans
WHERE collateral_image_url IS NOT NULL
ON CONFLICT DO NOTHING; -- No PK conflict expected but good practice
