import React from 'react';
import { Package, Gift, Heart, HelpCircle } from 'lucide-react';

interface QuickActionGridProps {
  onOrdersClick: () => void;
  onRewardsClick: () => void;
  onFavoritesClick?: () => void;
  onSupportClick: () => void;
}

const QuickActionGrid: React.FC<QuickActionGridProps> = ({
  onOrdersClick,
  onRewardsClick,
  onFavoritesClick = () => {},
  onSupportClick
}) => {
  const actions = [
    { 
      icon: <Package className="w-4 h-4 text-blue-600" />, 
      label: 'Orders', 
      bgColor: 'bg-blue-100',
      onClick: onOrdersClick
    },
    { 
      icon: <Gift className="w-4 h-4 text-purple-600" />, 
      label: 'Rewards', 
      bgColor: 'bg-purple-100',
      onClick: onRewardsClick
    },
    { 
      icon: <Heart className="w-4 h-4 text-red-600" />, 
      label: 'Favorites', 
      bgColor: 'bg-red-100',
      onClick: onFavoritesClick
    },
    { 
      icon: <HelpCircle className="w-4 h-4 text-gray-600" />, 
      label: 'Support', 
      bgColor: 'bg-gray-200',
      onClick: onSupportClick
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((action, index) => (
        <button 
          key={index}
          onClick={action.onClick}
          className="bg-white p-3 rounded-xl text-center border border-gray-200 active:scale-95 transition-all shadow-sm hover:shadow flex flex-col items-center justify-center"
        >
          <div className={`w-8 h-8 ${action.bgColor} rounded-lg flex items-center justify-center mx-auto mb-1.5`}>
            {action.icon}
          </div>
          <span className="text-xs font-bold text-gray-800 truncate w-full">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickActionGrid;