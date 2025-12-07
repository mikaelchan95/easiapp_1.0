-- Add missing columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS voucher_id text,
ADD COLUMN IF NOT EXISTS voucher_discount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS order_notes text,
ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_start_time text,
ADD COLUMN IF NOT EXISTS delivery_end_time text,
ADD COLUMN IF NOT EXISTS is_same_day_delivery boolean DEFAULT false;

-- Add missing columns to order_items table for historical preservation
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS product_name text,
ADD COLUMN IF NOT EXISTS product_image_url text;

-- Ensure delivery_address is treated as JSONB if possible, or leave as text but document intent
-- (Safest is to keep as is, app handles parsing)

-- Update RLS policies if needed (usually existing policies cover new columns on same table)
