-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  
  -- Pricing
  retail_price DECIMAL(10,2) NOT NULL,
  trade_price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  
  -- Product details
  image_url TEXT,
  volume VARCHAR(50),
  alcohol_content VARCHAR(20),
  country_of_origin VARCHAR(100),
  
  -- Inventory
  stock_quantity INTEGER DEFAULT 0,
  stock_status VARCHAR(20) DEFAULT 'in_stock',
  
  -- Features
  is_featured BOOLEAN DEFAULT false,
  is_limited BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Ratings
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT valid_stock_status CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock')),
  CONSTRAINT positive_prices CHECK (retail_price > 0 AND (trade_price IS NULL OR trade_price > 0))
);

-- Create indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_stock ON products(stock_status);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only authenticated users can view inactive products" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insert sample products
INSERT INTO products (
  name, description, category, sku, retail_price, trade_price, original_price,
  image_url, volume, alcohol_content, country_of_origin,
  stock_quantity, is_featured, is_limited, rating
) VALUES 
(
  'Dom Pérignon 2013',
  'A legendary champagne with exceptional finesse and complexity.',
  'Champagne',
  'DP2013-750',
  299.90,
  249.90,
  329.90,
  'https://example.com/dom-perignon-2013.jpg',
  '750ml',
  '12.5%',
  'France',
  25,
  true,
  false,
  4.8
),
(
  'Macallan 12 Year Old Double Cask',
  'Matured in a combination of sherry seasoned American and European oak casks.',
  'Whisky',
  'MAC12-DC-700',
  189.90,
  159.90,
  199.90,
  'https://example.com/macallan-12-double-cask.jpg',
  '700ml',
  '40%',
  'Scotland',
  50,
  true,
  false,
  4.6
),
(
  'Macallan 18 Year Old Sherry Cask',
  'Aged exclusively in hand-picked sherry seasoned oak casks.',
  'Whisky',
  'MAC18-SC-700',
  899.90,
  799.90,
  949.90,
  'https://example.com/macallan-18-sherry-cask.jpg',
  '700ml',
  '43%',
  'Scotland',
  15,
  true,
  true,
  4.9
),
(
  'Macallan 25 Year Old Sherry Oak',
  'An exceptional single malt whisky aged for 25 years.',
  'Whisky',
  'MAC25-SO-700',
  2499.90,
  2199.90,
  2699.90,
  'https://example.com/macallan-25-sherry-oak.jpg',
  '700ml',
  '43%',
  'Scotland',
  8,
  true,
  true,
  5.0
),
(
  'Macallan 30 Year Old Sherry Cask',
  'A rare and exceptional whisky with unparalleled depth.',
  'Whisky',
  'MAC30-SC-700',
  4999.90,
  4499.90,
  5299.90,
  'https://example.com/macallan-30-sherry-cask.jpg',
  '700ml',
  '43%',
  'Scotland',
  3,
  true,
  true,
  5.0
),
(
  'Château Margaux 2015',
  'A premier grand cru classé from Bordeaux.',
  'Wine',
  'CM2015-750',
  899.90,
  749.90,
  999.90,
  'https://example.com/chateau-margaux-2015.jpg',
  '750ml',
  '14%',
  'France',
  20,
  true,
  false,
  4.7
),
(
  'Hennessy Paradis',
  'A rare cognac of exceptional quality.',
  'Cognac',
  'HEN-PAR-700',
  1299.90,
  1099.90,
  1399.90,
  'https://example.com/hennessy-paradis.jpg',
  '700ml',
  '40%',
  'France',
  12,
  true,
  true,
  4.8
),
(
  'Johnnie Walker Blue Label',
  'The pinnacle of blended Scotch whisky.',
  'Whisky',
  'JW-BLUE-700',
  249.90,
  209.90,
  269.90,
  'https://example.com/johnnie-walker-blue.jpg',
  '700ml',
  '40%',
  'Scotland',
  40,
  false,
  false,
  4.5
);