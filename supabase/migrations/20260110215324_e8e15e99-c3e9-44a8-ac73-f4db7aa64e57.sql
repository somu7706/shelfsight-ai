-- Drop and recreate foreign keys with CASCADE DELETE for shops table

-- categories -> shops
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_shop_id_fkey;
ALTER TABLE public.categories ADD CONSTRAINT categories_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;

-- products -> shops
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_shop_id_fkey;
ALTER TABLE public.products ADD CONSTRAINT products_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;

-- orders -> shops
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_shop_id_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;

-- cart_items -> shops
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_shop_id_fkey;
ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;

-- shop_staff -> shops
ALTER TABLE public.shop_staff DROP CONSTRAINT IF EXISTS shop_staff_shop_id_fkey;
ALTER TABLE public.shop_staff ADD CONSTRAINT shop_staff_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;

-- rewards -> shops
ALTER TABLE public.rewards DROP CONSTRAINT IF EXISTS rewards_shop_id_fkey;
ALTER TABLE public.rewards ADD CONSTRAINT rewards_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;

-- loyalty_points -> shops
ALTER TABLE public.loyalty_points DROP CONSTRAINT IF EXISTS loyalty_points_shop_id_fkey;
ALTER TABLE public.loyalty_points ADD CONSTRAINT loyalty_points_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;

-- points_transactions -> shops
ALTER TABLE public.points_transactions DROP CONSTRAINT IF EXISTS points_transactions_shop_id_fkey;
ALTER TABLE public.points_transactions ADD CONSTRAINT points_transactions_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;

-- inventory_forecasts -> shops
ALTER TABLE public.inventory_forecasts DROP CONSTRAINT IF EXISTS inventory_forecasts_shop_id_fkey;
ALTER TABLE public.inventory_forecasts ADD CONSTRAINT inventory_forecasts_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;

-- vision_detections -> shops
ALTER TABLE public.vision_detections DROP CONSTRAINT IF EXISTS vision_detections_shop_id_fkey;
ALTER TABLE public.vision_detections ADD CONSTRAINT vision_detections_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;