-- Add latitude and longitude columns to shops for location-based discovery
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS longitude numeric;

-- Create index for faster geo queries
CREATE INDEX IF NOT EXISTS idx_shops_location ON public.shops (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;