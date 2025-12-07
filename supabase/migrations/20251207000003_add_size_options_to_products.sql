-- Add size_options column to products table
ALTER TABLE products ADD COLUMN size_options JSONB DEFAULT '[]'::jsonb;

-- Create index for size_options for faster searching/filtering if needed
CREATE INDEX idx_products_size_options ON products USING gin (size_options);
