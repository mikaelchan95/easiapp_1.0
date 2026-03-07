import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface InventoryProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock_quantity: number;
  stock_status: string;
  low_stock_threshold: number;
}

export interface InventoryData {
  products: InventoryProduct[];
  adjustments: Record<string, number>;
  loading: boolean;
  saving: boolean;
  setAdjustment: (id: string, value: number) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  saveAll: () => Promise<boolean>;
  hasChanges: boolean;
}

export function useInventoryData(): InventoryData {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(
          'id, name, sku, category, stock_quantity, stock_status, low_stock_threshold'
        )
        .order('name');

      if (error) {
        console.error('Inventory fetch error:', error);
        setLoading(false);
        return;
      }

      setProducts((data ?? []) as InventoryProduct[]);
    } catch (err) {
      console.error('Inventory fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  const setAdjustment = useCallback((id: string, value: number) => {
    setAdjustments(prev => {
      if (value === 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: value };
    });
  }, []);

  const increment = useCallback((id: string) => {
    setAdjustments(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }, []);

  const decrement = useCallback((id: string) => {
    setAdjustments(prev => ({ ...prev, [id]: (prev[id] || 0) - 1 }));
  }, []);

  const hasChanges = Object.values(adjustments).some(v => v !== 0);

  const saveAll = useCallback(async (): Promise<boolean> => {
    const entries = Object.entries(adjustments).filter(([, v]) => v !== 0);
    if (entries.length === 0) return true;

    setSaving(true);
    try {
      const updates = entries.map(([id, adj]) => {
        const product = products.find(p => p.id === id);
        if (!product) return Promise.resolve();
        const newQty = Math.max(0, product.stock_quantity + adj);
        const newStatus =
          newQty === 0
            ? 'out_of_stock'
            : newQty <= product.low_stock_threshold
              ? 'low_stock'
              : 'in_stock';
        return supabase
          .from('products')
          .update({
            stock_quantity: newQty,
            stock_status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      });

      await Promise.all(updates);

      setProducts(prev =>
        prev.map(p => {
          const adj = adjustments[p.id];
          if (!adj) return p;
          const newQty = Math.max(0, p.stock_quantity + adj);
          return {
            ...p,
            stock_quantity: newQty,
            stock_status:
              newQty === 0
                ? 'out_of_stock'
                : newQty <= p.low_stock_threshold
                  ? 'low_stock'
                  : 'in_stock',
          };
        })
      );
      setAdjustments({});
      return true;
    } catch (err) {
      console.error('Inventory save error:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [adjustments, products]);

  return {
    products,
    adjustments,
    loading,
    saving,
    setAdjustment,
    increment,
    decrement,
    saveAll,
    hasChanges,
  };
}
