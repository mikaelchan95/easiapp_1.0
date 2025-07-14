import { useState, useCallback } from 'react';

export interface PurchaseAchievementData {
  orderTotal: number;
  pointsEarned: number;
  savingsAmount?: number;
  orderId?: string;
}

export const usePurchaseAchievement = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [achievementData, setAchievementData] =
    useState<PurchaseAchievementData | null>(null);

  const showAchievement = useCallback((data: PurchaseAchievementData) => {
    setAchievementData(data);
    setIsVisible(true);
  }, []);

  const hideAchievement = useCallback(() => {
    setIsVisible(false);
    // Clear data after animation completes
    setTimeout(() => {
      setAchievementData(null);
    }, 500);
  }, []);

  const calculateRewards = useCallback((orderTotal: number) => {
    const pointsEarned = Math.floor(orderTotal * 2); // 2 points per dollar
    const savingsAmount = orderTotal * 0.15; // 15% savings

    return {
      pointsEarned,
      savingsAmount,
    };
  }, []);

  return {
    isVisible,
    achievementData,
    showAchievement,
    hideAchievement,
    calculateRewards,
  };
};

export default usePurchaseAchievement;
