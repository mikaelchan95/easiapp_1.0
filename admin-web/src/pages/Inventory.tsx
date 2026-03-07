import { useState, useMemo } from 'react';
import {
  Save,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Minus as MinusIcon,
  Plus as PlusIcon,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { useInventoryData } from '../hooks/useInventoryData';
import { useToast } from '../components/ui/Toast';

const PAGE_SIZE = 20;

type Tab = 'all' | 'low' | 'out';

export default function Inventory() {
  const {
    products,
    adjustments,
    loading,
    saving,
    setAdjustment,
    increment,
    decrement,
    saveAll,
    hasChanges,
  } = useInventoryData();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = products;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }

    if (tab === 'low') {
      result = result.filter(
        p => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold
      );
    } else if (tab === 'out') {
      result = result.filter(p => p.stock_quantity === 0);
    }

    return result;
  }, [products, search, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSave = async () => {
    const ok = await saveAll();
    if (ok) toast('Stock levels updated', 'success');
    else toast('Failed to save some updates', 'error');
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: 'All Products', count: products.length },
    {
      key: 'low',
      label: 'Low Stock',
      count: products.filter(
        p => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold
      ).length,
    },
    {
      key: 'out',
      label: 'Out of Stock',
      count: products.filter(p => p.stock_quantity === 0).length,
    },
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-primary)]">
            Inventory Quick Edit
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Efficiently manage stock levels for your catalog.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Filter size={16} />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download size={16} />
            Export
          </button>
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search inventory..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-4 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)]/20 placeholder:text-gray-400"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={`border-b-2 px-1 pb-4 text-sm font-semibold transition-colors ${
                tab === t.key
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              <span className="ml-2 text-xs text-gray-400 font-normal">
                ({t.count})
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 tracking-wider w-1/3">
                  Product Name
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 tracking-wider text-center">
                  Current Stock
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 tracking-wider text-right pr-12">
                  Adjusted
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-12 text-center text-gray-400 text-sm"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                paged.map(product => {
                  const adj = adjustments[product.id] || 0;
                  const isLow =
                    product.stock_quantity > 0 &&
                    product.stock_quantity <= product.low_stock_threshold;
                  const isOut = product.stock_quantity === 0;

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        isLow ? 'bg-red-50/30' : isOut ? 'bg-red-50/40' : ''
                      }`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--color-primary)]">
                              {product.name}
                            </span>
                            {(isLow || isOut) && (
                              <AlertTriangle
                                size={14}
                                className="text-red-500"
                                title={isOut ? 'Out of Stock' : 'Low Stock'}
                              />
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {product.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-mono text-gray-600">
                        {product.sku}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span
                          className={`text-sm font-medium ${
                            isOut
                              ? 'font-bold text-red-600'
                              : isLow
                                ? 'font-bold text-amber-600'
                                : 'text-[var(--color-primary)]'
                          }`}
                        >
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => decrement(product.id)}
                            className="size-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-colors"
                          >
                            <MinusIcon size={16} />
                          </button>
                          <input
                            type="text"
                            value={adj}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10) || 0;
                              setAdjustment(product.id, val);
                            }}
                            className={`w-16 h-8 text-center rounded-lg text-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] ${
                              adj !== 0
                                ? adj > 0
                                  ? 'border-[var(--color-primary)] font-bold text-[var(--color-primary)]'
                                  : 'border-red-500 font-bold text-red-600'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          />
                          <button
                            onClick={() => increment(product.id)}
                            className="size-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-colors"
                          >
                            <PlusIcon size={16} />
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
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
            Showing{' '}
            {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} to{' '}
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{' '}
            {filtered.length} products
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-200 rounded bg-white text-sm disabled:opacity-50"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-200 rounded bg-white text-sm disabled:opacity-50"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Tip */}
      <div className="bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-xl p-4 flex items-center gap-4">
        <div className="size-10 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white shrink-0">
          <Lightbulb size={20} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-[var(--color-primary)]">
            Quick Tip
          </h4>
          <p className="text-sm text-gray-600">
            Use the <b>+/- buttons</b> to stage adjustments. Click &lsquo;Save
            Changes&rsquo; once you&apos;re done to commit all updates to the
            live inventory.
          </p>
        </div>
      </div>
    </div>
  );
}
