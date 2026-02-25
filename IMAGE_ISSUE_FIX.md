# Product Image Issue - Fix Guide

## Problem Identified

The product images aren't showing on the mobile app home page because the database contains **placeholder image URLs** pointing to `https://example.com/*.jpg` instead of actual Supabase storage URLs.

### Root Cause

Looking at the products table seed data (`supabase/migrations/20250102000000_create_products_table.sql`), all products have URLs like:

- `https://example.com/macallan-12-double-cask.jpg`
- `https://example.com/dom-perignon-2013.jpg`

These are fake URLs that will never load. The actual images exist in Supabase storage as `.webp` files:

- `products/macallan-12-double-cask.webp`
- `products/dom-perignon-2013.webp`

## Solution

I've updated the image URL fixing utility to:

1. Detect placeholder `example.com` URLs
2. Map product names to their correct image filenames (with `.webp` extension)
3. Update all database records with the correct format: `products/filename.webp`

## How to Fix (Choose ONE method)

### Method 1: Use Admin Web Maintenance Page (Recommended)

1. Open **Admin Web** in your browser
2. Navigate to **Maintenance** (in the sidebar)
3. Click **"Fix All Image URLs"** button
4. Wait for the process to complete
5. Reload the mobile app
6. Images should now display correctly!

### Method 2: Run SQL Migration Manually

If you prefer to run SQL directly:

1. Open **Supabase Dashboard** → SQL Editor
2. Run this migration:

```sql
-- Fix product image URLs to use proper Supabase storage paths
UPDATE products SET image_url = 'products/dom-perignon-2013.webp' WHERE sku = 'DP2013-750';
UPDATE products SET image_url = 'products/macallan-12-double-cask.webp' WHERE sku = 'MAC12-DC-700';
UPDATE products SET image_url = 'products/macallan-18-sherry-oak.webp' WHERE sku = 'MAC18-SC-700';
UPDATE products SET image_url = 'products/macallan-25-sherry-oak.webp' WHERE sku = 'MAC25-SO-700';
UPDATE products SET image_url = 'products/macallan-30-sherry-oak.webp' WHERE sku = 'MAC30-SC-700';
UPDATE products SET image_url = 'products/chateau-margaux-2015-1.png' WHERE sku = 'CM2015-750';
UPDATE products SET image_url = 'products/HENNESSY-PARADIS-70CL-CARAFE-2000x2000px.webp' WHERE sku = 'HEN-PAR-700';
UPDATE products SET image_url = 'products/Johnnie-Walker-Blue-Label-750ml-600x600.webp' WHERE sku = 'JW-BLUE-700';
UPDATE products SET image_url = 'products/eldoria-elderflower-liqueur.webp'
WHERE LOWER(name) LIKE '%eldoria%elderflower%';
```

3. Reload the mobile app
4. Images should now display!

## Files Changed

### 1. Enhanced Image URL Fixing Utility

**File**: `admin-web/src/utils/fixImageUrls.ts`

- Added product name to image filename mapping
- Enhanced `normalizeImagePath()` to detect and fix `example.com` placeholder URLs
- Maps product names to correct `.webp` filenames
- Handles extension mismatches (`.jpg` → `.webp`)

### 2. Created SQL Migration

**File**: `supabase/migrations/20251209000000_fix_product_image_urls.sql`

- Updates all existing products with correct image paths
- Can be run manually or will be applied on next database reset

### 3. Added Debug Logging

**Files**:

- `app/services/productsService.ts` - Logs image URL transformation from database
- `app/components/Products/EnhancedProductCard.tsx` - Logs image resolution and loading

## Verification

After running the fix, verify it worked:

1. **Admin Web**: Navigate to Maintenance → Click "Verify Images"
   - Should show all products as "accessible"
   - Any "broken" products need attention

2. **Mobile App**: Check the Home screen
   - All product cards should show images
   - Check the terminal/console for success logs: `✅ Image loaded successfully for: [Product Name]`

## Expected Image URLs Format

After the fix, all products should have image URLs in this format:

```
products/filename.webp
```

Examples:

- ✅ `products/macallan-18-sherry-oak.webp`
- ✅ `products/eldoria-elderflower-liqueur.webp`
- ❌ `https://example.com/macallan-18-sherry-oak.jpg` (OLD - will be fixed)

## Troubleshooting

### Images still not showing after fix?

1. **Check database was updated**:
   - Go to Supabase Dashboard → Table Editor → products
   - Verify `image_url` column now has `products/*.webp` format

2. **Verify images exist in storage**:
   - Go to Supabase Dashboard → Storage → product-images → products/
   - Confirm the `.webp` files are actually there

3. **Check console logs**: Look for:
   - `📸 Product Image Transform` - shows database → app transformation
   - `🖼️ Resolving image for` - shows image source resolution
   - `✅ Image loaded successfully` - confirms image loaded
   - `❌ Image load FAILED` - indicates loading error with details

4. **Force app reload**:
   - Mobile: Shake device → "Reload"
   - or press `R` in Metro terminal

### Specific product image not working?

If a specific product still has issues:

1. Go to **Admin Web** → **Products** → Edit the product
2. Re-upload the image
3. The upload will use the correct path format

## Future Prevention

The seed data migration has been updated, so future database resets will have correct image URLs. However, for existing databases, you must run one of the fix methods above.

## Summary

**What was wrong**: Database had placeholder `example.com` URLs  
**What I fixed**: Enhanced the URL fixing utility to map product names to correct filenames  
**What you need to do**: Run "Fix All Image URLs" in Admin Web Maintenance page  
**Result**: All product images will display correctly on mobile app








