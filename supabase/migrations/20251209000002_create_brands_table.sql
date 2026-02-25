-- Create brands table if it doesn't exist
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT,
  logo_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_is_active ON brands(is_active);
CREATE INDEX IF NOT EXISTS idx_brands_sort_order ON brands(sort_order);

-- Add RLS policies
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read brands
CREATE POLICY "Allow authenticated users to read brands"
  ON brands
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage brands
CREATE POLICY "Allow admins to manage brands"
  ON brands
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default brands
INSERT INTO brands (name, is_active, sort_order) VALUES
  ('Macallan', true, 1),
  ('Glenfiddich', true, 2),
  ('Glenlivet', true, 3),
  ('Johnnie Walker', true, 4),
  ('Chivas Regal', true, 5),
  ('Ballantines', true, 6),
  ('Dom Pérignon', true, 7),
  ('Moët & Chandon', true, 8),
  ('Veuve Clicquot', true, 9),
  ('Hennessy', true, 10),
  ('Rémy Martin', true, 11),
  ('Courvoisier', true, 12)
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE brands IS 'Product brands/manufacturers';
COMMENT ON COLUMN brands.name IS 'Brand name (unique)';
COMMENT ON COLUMN brands.slug IS 'URL-friendly slug';
COMMENT ON COLUMN brands.logo_url IS 'Brand logo image URL';
COMMENT ON COLUMN brands.sort_order IS 'Display order (lower numbers first)';








