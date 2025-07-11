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
export const getSupabaseImageUrl = (bucketName: string, imagePath: string): string => {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(imagePath);
  return data.publicUrl;
};

/**
 * Convert product image URL to proper React Native image source
 */
export const getProductImageSource = (imageUrl?: string): ImageSource | null => {
  if (!imageUrl) return null;
  
  // If it's already a full URL, use it as is
  if (imageUrl.startsWith('http')) {
    return { uri: imageUrl };
  }
  
  // If it's a relative path, construct the full Supabase URL
  if (imageUrl.startsWith('/') || !imageUrl.includes('://')) {
    const fullUrl = getSupabaseImageUrl('product-images', imageUrl);
    return { uri: fullUrl };
  }
  
  return { uri: imageUrl };
};

/**
 * Get fallback image for products without images
 */
export const getProductFallbackImage = (): ImageSource => {
  // You can replace this with a proper fallback image URL
  return { uri: 'https://via.placeholder.com/300x300/f0f0f0/999999?text=No+Image' };
};

/**
 * Preload product images for better performance
 */
export const preloadProductImages = (imageUrls: string[]): void => {
  // React Native doesn't have a built-in preload mechanism
  // This is a placeholder for future implementation
  imageUrls.forEach(url => {
    // Could use libraries like react-native-fast-image for preloading
    console.log('Preloading image:', url);
  });
};