import React from 'react';
import { Gift, TrendingUp, Star } from 'lucide-react';

interface PointsBalanceProps {
  userPoints: number;
}

const PointsBalance: React.FC<PointsBalanceProps> = ({ userPoints }) => {
  return (
    <div className="px-4 mb-6">
      <div className="bg-black rounded-xl p-5 border border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-3xl font-bold text-white">{userPoints.toLocaleString()}</h2>
            <p className="text-gray-300 font-medium text-sm mt-1">Available Points</p>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
            <Gift className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-xs text-white/70">Earn Rate</div>
              <div className="text-sm font-bold text-white mt-1">1pt = $1</div>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-xs text-white/70">Premium</div>
              <div className="text-sm font-bold text-white mt-1">2x pts</div>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-xs text-white/70">Referral</div>
              <div className="text-sm font-bold text-white mt-1">500pts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsBalance;