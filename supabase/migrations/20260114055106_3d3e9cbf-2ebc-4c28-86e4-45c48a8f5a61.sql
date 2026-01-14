-- Drop the overly permissive policy that exposes cost_price
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

-- Add a policy that only allows shop managers and admins to see full product details (including cost_price)
CREATE POLICY "Shop managers can view their products"
ON public.products
FOR SELECT
USING (
  can_manage_shop(auth.uid(), shop_id) OR is_admin(auth.uid())
);

-- Grant select on products_public view to authenticated and anon users for public product browsing
GRANT SELECT ON public.products_public TO authenticated;
GRANT SELECT ON public.products_public TO anon;