/**
 * Converts a stored image path to a full Supabase Storage URL.
 * Handles various path formats consistently with mobile app:
 * - Full URLs (http/https) are returned as-is
 * - Paths with "products/" prefix
 * - Paths without any prefix (just filename)
 * - Paths already containing "product-images/"
 * - Legacy URLs missing the products/ subdirectory
 */
export const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vqxnkxaeriizizfmqvua.supabase.co';
  const baseUrl = `${supabaseUrl}/storage/v1/object/public`;
  
  // If it's already a full URL
  if (path.startsWith('http')) {
    // Fix legacy URLs that are missing the products/ subdirectory
    const legacyPattern = /\/product-images\/([^/]+\.(webp|png|jpg|jpeg))$/;
    if (legacyPattern.test(path)) {
      // Fix by inserting 'products/' before the filename
      return path.replace(legacyPattern, '/product-images/products/$1');
    }
    return path;
  }
  
  // Remove leading slashes for consistent processing
  const cleanPath = path.replace(/^\/+/, '');
  
  // If path already includes product-images/products/, use as-is
  if (cleanPath.includes('product-images/products/')) {
    return `${baseUrl}/${cleanPath}`;
  }
  
  // If path starts with products/, add the bucket name
  if (cleanPath.startsWith('products/')) {
    return `${baseUrl}/product-images/${cleanPath}`;
  }
  
  // If it's just a filename (no slashes), assume it's in the products folder
  if (!cleanPath.includes('/')) {
    return `${baseUrl}/product-images/products/${cleanPath}`;
  }
  
  // Fallback - assume it's a relative path in product-images bucket
  return `${baseUrl}/product-images/${cleanPath}`;
};
