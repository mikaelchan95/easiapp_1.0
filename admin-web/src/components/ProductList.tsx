
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Product } from '../types/product';
import { Edit, Plus, Trash2, Search, Filter } from 'lucide-react';

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter, searchTerm]); // Debounce search in real app

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('products')
      .select('category')
      .order('category');
      
    if (data) {
        // Unique categories
        const unique = Array.from(new Set(data.map(d => d.category)));
        setCategories(unique);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    if (categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }

    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }

    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error deleting product');
    } else {
      fetchProducts();
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-dark">Products</h1>
        <Link
          to="/products/new"
          className="flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 font-bold text-brand-dark transition-colors hover:bg-brand-accent/90"
        >
          <Plus size={20} />
          Add Product
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
          />
        </div>
        
        <div className="relative w-48">
            <Filter className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-brand-white py-2.5 pl-10 pr-8 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
            >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-brand-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-brand-light text-xs font-bold uppercase text-brand-dark">
            <tr>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-brand-light/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                         <img 
                           src={product.image_url.startsWith('http') ? product.image_url : `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/${product.image_url}`} 
                           alt={product.name} 
                           className="h-10 w-10 rounded-lg object-cover bg-gray-100"
                         />
                      ) : (
                        <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400 text-xs text-center">No Img</div>
                      )}
                      <div>
                        <div className="font-medium text-brand-dark">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{product.category}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    S${(product.retail_price || (product as any).price || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.stock_quantity <= (product.low_stock_threshold || 10)
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.is_active
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.is_active ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <Link
                        to={`/products/${product.id}`}
                        className="rounded-lg p-2 text-gray-400 hover:bg-brand-light hover:text-brand-dark"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
       {/* Pagination */}
       <div className="flex items-center justify-between border-t border-gray-200 bg-brand-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
               onClick={() => setPage(p => Math.max(1, p - 1))}
               disabled={page === 1}
               className="relative inline-flex items-center rounded-md border border-gray-300 bg-brand-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * itemsPerPage >= totalCount}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-brand-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(page * itemsPerPage, totalCount)}</span> of{' '}
                <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                   onClick={() => setPage(p => Math.max(1, p - 1))}
                   disabled={page === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * itemsPerPage >= totalCount}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <span>Next</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
    </div>
  );
}
