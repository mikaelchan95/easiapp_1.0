-- Update product image URLs to use Supabase storage
-- This migration updates all product images to use proper Supabase storage URLs

-- Get the Supabase project URL (replace with your actual project URL)
-- Note: In a real implementation, you would upload actual product images to the bucket first
-- For now, we'll use placeholder URLs that follow the Supabase storage pattern

UPDATE products SET image_url = 'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/dom-perignon-2013.webp'
WHERE sku = 'DP2013-750';

UPDATE products SET image_url = 'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/macallan-12-double-cask.webp'
WHERE sku = 'MAC12-DC-700';

UPDATE products SET image_url = 'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/macallan-18-sherry-cask.webp'
WHERE sku = 'MAC18-SC-700';

UPDATE products SET image_url = 'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/macallan-25-sherry-oak.webp'
WHERE sku = 'MAC25-SO-700';

UPDATE products SET image_url = 'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/macallan-30-sherry-cask.webp'
WHERE sku = 'MAC30-SC-700';

UPDATE products SET image_url = 'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/chateau-margaux-2015.webp'
WHERE sku = 'CM2015-750';

UPDATE products SET image_url = 'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/hennessy-paradis.webp'
WHERE sku = 'HEN-PAR-700';

UPDATE products SET image_url = 'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/johnnie-walker-blue.webp'
WHERE sku = 'JW-BLUE-700';

-- Note: In a production environment, you would:
-- 1. Upload actual product images to the product-images bucket
-- 2. Update the URLs to match the actual uploaded file names
-- 3. Ensure all images are properly sized and optimized