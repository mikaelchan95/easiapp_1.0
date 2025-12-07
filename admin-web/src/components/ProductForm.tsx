import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Product, SizeOption } from '../types/product';
import ImageUpload from './ImageUpload';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

// Default initial state
const INITIAL_PRODUCT: Partial<Product> = {
  name: '',
  description: '',
  category: 'Scotch',
  retail_price: 0,
  trade_price: 0,
  promo_price: null,
  promo_start_date: null,
  promo_end_date: null,
  stock_quantity: 0,
  low_stock_threshold: 5,
  is_active: true,
  is_featured: false,
  is_limited: false,
  rating: 0,
  sku: '',
  image_url: '',
  size_options: [],
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>(INITIAL_PRODUCT);
  const [categories, setCategories] = useState<string[]>([]);

  // State for new variant input
  const [newVariant, setNewVariant] = useState<SizeOption>({
    size: '',
    retail_price: 0,
    trade_price: 0,
  });

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchProduct(id);
    } else {
      setFetched(true);
    }
  }, [id]);

  const fetchCategories = async () => {
    // Fetch from the dedicated categories table
    const { data } = await supabase
      .from('categories')
      .select('name')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (data && data.length > 0) {
      setCategories(data.map(c => c.name));
    } else {
      // Fallback if categories table is empty (e.g. before migration)
      const { data: productData } = await supabase
        .from('products')
        .select('category');
      const unique = Array.from(
        new Set([
          'Scotch',
          'Champagne',
          'Cognac',
          'Japanese Whisky',
          'Wine',
          'Vodka',
          'Gin',
          ...(productData?.map(d => d.category) || []),
        ])
      );
      setCategories(unique.sort());
    }
  };

  const fetchProduct = async (productId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      alert('Error fetching product');
      navigate('/products');
    } else if (data) {
      // Ensure size_options is initialized
      setFormData({
        ...data,
        size_options: data.size_options || [],
      });
    }
    setLoading(false);
    setFetched(true);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    // Handle checking constraints
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }

    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddVariant = () => {
    if (!newVariant.size || newVariant.retail_price <= 0) {
      alert('Please enter valid size and price');
      return;
    }
    setFormData(prev => ({
      ...prev,
      size_options: [...(prev.size_options || []), newVariant],
    }));
    setNewVariant({ size: '', retail_price: 0, trade_price: 0 });
  };

  const handleRemoveVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      size_options: (prev.size_options || []).filter((_, i) => i !== index),
    }));
  };

  const hasVariants = formData.size_options && formData.size_options.length > 0;

  useEffect(() => {
    // If we have variants, update the main price to match the first/min variant price
    if (hasVariants && formData.size_options!.length > 0) {
      // Find min price for display
      const minRetail = Math.min(
        ...formData.size_options!.map(v => v.retail_price)
      );
      const minTrade = Math.min(
        ...formData.size_options!.map(v => v.trade_price)
      );

      if (
        minRetail !== formData.retail_price ||
        minTrade !== formData.trade_price
      ) {
        setFormData(prev => ({
          ...prev,
          retail_price: minRetail,
          trade_price: minTrade,
        }));
      }
    }
  }, [formData.size_options]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      if (!isEditMode) {
        // New product
        // Generate a SKU if missing? Or require it. Let's rely on user for now.
        if (!payload.sku) payload.sku = `SKU-${Date.now()}`;
      }

      let error;
      if (isEditMode) {
        const { error: updateError } = await supabase
          .from('products')
          .update(payload)
          .eq('id', id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('products')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      navigate('/products');
    } catch (error) {
      alert('Error saving product: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!fetched && isEditMode)
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--text-primary)]"></div>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <div className="mb-6 flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => navigate('/products')}
          className="rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] p-2 text-[var(--text-secondary)] shadow-sm transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] min-w-[40px] min-h-[40px] touch-manipulation"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
          {isEditMode ? 'Edit Product' : 'New Product'}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3"
      >
        {/* Left Column - Main Info */}
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] p-4 sm:p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
              Basic Information
            </h2>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px] touch-manipulation"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku || ''}
                    onChange={handleChange}
                    placeholder="Auto-generated if empty"
                    className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Unified Pricing Section */}
          <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] p-4 sm:p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
              Pricing
            </h2>

            <div className="space-y-5">
              {/* Toggle for variants mode */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasVariants}
                  onChange={e => {
                    if (!e.target.checked) {
                      // Switching OFF variants - clear them
                      setFormData(prev => ({ ...prev, size_options: [] }));
                    } else {
                      // Switching ON variants - add a default one with current prices
                      setFormData(prev => ({
                        ...prev,
                        size_options: [
                          {
                            size: 'Standard',
                            retail_price: prev.retail_price || 0,
                            trade_price: prev.trade_price || 0,
                          },
                        ],
                      }));
                    }
                  }}
                  className="h-5 w-5 rounded border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-[var(--text-primary)]"
                />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  This product has multiple sizes / variants
                </span>
              </label>

              {!hasVariants ? (
                /* Simple pricing - no variants */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                      Retail Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                        S$
                      </span>
                      <input
                        type="number"
                        name="retail_price"
                        step="0.01"
                        min="0"
                        value={formData.retail_price}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] pl-10 pr-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                      Trade Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                        S$
                      </span>
                      <input
                        type="number"
                        name="trade_price"
                        step="0.01"
                        min="0"
                        value={formData.trade_price}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] pl-10 pr-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Variants pricing */
                <div className="space-y-4">
                  {/* Variant list */}
                  <div className="space-y-2">
                    {formData.size_options?.map((variant, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)]/30"
                      >
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={variant.size}
                            onChange={e => {
                              const updated = [
                                ...(formData.size_options || []),
                              ];
                              updated[idx] = {
                                ...updated[idx],
                                size: e.target.value,
                              };
                              setFormData(prev => ({
                                ...prev,
                                size_options: updated,
                              }));
                            }}
                            className="w-full bg-transparent font-semibold text-[var(--text-primary)] border-0 p-0 focus:outline-none focus:ring-0"
                            placeholder="Size name"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24">
                            <label className="block text-[10px] text-[var(--text-tertiary)] mb-0.5">
                              Retail
                            </label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">
                                $
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={variant.retail_price || ''}
                                onChange={e => {
                                  const updated = [
                                    ...(formData.size_options || []),
                                  ];
                                  updated[idx] = {
                                    ...updated[idx],
                                    retail_price:
                                      parseFloat(e.target.value) || 0,
                                  };
                                  setFormData(prev => ({
                                    ...prev,
                                    size_options: updated,
                                  }));
                                }}
                                className="w-full rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] pl-5 pr-2 py-1.5 text-sm"
                              />
                            </div>
                          </div>
                          <div className="w-24">
                            <label className="block text-[10px] text-[var(--text-tertiary)] mb-0.5">
                              Trade
                            </label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">
                                $
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={variant.trade_price || ''}
                                onChange={e => {
                                  const updated = [
                                    ...(formData.size_options || []),
                                  ];
                                  updated[idx] = {
                                    ...updated[idx],
                                    trade_price:
                                      parseFloat(e.target.value) || 0,
                                  };
                                  setFormData(prev => ({
                                    ...prev,
                                    size_options: updated,
                                  }));
                                }}
                                className="w-full rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] pl-5 pr-2 py-1.5 text-sm"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            disabled={formData.size_options?.length === 1}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={
                              formData.size_options?.length === 1
                                ? 'Cannot remove last variant'
                                : 'Remove variant'
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add variant row */}
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)]/50">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={newVariant.size}
                        onChange={e =>
                          setNewVariant(prev => ({
                            ...prev,
                            size: e.target.value,
                          }))
                        }
                        className="w-full bg-transparent text-[var(--text-primary)] border-0 p-0 focus:outline-none focus:ring-0 placeholder:text-[var(--text-tertiary)]"
                        placeholder="New size (e.g. 1L, 750ml)"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={newVariant.retail_price || ''}
                            onChange={e =>
                              setNewVariant(prev => ({
                                ...prev,
                                retail_price: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="w-full rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] pl-5 pr-2 py-1.5 text-sm"
                            placeholder="Retail"
                          />
                        </div>
                      </div>
                      <div className="w-24">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={newVariant.trade_price || ''}
                            onChange={e =>
                              setNewVariant(prev => ({
                                ...prev,
                                trade_price: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="w-full rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] pl-5 pr-2 py-1.5 text-sm"
                            placeholder="Trade"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="p-1.5 text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors"
                        title="Add variant"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Display price summary */}
                  <div className="text-xs text-[var(--text-secondary)] pt-2">
                    Display price: S$
                    {Math.min(
                      ...(formData.size_options?.map(v => v.retail_price) || [
                        0,
                      ])
                    ).toFixed(2)}
                    {formData.size_options &&
                      formData.size_options.length > 1 &&
                      ' (lowest)'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Inventory Section */}
          <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] p-4 sm:p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
              Inventory
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  name="stock_quantity"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                  Low Stock Alert
                </label>
                <input
                  type="number"
                  name="low_stock_threshold"
                  min="0"
                  value={formData.low_stock_threshold}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Promotional Pricing Section */}
          <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] p-4 sm:p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
              Promotional Pricing
            </h2>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                  Promo Price (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                    S$
                  </span>
                  <input
                    type="number"
                    name="promo_price"
                    step="0.01"
                    min="0"
                    value={formData.promo_price || ''}
                    onChange={handleChange}
                    placeholder="Leave empty for no promo"
                    className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] pl-10 pr-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
                  />
                </div>
              </div>

              {formData.promo_price && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="promo_start_date"
                      value={formData.promo_start_date || ''}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="promo_end_date"
                      value={formData.promo_end_date || ''}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
                    />
                  </div>
                </div>
              )}

              {formData.promo_price && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-800 dark:text-blue-400">
                  💰 Promo active: S$
                  {Number(formData.promo_price).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  {formData.promo_start_date &&
                    formData.promo_end_date &&
                    ` (${new Date(formData.promo_start_date).toLocaleDateString()} - ${new Date(formData.promo_end_date).toLocaleDateString()})`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Status & Image */}
        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] p-4 sm:p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
              Status
            </h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer min-h-[44px] py-2 touch-manipulation">
                <span className="text-[var(--text-primary)] font-medium">
                  Active
                </span>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={!!formData.is_active}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-[var(--text-primary)] touch-manipulation"
                />
              </label>
              <div className="h-px bg-[var(--border-primary)]"></div>
              <label className="flex items-center justify-between cursor-pointer min-h-[44px] py-2 touch-manipulation">
                <span className="text-[var(--text-primary)] font-medium">
                  Featured
                </span>
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={!!formData.is_featured}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-[var(--text-primary)] touch-manipulation"
                />
              </label>
              <div className="h-px bg-[var(--border-primary)]"></div>
              <label className="flex items-center justify-between cursor-pointer min-h-[44px] py-2 touch-manipulation">
                <span className="text-[var(--text-primary)] font-medium">
                  Limited Edition
                </span>
                <input
                  type="checkbox"
                  name="is_limited"
                  checked={!!formData.is_limited}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-[var(--text-primary)] touch-manipulation"
                />
              </label>
            </div>
          </div>

          <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] p-4 sm:p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
              Product Image
            </h2>
            <ImageUpload
              value={formData.image_url || null}
              onChange={url =>
                setFormData(prev => ({ ...prev, image_url: url || '' }))
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-3 font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-h-[48px] touch-manipulation"
          >
            <Save size={20} />
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
