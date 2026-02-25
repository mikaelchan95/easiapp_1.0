-- Add brand field to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);

-- Create index for brand filtering
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);

-- Create brands table for managing available brands
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for brands
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active);
CREATE INDEX IF NOT EXISTS idx_brands_sort_order ON brands(sort_order);

-- Enable RLS for brands
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for brands
CREATE POLICY "Brands are viewable by everyone" ON brands
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only authenticated users can view inactive brands" ON brands
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insert featured brands
INSERT INTO brands (name, logo_url, description, sort_order) VALUES
  ('Macallan', 'brands/Macallan-logo.jpg', 'Highland Single Malt Scotch Whisky', 1),
  ('Hennessy', 'brands/Hennessy-Logo.png', 'Fine Cognac', 2),
  ('Lumina', 'brands/Lumina.png', 'Premium Liqueur', 3),
  ('Dom Pérignon', 'brands/Dom-Perignon-Logo.jpg', 'Prestige Champagne', 4),
  ('Eldoria', 'brands/Eldoria.png', 'Premium Spirits', 5),
  ('Louis XIII', 'brands/Louis-13_-300x300-1.webp', 'Fine Cognac', 6),
  ('Lush', 'brands/Lush.png', 'Fruit Liqueur', 7),
  ('Johnnie Walker', 'brands/johnnie-walker.svg', 'Blended Scotch Whisky', 8),
  ('Hofman', 'brands/Hofman.png', 'Peach Liqueur', 9),
  ('Regalia', 'brands/Regalia.jpg', 'Premium Spirits', 10),
  ('Francois Dion', 'brands/Francois Dion.png', 'Fine Cognac', 11)
ON CONFLICT (name) DO NOTHING;

-- Update existing products with brand information based on product names
UPDATE products SET brand = 'Macallan' WHERE name ILIKE '%macallan%' AND brand IS NULL;
UPDATE products SET brand = 'Hennessy' WHERE name ILIKE '%hennessy%' AND brand IS NULL;
UPDATE products SET brand = 'Dom Pérignon' WHERE name ILIKE '%dom%' OR name ILIKE '%perignon%' AND brand IS NULL;
UPDATE products SET brand = 'Johnnie Walker' WHERE name ILIKE '%johnnie%' OR name ILIKE '%walker%' AND brand IS NULL;
UPDATE products SET brand = 'Louis XIII' WHERE name ILIKE '%louis%' AND brand IS NULL;

-- Comment explaining the brand field
COMMENT ON COLUMN products.brand IS 'Brand name of the product for filtering and categorization';
COMMENT ON TABLE brands IS 'Available brands for products with metadata and logo information';








