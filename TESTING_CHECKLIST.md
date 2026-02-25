# Image Management Fix - Testing Checklist

## Pre-Deployment Testing

### ✅ Code Quality

- [x] TypeScript compilation passes (no new errors)
- [x] Syntax validation passes
- [x] No linting errors introduced
- [x] Code follows project conventions

### ✅ Logic Verification

- [x] Mobile app prioritizes database URLs
- [x] Admin-web normalizes all path formats
- [x] Path normalization handles edge cases
- [x] Full URL construction is consistent

---

## Post-Deployment Testing

### Step 1: Verify Maintenance Page Access

- [ ] Login to admin-web
- [ ] Click "Maintenance" in left sidebar (under General)
- [ ] Page loads without errors
- [ ] Both buttons visible: "Fix All Image URLs" and "Verify Images"

### Step 2: Run Initial Verification

- [ ] Click "Verify Images" button
- [ ] Wait for results to load
- [ ] Note the numbers:
  - Total Products: \_\_\_\_
  - Accessible: \_\_\_\_
  - Broken: \_\_\_\_
- [ ] Review list of broken products (if any)

### Step 3: Fix All Image URLs

- [ ] Click "Fix All Image URLs" button
- [ ] Wait for process to complete
- [ ] Success message appears
- [ ] Note "Updated X product image URLs"
- [ ] No errors in the error list

### Step 4: Re-verify After Fix

- [ ] Click "Verify Images" button again
- [ ] Confirm:
  - Accessible count increased
  - Broken count decreased (ideally to 0)
- [ ] If broken count > 0, note which products

### Step 5: Admin Web Visual Verification

#### Products List Page

- [ ] Navigate to Products page
- [ ] Check product thumbnails display correctly
- [ ] Specifically check:
  - [ ] Eldoria Elderflower Liqueur
  - [ ] Macallan products
  - [ ] Hennessy Paradis
  - [ ] Dom Pérignon
  - [ ] Château Margaux

#### Product Detail/Edit Pages

- [ ] Click to edit a product
- [ ] Image displays in the image upload area
- [ ] Try different products
- [ ] No broken image icons

### Step 6: Mobile App Testing

#### Initial Load

- [ ] Close mobile app completely
- [ ] Reopen the app
- [ ] Navigate to Products/Shop section
- [ ] Wait for products to load

#### Product Grid/List

- [ ] All product images display correctly
- [ ] Specifically check Eldoria (original issue)
- [ ] Check Macallan products
- [ ] Check other premium products

#### Product Details

- [ ] Tap on Eldoria Elderflower Liqueur
- [ ] Image displays correctly in detail view
- [ ] Try other products
- [ ] Images load without delay

#### Home Screen

- [ ] Check featured products section
- [ ] Check new arrivals (if applicable)
- [ ] Check any promotional banners

#### Past Orders

- [ ] Navigate to past orders
- [ ] Product images in order history display correctly

---

## Detailed Test Cases

### Test Case 1: Upload New Image (Admin Web → Mobile)

**Steps:**

1. Admin Web → Products → Add New Product
2. Fill in product details
3. Upload a test image
4. Save product
5. Note the product name
6. Open mobile app
7. Search for the product
8. Verify image displays

**Expected:**

- [ ] Upload succeeds
- [ ] Image shows in admin-web immediately
- [ ] Image shows in mobile app
- [ ] Image path in database is `products/filename.ext`

### Test Case 2: Edit Existing Product Image

**Steps:**

1. Admin Web → Products → Select "Eldoria"
2. Remove current image (click X)
3. Upload a different image
4. Save
5. Check mobile app

**Expected:**

- [ ] Old image removed
- [ ] New image uploaded
- [ ] Admin-web shows new image
- [ ] Mobile app shows new image (may need refresh)

### Test Case 3: Manual Database Check

**Steps:**

1. Open Supabase dashboard
2. Navigate to Database → products table
3. Check `image_url` column for several products
4. Verify format is `products/filename.ext`

**Expected:**

- [ ] All image URLs in format `products/filename.ext`
- [ ] No full URLs (starting with http)
- [ ] No paths with `product-images/` prefix
- [ ] No bare filenames without `products/`

### Test Case 4: Storage Structure Check

**Steps:**

1. Open Supabase dashboard
2. Navigate to Storage → product-images bucket
3. Open `products/` folder
4. Verify images exist

**Expected:**

- [ ] `products/` folder exists
- [ ] Images are inside `products/` folder
- [ ] Filenames match database entries
- [ ] No images directly in `product-images/` root

### Test Case 5: Path Normalization

**Test manually uploading various formats to database:**

1. `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/test.webp`
2. `product-images/products/test.webp`
3. `test.webp`
4. `/products/test.webp`

**Steps:**

1. Manually update a test product with each format
2. Run "Fix All Image URLs"
3. Check database - should all become `products/test.webp`

