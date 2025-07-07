import React from 'react';
import { useApp } from '../context/AppContext';
import { useRewards } from '../hooks/useRewards';
import { REWARD_CATEGORIES } from '../data/rewards';
import RewardsHeader from '../components/Rewards/RewardsHeader';
import LoyaltyProgressCard from '../components/Rewards/LoyaltyProgressCard';
import CategoryFilter from '../components/Rewards/CategoryFilter';
import RewardCard from '../components/Rewards/RewardCard';
import RedemptionModal from '../components/Rewards/RedemptionModal/RedemptionModal';
import RedeemedVouchers from '../components/Rewards/RedeemedVouchers';
import { User, ArrowRight, Gift, ArrowLeft } from 'lucide-react';

interface EASIRewardsProps {
  onBack: () => void;
  onSignIn?: () => void;
}

const EASIRewards: React.FC<EASIRewardsProps> = ({ onBack, onSignIn }) => {
  const { state } = useApp();
  
  const {
    viewMode,
    activeCategory,
    showRedemption,
    redemptionStep,
    selectedDeliveryMethod,
    generatedCode,
    generatedVoucherCode,
    copiedCode,
    copiedVoucher,
    redeemedVouchers,
    userPoints,
    filteredRewards,
    selectedReward,
    setViewMode,
    setActiveCategory,
    setSelectedDeliveryMethod,
    handleRedeem,
    handleConfirm,
    handleProceed,
    copyCode,
    copyVoucherCode,
    resetRedemption
  } = useRewards();

  const activeVouchersCount = redeemedVouchers.filter(v => v.status === 'active').length;

  // Render sign-in prompt if user is not logged in
  if (!state.user && onSignIn) {
    return (
      <div className="page-container bg-gray-50 max-w-sm mx-auto">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="px-4 py-4">
            <div className="flex items-center space-x-3">
              <button 
                onClick={onBack}
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
              >
                <ArrowLeft className="w-4 h-4 text-gray-700" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">EASI Rewards</h1>
            </div>
          </div>
        </div>
        
        <div className="page-content flex flex-col items-center justify-center px-8 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mb-6 mt-16 animate-bounce-in">
            <Gift className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3 animate-fade-in">Sign In Required</h3>
          <p className="text-gray-600 mb-8 animate-fade-in">
            Sign in to view your rewards and redeem exclusive offers
          </p>
          <button
            onClick={onSignIn}
            className="bg-black text-white px-8 py-4 rounded-2xl font-bold active:scale-95 transition-transform flex items-center space-x-2 animate-fade-in"
          >
            <User className="w-5 h-5" />
            <span>Sign In</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-sm mx-auto">
      <RewardsHeader
        onBack={onBack}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        userPoints={userPoints}
        activeVouchersCount={activeVouchersCount}
      />

      <div className="page-content">
        {viewMode === 'browse' ? (
          <>
            <LoyaltyProgressCard userPoints={userPoints} />
            
            <CategoryFilter
              categories={REWARD_CATEGORIES}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />

            <div className="px-4 pb-8">
              <div className="space-y-6">
                {filteredRewards.map((reward, index) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    userPoints={userPoints}
                    onRedeem={handleRedeem}
                    index={index}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <RedeemedVouchers
            vouchers={redeemedVouchers}
            onViewModeChange={setViewMode}
            onCopyVoucherCode={copyVoucherCode}
            copiedVoucher={copiedVoucher}
          />
        )}
      </div>

      {/* Redemption Modal */}
      {showRedemption && selectedReward && (
        <RedemptionModal
          selectedReward={selectedReward}
          redemptionStep={redemptionStep}
          userPoints={userPoints}
          selectedDeliveryMethod={selectedDeliveryMethod}
          setSelectedDeliveryMethod={setSelectedDeliveryMethod}
          generatedCode={generatedCode}
          generatedVoucherCode={generatedVoucherCode}
          copiedCode={copiedCode}
          copiedVoucher={copiedVoucher}
          onConfirm={handleConfirm}
          onProceed={handleProceed}
          onReset={resetRedemption}
          onCopyCode={copyCode}
          onCopyVoucherCode={() => copyVoucherCode()}
          onStepBack={() => {}}
        />
      )}
    </div>
  );
};

export default EASIRewards;