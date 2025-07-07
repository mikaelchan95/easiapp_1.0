import { useState } from 'react';
import { Reward, RedemptionStep, ViewMode, RewardCategoryId, RedeemedVoucher } from '../types/rewards';
import { REWARDS_DATA, MOCK_REDEEMED_VOUCHERS } from '../data/rewards';

export const useRewards = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [activeCategory, setActiveCategory] = useState<RewardCategoryId>('all');
  const [showRedemption, setShowRedemption] = useState<string | null>(null);
  const [redemptionStep, setRedemptionStep] = useState<RedemptionStep>('confirm');
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<string>('app');
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedVoucherCode, setGeneratedVoucherCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedVoucher, setCopiedVoucher] = useState(false);
  const [redeemedVouchers, setRedeemedVouchers] = useState<RedeemedVoucher[]>(MOCK_REDEEMED_VOUCHERS);

  const userPoints = 38412;
  const rewards = REWARDS_DATA;

  const filteredRewards = rewards.filter(reward => 
    activeCategory === 'all' || reward.category === activeCategory
  );

  const selectedReward = showRedemption ? rewards.find(r => r.id === showRedemption) : null;

  const handleRedeem = (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (reward && userPoints >= reward.points) {
      setShowRedemption(rewardId);
      setRedemptionStep('confirm');
    }
  };

  const handleConfirm = () => {
    if (!selectedReward) return;
    
    if (selectedReward.type === 'credit' || selectedReward.type === 'discount') {
      setRedemptionStep('processing');
      processRedemption();
    } else {
      setRedemptionStep('details');
    }
  };

  const handleProceed = () => {
    setRedemptionStep('processing');
    processRedemption();
  };

  const processRedemption = () => {
    setTimeout(() => {
      if (selectedReward?.type === 'discount') {
        setGeneratedCode('SAVE15NOW');
      }
      if (selectedReward?.type === 'voucher' || selectedReward?.type === 'experience') {
        const voucherCode = 'VCH' + Math.random().toString(36).substr(2, 8).toUpperCase();
        setGeneratedVoucherCode(voucherCode);
        
        const newVoucher: RedeemedVoucher = {
          id: `rv${Date.now()}`,
          reward: selectedReward,
          voucherCode,
          redeemedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + (selectedReward.validUntil === '6 months' ? 6 : 3) * 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          deliveryMethod: 'In-App'
        };
        setRedeemedVouchers(prev => [newVoucher, ...prev]);
      }
      setRedemptionStep('success');
    }, 1600);
  };

  const copyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1600);
    }
  };

  const copyVoucherCode = (code?: string) => {
    const codeToCopy = code || generatedVoucherCode;
    if (codeToCopy) {
      navigator.clipboard.writeText(codeToCopy);
      setCopiedVoucher(true);
      setTimeout(() => setCopiedVoucher(false), 1600);
    }
  };

  const resetRedemption = () => {
    setShowRedemption(null);
    setRedemptionStep('confirm');
    setGeneratedCode('');
    setGeneratedVoucherCode('');
    setCopiedCode(false);
    setCopiedVoucher(false);
  };

  return {
    // State
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
    rewards,
    filteredRewards,
    selectedReward,
    
    // Actions
    setViewMode,
    setActiveCategory,
    setSelectedDeliveryMethod,
    handleRedeem,
    handleConfirm,
    handleProceed,
    copyCode,
    copyVoucherCode,
    resetRedemption
  };
};