**Expected:**

- [ ] All formats normalized to `products/test.webp`
- [ ] Image displays correctly in admin-web
- [ ] Image displays correctly in mobile app

---

## Edge Cases to Test

### Empty/Null Image URL

- [ ] Product with `image_url = null`
  - Admin-web: Shows "No Image" placeholder
  - Mobile app: Shows fallback image

### Missing File in Storage

- [ ] Product with valid path but file doesn't exist
  - "Verify Images" reports it as broken
  - Admin-web: Broken image icon
  - Mobile app: Fallback image

### Special Characters in Filename

- [ ] Upload image with spaces in name
  - System handles it correctly
  - Path stored properly

- [ ] Upload image with special chars (é, ñ, etc.)
  - System handles it correctly
  - URL encoding works

### Large Images

- [ ] Upload very large image (>5MB)
  - Upload succeeds or gives appropriate error
  - Image displays correctly if uploaded

### Different Image Formats

- [ ] Upload .webp - should work ✅
- [ ] Upload .png - should work ✅
- [ ] Upload .jpg/.jpeg - should work ✅
- [ ] Upload .gif - check if supported

---

## Browser Testing (Admin Web)

### Chrome/Edge

- [ ] Images display correctly
- [ ] Upload works
- [ ] Maintenance page functions

### Firefox

- [ ] Images display correctly
- [ ] Upload works
- [ ] Maintenance page functions

### Safari

- [ ] Images display correctly
- [ ] Upload works
- [ ] Maintenance page functions

### Mobile Browsers (admin-web responsive)

- [ ] iOS Safari - images work
- [ ] Android Chrome - images work

---

## Performance Testing

### Load Time

- [ ] Products page loads in < 3 seconds
- [ ] Images load progressively (don't block page)
- [ ] Mobile app products load smoothly

### Network Conditions

- [ ] Fast connection: All images load
- [ ] Slow connection: Images load eventually or show placeholder
- [ ] Offline: Appropriate error/placeholder shown

---

## Rollback Testing (If Needed)

### Preparation

- [ ] Note current git commit hash
- [ ] Document current state
- [ ] Backup database (optional)

### If Issues Found

1. [ ] Identify specific issue
2. [ ] Check if it's a path problem or something else
3. [ ] Try "Fix All Image URLs" again
4. [ ] If still broken, consider rollback

### Rollback Steps

1. [ ] Git revert to previous commit
2. [ ] Restart admin-web
3. [ ] Rebuild mobile app
4. [ ] Test basic functionality
5. [ ] Investigate root cause

---

## Success Criteria

### Critical (Must Pass)

- [ ] All product images display on admin-web
- [ ] All product images display on mobile app
- [ ] Eldoria image works on mobile (original issue)
- [ ] New uploads work on both platforms
- [ ] No console errors related to images

### Important (Should Pass)

- [ ] "Fix All Image URLs" completes without errors
- [ ] "Verify Images" shows 0 broken images
- [ ] Page load times acceptable
- [ ] No UI glitches or broken layouts

### Nice to Have (Optional)

- [ ] Images load progressively
- [ ] Smooth animations/transitions
- [ ] Responsive on all screen sizes

---

## Issue Reporting Template

If you find an issue, document it:

```
Issue: [Brief description]

Steps to Reproduce:
1.
2.
3.

Expected Result:


Actual Result:


Screenshots/Logs:


Environment:
- Browser/Device:
- Admin Web or Mobile:
- URL/Screen:

Severity: [Critical / High / Medium / Low]

Suggested Fix:

```

---

## Final Sign-Off

After completing all tests:

- [ ] All critical tests passed
- [ ] No major issues found
- [ ] Minor issues documented (if any)
- [ ] Ready for production use

**Tested by:** ********\_\_\_********

**Date:** ********\_\_\_********

**Signature:** ********\_\_\_********

---

## Quick Reference

### Common Issues & Solutions

| Issue                          | Solution                                    |
| ------------------------------ | ------------------------------------------- |
| Image not showing on mobile    | Run "Fix All Image URLs"                    |
| Image not showing on admin-web | Check if file exists in storage             |
| Upload fails                   | Check file size, format, permissions        |
| Some images work, others don't | Run "Verify Images" to identify broken ones |
| All images broken after deploy | Check Supabase connection/credentials       |

### Useful Commands

```bash
# Check if admin-web is running
curl http://localhost:5173

# Check Supabase storage
# (via Supabase dashboard or API)

# View database image URLs
# SELECT id, name, image_url FROM products;
```

### Support Resources

- `IMAGE_FIX_SUMMARY.md` - Technical details
- `QUICK_FIX_GUIDE.md` - User guide
- `CHANGES_SUMMARY.md` - Complete changes
- `IMAGE_FLOW_DIAGRAM.md` - Visual diagrams








