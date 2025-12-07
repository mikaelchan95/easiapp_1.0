
/**
 * Converts a stored image path to a full Supabase Storage URL.
 * Handles various path formats:
 * - Full URLs (http/https) are returned as-is
 * - Paths with "products/" prefix
 * - Paths without any prefix (just filename)
 * - Paths already containing "product-images/"
 */
export const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  
  // If it's already a full URL, return as-is
  if (path.startsWith('http')) return path;
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vqxnkxaeriizizfmqvua.supabase.co';
  const baseUrl = `${supabaseUrl}/storage/v1/object/public`;
  
  // If path already includes product-images/, use as-is
  if (path.includes('product-images/')) {
    return `${baseUrl}/${path}`;
  }
  
  // If path starts with products/, add the bucket name
  if (path.startsWith('products/')) {
    return `${baseUrl}/product-images/${path}`;
  }
  
  // If it's just a filename (no slashes), assume it's in the products folder
  if (!path.includes('/')) {
    return `${baseUrl}/product-images/products/${path}`;
  }
  
  // Fallback - assume it's a relative path in product-images bucket
  return `${baseUrl}/product-images/${path}`;
};
