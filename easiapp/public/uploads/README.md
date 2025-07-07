# Image Upload Directory Structure

This directory contains uploaded images organized by type:

## Directory Structure

```
public/uploads/
├── products/     # Product images (bottles, spirits, etc.)
├── users/        # User profile pictures and avatars
├── rewards/      # Reward/voucher images
└── temp/         # Temporary uploads (cleaned periodically)
```

## Guidelines

- **Products**: High-quality product photos, preferably 800x800px or larger
- **Users**: Profile pictures, max 500x500px, formats: jpg, png, webp
- **Rewards**: Voucher and reward images for the rewards system
- **Temp**: Temporary storage for uploads during processing

## File Naming Convention

- Use descriptive names with hyphens: `product-name-variant.jpg`
- Include timestamps for uniqueness: `user-avatar-1640995200.jpg`
- Avoid spaces and special characters

## Supported Formats

- **Images**: JPG, PNG, WebP
- **Max file size**: 5MB per image
- **Recommended**: WebP format for better compression