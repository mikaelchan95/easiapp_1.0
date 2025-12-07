/**
 * Image utility functions for handling Supabase storage URLs
 */

import { supabase } from '../config/supabase';

export interface ImageSource {
  uri: string;
}

/**
 * Get the full Supabase storage URL for an image
 */
export const getSupabaseImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;

  // Direct approach - construct the correct URL format
  // Based on the storage listing: /product-images/products/filename.webp
  const cleanPath = imagePath.replace(/^\/+/, ''); // Remove leading slashes

  // If it already looks like a full path with product-images, use as-is
  if (cleanPath.includes('product-images/products/')) {
    return `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/${cleanPath}`;
  }

  // If it's just a filename, add the full path
  if (!cleanPath.includes('/')) {
    return `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/${cleanPath}`;
  }

  // If it starts with products/, add the bucket name
  if (cleanPath.startsWith('products/')) {
    return `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/${cleanPath}`;
  }

  // Default - assume it's a filename
  return `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/${cleanPath}`;
};

/**
 * Product name to image filename mapping
 * Based on the actual files in the storage bucket
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
};

/**
 * Get image filename based on product name
 */
const getImageFilenameByProductName = (productName: string): string => {
  const normalizedName = productName.toLowerCase().trim();

  // Check for exact matches first
  if (PRODUCT_IMAGE_MAPPING[normalizedName]) {
    return PRODUCT_IMAGE_MAPPING[normalizedName];
  }

  // Check for partial matches
  for (const [key, filename] of Object.entries(PRODUCT_IMAGE_MAPPING)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return filename;
    }
  }

  // Default fallback
  return 'placeholder-product.webp';
};

/**
 * Convert product image URL to proper React Native image source
 */
export const getProductImageSource = (
  imageUrl?: string,
  productName?: string
): ImageSource | null => {
  // 1. If we have a valid image URL from the database, use it
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
    // Check if it's already a full URL
    if (imageUrl.startsWith('http')) {
      return { uri: imageUrl };
    }
    // Otherwise construct the full Supabase URL
    return { uri: getSupabaseImageUrl(imageUrl) };
  }

  // 2. Fallback to smart mapping based on product name if provided
  if (productName) {
    const filename = getImageFilenameByProductName(productName);
    const mappedUrl = `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/${filename}`;
    return { uri: mappedUrl };
  }

  // 3. Last resort fallback
  return getProductFallbackImage();
};

/**
 * Get fallback image for products without images
 */
export const getProductFallbackImage = (): ImageSource => {
  return {
    uri: 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?w=400&h=400&fit=crop',
  };
};

/**
 * Preload product images for better performance
 */
export const preloadProductImages = (imageUrls: string[]): void => {
  // React Native doesn't have a built-in preload mechanism
  // This is a placeholder for future implementation
  imageUrls.forEach(url => {
    // Could use libraries like react-native-fast-image for preloading
  });
};
