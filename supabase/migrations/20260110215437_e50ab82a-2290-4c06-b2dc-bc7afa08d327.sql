-- Add is_archived column for soft delete functionality
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Update RLS policy to also check archived status for public viewing
DROP POLICY IF EXISTS "Anyone can view open shops" ON public.shops;
CREATE POLICY "Anyone can view open non-archived shops" 
ON public.shops 
FOR SELECT 
USING (is_open = true AND is_archived = false);

-- Owners can still see their archived shops
CREATE POLICY "Owners can view their own shops including archived" 
ON public.shops 
FOR SELECT 
USING (auth.uid() = owner_id);