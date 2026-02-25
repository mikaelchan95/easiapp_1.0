import { supabase } from '../lib/supabase';

export interface Brand {
  id: string;
  name: string;
  logo_url?: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const brandsService = {
  /**
   * Get all brands (including inactive for admin purposes)
   */
  async getAllBrands(): Promise<Brand[]> {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching brands:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllBrands:', error);
      return [];
    }
  },

  /**
   * Get only active brands
   */
  async getActiveBrands(): Promise<Brand[]> {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching brands:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActiveBrands:', error);
      return [];
    }
  },

  /**
   * Get brand names for dropdown
   */
  async getBrandNames(): Promise<string[]> {
    try {
      const brands = await this.getActiveBrands();
      return brands.map(b => b.name);
    } catch (error) {
      console.error('Error in getBrandNames:', error);
      return [];
    }
  },

  /**
   * Check if a brand exists by name (case-insensitive)
   */
  async brandExists(name: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id')
        .ilike('name', name)
        .limit(1);

      if (error) {
        console.error('Error checking brand existence:', error);
        return false;
      }

      return (data?.length ?? 0) > 0;
    } catch (error) {
      console.error('Error in brandExists:', error);
      return false;
    }
  },

  /**
   * Create a new brand
   */
  async createBrand(name: string): Promise<Brand | null> {
    try {
      // Check if already exists
      const exists = await this.brandExists(name);
      if (exists) {
        throw new Error(`Brand "${name}" already exists`);
      }

      // Get max sort_order to add at the end
      const { data: maxData } = await supabase
        .from('brands')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextSortOrder = (maxData?.[0]?.sort_order ?? 0) + 1;

      const { data, error } = await supabase
        .from('brands')
        .insert([
          {
            name,
            is_active: true,
            sort_order: nextSortOrder,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating brand:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createBrand:', error);
      throw error;
    }
  },
};
