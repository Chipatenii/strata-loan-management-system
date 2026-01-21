-- Migration: Upgrade Businesses Table with Full Profile Support
-- Adds email, phone, address, logo, registration, and branding fields

-- Add profile fields to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS trading_name text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS registration_number text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS tax_number text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS physical_address text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS country text DEFAULT 'Zambia';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS logo_object_key text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS brand_primary_color text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS brand_secondary_color text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_businesses_updated_at ON public.businesses;
CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
