import React from 'react';
import { Gift, Star, Flame } from 'lucide-react';
import { Reward } from '../../types/rewards';

interface RewardCardProps {
  reward: Reward;
  userPoints: number;
  onRedeem: (rewardId: string) => void;
  index: number;
}

const RewardCard: React.FC<RewardCardProps> = ({ 
  reward, 
  userPoints, 
  onRedeem, 
  index 
}) => {
  const canAfford = userPoints >= reward.points;
  const IconComponent = reward.icon;
  
  const handleRedeem = () => {
    if (reward.available && canAfford) {
      onRedeem(reward.id);
    }
  };
  
  return (
    <div 
      className="bg-white rounded-xl border border-gray-100 animate-fade-in shadow-sm overflow-hidden"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex">
        {/* Left section - Icon */}
        <div className="p-3 border-r border-gray-100">
          <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center">
            <IconComponent className="w-6 h-6 text-gray-600" />
          </div>
        </div>
        
        {/* Middle section - Info */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900">
                {reward.title}
              </h3>
              <div className="flex items-center">
                {reward.trending && (
                  <div className="bg-red-50 w-5 h-5 flex items-center justify-center rounded-full">
                    <Flame className="w-3 h-3 text-red-600" />
                  </div>
                )}
                {reward.exclusive && (
                  <div className="bg-yellow-50 w-5 h-5 flex items-center justify-center rounded-full ml-1">
                    <Star className="w-3 h-3 text-yellow-600 fill-current" />
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-1">{reward.description}</p>
            
            {reward.validUntil && (
              <div className="flex items-center space-x-1 text-gray-500">
                <span className="text-xs">Valid {reward.validUntil}</span>
              </div>
            )}
          </div>
          
          {/* Value badges */}
          <div className="flex items-center space-x-2 mt-1">
            {reward.originalValue && (
              <div className="bg-gray-100 px-2 py-0.5 rounded-lg">
                <span className="text-xs font-bold text-gray-700">
                  ${reward.originalValue}
                </span>
              </div>
            )}
            <div className="bg-primary-50 px-2 py-0.5 rounded-lg">
              <span className="text-xs font-bold text-primary-700">
                {reward.points.toLocaleString()} pts
              </span>
            </div>
          </div>
        </div>

        {/* Right section - Action */}
        <div className="p-3 flex items-center">
          <button
            onClick={handleRedeem}
            disabled={!reward.available || !canAfford}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !reward.available 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : !canAfford
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white active:scale-95'
            }`}
          >
            {!reward.available ? 'Unavailable' : 
             !canAfford ? 'Need More' : 
             'Redeem'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RewardCard;