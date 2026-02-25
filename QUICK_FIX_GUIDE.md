# Quick Fix Guide - Fix All Broken Product Images

## Problem

- Images broken on admin-web (manually added to Supabase)
- Eldoria image not working on mobile (added via admin-web)

## Solution - 3 Steps

### Step 1: Access Maintenance Page

1. Open admin-web
2. Login
3. Click **"Maintenance"** in the left sidebar (under General section)

### Step 2: Fix All Image URLs

On the Maintenance page:

1. Click **"Fix All Image URLs"** button
2. Wait for the process to complete (should take a few seconds)
3. You'll see a success message with count of updated images

Example output:

```
✓ Updated 8 product image URLs
Successfully updated 8 product image URLs
```

### Step 3: Verify Everything Works

1. Click **"Verify Images"** button to check status
2. Should show:
   - Total Products: X
   - Accessible: X (should be all green)
   - Broken: 0 (should be zero)

### Test on Mobile App

1. Restart the mobile app (or pull to refresh on products page)
2. Check that all product images now display correctly
3. Specifically check Eldoria - should now work

### Before & After

**BEFORE FIX:**

```
Database contains:
- products/eldoria-elderflower-liqueur.webp  ← Added via admin-web
- https://...supabase.co/.../macallan-18.webp  ← Added manually (BROKEN)
- macallan-25-sherry-oak.webp  ← Added manually (BROKEN)
```

**AFTER FIX:**

```
All standardized to:
- products/eldoria-elderflower-liqueur.webp  ✓
- products/macallan-18.webp  ✓
- products/macallan-25-sherry-oak.webp  ✓
```

## What This Does

The fix utility:

1. Scans all products in database
2. Finds image URLs in non-standard formats
3. Converts them to standard format: `products/filename.ext`
4. Updates the database
5. Both admin-web and mobile now use the same format

## If Images Still Broken After Fix

### Check 1: Does the file exist in Supabase Storage?

1. Go to Supabase Dashboard
2. Navigate to Storage → product-images → products/
3. Look for the image file
4. If missing, you need to re-upload via admin-web

### Check 2: Re-upload the Image

1. Go to Products → Edit Product (the broken one)
2. Remove current image (click X button)
3. Upload new image
4. Save product
5. Image should now work everywhere

### Check 3: Mobile App Cache

1. Close mobile app completely
2. Reopen and test
3. Or clear app data/cache

## Key Points

- ✅ Use admin-web to upload images (recommended)
- ✅ Images upload to correct path automatically
- ✅ Fix utility standardizes existing images
- ❌ Don't manually upload to Supabase Storage (use admin-web instead)
- ❌ Don't put full URLs in database (just `products/filename.ext`)

## For New Images Going Forward

**Correct way:**

1. Admin Web → Products → Add/Edit Product
2. Click image upload area
3. Select image file
4. Save product

The system automatically:

- Uploads to `product-images/products/` in Supabase
- Stores `products/filename.ext` in database
- Works on both admin-web and mobile app

## Need Help?

If images still don't work after following this guide:

1. Check browser console for errors (F12 → Console)
2. Check mobile app logs
3. Run "Verify Images" to see which products are broken
4. Check the full path being generated (logged in console)

## Technical Details

Standard format: `products/filename.ext`

Full URL (generated automatically):

```
https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/filename.ext
```

Both admin-web and mobile app construct this full URL from the stored path `products/filename.ext`.








