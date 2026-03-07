import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Product, SizeOption } from '../types/product';
import { getImageUrl } from '../lib/imageUtils';
import { useToast } from './ui/Toast';
import {
  ChevronRight,
  FileText,
  ImageIcon,
  Layers,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';

const INITIAL_PRODUCT: Partial<Product> = {
  name: '',
  description: '',
  category: '',
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
  const { toast } = useToast();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>(INITIAL_PRODUCT);
  const [categories, setCategories] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const { data } = await supabase
      .from('categories')
      .select('name')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (data && data.length > 0) {
      setCategories(data.map(c => c.name));
      if (!formData.category && !isEditMode) {
        setFormData(prev => ({ ...prev, category: data[0].name }));
      }
    } else {
      const { data: productData } = await supabase
        .from('products')
        .select('category');
      const unique = Array.from(
        new Set(productData?.map(d => d.category) || [])
      ).sort();
      setCategories(unique);
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
      toast('Error fetching product', 'error');
      navigate('/products');
    } else if (data) {
      setFormData({ ...data, size_options: data.size_options || [] });
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
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddVariant = () => {
    if (!newVariant.size || newVariant.retail_price <= 0) {
      toast('Please enter valid size and price', 'error');
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

  const updateVariant = (
    index: number,
    field: keyof SizeOption,
    value: string | number
  ) => {
    setFormData(prev => {
      const updated = [...(prev.size_options || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, size_options: updated };
    });
  };

  useEffect(() => {
    const variants = formData.size_options;
    if (variants && variants.length > 0) {
      const minRetail = Math.min(...variants.map(v => v.retail_price));
      const minTrade = Math.min(...variants.map(v => v.trade_price));
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

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setFormData(prev => ({ ...prev, image_url: filePath }));
      toast('Image uploaded', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      toast((error as Error).message, 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      if (!isEditMode && !payload.sku) {
        payload.sku = `SKU-${Date.now()}`;
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
      toast(isEditMode ? 'Product updated' : 'Product created', 'success');
      navigate('/products');
    } catch (error) {
      toast('Error saving product: ' + (error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!fetched && isEditMode) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  const imageUrl = getImageUrl(formData.image_url || null);
  const hasVariants = formData.size_options && formData.size_options.length > 0;
  const totalStock = formData.stock_quantity ?? 0;

  return (
    <div className="animate-fade-in font-sans pb-8 max-w-[1200px] mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
        <Link to="/" className="hover:text-[var(--color-primary)]">
          EASI Admin
        </Link>
        <ChevronRight size={10} />
        <Link to="/products" className="hover:text-[var(--color-primary)]">
          Products
        </Link>
        <ChevronRight size={10} />
        <span className="text-[var(--color-primary)]">
          {isEditMode ? 'Edit Product' : 'New Product'}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4 mt-2 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-[var(--color-primary)] leading-tight tracking-tight">
            {formData.name || (isEditMode ? 'Edit Product' : 'New Product')}
          </h1>
          {isEditMode && id && (
            <p className="text-gray-500 text-sm font-mono bg-gray-100 px-2 py-0.5 rounded w-fit">
              ID: {id.slice(0, 8)}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="flex items-center justify-center rounded-lg h-11 px-6 bg-white border border-gray-200 text-gray-700 text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
          >
            Discard Changes
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={loading}
            className="flex items-center justify-center rounded-lg h-11 px-8 bg-[var(--color-primary)] text-white text-sm font-bold shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>

      {/* Two-Column Layout */}
      <form
        id="product-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
      >
        {/* Left Column (2/3) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* General Information */}
          <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--color-primary)] mb-6 flex items-center gap-2">
              <FileText size={20} className="text-[var(--color-primary)]" />
              General Information
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-200 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm p-3"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Description
                </label>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 p-2 flex gap-2">
                    <button
                      type="button"
                      className="p-1 hover:bg-gray-200 rounded text-gray-500"
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      type="button"
                      className="p-1 hover:bg-gray-200 rounded text-gray-500 italic"
                    >
                      I
                    </button>
                  </div>
                  <textarea
                    name="description"
                    rows={6}
                    value={formData.description || ''}
                    onChange={handleChange}
                    placeholder="Enter product description..."
                    className="w-full p-4 border-none focus:ring-0 text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Media */}
          <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--color-primary)] mb-6 flex items-center gap-2">
              <ImageIcon size={20} className="text-[var(--color-primary)]" />
              Media
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {/* Upload Zone */}
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className="col-span-2 lg:col-span-3 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
              >
                <Upload
                  size={36}
                  className="text-gray-400 group-hover:text-[var(--color-primary)] mb-2"
                />
                <p className="text-sm font-semibold text-gray-700">
                  {uploading ? 'Uploading...' : 'Drag & drop images here'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  or click to browse from files
                </p>
              </div>

              {/* Thumbnail */}
              {imageUrl && (
                <div className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          image_url: '',
                        }))
                      }
                      className="p-1 bg-white rounded text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <img
                    src={imageUrl}
                    alt={formData.name || 'Product'}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
          </section>

          {/* Variants Table */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-[var(--color-primary)] flex items-center gap-2">
                <Layers size={20} className="text-[var(--color-primary)]" />
                Variants (Size)
              </h3>
              <button
                type="button"
                onClick={handleAddVariant}
                className="text-[var(--color-primary)] text-sm font-bold flex items-center gap-1 hover:underline"
              >
                <Plus size={14} /> Add Variant
              </button>
            </div>

            {hasVariants ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Variant</th>
                      <th className="px-6 py-4">Retail Price</th>
                      <th className="px-6 py-4">Trade Price</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formData.size_options!.map((variant, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={variant.size}
                            onChange={e =>
                              updateVariant(idx, 'size', e.target.value)
                            }
                            className="bg-transparent border-none p-0 focus:ring-0 text-sm font-medium w-full"
                            placeholder="Size name"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            step="0.01"
                            value={variant.retail_price || ''}
                            onChange={e =>
                              updateVariant(
                                idx,
                                'retail_price',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="bg-transparent border-none p-0 focus:ring-0 w-20 text-sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            step="0.01"
                            value={variant.trade_price || ''}
                            onChange={e =>
                              updateVariant(
                                idx,
                                'trade_price',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="bg-transparent border-none p-0 focus:ring-0 w-20 text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Add new variant row */}
                    <tr className="bg-gray-50/50">
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={newVariant.size}
                          onChange={e =>
                            setNewVariant(prev => ({
                              ...prev,
                              size: e.target.value,
                            }))
                          }
                          className="bg-transparent border-none p-0 focus:ring-0 text-sm placeholder:text-gray-400 w-full"
                          placeholder="New size (e.g. 750ml)"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          value={newVariant.retail_price || ''}
                          onChange={e =>
                            setNewVariant(prev => ({
                              ...prev,
                              retail_price: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="bg-transparent border-none p-0 focus:ring-0 w-20 text-sm placeholder:text-gray-400"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          value={newVariant.trade_price || ''}
                          onChange={e =>
                            setNewVariant(prev => ({
                              ...prev,
                              trade_price: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="bg-transparent border-none p-0 focus:ring-0 w-20 text-sm placeholder:text-gray-400"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={handleAddVariant}
                          className="text-[var(--color-primary)] hover:text-[var(--color-primary)]/80"
                        >
                          <Plus size={16} />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                <p>
                  No variants yet. Add one above or use the base pricing in the
                  sidebar.
                </p>
              </div>
            )}
          </section>

          {/* Promotional Pricing */}
          <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider mb-6">
              Promotional Pricing
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500">
                  Promo Price (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    name="promo_price"
                    step="0.01"
                    min="0"
                    value={formData.promo_price || ''}
                    onChange={handleChange}
                    placeholder="Leave empty for no promo"
                    className="w-full rounded-lg border-gray-200 text-sm py-2.5 pl-7 pr-3 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>
              {formData.promo_price != null && formData.promo_price > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="promo_start_date"
                      value={formData.promo_start_date || ''}
                      onChange={handleChange}
                      className="w-full rounded-lg border-gray-200 text-sm p-2.5 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="promo_end_date"
                      value={formData.promo_end_date || ''}
                      onChange={handleChange}
                      className="w-full rounded-lg border-gray-200 text-sm p-2.5 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column - Sidebar (1/3) */}
        <div className="flex flex-col gap-6">
          {/* Status & Visibility */}
          <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider mb-6">
              Status & Visibility
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Product Status
                </span>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    className="sr-only peer"
                    checked={!!formData.is_active}
                    onChange={handleChange}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
                  <span className="ml-3 text-sm font-bold text-green-600">
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Featured
                </span>
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={!!formData.is_featured}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Limited Edition
                </span>
                <input
                  type="checkbox"
                  name="is_limited"
                  checked={!!formData.is_limited}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>
          </section>

          {/* Organization */}
          <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider mb-6">
              Organization
            </h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-200 text-sm p-2.5 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider mb-6">
              Pricing
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500">
                    Base Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      name="retail_price"
                      step="0.01"
                      min="0"
                      value={formData.retail_price || ''}
                      onChange={handleChange}
                      disabled={!!hasVariants}
                      className="w-full rounded-lg border-gray-200 text-sm py-2.5 pl-7 pr-3 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500">
                    Trade Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      name="trade_price"
                      step="0.01"
                      min="0"
                      value={formData.trade_price || ''}
                      onChange={handleChange}
                      disabled={!!hasVariants}
                      className="w-full rounded-lg border-gray-200 text-sm py-2.5 pl-7 pr-3 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                </div>
              </div>
              {hasVariants && (
                <p className="text-xs text-gray-400">
                  Prices auto-set from lowest variant.
                </p>
              )}
            </div>
          </section>

          {/* Inventory */}
          <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider mb-6">
              Inventory
            </h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500">
                  Base SKU
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku || ''}
                  onChange={handleChange}
                  placeholder="Auto-generated if empty"
                  className="w-full rounded-lg border-gray-200 text-sm p-2.5 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500">
                    Total Stock
                  </label>
                  <input
                    type="number"
                    name="stock_quantity"
                    min="0"
                    value={totalStock}
                    onChange={handleChange}
                    className="w-full rounded-lg border-gray-200 text-sm p-2.5 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-red-500">
                    Safety Stock
                  </label>
                  <input
                    type="number"
                    name="low_stock_threshold"
                    min="0"
                    value={formData.low_stock_threshold ?? 5}
                    onChange={handleChange}
                    className="w-full rounded-lg border-red-200 text-sm p-2.5 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </form>

      {/* Mobile Footer */}
      <div className="xl:hidden sticky bottom-4 left-0 right-0 mt-6 px-4 py-3 bg-white/80 backdrop-blur-md rounded-xl border border-gray-200 flex gap-3 shadow-lg">
        <button
          type="button"
          onClick={() => navigate('/products')}
          className="flex-1 h-12 rounded-lg bg-gray-100 text-gray-700 font-bold"
        >
          Discard
        </button>
        <button
          type="submit"
          form="product-form"
          disabled={loading}
          className="flex-[2] h-12 rounded-lg bg-[var(--color-primary)] text-white font-bold px-8 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
