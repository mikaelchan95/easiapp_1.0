import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface Voucher {
  id: string;
  voucher_code: string;
  voucher_value: number;
  voucher_status: 'active' | 'used' | 'expired' | 'cancelled';
  expires_at: string;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  redemption?: {
    reward?: {
      title: string;
    };
  };
  created_at: string;
}

interface Props {
  vouchers: Voucher[];
  isLoading: boolean;
  searchQuery: string;
}

type SortField = 'voucher_code' | 'voucher_value' | 'created_at' | 'expires_at';
type SortDirection = 'asc' | 'desc';

export const RewardVouchers = ({ vouchers, isLoading, searchQuery }: Props) => {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp size={14} />
    ) : (
      <ChevronDown size={14} />
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-[var(--text-primary)] text-[var(--color-primary-text)]';
      case 'used':
        return 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'cancelled':
        return 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]';
      default:
        return 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]';
    }
  };

  const filteredAndSortedVouchers = vouchers
    .filter(
      voucher =>
        voucher.voucher_code
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        voucher.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voucher.user?.email
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        voucher.redemption?.reward?.title
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;

      if (sortField === 'created_at' || sortField === 'expires_at') {
        return (
          multiplier *
          (new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime())
        );
      }

      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return multiplier * aVal.localeCompare(bVal);
      }
      return multiplier * ((aVal as number) - (bVal as number));
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--text-primary)]"></div>
      </div>
    );
  }

  if (filteredAndSortedVouchers.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-[var(--border-default)] rounded-xl bg-[var(--bg-tertiary)]">
        <p className="text-[var(--text-secondary)]">
          {searchQuery
            ? 'No vouchers found matching your search'
            : 'No vouchers issued yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[var(--border-default)] rounded-xl overflow-hidden bg-[var(--bg-card)]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-subtle)]">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('voucher_code')}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors"
                >
                  Code
                  <SortIcon field="voucher_code" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('voucher_value')}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors"
                >
                  Value
                  <SortIcon field="voucher_value" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  User
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Source
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Status
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('expires_at')}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors"
                >
                  Expires
                  <SortIcon field="expires_at" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {filteredAndSortedVouchers.map(voucher => (
              <tr
                key={voucher.id}
                className="hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono font-semibold text-[var(--text-primary)]">
                      {voucher.voucher_code}
                    </code>
                    <button
                      onClick={() => handleCopyCode(voucher.voucher_code)}
                      className="p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                      title="Copy code"
                    >
                      {copiedCode === voucher.voucher_code ? (
                        <Check
                          size={14}
                          className="text-[var(--text-primary)]"
                        />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-[var(--text-primary)] text-sm">
                    ${voucher.voucher_value.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {voucher.user?.name || 'Unknown'}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {voucher.user?.email}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-[var(--text-secondary)] truncate max-w-[200px] block">
                    {voucher.redemption?.reward?.title || 'Manual'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusColor(voucher.voucher_status)}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        voucher.voucher_status === 'active'
                          ? 'bg-[var(--color-primary-text)]'
                          : 'bg-current'
                      }`}
                    />
                    {voucher.voucher_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {new Date(voucher.expires_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-tertiary)]">
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span>
            Showing {filteredAndSortedVouchers.length} of {vouchers.length}{' '}
            vouchers
          </span>
          <div className="flex items-center gap-4">
            <span>
              {vouchers.filter(v => v.voucher_status === 'active').length}{' '}
              active
            </span>
            <span>
              {vouchers.filter(v => v.voucher_status === 'used').length} used
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
