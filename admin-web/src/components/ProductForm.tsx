
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Product } from '../types/product';
import ImageUpload from './ImageUpload';
import { ArrowLeft, Save } from 'lucide-react';

// Default initial state
const INITIAL_PRODUCT: Partial<Product> = {
  name: '',
  description: '',
  category: 'Scotch',
  retail_price: 0,
  trade_price: 0,
  stock_quantity: 0,
  low_stock_threshold: 5,
  is_active: true,
  is_featured: false,
  is_limited: false,
  rating: 0,
  sku: '',
  image_url: '',
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>(INITIAL_PRODUCT);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchProduct(id);
    } else {
        setFetched(true);
    }
  }, [id]);

  const fetchCategories = async () => {
    // Fetch existing categories to populate the dropdown suggestions or we can hardcode
    // For now let's just use a set list plus what's in DB
    const { data } = await supabase
    .from('products')
    .select('category');
    
    const unique = Array.from(new Set([
        'Scotch', 'Champagne', 'Cognac', 'Japanese Whisky', 'Wine', 'Vodka', 'Gin',
        ...(data?.map(d => d.category) || [])
    ]));
    setCategories(unique.sort());
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
      setFormData(data);
    }
    setLoading(false);
    setFetched(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
             if(!payload.sku) payload.sku = `SKU-${Date.now()}`;
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

  if (!fetched && isEditMode) return <div>Loading...</div>;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/products')}
            className="rounded-lg bg-brand-white p-2 text-gray-600 shadow-sm transition-colors hover:bg-white/50"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-brand-dark">
            {isEditMode ? 'Edit Product' : 'New Product'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl bg-brand-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-brand-dark">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-dark">Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-brand-dark">Description</label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="mb-1 block text-sm font-medium text-brand-dark">Category</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-white focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                 </div>
                 <div>
                    <label className="mb-1 block text-sm font-medium text-brand-dark">SKU</label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku || ''}
                      onChange={handleChange}
                      placeholder="Auto-generated if empty"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                    />
                 </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-brand-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-brand-dark">Pricing & Inventory</h2>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="mb-1 block text-sm font-medium text-brand-dark">Retail Price</label>
                  <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">S$</span>
                     <input
                        type="number"
                        name="retail_price"
                        step="0.01"
                        min="0"
                        value={formData.retail_price}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                     />
                  </div>
               </div>
               <div>
                  <label className="mb-1 block text-sm font-medium text-brand-dark">Trade Price</label>
                  <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">S$</span>
                     <input
                        type="number"
                        name="trade_price"
                        step="0.01"
                        min="0"
                        value={formData.trade_price}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                     />
                  </div>
               </div>
               <div>
                  <label className="mb-1 block text-sm font-medium text-brand-dark">Stock Quantity</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
               </div>
               <div>
                  <label className="mb-1 block text-sm font-medium text-brand-dark">Low Stock Alert</label>
                  <input
                    type="number"
                    name="low_stock_threshold"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
               </div>
            </div>
          </div>
        </div>

        {/* Right Column - Status & Image */}
        <div className="space-y-6">
          <div className="rounded-xl bg-brand-white p-6 shadow-sm">
             <h2 className="mb-4 text-lg font-bold text-brand-dark">Status</h2>
             <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-700">Active</span>
                    <input 
                        type="checkbox" 
                        name="is_active"
                        checked={!!formData.is_active}
                        onChange={handleChange}
                        className="h-5 w-5 rounded border-gray-300 text-brand-dark focus:ring-brand-dark"
                    />
                </label>
                <div className="h-px bg-gray-100"></div>
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-700">Featured</span>
                    <input 
                        type="checkbox" 
                        name="is_featured"
                        checked={!!formData.is_featured}
                        onChange={handleChange}
                        className="h-5 w-5 rounded border-gray-300 text-brand-dark focus:ring-brand-dark"
                    />
                </label>
                <div className="h-px bg-gray-100"></div>
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-700">Limited Edition</span>
                     <input 
                        type="checkbox" 
                        name="is_limited"
                        checked={!!formData.is_limited}
                        onChange={handleChange}
                        className="h-5 w-5 rounded border-gray-300 text-brand-dark focus:ring-brand-dark"
                    />
                </label>
             </div>
          </div>

          <div className="rounded-xl bg-brand-white p-6 shadow-sm">
             <h2 className="mb-4 text-lg font-bold text-brand-dark">Product Image</h2>
             <ImageUpload 
                value={formData.image_url || null}
                onChange={(url) => setFormData(prev => ({ ...prev, image_url: url || '' }))}
             />
          </div>
          
           <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-3 font-bold text-brand-dark transition-colors hover:bg-brand-accent/90 disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? 'Saving...' : 'Save Product'}
            </button>
        </div>
      </form>
    </div>
  );
}
