-- Migration: Add missing review columns to loans table
-- Fixes errors when approving/rejecting loans

DO $$
BEGIN
    -- Add decision_notes if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='decision_notes') THEN
        ALTER TABLE public.loans ADD COLUMN decision_notes text;
    END IF;

    -- Add reviewed_at if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='reviewed_at') THEN
        ALTER TABLE public.loans ADD COLUMN reviewed_at timestamptz;
    END IF;

    -- Add reviewed_by if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='reviewed_by') THEN
        ALTER TABLE public.loans ADD COLUMN reviewed_by uuid references public.users(id);
    END IF;
END $$;
