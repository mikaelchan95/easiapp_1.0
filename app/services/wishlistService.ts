import { supabaseService } from './supabaseService';
import { Product } from '../utils/pricing';

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImageUrl?: string;
  productCategory?: string;
  productDescription?: string;
  dateAdded: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseWishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  product_image_url?: string;
  product_category?: string;
  product_description?: string;
  date_added: string;
  created_at: string;
  updated_at: string;
}

// Transform database wishlist item to app wishlist item
const transformDatabaseWishlistItem = (
  dbItem: DatabaseWishlistItem
): WishlistItem => ({
  id: dbItem.id,
  userId: dbItem.user_id,
  productId: dbItem.product_id,
  productName: dbItem.product_name,
  productPrice: dbItem.product_price,
  productImageUrl: dbItem.product_image_url,
  productCategory: dbItem.product_category,
  productDescription: dbItem.product_description,
  dateAdded: dbItem.date_added,
  createdAt: dbItem.created_at,
  updatedAt: dbItem.updated_at,
});

export const wishlistService = {
  // Get user's wishlist
  async getUserWishlist(userId: string): Promise<WishlistItem[]> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', userId)
        .order('date_added', { ascending: false });

      if (error) {
        console.error('Error fetching wishlist:', error);
        return [];
      }

      return data?.map(transformDatabaseWishlistItem) || [];
    } catch (error) {
      console.error('Error in getUserWishlist:', error);
      return [];
    }
  },

  // Check if product is in wishlist
  async isProductInWishlist(
    userId: string,
    productId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking wishlist:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isProductInWishlist:', error);
      return false;
    }
  },

  // Add product to wishlist
  async addToWishlist(
    userId: string,
    product: Product
  ): Promise<WishlistItem | null> {
    try {
      const wishlistItem = {
        user_id: userId,
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        product_image_url: product.imageUrl,
        product_category: product.category,
        product_description: product.description,
        date_added: new Date().toISOString(),
      };

      const { data, error } = await supabaseService.supabase
        .from('wishlist')
        .insert([wishlistItem])
        .select()
        .single();

      if (error) {
        console.error('Error adding to wishlist:', error);
        return null;
      }

      return transformDatabaseWishlistItem(data);
    } catch (error) {
      console.error('Error in addToWishlist:', error);
      return null;
    }
  },

  // Remove product from wishlist
  async removeFromWishlist(
    userId: string,
    productId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabaseService.supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) {
        console.error('Error removing from wishlist:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeFromWishlist:', error);
      return false;
    }
  },

  // Toggle product in wishlist
  async toggleWishlist(
    userId: string,
    product: Product
  ): Promise<{
    isInWishlist: boolean;
    item?: WishlistItem;
  }> {
    try {
      const isInWishlist = await this.isProductInWishlist(userId, product.id);

      if (isInWishlist) {
        const success = await this.removeFromWishlist(userId, product.id);
        return { isInWishlist: !success };
      } else {
        const item = await this.addToWishlist(userId, product);
        return { isInWishlist: !!item, item };
      }
    } catch (error) {
      console.error('Error in toggleWishlist:', error);
      return { isInWishlist: false };
    }
  },

  // Get wishlist item count for user
  async getWishlistCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabaseService.supabase
        .from('wishlist')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting wishlist count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getWishlistCount:', error);
      return 0;
    }
  },

  // Clear entire wishlist
  async clearWishlist(userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseService.supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing wishlist:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in clearWishlist:', error);
      return false;
    }
  },
};
