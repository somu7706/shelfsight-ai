-- Create is_admin function for checking admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- Fix profiles table - deny anonymous access, only authenticated users can see their own
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Admins can manage profiles
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix shops table - restrict sensitive data exposure
DROP POLICY IF EXISTS "Anyone can view open non-archived shops" ON public.shops;

-- Authenticated users can view open shops
CREATE POLICY "Authenticated users can view open shops"
ON public.shops
FOR SELECT
TO authenticated
USING ((is_open = true) AND (is_archived = false));

-- Admins can view all shops including archived
CREATE POLICY "Admins can view all shops"
ON public.shops
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Admins can manage all shops
CREATE POLICY "Admins can manage all shops"
ON public.shops
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix points_transactions - remove the dangerous policy
DROP POLICY IF EXISTS "System can insert transactions" ON public.points_transactions;

-- Create restrictive policy - only backend triggers can insert (via service role)
-- This is handled by the award_loyalty_points trigger with SECURITY DEFINER

-- Fix loyalty_points - remove the dangerous system policy
DROP POLICY IF EXISTS "System can manage points" ON public.loyalty_points;

-- Admins can manage points
CREATE POLICY "Admins can manage all points"
ON public.loyalty_points
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix inventory_forecasts - remove dangerous system policy
DROP POLICY IF EXISTS "System can manage forecasts" ON public.inventory_forecasts;

-- Admins can manage forecasts
CREATE POLICY "Admins can manage all forecasts"
ON public.inventory_forecasts
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Add admin policies to user_roles table
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Update user roles view policy
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Products - admin access
CREATE POLICY "Admins can manage all products"
ON public.products
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Orders - admin access
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete all orders"
ON public.orders
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Order items - admin access
CREATE POLICY "Admins can view all order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all order items"
ON public.order_items
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Categories - admin access
CREATE POLICY "Admins can manage all categories"
ON public.categories
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Inventory - admin access
CREATE POLICY "Admins can manage all inventory"
ON public.inventory
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Stock transactions - admin access
CREATE POLICY "Admins can view all stock transactions"
ON public.stock_transactions
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all stock transactions"
ON public.stock_transactions
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Shop staff - admin access
CREATE POLICY "Admins can manage all shop staff"
ON public.shop_staff
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Rewards - admin access
CREATE POLICY "Admins can manage all rewards"
ON public.rewards
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Vision detections - admin access
CREATE POLICY "Admins can manage all vision detections"
ON public.vision_detections
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Cart items - admin access
CREATE POLICY "Admins can manage all cart items"
ON public.cart_items
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Push subscriptions - admin access
CREATE POLICY "Admins can manage all push subscriptions"
ON public.push_subscriptions
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Points transactions - admin access
CREATE POLICY "Admins can manage all points transactions"
ON public.points_transactions
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));