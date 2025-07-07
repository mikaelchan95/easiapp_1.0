import React from 'react';
import { User, Edit3, Award } from 'lucide-react';
import { User as UserType } from '../../types';
import { useCredit } from '../../hooks/useCredit';
import { useRewards } from '../../hooks/useRewards';
import { getLoyaltyLevelInfo, getLoyaltyProgressPercentage } from '../../utils/rewards';

interface ProfileCardProps {
  user: UserType | null;
  onEditProfile: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, onEditProfile }) => {
  const { creditAccount } = useCredit();
  const { userPoints } = useRewards();
  const isTradeAccount = user?.role === 'trade';

  const { currentTier } = getLoyaltyLevelInfo(userPoints);
  const progressPercentage = getLoyaltyProgressPercentage(userPoints);

  if (!user) return null;

  return (
    <div className="bg-black rounded-2xl p-5 text-white shadow-md">
      <div className="flex items-center space-x-4 mb-5">
        <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
          <User className="w-7 h-7 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold leading-tight">{user.name}</h2>
          <p className="text-gray-400 text-sm">{user.email}</p>
          <div className="flex items-center space-x-2 mt-2">
            <div className="bg-amber-500 px-3 py-1 rounded-lg text-xs font-bold text-black">
              {isTradeAccount ? 'Trade Account' : 'Retail Account'}
            </div>
            {isTradeAccount && (
              <div className="flex items-center space-x-1 text-amber-300">
                <Award className="w-3 h-3" />
                <span className="text-xs font-bold">Wholesale</span>
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={onEditProfile}
          className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Edit profile"
        >
          <Edit3 className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Loyalty Status */}
      <div className="mb-4 mt-4 pt-4 border-t border-gray-800">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-bold text-primary-400">{currentTier.name} Member</span>
          </div>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div 
            className="h-1.5 bg-primary-500 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <div>
          <div className="text-xl font-bold">
            {creditAccount ? `$${(creditAccount.availableCredit / 1000).toFixed(1)}K` : '$0'}
          </div>
          <div className="text-xs text-gray-400 mt-1">Available Credit</div>
        </div>
        <div>
          <div className="text-xl font-bold">0</div>
          <div className="text-xs text-gray-400 mt-1">Orders</div>
        </div>
        <div>
          <div className="text-xl font-bold">{userPoints.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">Reward Points</div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;