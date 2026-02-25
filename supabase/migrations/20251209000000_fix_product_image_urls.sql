-- Fix product image URLs to use proper Supabase storage paths
-- Format: products/filename.webp (the imageUtils will convert to full URL)

UPDATE products SET image_url = 'products/dom-perignon-2013.webp' WHERE sku = 'DP2013-750';
UPDATE products SET image_url = 'products/macallan-12-double-cask.webp' WHERE sku = 'MAC12-DC-700';
UPDATE products SET image_url = 'products/macallan-18-sherry-oak.webp' WHERE sku = 'MAC18-SC-700';
UPDATE products SET image_url = 'products/macallan-25-sherry-oak.webp' WHERE sku = 'MAC25-SO-700';
UPDATE products SET image_url = 'products/macallan-30-sherry-oak.webp' WHERE sku = 'MAC30-SC-700';
UPDATE products SET image_url = 'products/chateau-margaux-2015-1.png' WHERE sku = 'CM2015-750';
UPDATE products SET image_url = 'products/HENNESSY-PARADIS-70CL-CARAFE-2000x2000px.webp' WHERE sku = 'HEN-PAR-700';
UPDATE products SET image_url = 'products/Johnnie-Walker-Blue-Label-750ml-600x600.webp' WHERE sku = 'JW-BLUE-700';

-- Update Eldoria if it exists (might have been added via admin-web)
UPDATE products SET image_url = 'products/eldoria-elderflower-liqueur.webp' 
WHERE LOWER(name) LIKE '%eldoria%elderflower%' AND (image_url IS NULL OR image_url = '' OR image_url LIKE '%example.com%');








