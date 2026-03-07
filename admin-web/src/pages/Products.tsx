import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  Plus,
  Package,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Edit,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Archive,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import { getImageUrl } from '../lib/imageUtils';
import { useProductsData } from '../hooks/useProductsData';
import { formatCurrency, formatNumber } from '../lib/formatters';
import type { Product } from '../types/product';

const PAGE_SIZE = 10;

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

function TrendBadge({
  value,
  suffix,
}: {
  value: number | null;
  suffix?: string;
}) {
  if (value === null)
    return (
      <div className="flex items-center gap-1 mt-1 text-gray-400 text-xs font-bold">
        <Minus size={12} />
        <span>0%</span>
        {suffix && (
          <span className="text-gray-400 font-normal ml-1">{suffix}</span>
        )}
      </div>
    );

  const isUp = value >= 0;
  return (
    <div
      className={`flex items-center gap-1 mt-1 text-xs font-bold ${
        isUp ? 'text-emerald-600' : 'text-rose-600'
      }`}
    >
      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      <span>
        {isUp ? '+' : ''}
        {value.toFixed(1)}%
      </span>
      {suffix && (
        <span className="text-gray-400 font-normal ml-1">{suffix}</span>
      )}
    </div>
  );
}

function StockBadge({ product }: { product: Product }) {
  const qty = product.stock_quantity ?? 0;
  const threshold = product.low_stock_threshold ?? 10;

  if (qty === 0)
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
        Out of Stock
      </span>
    );

  if (qty <= threshold)
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
        {qty} Low Stock
      </span>
    );

  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
      {qty} In Stock
    </span>
  );
}

