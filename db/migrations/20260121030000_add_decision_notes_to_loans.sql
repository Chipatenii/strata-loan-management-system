-- Migration: Add decision_notes column to loans table
-- This column is required for storing reviewer notes when approving or rejecting a loan.

ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS decision_notes text;
