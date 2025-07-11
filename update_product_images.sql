-- Update product image URLs to use Supabase storage
-- Run this directly in the Supabase SQL editor

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

-- Verify the updates
SELECT name, sku, image_url FROM products ORDER BY name;