export default function Products() {
  const navigate = useNavigate();
  const { products, categories, kpis, loading } = useProductsData();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let result = products;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }

    if (statusFilter === 'active') result = result.filter(p => p.is_active);
    else if (statusFilter === 'inactive')
      result = result.filter(p => !p.is_active);

    if (categoryFilter !== 'all')
      result = result.filter(p => p.category === categoryFilter);

    return result;
  }, [products, search, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const allOnPageSelected =
    paged.length > 0 && paged.every(p => selected.has(p.id));

  const toggleSelectAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        paged.forEach(p => next.delete(p.id));
      } else {
        paged.forEach(p => next.add(p.id));
      }
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleActive = useCallback(async (product: Product) => {
    setTogglingIds(prev => new Set(prev).add(product.id));
    const newStatus = !product.is_active;
    await supabase
      .from('products')
      .update({ is_active: newStatus })
      .eq('id', product.id);
    product.is_active = newStatus;
    setTogglingIds(prev => {
      const next = new Set(prev);
      next.delete(product.id);
      return next;
    });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Delete this product permanently?')) return;
    await supabase.from('products').delete().eq('id', id);
    window.location.reload();
  }, []);

  const handleDuplicate = useCallback(async (product: Product) => {
    const { id, created_at, updated_at, ...rest } = product;
    await supabase.from('products').insert([
      {
        ...rest,
        name: `${product.name} (Copy)`,
        sku: `${product.sku}-COPY-${Date.now().toString(36).slice(-4)}`,
      },
    ]);
    window.location.reload();
  }, []);

  const handleExport = useCallback(() => {
    const csv = Papa.unparse(
      filtered.map(p => ({
        Name: p.name,
        SKU: p.sku,
        Category: p.category,
        'Retail Price': p.retail_price,
        'Trade Price': p.trade_price ?? '',
        Stock: p.stock_quantity,
        Status: p.is_active ? 'Active' : 'Inactive',
      }))
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const handleBulkDelete = useCallback(async () => {
    if (!window.confirm(`Delete ${selected.size} products permanently?`))
      return;
    const ids = Array.from(selected);
    await Promise.all(
      ids.map(id => supabase.from('products').delete().eq('id', id))
    );
    setSelected(new Set());
    window.location.reload();
  }, [selected]);

  const handleBulkArchive = useCallback(async () => {
    const ids = Array.from(selected);
    await Promise.all(
      ids.map(id =>
        supabase.from('products').update({ is_active: false }).eq('id', id)
      )
    );
    setSelected(new Set());
    window.location.reload();
  }, [selected]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-primary)]">
            Products
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your inventory, pricing, and availability.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg h-10 px-4 border-2 border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          <button
            onClick={() => navigate('/products/new')}
            className="flex items-center gap-2 rounded-lg h-10 px-5 bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 transition-all shadow-sm"
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
              Total Products
            </p>
            <Package
              size={18}
              className="text-[var(--color-primary)] opacity-40"
            />
          </div>
          <p className="text-2xl font-black text-[var(--color-primary)]">
            {formatNumber(kpis.totalProducts)}
          </p>
          <TrendBadge value={kpis.totalTrend} suffix="vs last month" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
              Active
            </p>
            <CheckCircle
              size={18}
              className="text-[var(--color-primary)] opacity-40"
            />
          </div>
          <p className="text-2xl font-black text-[var(--color-primary)]">
            {formatNumber(kpis.activeProducts)}
          </p>
          <TrendBadge value={kpis.activeTrend} suffix="vs last month" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
              Low Stock
            </p>
            <AlertTriangle size={18} className="text-amber-500 opacity-60" />
          </div>
          <p className="text-2xl font-black text-[var(--color-primary)]">
            {formatNumber(kpis.lowStockCount)}
          </p>
          <TrendBadge value={kpis.lowStockTrend} suffix="fewer alerts" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
              Total Value
            </p>
            <DollarSign
              size={18}
              className="text-[var(--color-primary)] opacity-40"
            />
          </div>
          <p className="text-2xl font-black text-[var(--color-primary)]">
            {formatCurrency(kpis.totalValue)}
          </p>
          <TrendBadge value={kpis.valueTrend} suffix="inventory value" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)]/20 placeholder:text-gray-400"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[140px]">
            <select
              className="w-full appearance-none bg-gray-50 border-none rounded-lg py-2 pl-3 pr-8 text-sm font-medium focus:ring-2 focus:ring-[var(--color-primary)]/20 cursor-pointer"
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronRight
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 rotate-90"
            />
          </div>
          <div className="relative min-w-[160px]">
            <select
              className="w-full appearance-none bg-gray-50 border-none rounded-lg py-2 pl-3 pr-8 text-sm font-medium focus:ring-2 focus:ring-[var(--color-primary)]/20 cursor-pointer"
              value={categoryFilter}
              onChange={e => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronRight
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 rotate-90"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] h-4 w-4"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Product
                </th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Price (Ret/Trad)
                </th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Stock
                </th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-12 text-center text-gray-400 text-sm"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                paged.map(product => {
                  const imgUrl = getImageUrl(product.image_url);
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] h-4 w-4"
                          checked={selected.has(product.id)}
                          onChange={() => toggleSelect(product.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="size-10 rounded-lg bg-gray-100 bg-center bg-cover flex-shrink-0 border border-gray-100"
                            style={
                              imgUrl
                                ? { backgroundImage: `url(${imgUrl})` }
                                : undefined
                            }
                          >
                            {!imgUrl && (
                              <div className="size-10 flex items-center justify-center text-gray-300">
                                <Package size={16} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[var(--color-primary)]">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              SKU: {product.sku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[var(--color-primary)]">
                            {formatCurrency(product.retail_price)}
                          </span>
                          {product.trade_price != null && (
                            <span className="text-xs text-gray-500">
                              {formatCurrency(product.trade_price)} Trade
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <StockBadge product={product} />
                      </td>
                      <td className="p-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={product.is_active}
                            disabled={togglingIds.has(product.id)}
                            onChange={() => handleToggleActive(product)}
                          />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-primary)]" />
                        </label>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => navigate(`/products/${product.id}`)}
                            className="p-2 text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDuplicate(product)}
                            className="p-2 text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                            title="Duplicate"
                          >
                            <Copy size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 bg-gray-50/50 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Showing{' '}
            <span className="font-bold text-gray-700">
              {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} to{' '}
              {Math.min(currentPage * PAGE_SIZE, filtered.length)}
            </span>{' '}
            of{' '}
            <span className="font-bold text-gray-700">
              {formatNumber(filtered.length)}
            </span>{' '}
            products
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="size-8 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-white transition-all disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            {getPageNumbers(currentPage, totalPages).map((item, i) =>
              item === '...' ? (
                <span
                  key={`ellipsis-${i}`}
                  className="size-8 flex items-center justify-center text-xs text-gray-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item as number)}
                  className={`size-8 flex items-center justify-center rounded text-xs font-bold transition-colors ${
                    item === currentPage
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'border border-gray-300 text-gray-500 hover:bg-white'
                  }`}
                >
                  {item}
                </button>
              )
            )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="size-8 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-white transition-all disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-50">
          <span className="text-sm font-medium">
            {selected.size} item{selected.size > 1 ? 's' : ''} selected
          </span>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-4">
            <button
              onClick={handleBulkArchive}
              className="text-xs font-bold flex items-center gap-1.5 hover:text-gray-300 transition-colors"
            >
              <Archive size={14} />
              Archive
            </button>
            <button
              onClick={handleBulkDelete}
              className="text-xs font-bold flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
          <button
            onClick={() => setSelected(new Set())}
            className="bg-white/10 hover:bg-white/20 p-1 rounded-full transition-all"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
