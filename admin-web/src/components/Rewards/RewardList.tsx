import {
  Edit,
  Trash2,
  Power,
  PowerOff,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import { getImageUrl } from '../../lib/imageUtils';
import type { RewardCatalogItem } from '../../types/reward';

interface RewardListProps {
  rewards: RewardCatalogItem[];
  isLoading: boolean;
  searchQuery: string;
  onEdit: (reward: RewardCatalogItem) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
}

type SortField =
  | 'title'
  | 'points_required'
  | 'reward_value'
  | 'stock_quantity';
type SortDirection = 'asc' | 'desc';

export const RewardList = ({
  rewards,
  isLoading,
  searchQuery,
  onEdit,
  onDelete,
  onToggleStatus,
}: RewardListProps) => {
  const [sortField, setSortField] = useState<SortField>('points_required');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp size={14} />
    ) : (
      <ChevronDown size={14} />
    );
  };

  const filteredAndSortedRewards = rewards
    .filter(
      reward =>
        reward.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reward.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reward.reward_type.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      const aVal = a[sortField] || 0;
      const bVal = b[sortField] || 0;

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

  if (filteredAndSortedRewards.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-[var(--border-default)] rounded-xl bg-[var(--bg-tertiary)]">
        <p className="text-[var(--text-secondary)]">
          {searchQuery
            ? 'No rewards found matching your search'
            : 'No rewards in catalog yet'}
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
                <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Reward
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('points_required')}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors"
                >
                  Points
                  <SortIcon field="points_required" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('reward_value')}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors"
                >
                  Value
                  <SortIcon field="reward_value" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('stock_quantity')}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors"
                >
                  Stock
                  <SortIcon field="stock_quantity" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Type
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Status
                </span>
              </th>
              <th className="px-4 py-3 text-right">
                <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {filteredAndSortedRewards.map(reward => (
              <tr
                key={reward.id}
                className="hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                      {reward.image_url ? (
                        <img
                          src={getImageUrl(reward.image_url)}
                          alt={reward.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon
                            size={20}
                            className="text-[var(--text-tertiary)]"
                          />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[var(--text-primary)] text-sm truncate">
                        {reward.title}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        {reward.description}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-[var(--text-primary)] text-sm">
                    {reward.points_required.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {reward.reward_value
                      ? `$${reward.reward_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-sm ${
                      reward.stock_quantity === null
                        ? 'text-[var(--text-tertiary)]'
                        : reward.stock_quantity > 10
                          ? 'text-[var(--text-secondary)]'
                          : 'text-red-500'
                    }`}
                  >
                    {reward.stock_quantity === null
                      ? '∞'
                      : reward.stock_quantity.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] capitalize">
                    {reward.reward_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
                      reward.is_active
                        ? 'bg-[var(--text-primary)] text-[var(--color-primary-text)]'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        reward.is_active
                          ? 'bg-[var(--color-primary-text)]'
                          : 'bg-[var(--text-tertiary)]'
                      }`}
                    />
                    {reward.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(reward)}
                      className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                      title="Edit reward"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() =>
                        onToggleStatus(reward.id, reward.is_active)
                      }
                      className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                      title={reward.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {reward.is_active ? (
                        <PowerOff size={16} />
                      ) : (
                        <Power size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => onDelete(reward.id)}
                      className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete reward"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
            Showing {filteredAndSortedRewards.length} of {rewards.length}{' '}
            rewards
          </span>
          <span>{rewards.filter(r => r.is_active).length} active</span>
        </div>
      </div>
    </div>
  );
};
