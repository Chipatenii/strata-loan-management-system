-- Migration: Add 'approved' to loan_status enum
-- Required because the application uses 'approved' status before 'active'

ALTER TYPE public.loan_status ADD VALUE IF NOT EXISTS 'approved';
