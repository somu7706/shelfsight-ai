-- Create loyalty points table
CREATE TABLE public.loyalty_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, shop_id)
);

-- Create points transactions table
CREATE TABLE public.points_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'bonus', 'expire')),
  points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rewards table
CREATE TABLE public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_redemptions INTEGER,
  current_redemptions INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create push subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Create inventory forecasts table
CREATE TABLE public.inventory_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL,
  daily_sales_avg NUMERIC NOT NULL DEFAULT 0,
  days_until_stockout INTEGER,
  predicted_stockout_date DATE,
  confidence_score NUMERIC,
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_forecasts ENABLE ROW LEVEL SECURITY;

-- Loyalty points policies
CREATE POLICY "Users can view their own points" ON public.loyalty_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Shop managers can view all points" ON public.loyalty_points
  FOR SELECT USING (can_manage_shop(auth.uid(), shop_id));

CREATE POLICY "System can manage points" ON public.loyalty_points
  FOR ALL USING (true) WITH CHECK (true);

-- Points transactions policies
CREATE POLICY "Users can view their own transactions" ON public.points_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Shop managers can view all transactions" ON public.points_transactions
  FOR SELECT USING (can_manage_shop(auth.uid(), shop_id));

CREATE POLICY "System can insert transactions" ON public.points_transactions
  FOR INSERT WITH CHECK (true);

-- Rewards policies
CREATE POLICY "Anyone can view active rewards" ON public.rewards
  FOR SELECT USING (is_active = true);

CREATE POLICY "Shop managers can manage rewards" ON public.rewards
  FOR ALL USING (can_manage_shop(auth.uid(), shop_id));

-- Push subscriptions policies
CREATE POLICY "Users can manage their own subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Inventory forecasts policies
CREATE POLICY "Shop managers can view forecasts" ON public.inventory_forecasts
  FOR SELECT USING (can_manage_shop(auth.uid(), shop_id));

CREATE POLICY "System can manage forecasts" ON public.inventory_forecasts
  FOR ALL USING (true) WITH CHECK (true);

-- Create function to award points on order completion
CREATE OR REPLACE FUNCTION public.award_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award INTEGER;
  current_lifetime INTEGER;
  new_tier TEXT;
BEGIN
  -- Only award points when order status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Calculate points (1 point per 10 rupees spent)
    points_to_award := FLOOR(NEW.total / 10);
    
    -- Upsert loyalty points
    INSERT INTO public.loyalty_points (user_id, shop_id, balance, lifetime_points)
    VALUES (NEW.customer_id, NEW.shop_id, points_to_award, points_to_award)
    ON CONFLICT (user_id, shop_id) 
    DO UPDATE SET 
      balance = loyalty_points.balance + points_to_award,
      lifetime_points = loyalty_points.lifetime_points + points_to_award,
      updated_at = now();
    
    -- Get current lifetime points
    SELECT lifetime_points INTO current_lifetime
    FROM public.loyalty_points
    WHERE user_id = NEW.customer_id AND shop_id = NEW.shop_id;
    
    -- Determine tier based on lifetime points
    IF current_lifetime >= 10000 THEN
      new_tier := 'platinum';
    ELSIF current_lifetime >= 5000 THEN
      new_tier := 'gold';
    ELSIF current_lifetime >= 1000 THEN
      new_tier := 'silver';
    ELSE
      new_tier := 'bronze';
    END IF;
    
    -- Update tier
    UPDATE public.loyalty_points
    SET tier = new_tier
    WHERE user_id = NEW.customer_id AND shop_id = NEW.shop_id;
    
    -- Record transaction
    INSERT INTO public.points_transactions (user_id, shop_id, order_id, type, points, description)
    VALUES (NEW.customer_id, NEW.shop_id, NEW.id, 'earn', points_to_award, 
            'Points earned from order #' || NEW.order_number);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for awarding points
CREATE TRIGGER award_points_on_order_complete
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.award_loyalty_points();

-- Add trigger for updated_at on new tables
CREATE TRIGGER update_loyalty_points_updated_at
  BEFORE UPDATE ON public.loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_forecasts_updated_at
  BEFORE UPDATE ON public.inventory_forecasts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();