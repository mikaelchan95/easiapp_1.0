import { Gift, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { getImageUrl } from '../../lib/imageUtils';
import type { RewardCatalogItem } from '../../types/reward';

interface RewardListProps {
  rewards: RewardCatalogItem[];
  isLoading: boolean;
  onEdit: (reward: RewardCatalogItem) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onCreate: () => void;
}

export const RewardList = ({
  rewards,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
  onCreate,
}: RewardListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-9 w-28 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-2xl bg-gray-50 border border-gray-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Reward Catalog
        </h2>
        <Button size="sm" onClick={onCreate} leftIcon={<Plus size={16} />}>
          Add Reward
        </Button>
      </div>

      {rewards.length === 0 ? (
        <div className="py-16 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Gift size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-[var(--text-secondary)]">
            No rewards yet. Add one to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map(reward => (
            <Card
              key={reward.id}
              hover
              className="overflow-hidden flex flex-col !p-0"
            >
              <div className="relative h-36 bg-gray-50">
                {reward.image_url ? (
                  <img
                    src={getImageUrl(reward.image_url)}
                    alt={reward.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gift size={28} className="text-gray-300" />
                  </div>
                )}
                {reward.logo_url && (
                  <div className="absolute bottom-2 left-2 w-8 h-8 rounded-full overflow-hidden border-2 border-white bg-white shadow-sm">
                    <img
                      src={getImageUrl(reward.logo_url)}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={reward.is_active ? 'mono' : 'mono-outline'}>
                    {reward.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">
                      {reward.reward_type}
                    </p>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {reward.title}
                    </h3>
                  </div>
                  <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums shrink-0">
                    {reward.points_required.toLocaleString()} pts
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2 flex-1">
                  {reward.description}
                </p>

                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-3 border-t border-gray-100">
                  <span>
                    {reward.reward_value
                      ? `$${reward.reward_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} value`
                      : 'No value'}
                  </span>
                  <span>
                    Stock: {reward.stock_quantity?.toLocaleString() ?? '∞'}
                  </span>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(reward)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleStatus(reward.id, reward.is_active)}
                    className="text-xs"
                  >
                    {reward.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(reward.id)}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 text-xs"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
