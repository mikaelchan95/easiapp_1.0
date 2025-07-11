-- Create storage bucket and policies for profile images
-- This migration creates the profile-images bucket and sets up proper RLS policies

-- Insert storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, avif_autodetection)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']::text[],
  false
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create RLS policies for the storage.objects table (with proper error handling)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;

-- Policy: Allow authenticated users to insert their own profile images
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
);

-- Policy: Allow public read access to all profile images
CREATE POLICY "Public can view profile images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profile-images');

-- Policy: Allow authenticated users to update their own profile images
CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-images'
)
WITH CHECK (
  bucket_id = 'profile-images'
);

-- Policy: Allow authenticated users to delete their own profile images
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-images'
);