import { supabase } from '../../utils/supabase';
import { Product } from '../utils/pricing';

export interface ProductFilters {
  category?: string;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  sortBy?: 'name' | 'price' | 'rating' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface DatabaseProduct {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  retail_price: number;
  trade_price: number;
  original_price?: number;
  image_url: string;
  rating: number;
  volume?: string;
  alcohol_content?: string;
  country_of_origin?: string;
  is_limited: boolean;
  is_featured: boolean;
  is_active: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

// Helper function to generate Supabase Storage URL
const getSupabaseStorageUrl = (path: string): string => {
  // If it's just a filename (no slashes), add the full path
  if (!path.includes('/')) {
    return `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/${path}`;
  }
  // If path already includes product-images/, use as-is
  if (path.includes('product-images/')) {
    return `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/${path}`;
  }
  // If path starts with products/, add the bucket name
  if (path.startsWith('products/')) {
    return `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/${path}`;
  }
  // Fallback - assume it's a full relative path
  return `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/${path}`;
};

// Transform database product to app Product format
const transformDatabaseProductToProduct = (
  dbProduct: DatabaseProduct
): Product => {
  const finalImageUrl = dbProduct.image_url
    ? dbProduct.image_url.startsWith('http')
      ? dbProduct.image_url
      : getSupabaseStorageUrl(dbProduct.image_url)
    : null;


  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    price: dbProduct.retail_price,
    originalPrice: dbProduct.original_price,
    category: dbProduct.category,
    imageUrl: finalImageUrl,
    retailPrice: dbProduct.retail_price,
    tradePrice: dbProduct.trade_price,
    rating: dbProduct.rating,
    volume: dbProduct.volume,
    alcoholContent: dbProduct.alcohol_content,
    countryOfOrigin: dbProduct.country_of_origin,
    isLimited: dbProduct.is_limited,
    isFeatured: dbProduct.is_featured,
    sku: dbProduct.sku,
  };
};

// Column existence check function removed as it's not used

export const productsService = {
  // Get products with filters
  async getProducts(filters: ProductFilters = {}): Promise<Product[]> {
    let query = supabase.from('products').select('*');

    // Add is_active filter (column exists in database)
    query = query.eq('is_active', true);

    // Apply filters
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters.featured) {
      query = query.eq('is_featured', true);
    }

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,category.ilike.%${filters.search}%`
      );
    }

    if (filters.priceRange) {
      query = query
        .gte('retail_price', filters.priceRange.min)
        .lte('retail_price', filters.priceRange.max);
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    if (filters.limit) {
      if (filters.offset) {
        query = query.range(
          filters.offset,
          filters.offset + filters.limit - 1
        );
      } else {
        query = query.limit(filters.limit);
      }
    }

    const { data: products, error } = await query;

    if (error) {
      throw error;
    }

    return products ? products.map(transformDatabaseProductToProduct) : [];
  },

  // Get single product by ID
  async getProductById(productId: string): Promise<Product | null> {
    try {
      let query = supabase.from('products').select('*').eq('id', productId);

      // Don't add is_active filter since the column doesn't exist in the current database
      // When the database is properly set up, uncomment: query = query.eq('is_active', true);

      const { data: product, error } = await query.maybeSingle();

      if (error) {
        throw error;
      }

      return product ? transformDatabaseProductToProduct(product) : null;
    } catch (error) {
      return null;
    }
  },

  // Get products by category
  async getProductsByCategory(
    category: string,
    limit?: number
  ): Promise<Product[]> {
    return this.getProducts({
      category: category === 'all' ? undefined : category,
      limit,
      sortBy: 'rating',
      sortOrder: 'desc',
    });
  },

  // Get featured products
  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    return this.getProducts({
      featured: true,
      limit,
      sortBy: 'rating',
      sortOrder: 'desc',
    });
  },

  // Search products
  async searchProducts(
    searchTerm: string,
    filters: Omit<ProductFilters, 'search'> = {}
  ): Promise<Product[]> {
    return this.getProducts({
      ...filters,
      search: searchTerm,
    });
  },

  // Get product categories
  async getProductCategories(): Promise<string[]> {
    try {
      let query = supabase
        .from('products')
        .select('category')
        .order('category');

      // Don't add is_active filter since the column doesn't exist in the current database
      // When the database is properly set up, uncomment: query = query.eq('is_active', true);

      const { data: categories, error } = await query;

      if (error) {
        throw error;
      }

      // Extract unique categories
      const uniqueCategories = [
        ...new Set(categories?.map(item => item.category) || []),
      ];
      return uniqueCategories;
    } catch (error) {
      // Return default categories on error
      return ['Scotch', 'Champagne', 'Cognac', 'Japanese Whisky'];
    }
  },

  // Check product availability
  async checkProductAvailability(
    productId: string,
    quantity: number
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId);

      // Don't add is_active filter since the column doesn't exist in the current database
      // When the database is properly set up, uncomment: query = query.eq('is_active', true);

      const { data: product, error } = await query.maybeSingle();

      if (error) {
        return false;
      }

      return product ? product.stock_quantity >= quantity : false;
    } catch (error) {
      return false;
    }
  },

  // Get stock info for a product
  async getProductStock(
    productId: string
  ): Promise<{ inStock: boolean; quantity: number; lowStock: boolean } | null> {
    try {
      let query = supabase
        .from('products')
        .select('stock_quantity, low_stock_threshold')
        .eq('id', productId);

      // Don't add is_active filter since the column doesn't exist in the current database
      // When the database is properly set up, uncomment: query = query.eq('is_active', true);

      const { data: product, error } = await query.maybeSingle();

      if (error) {
        return null;
      }

      if (!product) return null;

      return {
        inStock: product.stock_quantity > 0,
        quantity: product.stock_quantity,
        lowStock: product.stock_quantity <= product.low_stock_threshold,
      };
    } catch (error) {
      return null;
    }
  },

  // Subscribe to product changes (real-time)
  subscribeToProductChanges(callback: (payload: any) => void) {
    return supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        payload => {
          // Only log significant changes in development
          callback(payload);
        }
      )
      .subscribe();
  },

  // Unsubscribe from product changes
  unsubscribeFromProductChanges(subscription: any) {
    if (subscription) {
      subscription.unsubscribe();
    }
  },
};
