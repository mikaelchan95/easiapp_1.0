# Image Management Fix - Summary

## Problem

Images had inconsistent behavior between admin-web and mobile app:

1. **Admin-web**: Images added manually to Supabase were broken (wrong path format)
2. **Mobile app**: Eldoria image (added via admin-web) wasn't working
3. **Root cause**: Inconsistent image path handling and hardcoded product name mapping that overrode database URLs

## Solution

### 1. Mobile App Image Handling (`app/utils/imageUtils.ts`)

**BEFORE**: Hardcoded product name mapping took precedence over database URLs

```typescript
// 1. Try product name mapping first (most reliable)
// 2. Fall back to database URL if no mapping found
```

**AFTER**: Database URLs are now the primary source of truth

```typescript
// 1. Try database URL first (primary source of truth)
// 2. Fall back to product name mapping if no database URL
```

This ensures images uploaded via admin-web work correctly on mobile.

### 2. Admin-Web Image Handling (`admin-web/src/lib/imageUtils.ts`)

Enhanced to handle:

- Legacy URLs missing the `products/` subdirectory
- Various path formats consistently
- Automatic path normalization

### 3. Image URL Standardization

Created utilities to fix existing broken image paths:

**File**: `admin-web/src/utils/fixImageUrls.ts`

Functions:

- `normalizeImagePath()` - Converts any image path to standard format: `products/filename.ext`
- `fixAllProductImageUrls()` - Batch updates all products with non-standard paths
- `verifyProductImages()` - Checks which images are accessible/broken

### 4. Maintenance Page (`admin-web/src/pages/Maintenance.tsx`)

New admin page with UI to:

- **Fix All Image URLs**: Standardizes all product image URLs in database
- **Verify Images**: Reports which products have broken/missing images

Access via: **Admin Web → Sidebar → Maintenance**

## Standard Image Path Format

All product images should now use this format in the database:

```
products/filename.ext
```

Examples:

- ✅ `products/eldoria-elderflower-liqueur.webp`
- ✅ `products/macallan-18-sherry-oak.webp`
- ❌ `https://...supabase.co/.../products/file.webp` (full URL - will be normalized)
- ❌ `product-images/products/file.webp` (includes bucket name - will be normalized)
- ❌ `file.webp` (missing products/ - will be normalized)

## How Image URLs Are Resolved

### Mobile App (`app/utils/imageUtils.ts`)

```typescript
export const getProductImageSource = (imageUrl?, productName?) => {
  // 1. Try database URL first ✅ PRIMARY
  if (imageUrl) {
    return { uri: getSupabaseImageUrl(imageUrl) };
  }

  // 2. Fall back to product name mapping
  if (productName) {
    const filename = getImageFilenameByProductName(productName);
    return { uri: `...product-images/products/${filename}` };
  }

  // 3. Last resort fallback
  return getProductFallbackImage();
};
```

### Admin Web (`admin-web/src/lib/imageUtils.ts`)

```typescript
export const getImageUrl = path => {
  // Handles full URLs, partial paths, and legacy formats
  // Always normalizes to: .../product-images/products/filename.ext
};
```

## How Images Are Uploaded

When you upload an image via admin-web:

1. **ImageUpload Component** uploads to: `products/filename.ext`
2. **Database** stores: `products/filename.ext`
3. **getImageUrl()** converts to full URL: `https://...supabase.co/storage/v1/object/public/product-images/products/filename.ext`
4. **Mobile app** receives the path and constructs the same URL

## Usage Instructions

### For New Products

1. Use admin-web to create/edit products
2. Upload image via the Image Upload component
3. Image will automatically work on both admin-web and mobile app

### For Existing Products with Broken Images

1. Go to **Admin Web → Maintenance**
2. Click **"Verify Images"** to see which products have broken images
3. Click **"Fix All Image URLs"** to standardize all paths
4. Check mobile app - images should now work

### Manual Fix (If Needed)

If a specific product still has issues:

1. Go to **Products → Edit Product**
2. Remove the current image (click X)
3. Upload a new image
4. Save

The new upload will use the correct path format.

## Storage Structure in Supabase

```
product-images/                    ← Bucket name
└── products/                      ← Subdirectory
    ├── eldoria-elderflower-liqueur.webp
    ├── macallan-18-sherry-oak.webp
    ├── hennessy-paradis.webp
    └── ...other images
```

## Database Schema

**Table**: `products`
**Column**: `image_url` (text, nullable)

**Value format**: `products/filename.ext`

Example row:

```json
{
  "id": "...",
  "name": "Eldoria Elderflower Liqueur",
  "image_url": "products/eldoria-elderflower-liqueur.webp",
  ...
}
```

## Testing Checklist

- [x] Upload image via admin-web
- [x] Image displays correctly in admin-web product list
- [x] Image displays correctly in mobile app product list
- [x] Image displays correctly in mobile app product details
- [x] Run "Fix All Image URLs" in Maintenance page
- [x] Run "Verify Images" to confirm all accessible
- [x] Manually added images (old format) now work after fix

## Files Changed

### Mobile App

- `app/utils/imageUtils.ts` - Prioritize database URLs over hardcoded mapping

### Admin Web

- `admin-web/src/lib/imageUtils.ts` - Enhanced path normalization
- `admin-web/src/utils/fixImageUrls.ts` - NEW: Utility functions
- `admin-web/src/pages/Maintenance.tsx` - NEW: Maintenance UI
- `admin-web/src/App.tsx` - Added maintenance route
- `admin-web/src/components/Layout.tsx` - Added maintenance nav link

## Future Considerations

1. **Image Optimization**: Consider adding automatic WebP conversion and resizing
2. **CDN**: For better performance, consider using a CDN for image delivery
3. **Image Validation**: Add file size and dimension validation on upload
4. **Bulk Upload**: Add ability to upload multiple images at once
5. **Image Library**: Create a shared image library for reusable assets

## Troubleshooting

### Image not showing on mobile app

1. Check database: Is `image_url` in format `products/filename.ext`?
2. Check Supabase storage: Does the file exist in `product-images/products/`?
3. Run "Verify Images" in Maintenance page
4. Check mobile app console logs for image URL being used

### Image not showing on admin-web

1. Check browser console for 404 errors
2. Verify the image exists in Supabase storage
3. Try re-uploading the image

### "Fix All Image URLs" not working

1. Check browser console for errors
2. Verify you have proper Supabase permissions
3. Try running "Verify Images" first to see which products need fixing








