import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getImageUrl } from '../lib/imageUtils';
import type { Product } from '../types/product';
import {
  Edit,
  Plus,
  Trash2,
  Search,
  Filter,
  Eye,
  EyeOff,
  Upload,
} from 'lucide-react';
import ProductImport from './ProductImport';

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(false);

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
    let query = supabase.from('products').select('*', { count: 'exact' });

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

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      alert('Error deleting product');
    } else {
      fetchProducts();
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      alert('Error updating product status');
    } else {
      fetchProducts();
    }
  };

  const isPromoActive = (product: Product) => {
    if (!product.promo_price) return false;

    const now = new Date();
    const start = product.promo_start_date
      ? new Date(product.promo_start_date)
      : null;
    const end = product.promo_end_date
      ? new Date(product.promo_end_date)
      : null;

    if (start && now < start) return false;
    if (end && now > end) return false;

    return true;
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          Products
        </h1>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 sm:px-4 py-2 font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)] min-h-[44px] touch-manipulation"
          >
            <Upload size={20} />
            <span className="hidden sm:inline">Import CSV</span>
            <span className="sm:hidden">Import</span>
          </button>
          <Link
            to="/products/new"
            className="flex items-center gap-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] px-3 sm:px-4 py-2 font-semibold transition-all hover:opacity-90 shadow-sm min-h-[44px] touch-manipulation"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
          />
        </div>

        <div className="relative w-full sm:w-56">
          <Filter className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full appearance-none rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-8 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px] touch-manipulation"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-sm">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-[var(--bg-tertiary)] text-xs font-bold uppercase text-[var(--text-primary)] tracking-wider">
            <tr>
              <th className="px-4 sm:px-6 py-3 sm:py-4">Product</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4">Category</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4">Price</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4">Stock</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4">Status</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-primary)]">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-[var(--text-secondary)]"
                >
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--text-primary)]"></div>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-[var(--text-secondary)]"
                >
                  No products found.
                </td>
              </tr>
            ) : (
              products.map(product => (
                <tr
                  key={product.id}
                  className="hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img
                          src={getImageUrl(product.image_url)}
                          alt={product.name}
                          className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover bg-[var(--bg-tertiary)]"
                        />
                      ) : (
                        <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] text-xs text-center">
                          No Img
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--text-primary)] truncate">
                          {product.name}
                        </div>
                        <div className="text-sm text-[var(--text-secondary)] truncate">
                          {product.sku}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                    {product.category}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex flex-col gap-1">
                      {isPromoActive(product) ? (
                        <>
                          <div className="font-medium text-red-600 dark:text-red-400">
                            S$
                            {product.promo_price!.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                          <div className="text-xs text-[var(--text-tertiary)] line-through">
                            S$
                            {product.retail_price.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="font-medium text-[var(--text-primary)]">
                          S$
                          {product.retail_price.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.stock_quantity <=
                        (product.low_stock_threshold || 10)
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                      }`}
                    >
                      {product.stock_quantity.toLocaleString('en-US')}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex flex-col gap-1.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          product.is_active
                            ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] dark:bg-[var(--bg-tertiary)] dark:text-[var(--text-tertiary)]'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Archived'}
                      </span>
                      {isPromoActive(product) && (
                        <span className="inline-flex rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:text-red-400">
                          Promo
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                    <div className="flex justify-end gap-1 sm:gap-2">
                      <button
                        onClick={() =>
                          handleToggleActive(product.id, product.is_active)
                        }
                        className={`rounded-lg p-2 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation ${
                          product.is_active
                            ? 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                            : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                        title={
                          product.is_active ? 'Delist product' : 'List product'
                        }
                      >
                        {product.is_active ? (
                          <Eye size={18} />
                        ) : (
                          <EyeOff size={18} />
                        )}
                      </button>
                      <Link
                        to={`/products/${product.id}`}
                        className="rounded-lg p-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="rounded-lg p-2 text-[var(--text-tertiary)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
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
      <div className="flex items-center justify-between border-t border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="relative inline-flex items-center rounded-md border border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * itemsPerPage >= totalCount}
            className="relative ml-3 inline-flex items-center rounded-md border border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation transition-colors"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">
              Showing{' '}
              <span className="font-medium text-[var(--text-primary)]">
                {(page - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium text-[var(--text-primary)]">
                {Math.min(page * itemsPerPage, totalCount)}
              </span>{' '}
              of{' '}
              <span className="font-medium text-[var(--text-primary)]">
                {totalCount}
              </span>{' '}
              results
            </p>
          </div>
          <div>
            <nav
              className="isolate inline-flex -space-x-px rounded-md shadow-sm"
              aria-label="Pagination"
            >
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-l-md px-3 py-2 text-[var(--text-secondary)] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="sr-only">Previous</span>
                <span>Previous</span>
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * itemsPerPage >= totalCount}
                className="relative inline-flex items-center rounded-r-md px-3 py-2 text-[var(--text-secondary)] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="sr-only">Next</span>
                <span>Next</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <ProductImport
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            fetchProducts();
            setShowImport(false);
          }}
        />
      )}
    </div>
  );
}
