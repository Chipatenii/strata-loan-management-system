-- Migration: Add Payment Instructions to Businesses
-- Allows organizations to specify how customers should pay (Bank details, MoMo instructions, etc)

ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS payment_instructions text;

-- Add some default instructions for existing organization
UPDATE public.businesses 
SET payment_instructions = 'MOBILE MONEY: Send to 0979082676 (Zamtel) or 0968997788 (Airtel). Reference: Your Loan ID. 
BANK: FDH Bank, Acc: 12345678, Branch: Lusaka Corporate.'
WHERE code = 'PILOT001';
