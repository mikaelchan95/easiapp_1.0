-- Create storage bucket and policies for product images
-- This migration creates the product-images bucket and sets up proper RLS policies

-- Insert storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, avif_autodetection)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit for product images
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']::text[],
  false
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create RLS policies for the storage.objects table (with proper error handling)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;

-- Policy: Allow public read access to all product images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images');

-- Policy: Allow authenticated users to insert product images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
);

-- Policy: Allow authenticated users to update product images
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-images'
)
WITH CHECK (
  bucket_id = 'product-images'
);

-- Policy: Allow authenticated users to delete product images
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images'
);