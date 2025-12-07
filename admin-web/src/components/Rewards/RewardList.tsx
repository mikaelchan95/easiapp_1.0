import { Tag, Gift, Award, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { getImageUrl } from '../../lib/imageUtils';

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
      <div className="text-center py-12 text-[var(--text-secondary)]">
        Loading rewards...
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'voucher':
        return <Tag size={20} className="text-green-600 dark:text-green-400" />;
      case 'bundle':
        return (
          <Gift size={20} className="text-purple-600 dark:text-purple-400" />
        );
      case 'experience':
        return (
          <Award size={20} className="text-orange-600 dark:text-orange-400" />
        );
      default:
        return <Gift size={20} className="text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
          Reward Catalog
        </h2>
        <Button onClick={onCreate} leftIcon={<Plus size={16} />}>
          Add Reward
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {rewards.map(reward => (
          <Card key={reward.id} className="overflow-hidden flex flex-col">
            <div className="relative h-40 bg-[var(--bg-tertiary)]">
              {reward.image_url ? (
                <img
                  src={getImageUrl(reward.image_url)}
                  alt={reward.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)]">
                  {getIcon(reward.reward_type)}
                </div>
              )}
              {reward.logo_url && (
                <div className="absolute bottom-2 left-2 w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-white shadow-sm">
                  <img
                    src={getImageUrl(reward.logo_url)}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge variant={reward.is_active ? 'success' : 'default'}>
                  {reward.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                    {reward.reward_type}
                  </p>
                  <h3 className="font-bold text-[var(--text-primary)] text-base sm:text-lg line-clamp-1">
                    {reward.title}
                  </h3>
                </div>
                <div className="font-bold text-[var(--text-primary)] text-base sm:text-lg flex-shrink-0">
                  {reward.points_required.toLocaleString()} pts
                </div>
              </div>

              <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2 flex-1">
                {reward.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-primary)] text-sm">
                <span className="text-[var(--text-secondary)]">
                  {reward.reward_value
                    ? `$${reward.reward_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} value`
                    : 'No value'}
                </span>
                <span className="text-[var(--text-secondary)]">
                  Stock: {reward.stock_quantity?.toLocaleString() ?? '∞'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(reward)}
                  className="w-full col-span-2"
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleStatus(reward.id, reward.is_active)}
                  className={
                    reward.is_active
                      ? 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                      : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                  }
                >
                  {reward.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(reward.id)}
                  className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-300"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {rewards.length === 0 && (
          <div className="col-span-full py-12 text-center bg-[var(--bg-tertiary)] rounded-xl border border-dashed border-[var(--border-primary)]">
            <p className="text-[var(--text-secondary)]">
              No rewards found. Create your first reward!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
