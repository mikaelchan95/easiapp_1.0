# Image Management Flow - Before & After

## BEFORE FIX ❌

### Upload Flow (Admin Web → Database)

```
Admin Web
   │
   │ Upload Image
   ↓
ImageUpload Component
   │
   │ stores: products/filename.ext
   ↓
Database (products.image_url)
   │
   │ value: "products/eldoria.webp"
   ↓
Mobile App
   │
   │ getProductImageSource()
   ↓
❌ Checks PRODUCT_IMAGE_MAPPING first
   │
   │ Not found in mapping or wrong filename
   ↓
❌ BROKEN - Image doesn't display
```

### Manual Upload Flow (Supabase → Database)

```
Supabase Storage
   │
   │ Upload to: product-images/macallan.webp
   │ (missing products/ subdirectory)
   ↓
Database (products.image_url)
   │
   │ Manual insert: "https://...supabase.co/.../product-images/macallan.webp"
   │ OR: "macallan.webp"
   │ OR: "product-images/macallan.webp"
   ↓
Admin Web
   │
   │ getImageUrl()
   ↓
❌ Can't find file at constructed path
   │
   │ Tries: .../product-images/products/macallan.webp
   │ But file is at: .../product-images/macallan.webp
   ↓
❌ BROKEN - Image doesn't display
```

---

## AFTER FIX ✅

### Upload Flow (Admin Web → Database → Mobile)

```
Admin Web
   │
   │ Upload Image
   ↓
ImageUpload Component
   │
   │ stores: products/filename.ext
   ↓
Supabase Storage
   │
   │ uploads to: product-images/products/filename.ext
   ↓
Database (products.image_url)
   │
   │ value: "products/eldoria.webp"
   ↓
                      ┌──────────────┐
                      │              │
         ┌────────────┤   Database   ├────────────┐
         │            │              │            │
         │            └──────────────┘            │
         │                                        │
         ↓                                        ↓

   Admin Web                                Mobile App
      │                                         │
      │ getImageUrl()                           │ getProductImageSource()
      ↓                                         ↓
      │                                         │
      │ Normalizes to:                          │ Uses database URL (PRIMARY)
      │ .../product-images/products/eldoria.webp│ .../product-images/products/eldoria.webp
      ↓                                         ↓

✅ Image displays correctly              ✅ Image displays correctly
```

### Standardization Flow (Fix Existing Images)

```
Admin Web → Maintenance Page
   │
   │ Click "Fix All Image URLs"
   ↓
fixAllProductImageUrls()
   │
   │ Scans database for all products
   ↓

Product A: "https://...supabase.co/.../product-images/products/file.webp"
   │
   │ normalizeImagePath()
   ↓
✅ "products/file.webp"


Product B: "product-images/products/file.webp"
   │
   │ normalizeImagePath()
   ↓
✅ "products/file.webp"


Product C: "file.webp"
   │
   │ normalizeImagePath()
   ↓
✅ "products/file.webp"


Product D: "products/file.webp" (already correct)
   │
   │ normalizeImagePath()
   ↓
✅ "products/file.webp" (no change)

   │
   │ Batch update database
   ↓

Database now has all standardized paths
   │
   ↓

Both Admin Web & Mobile App work correctly ✅
```

---

## Path Resolution Logic

### Mobile App (`getProductImageSource`)

```
┌─────────────────────────────┐
│ Input: imageUrl, productName│
└──────────────┬──────────────┘
               │
               ↓
        ┌──────────────┐
        │Has imageUrl? │
        └──────┬───────┘
               │
         YES───┤───NO
               │       │
               ↓       ↓
    ┌──────────────────┐    ┌──────────────────────┐
    │getSupabaseImageUrl│    │Has productName?      │
    │                   │    │                      │
    │Normalizes path    │    │Check mapping         │
    │Returns full URL   │    │PRODUCT_IMAGE_MAPPING │
    └────────┬──────────┘    └───────┬──────────────┘
             │                       │
             ↓                 YES───┤───NO
       ✅ Use database URL            │       │
                                     ↓       ↓
                           ✅ Use mapping  ❓ Fallback
```

### Admin Web (`getImageUrl`)

```
┌────────────┐
│Input: path │
└─────┬──────┘
      │
      ↓
┌─────────────┐
│Full URL?    │
│(starts http)│
└──────┬──────┘
       │
  YES──┤──NO
       │      │
       ↓      ↓
  ┌────────────────┐      ┌────────────────────┐
  │Fix legacy      │      │Remove leading slash│
  │pattern?        │      │                    │
  │/product-images/│      │Clean path          │
  │file.ext        │      └──────┬─────────────┘
  │                │             │
  │Add products/   │             ↓
  └────┬───────────┘      ┌───────────────────┐
       │                  │Already has         │
       │                  │product-images/     │
       │                  │products/?          │
       │                  └────┬───────────────┘
       │                       │
       │                 YES───┤───NO
       │                       │      │
       ↓                       ↓      ↓
  ✅ Return fixed        ✅ Use as-is  Continue...
                                      │
                              ┌───────┴──────────┐
                              │Starts products/? │
                              └────┬──────────────┘
                                   │
                             YES───┤───NO
                                   │      │
                                   ↓      ↓
                        ✅ Add bucket   ┌──────────────┐
                           name         │Just filename?│
                                       │(no slashes)  │
                                       └────┬─────────┘
                                            │
                                      YES───┤───NO
                                            │      │
                                            ↓      ↓
                                    ✅ Add full  ✅ Assume
                                       path        relative
```

---

## Standard Path Examples

### ✅ Correct Formats

```
Database Storage:
├─ products/eldoria-elderflower-liqueur.webp
├─ products/macallan-18-sherry-oak.webp
└─ products/hennessy-paradis.webp

Constructed Full URL:
https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/eldoria-elderflower-liqueur.webp

Supabase Storage:
product-images/
└── products/
    ├── eldoria-elderflower-liqueur.webp  ✅
    ├── macallan-18-sherry-oak.webp       ✅
    └── hennessy-paradis.webp             ✅
```

### ❌ Incorrect Formats (Before Fix)

```
Database Storage:
├─ https://...supabase.co/.../product-images/file.webp  ❌ Full URL
├─ product-images/products/file.webp                    ❌ Includes bucket
├─ file.webp                                           ❌ Just filename
└─ /products/file.webp                                 ❌ Leading slash

These get normalized to:
└─ products/file.webp  ✅
```

---

## Data Flow Comparison

### Image Upload

```
BEFORE:                          AFTER:
┌──────────┐                    ┌──────────┐
│Admin Web │                    │Admin Web │
└────┬─────┘                    └────┬─────┘
     │                               │
     │ products/file.webp            │ products/file.webp
     ↓                               ↓
┌──────────┐                    ┌──────────┐
│Database  │                    │Database  │
└────┬─────┘                    └────┬─────┘
     │                               │
     │                               ├─────────────┐
     ↓                               ↓             ↓
┌──────────┐                    ┌──────────┐ ┌──────────┐
│Mobile App│                    │Admin Web │ │Mobile App│
└────┬─────┘                    └────┬─────┘ └────┬─────┘
     │                               │             │
     │ Checks mapping first          │ Uses DB URL │ Uses DB URL
     ↓                               ↓             ↓

❌ eldoria not in mapping         ✅ Works       ✅ Works
❌ Image broken
```

### Manual Upload

```
BEFORE:                          AFTER:
┌──────────┐                    ┌──────────┐
│Supabase  │                    │Supabase  │
│Storage   │                    │Storage   │
└────┬─────┘                    └────┬─────┘
     │                               │
     │ product-images/file.webp      │ product-images/products/file.webp
     ↓                               ↓
┌──────────┐                    ┌──────────┐
│Database  │                    │Database  │
│(manual)  │                    │(manual)  │
└────┬─────┘                    └────┬─────┘
     │                               │
     │ Inconsistent path             │ Run "Fix All"
     ↓                               ↓
┌──────────┐                    ┌──────────┐
│Admin Web │                    │Database  │
└────┬─────┘                    │(updated) │
     │                          └────┬─────┘
     │ Constructs wrong path         │
     ↓                               │
                                     ├─────────────┐
❌ Image broken                       ↓             ↓
                                ┌──────────┐ ┌──────────┐
                                │Admin Web │ │Mobile App│
                                └────┬─────┘ └────┬─────┘
                                     │             │
                                     │ Normalizes  │ Uses DB URL
                                     ↓             ↓

                                   ✅ Works       ✅ Works
```

---

## Key Takeaways

### Before Fix

- ❌ Hardcoded mapping overrode database
- ❌ No path normalization
- ❌ Manual uploads broke admin-web
- ❌ Admin-web uploads broke mobile

### After Fix

- ✅ Database is source of truth
- ✅ Automatic path normalization
- ✅ Legacy paths handled
- ✅ Works consistently everywhere
- ✅ Easy to fix existing issues (Maintenance page)

### Standard Format

```
Database:    products/filename.ext
Storage:     product-images/products/filename.ext
Full URL:    https://.../product-images/products/filename.ext
```

### Priority Order

```
Mobile App:
  1. Database URL (image_url)  ← PRIMARY
  2. Product name mapping      ← FALLBACK
  3. Default placeholder       ← LAST RESORT

Admin Web:
  1. Database URL (image_url)  ← ONLY SOURCE
  2. Normalize any format      ← AUTOMATIC
  3. Construct full URL        ← CONSISTENT
```








