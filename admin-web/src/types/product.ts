
export interface SizeOption {
  size: string;
  retail_price: number;
  trade_price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  retail_price: number;
  trade_price: number;
  original_price?: number;
  promo_price?: number | null;
  promo_start_date?: string | null;
  promo_end_date?: string | null;
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
  size_options?: SizeOption[];
}

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'retail_price' | 'created_at' | 'stock_quantity';
  sortOrder?: 'asc' | 'desc';
}
