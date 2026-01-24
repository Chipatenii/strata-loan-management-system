-- Migration: Force Payment Instructions
-- Ensures ALL businesses have something for the pilot, specifically targetting the default ID

UPDATE public.businesses 
SET payment_instructions = 'MOBILE MONEY (Pilot): Send to 0979082676 (Zamtel) or 0968997788 (Airtel). Reference: Your Loan ID. 
BANK: FDH Bank, Acc: 12345678, Branch: Lusaka Corporate.'
WHERE id = '00000000-0000-0000-0000-000000000000' OR code = 'PILOT001';

-- Fallback for any other business created during testing
UPDATE public.businesses 
SET payment_instructions = 'Please contact support for payment instructions if not shown here.'
WHERE payment_instructions IS NULL;
