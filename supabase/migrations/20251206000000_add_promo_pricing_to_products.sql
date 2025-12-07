-- Add promotional pricing fields to products table
ALTER TABLE products 
ADD COLUMN promo_price DECIMAL(10,2),
ADD COLUMN promo_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN promo_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN low_stock_threshold INTEGER DEFAULT 10;

-- Add constraint to ensure promo price is less than retail price
ALTER TABLE products 
ADD CONSTRAINT valid_promo_price 
CHECK (promo_price IS NULL OR promo_price < retail_price);

-- Add index for promo dates to optimize queries
CREATE INDEX idx_products_promo_dates ON products(promo_start_date, promo_end_date);

-- Add comment for documentation
COMMENT ON COLUMN products.promo_price IS 'Promotional price for the product. Must be less than retail_price.';
COMMENT ON COLUMN products.promo_start_date IS 'Start date for the promotional pricing period.';
COMMENT ON COLUMN products.promo_end_date IS 'End date for the promotional pricing period.';
COMMENT ON COLUMN products.low_stock_threshold IS 'Stock quantity threshold for low stock alerts.';
