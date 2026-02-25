/**
 * Utility to standardize product image URLs in the database
 * Run this from the browser console or as a maintenance script
 */

import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  image_url: string | null;
}

/**
 * Product name to correct image filename mapping
 * Based on actual files in Supabase storage
 */
const PRODUCT_IMAGE_MAPPING: Record<string, string> = {
  // Macallan products
  'macallan 12': 'macallan-12-double-cask.webp',
  'macallan 18': 'macallan-18-sherry-oak.webp',
  'macallan 25': 'macallan-25-sherry-oak.webp',
  'macallan 30': 'macallan-30-sherry-oak.webp',
  // Dom Pérignon
  'dom pérignon': 'dom-perignon-2013.webp',
  'dom perignon': 'dom-perignon-2013.webp',
  // Château Margaux
  'château margaux': 'chateau-margaux-2015-1.png',
  'chateau margaux': 'chateau-margaux-2015-1.png',
  margaux: 'margaux-919557.webp',
  // Hennessy
  hennessy: 'HENNESSY-PARADIS-70CL-CARAFE-2000x2000px.webp',
  'hennessy paradis': 'HENNESSY-PARADIS-70CL-CARAFE-2000x2000px.webp',
  // Johnnie Walker
  'johnnie walker': 'Johnnie-Walker-Blue-Label-750ml-600x600.webp',
  'johnnie walker blue': 'Johnnie-Walker-Blue-Label-750ml-600x600.webp',
  'blue label': 'Johnnie-Walker-Blue-Label-750ml-600x600.webp',
  // Eldoria
  eldoria: 'eldoria-elderflower-liqueur.webp',
  'eldoria elderflower': 'eldoria-elderflower-liqueur.webp',
};

/**
 * Get the correct filename based on product name
 */
const getImageFilenameByProductName = (productName: string): string | null => {
  const normalizedName = productName.toLowerCase().trim();
  if (PRODUCT_IMAGE_MAPPING[normalizedName]) {
    return PRODUCT_IMAGE_MAPPING[normalizedName];
  }
  for (const [key, filename] of Object.entries(PRODUCT_IMAGE_MAPPING)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return filename;
    }
  }
  return null;
};

/**
 * Normalizes an image path to the standard format: products/filename.ext
 * This ensures consistency across the app
 */
export const normalizeImagePath = (path: string | null, productName?: string): string | null => {
  if (!path) {
    if (productName) {
      const filename = getImageFilenameByProductName(productName);
      return filename ? `products/${filename}` : null;
    }
    return null;
  }
  
  // Handle placeholder URLs from example.com
  if (path.startsWith('http') && path.includes('example.com') && productName) {
    const filename = getImageFilenameByProductName(productName);
    if (filename) {
      return `products/${filename}`;
    }
  }

  // If it's a full URL, extract just the path part
  if (path.startsWith('http')) {
    try {
      const url = new URL(path);
      const pathParts = url.pathname.split('/');
      const filename = pathParts[pathParts.length - 1];
      return `products/${filename}`;
    } catch {
      return null;
    }
  }

  // Remove leading slashes
  const cleanPath = path.replace(/^\/+/, '');

  // If already in correct format (products/filename.ext), return as-is
  if (cleanPath.startsWith('products/') && cleanPath.split('/').length === 2) {
    return cleanPath;
  }

  // If it includes product-images/, extract just filename
  if (cleanPath.includes('product-images/')) {
    const parts = cleanPath.split('/');
    const filename = parts[parts.length - 1];
    return `products/${filename}`;
  }

  // If it's just a filename, add products/ prefix
  if (!cleanPath.includes('/')) {
    return `products/${cleanPath}`;
  }

  // If format is unclear, extract filename and standardize
  const parts = cleanPath.split('/');
  const filename = parts[parts.length - 1];
  return `products/${filename}`;
};

/**
 * Fixes all product image URLs in the database
 * @returns Object with results of the operation
 */
export const fixAllProductImageUrls = async (): Promise<{
  success: boolean;
  message: string;
  updated: number;
  errors: string[];
}> => {
  try {
    // Fetch all products with image URLs
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, image_url')
      .not('image_url', 'is', null);

    if (fetchError) {
      return {
        success: false,
        message: 'Failed to fetch products',
        updated: 0,
        errors: [fetchError.message],
      };
    }

    if (!products || products.length === 0) {
      return {
        success: true,
        message: 'No products with images found',
        updated: 0,
        errors: [],
      };
    }

    const updates: Array<Promise<any>> = [];
    const errors: string[] = [];
    let updated = 0;

    for (const product of products as Product[]) {
      const normalized = normalizeImagePath(product.image_url, product.name);

      // Only update if the path changed
      if (normalized && normalized !== product.image_url) {
        console.log(
          `Updating ${product.name}: ${product.image_url} → ${normalized}`
        );

        updates.push(
          supabase
            .from('products')
            .update({ image_url: normalized })
            .eq('id', product.id)
            .then(({ error }) => {
              if (error) {
                errors.push(
                  `Failed to update ${product.name}: ${error.message}`
                );
              } else {
                updated++;
              }
            })
        );
      }
    }

    // Execute all updates
    await Promise.all(updates);

    return {
      success: errors.length === 0,
      message: `Updated ${updated} product image URLs`,
      updated,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Unexpected error',
      updated: 0,
      errors: [(error as Error).message],
    };
  }
};

/**
 * Verifies that all product images are accessible
 * @returns List of products with broken image URLs
 */
export const verifyProductImages = async (): Promise<{
  total: number;
  accessible: number;
  broken: Array<{ id: string; name: string; image_url: string }>;
}> => {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, image_url')
    .not('image_url', 'is', null);

  if (!products) {
    return { total: 0, accessible: 0, broken: [] };
  }

  const broken: Array<{ id: string; name: string; image_url: string }> = [];
  let accessible = 0;

  for (const product of products as Product[]) {
    if (!product.image_url) continue;

    try {
      // Check if image exists in storage
      const path = normalizeImagePath(product.image_url, product.name);
      if (!path) {
        broken.push(product);
        continue;
      }

      const { data, error } = await supabase.storage
        .from('product-images')
        .list('products', {
          search: path.replace('products/', ''),
        });

      if (error || !data || data.length === 0) {
        broken.push(product);
      } else {
        accessible++;
      }
    } catch {
      broken.push(product);
    }
  }

  return {
    total: products.length,
    accessible,
    broken,
  };
};

/**
 * Browser console helper - call this to fix all image URLs
 * Usage: Open browser console on admin web and run:
 * 
 *   import { fixAllProductImageUrls } from './utils/fixImageUrls';
 *   fixAllProductImageUrls().then(console.log);
 */
if (typeof window !== 'undefined') {
  (window as any).fixProductImageUrls = fixAllProductImageUrls;
  (window as any).verifyProductImages = verifyProductImages;
  console.log('Image fix utilities loaded. Available commands:');
  console.log('  - fixProductImageUrls()');
  console.log('  - verifyProductImages()');
}
