import React from 'react';
import { ArrowLeft, History } from 'lucide-react';
import { ViewMode } from '../../types/rewards';

interface RewardsHeaderProps {
  onBack: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  userPoints: number;
  activeVouchersCount: number;
}

const RewardsHeader: React.FC<RewardsHeaderProps> = ({
  onBack,
  viewMode,
  onViewModeChange,
  userPoints,
  activeVouchersCount
}) => {
  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-4 h-4 text-gray-900" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">EASI Rewards</h1>
          </div>
          <div className="bg-black text-white px-3 py-1.5 rounded-lg">
            <span className="text-sm font-bold">{userPoints.toLocaleString()}</span>
          </div>
        </div>

        {/* Segmented Control */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('browse')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
              viewMode === 'browse'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 active:scale-95'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => onViewModeChange('redeemed')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
              viewMode === 'redeemed'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 active:scale-95'
            }`}
          >
            <div className="flex items-center justify-center space-x-2 relative">
              <History className="w-4 h-4" />
              <span>My Rewards</span>
              {activeVouchersCount > 0 && (
                <div className="absolute -right-3 -top-1 w-2 h-2 bg-primary-500 rounded-full" />
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RewardsHeader;