import { Tag, Gift, Award, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

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
    return <div className="text-center py-12">Loading rewards...</div>;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'voucher':
        return <Tag size={20} className="text-green-600" />;
      case 'bundle':
        return <Gift size={20} className="text-purple-600" />;
      case 'experience':
        return <Award size={20} className="text-orange-600" />;
      default:
        return <Gift size={20} className="text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-brand-dark">Reward Catalog</h2>
        <Button onClick={onCreate} leftIcon={<Plus size={16} />}>
          Add Reward
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map(reward => (
          <Card key={reward.id} className="overflow-hidden flex flex-col">
            <div className="relative h-40 bg-gray-100">
              {reward.image_url ? (
                <img
                  src={reward.image_url}
                  alt={reward.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  {getIcon(reward.reward_type)}
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge variant={reward.is_active ? 'success' : 'default'}>
                  {reward.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    {reward.reward_type}
                  </p>
                  <h3 className="font-bold text-brand-dark text-lg line-clamp-1">
                    {reward.title}
                  </h3>
                </div>
                <div className="font-bold text-brand-accent text-lg">
                  {reward.points_required} pts
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
                {reward.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm">
                <span className="text-gray-500">
                  {reward.reward_value
                    ? '$' + reward.reward_value + ' value'
                    : 'No value'}
                </span>
                <span className="text-gray-500">
                  Stock: {reward.stock_quantity ?? '∞'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(reward)}
                  className="w-full"
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleStatus(reward.id, reward.is_active)}
                  className={
                    reward.is_active
                      ? 'text-orange-600 hover:bg-orange-50'
                      : 'text-green-600 hover:bg-green-50'
                  }
                >
                  {reward.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(reward.id)}
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {rewards.length === 0 && (
          <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">
              No rewards found. Create your first reward!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
