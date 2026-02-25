import { supabase } from '../../utils/supabase';

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
   * Get all active brands sorted by sort_order
   */
  async getBrands(): Promise<Brand[]> {
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
      console.error('Error in getBrands:', error);
      return [];
    }
  },

  /**
   * Get brand by name
   */
  async getBrandByName(name: string): Promise<Brand | null> {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('name', name)
        .maybeSingle();

      if (error) {
        console.error('Error fetching brand:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getBrandByName:', error);
      return null;
    }
  },

  /**
   * Get all brand names for dropdown/filter use
   */
  async getBrandNames(): Promise<string[]> {
    try {
      const brands = await this.getBrands();
      return brands.map(b => b.name);
    } catch (error) {
      console.error('Error in getBrandNames:', error);
      return [];
    }
  },

  /**
   * Subscribe to brand changes (real-time)
   */
  subscribeToBrandChanges(callback: (payload: any) => void) {
    return supabase
      .channel('brands-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'brands',
        },
        payload => {
          callback(payload);
        }
      )
      .subscribe();
  },

  /**
   * Unsubscribe from brand changes
   */
  unsubscribeFromBrandChanges(subscription: any) {
    if (subscription) {
      subscription.unsubscribe();
    }
  },
};








