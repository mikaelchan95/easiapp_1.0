-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert categories" ON categories
  FOR INSERT USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update categories" ON categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete categories" ON categories
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial categories from existing products
INSERT INTO categories (name, slug)
SELECT DISTINCT category, LOWER(REGEXP_REPLACE(category, '[^a-zA-Z0-9]+', '-', 'g'))
FROM products
WHERE category IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- Insert standard categories if they don't exist
INSERT INTO categories (name, slug) VALUES
('Scotch', 'scotch'),
('Champagne', 'champagne'),
('Cognac', 'cognac'),
('Japanese Whisky', 'japanese-whisky'),
('Wine', 'wine'),
('Vodka', 'vodka'),
('Gin', 'gin')
ON CONFLICT (name) DO NOTHING;
