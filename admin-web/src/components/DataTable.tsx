import { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
} from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  defaultSortKey?: string;
  defaultSortOrder?: 'asc' | 'desc';
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
}

export function DataTable<
  T extends { id: string | number } & Record<string, any>,
>({
  data,
  columns,
  isLoading = false,
  onRowClick,
  searchPlaceholder = 'Search...',
  filters,
  defaultSortKey,
  defaultSortOrder = 'desc',
  selectable = false,
  selectedIds = [],
  onSelectionChange,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(
    defaultSortKey ? { key: defaultSortKey, direction: defaultSortOrder } : null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Very basic search implementation that looks through all string values
      return Object.values(item).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // Reset page when search/filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, data]);

  // Selection Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select all visible items (or all items? usually all visible or all in dataset)
      // Let's select all in current filtered dataset for better UX
      const allIds = filteredData.map(item => item.id);
      onSelectionChange?.(allIds);
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (id: string | number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange?.(selectedIds.filter(itemId => itemId !== id));
    } else {
      onSelectionChange?.([...selectedIds, id]);
    }
  };

  const isAllSelected =
    filteredData.length > 0 &&
    filteredData.every(item => selectedIds.includes(item.id));
  const isIndeterminate =
    filteredData.some(item => selectedIds.includes(item.id)) && !isAllSelected;

  return (
    <div className="w-full">
      {/* Search and Filters Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {filters && (
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-[var(--text-secondary)]" />
            {filters}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-[var(--bg-tertiary)] text-xs uppercase text-[var(--text-primary)] font-bold tracking-wider">
              <tr>
                {selectable && (
                  <th className="px-4 sm:px-6 py-3 sm:py-4 w-4">
                    <input
                      type="checkbox"
                      className="rounded border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-[var(--text-primary)] min-w-[20px] min-h-[20px] touch-manipulation"
                      checked={isAllSelected}
                      ref={input => {
                        if (input) input.indeterminate = isIndeterminate;
                      }}
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                {columns.map(column => (
                  <th
                    key={column.key}
                    className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold ${
                      column.sortable
                        ? 'cursor-pointer select-none hover:bg-[var(--bg-secondary)] transition-colors'
                        : ''
                    }`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      {column.header}
                      {column.sortable &&
                        sortConfig?.key === column.key &&
                        (sortConfig.direction === 'asc' ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        ))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-6 py-12 text-center text-[var(--text-secondary)]"
                  >
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--text-primary)]"></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-6 py-12 text-center text-[var(--text-secondary)]"
                  >
                    No data found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    onClick={e => {
                      // Prevent row click when clicking checkbox or interactive elements
                      if (
                        (e.target as HTMLElement).tagName === 'INPUT' ||
                        (e.target as HTMLElement).closest('a') ||
                        (e.target as HTMLElement).closest('button')
                      ) {
                        return;
                      }
                      onRowClick && onRowClick(row);
                    }}
                    className={`${
                      onRowClick
                        ? 'cursor-pointer hover:bg-[var(--bg-tertiary)]'
                        : ''
                    } transition-colors ${
                      selectedIds.includes(row.id)
                        ? 'bg-[var(--bg-tertiary)]/50'
                        : ''
                    }`}
                  >
                    {selectable && (
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <input
                          type="checkbox"
                          className="rounded border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-[var(--text-primary)] min-w-[20px] min-h-[20px] touch-manipulation"
                          checked={selectedIds.includes(row.id)}
                          onChange={() => handleSelectRow(row.id)}
                        />
                      </td>
                    )}
                    {columns.map(column => (
                      <td
                        key={`${row.id}-${column.key}`}
                        className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-primary)]"
                      >
                        {column.render ? column.render(row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 py-3 sm:px-6">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Showing{' '}
                  <span className="font-medium text-[var(--text-primary)]">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium text-[var(--text-primary)]">
                    {Math.min(currentPage * itemsPerPage, sortedData.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium text-[var(--text-primary)]">
                    {sortedData.length}
                  </span>{' '}
                  results
                </p>
              </div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-3 py-2 text-[var(--text-secondary)] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[36px] touch-manipulation"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(p => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-3 py-2 text-[var(--text-secondary)] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[36px] touch-manipulation"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
