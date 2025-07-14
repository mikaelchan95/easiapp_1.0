import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from 'react';
import { useAppContext } from './AppContext';
import { pointsService } from '../services/pointsService';
import { auditService } from '../services/auditService';

// Types
export type TierLevel = 'Bronze' | 'Silver' | 'Gold';
export type VoucherStatus = 'pending' | 'confirmed' | 'expired' | 'used';
export type PointsTransactionType =
  | 'earned'
  | 'redeemed'
  | 'expired'
  | 'missing';

export interface PointsHistory {
  id: string;
  date: string;
  description: string;
  points: number;
  type: PointsTransactionType;
  orderId?: string;
  category?:
    | 'purchase'
    | 'bonus'
    | 'milestone'
    | 'voucher'
    | 'expiry'
    | 'adjustment';
  expiryDate?: string; // For points that will expire
}

export interface VoucherRedemption {
  id: string;
  rewardId: string;
  title: string;
  value: number;
  pointsUsed: number;
  status: VoucherStatus;
  redeemedDate: string;
  expiryDate: string;
  usedDate?: string;
  orderId?: string; // Order where voucher was used
  confirmationCode?: string;
}

export interface MissingPointsEntry {
  id: string;
  orderId: string;
  orderDate: string;
  expectedPoints: number;
  reason: string;
  status: 'reported' | 'investigating' | 'resolved' | 'rejected';
  reportedDate: string;
  resolvedDate?: string;
}

export interface PointsExpiry {
  id: string;
  points: number;
  earnedDate: string;
  expiryDate: string;
  source: string; // What earned these points
}

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  points: number;
  type: 'voucher' | 'bundle' | 'swag';
  value?: number; // For vouchers
  imageUrl?: string;
  stock?: number;
  validityDays?: number; // How many days the voucher is valid after redemption
}

export interface UserRewards {
  points: number;
  tier: TierLevel;
  lifetimePoints: number;
  yearlySpend: number; // 12-month rolling
  pointsHistory: PointsHistory[];
  redeemedRewards: string[]; // IDs of redeemed rewards
  availableVouchers: {
    id: string;
    rewardId: string;
    value: number;
    expiryDate: string;
    used: boolean;
  }[];
  voucherRedemptions: VoucherRedemption[];
  missingPoints: MissingPointsEntry[];
  pointsExpiring: PointsExpiry[];
}

interface RewardsState {
  userRewards: UserRewards | null;
  rewardsCatalog: RewardItem[];
  loading: boolean;
  error: string | null;
}

