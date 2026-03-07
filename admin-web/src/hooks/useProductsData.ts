import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Product } from '../types/product';

export interface ProductKPIs {
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
  totalValue: number;
  totalTrend: number | null;
  activeTrend: number | null;
  lowStockTrend: number | null;
  valueTrend: number | null;
}

export interface ProductsData {
  products: Product[];
  categories: string[];
  kpis: ProductKPIs;
  loading: boolean;
}

function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return cur > 0 ? 100 : null;
  return ((cur - prev) / prev) * 100;
}

export function useProductsData(): ProductsData {
  const [data, setData] = useState<ProductsData>({
    products: [],
    categories: [],
    kpis: {
      totalProducts: 0,
      activeProducts: 0,
      lowStockCount: 0,
      totalValue: 0,
      totalTrend: null,
      activeTrend: null,
      lowStockTrend: null,
      valueTrend: null,
    },
    loading: true,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('name')
          .eq('is_active', true)
          .order('sort_order')
          .order('name'),
      ]);

      if (productsRes.error) {
        console.error('Products fetch error:', productsRes.error);
        setData(prev => ({ ...prev, loading: false }));
        return;
      }

      const products = (productsRes.data ?? []) as Product[];
      const categories = (categoriesRes.data ?? []).map(
        (c: { name: string }) => c.name
      );

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      let totalProducts = 0;
      let activeProducts = 0;
      let lowStockCount = 0;
      let totalValue = 0;

      let prevTotal = 0;
      let prevActive = 0;
      let prevLowStock = 0;
      let prevValue = 0;

      for (const p of products) {
        const created = new Date(p.created_at);
        const stock = p.stock_quantity ?? 0;
        const threshold = p.low_stock_threshold ?? 10;
        const price = Number(p.retail_price) || 0;
        const isLow = stock > 0 && stock <= threshold;

        totalProducts++;
        if (p.is_active) activeProducts++;
        if (isLow) lowStockCount++;
        totalValue += price * stock;

        if (created < monthStart) {
          prevTotal++;
          if (p.is_active) prevActive++;
          if (isLow) prevLowStock++;
          prevValue += price * stock;
        }

        if (created < prevMonthStart) {
          prevTotal--;
          if (p.is_active) prevActive--;
          if (isLow) prevLowStock--;
          prevValue -= price * stock;
        }
      }

      setData({
        products,
        categories,
        kpis: {
          totalProducts,
          activeProducts,
          lowStockCount,
          totalValue,
          totalTrend: pctChange(totalProducts, prevTotal),
          activeTrend: pctChange(activeProducts, prevActive),
          lowStockTrend: pctChange(lowStockCount, prevLowStock),
          valueTrend: pctChange(totalValue, prevValue),
        },
        loading: false,
      });
    } catch (err) {
      console.error('Products fetch error:', err);
      setData(prev => ({ ...prev, loading: false }));
    }
  }

  return data;
}
