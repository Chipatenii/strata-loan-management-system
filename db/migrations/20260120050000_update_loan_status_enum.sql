-- Migration: Add missing values to loan_status enum
-- Created because 'submitted' and 'under_review' were missing but required by new logic.

-- Postgres cannot ALTER TYPE ... ADD VALUE inside a transaction block in some versions/contexts nicely without
-- specifying "IF NOT EXISTS", but PG < 12 doesn't support IF NOT EXISTS for enums easily.
-- Supabase is PG 15+, so ALTER TYPE ... ADD VALUE IF NOT EXISTS works.

DO $$
BEGIN
    ALTER TYPE public.loan_status ADD VALUE IF NOT EXISTS 'submitted';
    ALTER TYPE public.loan_status ADD VALUE IF NOT EXISTS 'under_review';
    ALTER TYPE public.loan_status ADD VALUE IF NOT EXISTS 'paid'; -- Also missing from init.sql
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