type RewardsAction =
  | {
      type: 'EARN_POINTS';
      payload: {
        points: number;
        description: string;
        orderId?: string;
        category?: string;
      };
    }
  | { type: 'REDEEM_REWARD'; payload: { rewardId: string } }
  | { type: 'USE_VOUCHER'; payload: { voucherId: string } }
  | { type: 'UPDATE_TIER' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_USER_REWARDS'; payload: UserRewards }
  | { type: 'CLEAR_USER_REWARDS' }
  | { type: 'SET_REWARDS_CATALOG'; payload: RewardItem[] }
  | {
      type: 'REPORT_MISSING_POINTS';
      payload: {
        orderId: string;
        orderDate: string;
        expectedPoints: number;
        reason: string;
      };
    }
  | {
      type: 'UPDATE_VOUCHER_STATUS';
      payload: {
        redemptionId: string;
        status: VoucherStatus;
        usedDate?: string;
        orderId?: string;
      };
    }
  | { type: 'EXPIRE_POINTS'; payload: { pointsExpiryId: string } };

// Tier thresholds (based on lifetime points earned - NOT current balance)
const TIER_THRESHOLDS = {
  Bronze: { min: 0, max: 49999 },
  Silver: { min: 50000, max: 199999 },
  Gold: { min: 200000, max: Infinity },
};

// Calculate tier based on lifetime points earned (not current balance)
const calculateTier = (lifetimePoints: number): TierLevel => {
  if (lifetimePoints >= TIER_THRESHOLDS.Gold.min) return 'Gold';
  if (lifetimePoints >= TIER_THRESHOLDS.Silver.min) return 'Silver';
  return 'Bronze';
};

// Mock rewards catalog
const mockRewardsCatalog: RewardItem[] = [
  {
    id: 'voucher-500',
    title: 'S$500 Voucher',
    description: 'Redeem S$500 off your next order',
    points: 20000,
    type: 'voucher',
    value: 500,
  },
  {
    id: 'voucher-1500',
    title: 'S$1,500 Voucher',
    description: 'Redeem S$1,500 off your next order',
    points: 50000,
    type: 'voucher',
    value: 1500,
  },
  {
    id: 'bundle-120',
    title: 'Volume Bundle Deal',
    description: 'Buy 120 get 12 free on select products',
    points: 100000,
    type: 'bundle',
  },
  {
    id: 'swag-bartool',
    title: 'Premium Bar Tool Set',
    description: 'Professional-grade bar tools with custom engraving',
    points: 30000,
    type: 'swag',
    stock: 50,
  },
];

// Initial state - no user rewards until authenticated
const initialState: RewardsState = {
  userRewards: null,
  rewardsCatalog: mockRewardsCatalog,
  loading: false,
  error: null,
};

// Default user rewards for new users
const getDefaultUserRewards = (): UserRewards => ({
  points: 0,
  tier: 'Bronze',
  lifetimePoints: 0,
  yearlySpend: 0,
  pointsHistory: [],
  redeemedRewards: [],
  availableVouchers: [],
  voucherRedemptions: [],
  missingPoints: [],
  pointsExpiring: [],
});

// Reducer
const rewardsReducer = (
  state: RewardsState,
  action: RewardsAction
): RewardsState => {
  switch (action.type) {
    case 'EARN_POINTS':
      if (!state.userRewards) return state;
      const newPoints = state.userRewards.points + action.payload.points;
      const newLifetimePoints =
        state.userRewards.lifetimePoints + action.payload.points;
      const newYearlySpend =
        state.userRewards.yearlySpend + action.payload.points;

      const newHistory: PointsHistory = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        description: action.payload.description,
        points: action.payload.points,
        type: 'earned',
        orderId: action.payload.orderId,
      };

      return {
        ...state,
        userRewards: {
          ...state.userRewards,
          points: newPoints,
          lifetimePoints: newLifetimePoints,
          yearlySpend: newYearlySpend,
          tier: calculateTier(newLifetimePoints), // Use lifetime points for tier calculation
          pointsHistory: [newHistory, ...state.userRewards.pointsHistory],
        },
      };

    case 'REDEEM_REWARD':
      if (!state.userRewards) return state;
      const reward = state.rewardsCatalog.find(
        r => r.id === action.payload.rewardId
      );
      if (!reward || state.userRewards.points < reward.points) {
        return { ...state, error: 'Insufficient points or invalid reward' };
      }

      const redemptionHistory: PointsHistory = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        description: `Redeemed: ${reward.title}`,
        points: -reward.points,
        type: 'redeemed',
      };

      let newVouchers = [...state.userRewards.availableVouchers];

      if (reward.type === 'voucher' && reward.value) {
        const newVoucher = {
          id: `voucher-${Date.now()}`,
          rewardId: reward.id,
          value: reward.value,
          expiryDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(), // 30 days
          used: false,
        };
        newVouchers.push(newVoucher);
      }

      return {
        ...state,
        userRewards: {
          ...state.userRewards,
          points: state.userRewards.points - reward.points,
          pointsHistory: [
            redemptionHistory,
            ...state.userRewards.pointsHistory,
          ],
          redeemedRewards: [...state.userRewards.redeemedRewards, reward.id],
          availableVouchers: newVouchers,
        },
      };

    case 'USE_VOUCHER':
      if (!state.userRewards) return state;
      return {
        ...state,
        userRewards: {
          ...state.userRewards,
          availableVouchers: state.userRewards.availableVouchers.map(v =>
            v.id === action.payload.voucherId ? { ...v, used: true } : v
          ),
        },
      };

    case 'UPDATE_TIER':
      if (!state.userRewards) return state;
      return {
        ...state,
        userRewards: {
          ...state.userRewards,
          tier: calculateTier(state.userRewards.lifetimePoints), // Use lifetime points for tier calculation
        },
      };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'LOAD_USER_REWARDS':
      return { ...state, userRewards: action.payload };

    case 'CLEAR_USER_REWARDS':
      return { ...state, userRewards: null };

    case 'SET_REWARDS_CATALOG':
      return { ...state, rewardsCatalog: action.payload };

    case 'REPORT_MISSING_POINTS':
      if (!state.userRewards) return state;
      const newMissingEntry: MissingPointsEntry = {
        id: `missing-${Date.now()}`,
        orderId: action.payload.orderId,
        orderDate: action.payload.orderDate,
        expectedPoints: action.payload.expectedPoints,
        reason: action.payload.reason,
        status: 'reported',
        reportedDate: new Date().toISOString().split('T')[0],
      };

      return {
        ...state,
        userRewards: {
          ...state.userRewards,
          missingPoints: [...state.userRewards.missingPoints, newMissingEntry],
        },
      };

    case 'UPDATE_VOUCHER_STATUS':
      if (!state.userRewards) return state;
      return {
        ...state,
        userRewards: {
          ...state.userRewards,
          voucherRedemptions: state.userRewards.voucherRedemptions.map(
            redemption =>
              redemption.id === action.payload.redemptionId
                ? {
                    ...redemption,
                    status: action.payload.status,
                    usedDate: action.payload.usedDate,
                    orderId: action.payload.orderId,
                  }
                : redemption
          ),
        },
      };

    case 'EXPIRE_POINTS':
      if (!state.userRewards) return state;
      const expiredPointsEntry = state.userRewards.pointsExpiring.find(
        p => p.id === action.payload.pointsExpiryId
      );

      if (!expiredPointsEntry) return state;

      const expiryHistory: PointsHistory = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        description: `Points expired: ${expiredPointsEntry.source}`,
        points: -expiredPointsEntry.points,
        type: 'expired',
        category: 'expiry',
      };

      return {
        ...state,
        userRewards: {
          ...state.userRewards,
          points: state.userRewards.points - expiredPointsEntry.points,
          pointsHistory: [expiryHistory, ...state.userRewards.pointsHistory],
          pointsExpiring: state.userRewards.pointsExpiring.filter(
            p => p.id !== action.payload.pointsExpiryId
          ),
        },
      };

    default:
      return state;
  }
};

