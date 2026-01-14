-- Create secure view for shops that hides sensitive data from customers
CREATE OR REPLACE VIEW public.shops_public
WITH (security_invoker = on)
AS SELECT 
  id,
  name,
  description,
  address,
  is_open,
  logo_url,
  latitude,
  longitude,
  created_at
FROM public.shops
WHERE is_open = true AND is_archived = false;

-- Create secure view for products that hides cost_price from customers
CREATE OR REPLACE VIEW public.products_public
WITH (security_invoker = on)
AS SELECT 
  id,
  shop_id,
  category_id,
  name,
  description,
  price,
  image_url,
  barcode,
  sku,
  is_active,
  is_seasonal,
  created_at,
  updated_at
FROM public.products
WHERE is_active = true;

-- Fix function search paths
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "System can manage points" ON public.loyalty_points;
DROP POLICY IF EXISTS "System can insert transactions" ON public.points_transactions;
DROP POLICY IF EXISTS "System can manage forecasts" ON public.inventory_forecasts;