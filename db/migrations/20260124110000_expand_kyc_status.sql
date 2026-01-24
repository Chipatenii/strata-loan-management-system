-- Migration: Expand KYC Status Enum
-- Adds 'submitted' to support all KYC entry states.

ALTER TYPE public.kyc_status ADD VALUE IF NOT EXISTS 'submitted';