// Context
const RewardsContext = createContext<
  | {
      state: RewardsState;
      dispatch: React.Dispatch<RewardsAction>;
      earnPoints: (
        points: number,
        description: string,
        orderId?: string,
        category?: string
      ) => Promise<void>;
      redeemReward: (rewardId: string) => Promise<boolean>;
      getAvailableVouchers: () => any[];
      getTierBenefits: (tier: TierLevel) => string[];
      getPointsToNextTier: () => number;
      reportMissingPoints: (
        orderId: string,
        orderDate: string,
        expectedPoints: number,
        reason: string
      ) => void;
      updateVoucherStatus: (
        redemptionId: string,
        status: VoucherStatus,
        usedDate?: string,
        orderId?: string
      ) => void;
      getExpiringPoints: (daysAhead?: number) => PointsExpiry[];
      getVouchersByStatus: (status: VoucherStatus) => VoucherRedemption[];
    }
  | undefined
>(undefined);

// Provider
export const RewardsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(rewardsReducer, initialState);
  const appContext = useAppContext();
  const { state: appState } = appContext;

  const earnPoints = async (
    points: number,
    description: string,
    orderId?: string,
    category?: string
  ) => {
    if (!appState.user) {
      console.warn('Cannot earn points: user not authenticated');
      return;
    }

    // Update local state immediately for responsiveness
    dispatch({
      type: 'EARN_POINTS',
      payload: { points, description, orderId, category },
    });

    // Save points to database using new points service
    try {
      const { isCompanyUser } = await import('../types/user');

      // For company users, use the new company points system
      if (isCompanyUser(appState.user) && appState.company) {
        console.log('💰 Earning company points:', {
          userId: appState.user.id,
          companyId: appState.company.id,
          pointsEarned: points,
          description,
        });

        // Use the new points service to update user company points
        await pointsService.updateUserCompanyPoints(
          appState.user.id,
          appState.company.id,
          points,
          'earned_purchase'
        );

        console.log('✅ Company points saved to database successfully');
      } else {
        // For individual users, save points to user account
        const newTotalPoints = (appState.user.points || 0) + points;

        console.log('💰 Saving individual points to database:', {
          userId: appState.user.id,
          currentPoints: appState.user.points,
          pointsEarned: points,
          newTotal: newTotalPoints,
        });

        const { supabaseService } = await import('../services/supabaseService');
        const success = await supabaseService.updateUser(appState.user.id, {
          points: newTotalPoints,
        });

        if (success) {
          // Log the points transaction to audit trail
          await auditService.logPointsTransaction(
            appState.user.id,
            null,
            'earned_purchase',
            points,
            appState.user.points || 0,
            newTotalPoints,
            orderId,
            'order',
            description,
            {
              category: category,
            }
          );

          console.log('✅ Individual points saved to database successfully');
        } else {
          console.error('❌ Failed to save individual points to database');
        }
      }
    } catch (error) {
      console.error('❌ Error saving points to database:', error);
    }
  };

  const redeemReward = async (rewardId: string): Promise<boolean> => {
    if (!appState.user || !state.userRewards) {
      console.warn(
        'Cannot redeem reward: user not authenticated or rewards not loaded'
      );
      return false;
    }

    const reward = state.rewardsCatalog.find(r => r.id === rewardId);
    if (!reward || state.userRewards.points < reward.points) {
      return false;
    }

    // Update local state immediately
    dispatch({ type: 'REDEEM_REWARD', payload: { rewardId } });

    // Save updated points to database
    try {
      const { supabaseService } = await import('../services/supabaseService');
      const newTotalPoints = (appState.user.points || 0) - reward.points;

      console.log('💰 Saving redeemed points to database:', {
        userId: appState.user.id,
        currentPoints: appState.user.points,
        pointsRedeemed: reward.points,
        newTotal: newTotalPoints,
      });

      const success = await supabaseService.updateUser(appState.user.id, {
        points: newTotalPoints,
      });

      if (!success) {
        console.error('❌ Failed to save redeemed points to database');
      } else {
        console.log('✅ Redeemed points saved to database successfully');
      }
    } catch (error) {
      console.error('❌ Error saving redeemed points to database:', error);
    }

    return true;
  };

  const getAvailableVouchers = () => {
    if (!state.userRewards) return [];
    return state.userRewards.availableVouchers.filter(v => !v.used);
  };

  const getTierBenefits = (tier: TierLevel): string[] => {
    const benefits = {
      Bronze: ['Access to weekly flash-deal alerts'],
      Silver: [
        '2% off all orders',
        'Early-bird slots on same-day delivery',
        'All Bronze benefits',
      ],
      Gold: [
        '5% off all orders',
        'Free same-day delivery',
        'Exclusive volume bundles',
        'All Silver benefits',
      ],
    };
    return benefits[tier];
  };

  const getPointsToNextTier = (): number => {
    if (!state.userRewards) return 0;
    const lifetimePoints = state.userRewards.lifetimePoints;
    if (state.userRewards.tier === 'Bronze') {
      return TIER_THRESHOLDS.Silver.min - lifetimePoints;
    } else if (state.userRewards.tier === 'Silver') {
      return TIER_THRESHOLDS.Gold.min - lifetimePoints;
    }
    return 0; // Already Gold
  };

  const reportMissingPoints = (
    orderId: string,
    orderDate: string,
    expectedPoints: number,
    reason: string
  ) => {
    if (!appState.user) {
      console.warn('Cannot report missing points: user not authenticated');
      return;
    }
    dispatch({
      type: 'REPORT_MISSING_POINTS',
      payload: { orderId, orderDate, expectedPoints, reason },
    });
  };

  const updateVoucherStatus = (
    redemptionId: string,
    status: VoucherStatus,
    usedDate?: string,
    orderId?: string
  ) => {
    if (!appState.user) {
      console.warn('Cannot update voucher status: user not authenticated');
      return;
    }
    dispatch({
      type: 'UPDATE_VOUCHER_STATUS',
      payload: { redemptionId, status, usedDate, orderId },
    });
  };

  const getExpiringPoints = (daysAhead: number = 30): PointsExpiry[] => {
    if (!state.userRewards) return [];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return state.userRewards.pointsExpiring.filter(entry => {
      const expiryDate = new Date(entry.expiryDate);
      return expiryDate <= futureDate;
    });
  };

  const getVouchersByStatus = (status: VoucherStatus): VoucherRedemption[] => {
    if (!state.userRewards) return [];
    return state.userRewards.voucherRedemptions.filter(
      voucher => voucher.status === status
    );
  };

  // Load user rewards when user changes
  useEffect(() => {
    if (appState.user) {
      // Load user's rewards from AppContext stats or initialize with defaults
      const userRewards = getDefaultUserRewards();

      // Check if user is company user to determine point source
      const isUserCompanyUser = async () => {
        const { isCompanyUser } = await import('../types/user');
        return isCompanyUser(appState.user);
      };

      isUserCompanyUser().then(isCompany => {
        // For company users, use company's total points
        if (isCompany && appState.company) {
          userRewards.points = appState.company.totalPoints || 0;
          userRewards.lifetimePoints = appState.company.totalPoints || 0;

          console.log('✅ Company user rewards loaded:', {
            user: appState.user.name,
            company: appState.company.name,
            points: appState.company.totalPoints,
          });
        } else {
          // For individual users, use user's points
          userRewards.points = appState.user.points || 0;
          userRewards.lifetimePoints = appState.user.points || 0;

          console.log('✅ Individual user rewards loaded:', {
            user: appState.user.name,
            points: appState.user.points,
          });
        }

        // Estimate yearly spend based on order count and average order value
        const estimatedYearlySpend = appState.userStats.orderCount * 1000; // Rough estimate
        userRewards.yearlySpend = estimatedYearlySpend;
        userRewards.tier = calculateTier(userRewards.lifetimePoints); // Use lifetime points for tier calculation

        dispatch({ type: 'LOAD_USER_REWARDS', payload: userRewards });
      });
    } else {
      // Clear rewards when user logs out
      dispatch({ type: 'CLEAR_USER_REWARDS' });
      console.log('🧹 User rewards cleared');
    }
  }, [appState.user?.id, appState.user?.points, appState.company?.totalPoints]);

  // Sync points when user or company points change (from database)
  useEffect(() => {
    if (appState.user && state.userRewards) {
      const checkAndUpdatePoints = async () => {
        const { isCompanyUser } = await import('../types/user');
        const isCompany = isCompanyUser(appState.user);

        // For company users, sync with company points
        if (isCompany && appState.company) {
          const companyPoints = appState.company.totalPoints || 0;
          if (companyPoints !== state.userRewards.points) {
            const updatedRewards = {
              ...state.userRewards,
              points: companyPoints,
              lifetimePoints: Math.max(
                state.userRewards.lifetimePoints,
                companyPoints
              ),
            };
            dispatch({ type: 'LOAD_USER_REWARDS', payload: updatedRewards });
          }
        } else {
          // For individual users, sync with user points
          const userPoints = appState.user.points || 0;
          if (userPoints !== state.userRewards.points) {
            const updatedRewards = {
              ...state.userRewards,
              points: userPoints,
              lifetimePoints: Math.max(
                state.userRewards.lifetimePoints,
                userPoints
              ),
            };
            dispatch({ type: 'LOAD_USER_REWARDS', payload: updatedRewards });
          }
        }
      };

      checkAndUpdatePoints();
    }
  }, [
    appState.user?.points,
    appState.company?.totalPoints,
    state.userRewards?.points,
  ]);

  // Listen for purchase achievements to earn rewards points
  useEffect(() => {
    if (
      appState.purchaseAchievement.visible &&
      appState.purchaseAchievement.data
    ) {
      const { pointsEarned, orderId } = appState.purchaseAchievement.data;

      // Earn points in the rewards system
      if (pointsEarned > 0) {
        earnPoints(
          pointsEarned,
          `Purchase reward for order ${orderId}`,
          orderId,
          'purchase'
        )
          .then(() => {
            console.log(
              '✨ Rewards points earned and saved:',
              pointsEarned,
              'for order:',
              orderId
            );
          })
          .catch(error => {
            console.error('❌ Error earning rewards points:', error);
          });
      }
    }
  }, [appState.purchaseAchievement.visible, appState.purchaseAchievement.data]);

  return (
    <RewardsContext.Provider
      value={{
        state,
        dispatch,
        earnPoints,
        redeemReward,
        getAvailableVouchers,
        getTierBenefits,
        getPointsToNextTier,
        reportMissingPoints,
        updateVoucherStatus,
        getExpiringPoints,
        getVouchersByStatus,
      }}
    >
      {children}
    </RewardsContext.Provider>
  );
};

// Hook
export const useRewards = () => {
  const context = useContext(RewardsContext);
  if (context === undefined) {
    throw new Error('useRewards must be used within a RewardsProvider');
  }
  return context;
};
