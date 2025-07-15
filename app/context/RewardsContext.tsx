import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from 'react';
import { useAppContext } from './AppContext';
import { pointsService, RewardCatalogItem, UserVoucher } from '../services/pointsService';
import { auditService } from '../services/auditService';
import { supabase } from '../../utils/supabase';

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
  // User attribution
  redeemedBy: {
    id: string;
    name: string;
    email?: string;
  };
  usedBy?: {
    id: string;
    name: string;
    email?: string;
  };
  // Company context
  companyId?: string;
  companyName?: string;
  // Additional metadata
  redemptionSource?: 'web' | 'mobile' | 'admin';
  ipAddress?: string;
  userAgent?: string;
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
  type: 'voucher' | 'bundle' | 'swag' | 'experience';
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
  availableVouchers: UserVoucher[];
  voucherRedemptions: VoucherRedemption[];
  voucherHistory: VoucherRedemption[]; // Complete voucher history with user attribution
  missingPoints: MissingPointsEntry[];
  pointsExpiring: PointsExpiry[];
}

interface RewardsState {
  userRewards: UserRewards | null;
  rewardsCatalog: RewardItem[];
  loading: boolean;
  error: string | null;
  vouchersLoading: boolean;
  catalogLoading: boolean;
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
  | { type: 'SET_CATALOG_LOADING'; payload: boolean }
  | { type: 'SET_VOUCHERS_LOADING'; payload: boolean }
  | { type: 'LOAD_VOUCHERS'; payload: UserVoucher[] }
  | { type: 'LOAD_VOUCHER_HISTORY'; payload: VoucherRedemption[] }
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

// Initial state - no user rewards until authenticated
const initialState: RewardsState = {
  userRewards: null,
  rewardsCatalog: [],
  loading: false,
  error: null,
  vouchersLoading: false,
  catalogLoading: false,
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
  voucherHistory: [],
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

    case 'SET_CATALOG_LOADING':
      return { ...state, catalogLoading: action.payload };

    case 'SET_VOUCHERS_LOADING':
      return { ...state, vouchersLoading: action.payload };

    case 'LOAD_VOUCHERS':
      if (!state.userRewards) return state;
      return {
        ...state,
        userRewards: {
          ...state.userRewards,
          availableVouchers: action.payload,
        },
      };

    case 'LOAD_VOUCHER_HISTORY':
      if (!state.userRewards) return state;
      return {
        ...state,
        userRewards: {
          ...state.userRewards,
          voucherHistory: action.payload,
        },
      };

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
      getAvailableVouchers: () => UserVoucher[];
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
      loadRewardsCatalog: () => Promise<void>;
      loadUserVouchers: () => Promise<void>;
      loadVoucherHistory: () => Promise<void>;
      processExpiredVouchers: () => Promise<{ success: boolean; expiredCount: number; error?: string }>;
      getVoucherStatusSummary: () => Promise<{ success: boolean; summary?: { active: number; used: number; expired: number; cancelled: number }; error?: string }>;
      getVouchersExpiringSoon: (daysAhead?: number) => Promise<{ success: boolean; vouchers?: UserVoucher[]; error?: string }>;
      validateVoucherForCheckout: (voucherId: string, orderTotal: number) => Promise<{ success: boolean; voucher?: UserVoucher; canUse: boolean; reason?: string; error?: string }>;
      reactivateVoucher: (voucherId: string) => Promise<{ success: boolean; voucher?: UserVoucher; error?: string }>;
      getVoucherUsageStats: () => Promise<{ success: boolean; stats?: { totalRedeemed: number; totalValue: number; usageRate: number }; error?: string }>;
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

        // Log general audit entry for company points earning
        await auditService.logAuditEntry(
          appState.user.id,
          'points_earned',
          'points',
          orderId,
          { points: (appState.company?.totalPoints || 0) },
          { points: (appState.company?.totalPoints || 0) + points },
          appState.company?.id,
          {
            points_earned: points,
            description: description,
            category: category,
            earning_method: 'purchase',
            account_type: 'company',
          }
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
            description,
            {
              category: category,
              account_type: 'individual',
            }
          );

          // Log general audit entry for points earning
          await auditService.logAuditEntry(
            appState.user.id,
            'points_earned',
            'points',
            orderId,
            { points: appState.user.points || 0 },
            { points: newTotalPoints },
            null,
            {
              points_earned: points,
              description: description,
              category: category,
              earning_method: 'purchase',
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

    try {
      const { isCompanyUser } = await import('../types/user');
      const companyId = isCompanyUser(appState.user) ? appState.company?.id || null : null;

      // Use pointsService to redeem the reward
      const result = await pointsService.redeemReward(
        appState.user.id,
        companyId,
        rewardId
      );

      if (result.success) {
        console.log('🎉 Redemption successful, reloading vouchers...');
        
        // Reload user vouchers to get updated counts
        await loadUserVouchers();
        
        // Refresh user data to get updated points
        if (appState.loadUserFromSupabase) {
          await appState.loadUserFromSupabase(appState.user.id);
        }

        // Update points in local state
        const newUserRewards = {
          ...state.userRewards,
          points: state.userRewards.points - reward.points,
          redeemedRewards: [...state.userRewards.redeemedRewards, reward.id],
        };

        dispatch({ type: 'LOAD_USER_REWARDS', payload: newUserRewards });
        
        console.log('✅ Voucher reload completed, current vouchers:', state.userRewards?.availableVouchers?.length || 0);

        // Log the successful redemption in points history
        const redemptionHistory = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          description: `Redeemed: ${reward.title}`,
          points: -reward.points,
          type: 'redeemed' as const,
          orderId: result.redemption?.id,
          category: 'voucher' as const,
        };

        if (state.userRewards.pointsHistory) {
          const updatedHistory = [redemptionHistory, ...state.userRewards.pointsHistory];
          dispatch({ type: 'LOAD_USER_REWARDS', payload: {
            ...newUserRewards,
            pointsHistory: updatedHistory,
          }});
        }

        console.log('✅ Reward redeemed successfully');
        return true;
      } else {
        console.error('❌ Failed to redeem reward:', result.error);
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to redeem reward' });
        return false;
      }
    } catch (error) {
      console.error('❌ Error redeeming reward:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to redeem reward' });
      return false;
    }
  };

  const getAvailableVouchers = () => {
    if (!state.userRewards) return [];
    return state.userRewards.availableVouchers.filter(v => v.voucher_status === 'active');
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

  const reportMissingPoints = async (
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

    // Log missing points report in audit trail
    try {
      await auditService.logAuditEntry(
        appState.user.id,
        'missing_points_reported',
        'points',
        orderId,
        undefined,
        {
          order_id: orderId,
          order_date: orderDate,
          expected_points: expectedPoints,
          reason: reason,
          report_status: 'reported',
        },
        appState.company?.id,
        {
          report_date: new Date().toISOString(),
          expected_points: expectedPoints,
          reason: reason,
        }
      );
    } catch (error) {
      console.error('Error logging missing points report:', error);
    }
  };

  const updateVoucherStatus = async (
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

    // Log voucher status change in audit trail
    try {
      await auditService.logVoucherEvent(
        appState.user.id,
        redemptionId,
        status === 'used' ? 'redeemed' : 
        status === 'expired' ? 'expired' : 
        status === 'cancelled' ? 'cancelled' : 'created',
        appState.company?.id,
        {
          voucher_status: status,
          used_date: usedDate,
          order_id: orderId,
          status_change_date: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error('Error logging voucher status change:', error);
    }
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

  // Load rewards catalog from database
  const loadRewardsCatalog = async () => {
    dispatch({ type: 'SET_CATALOG_LOADING', payload: true });
    try {
      const catalogData = await pointsService.getRewardCatalog();
      
      // Transform catalog data to match RewardItem interface
      const transformedCatalog: RewardItem[] = catalogData.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        points: item.points_required,
        type: item.reward_type,
        value: item.reward_value,
        imageUrl: item.image_url,
        stock: item.stock_quantity,
        validityDays: item.validity_days,
      }));

      dispatch({ type: 'SET_REWARDS_CATALOG', payload: transformedCatalog });
    } catch (error) {
      console.error('Error loading rewards catalog:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load rewards catalog' });
    } finally {
      dispatch({ type: 'SET_CATALOG_LOADING', payload: false });
    }
  };

  // Load user vouchers from database
  const loadUserVouchers = async () => {
    if (!appState.user) return;
    
    console.log('🔄 Loading user vouchers...');
    dispatch({ type: 'SET_VOUCHERS_LOADING', payload: true });
    try {
      const { isCompanyUser } = await import('../types/user');
      const companyId = isCompanyUser(appState.user) ? appState.company?.id : undefined;
      
      console.log('📋 Loading vouchers for:', {
        userId: appState.user.id,
        companyId,
        isCompany: isCompanyUser(appState.user),
      });
      
      // Process expired vouchers first
      await processExpiredVouchers();
      
      const vouchers = await pointsService.getUserVouchers(
        appState.user.id,
        companyId
      );
      
      console.log('📦 Loaded vouchers:', vouchers.length, 'vouchers');
      console.log('📦 Voucher details:', vouchers.map(v => ({ 
        id: v.id, 
        status: v.voucher_status, 
        value: v.voucher_value 
      })));
      
      dispatch({ type: 'LOAD_VOUCHERS', payload: vouchers });
    } catch (error) {
      console.error('Error loading user vouchers:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load vouchers' });
    } finally {
      dispatch({ type: 'SET_VOUCHERS_LOADING', payload: false });
    }
  };

  // Load voucher history with user attribution
  const loadVoucherHistory = async () => {
    if (!appState.user) return;
    
    console.log('🔄 Loading voucher history...');
    try {
      const { isCompanyUser } = await import('../types/user');
      const companyId = isCompanyUser(appState.user) ? appState.company?.id : undefined;
      
      console.log('📋 Loading voucher history for:', {
        userId: appState.user.id,
        companyId,
        isCompany: isCompanyUser(appState.user),
      });
      
      const history = await pointsService.getVoucherHistory(
        appState.user.id,
        companyId
      );
      
      console.log('📦 Loaded voucher history:', history.length, 'entries');
      
      // Transform the data to match VoucherRedemption interface
      const transformedHistory = history.map(item => ({
        id: item.id,
        rewardId: item.redemption?.reward?.id || '',
        title: item.redemption?.reward?.title || 'Unknown Reward',
        value: item.voucher_value,
        pointsUsed: item.redemption?.points_used || 0,
        status: item.voucher_status,
        redeemedDate: item.issued_at,
        expiryDate: item.expires_at,
        usedDate: item.used_at,
        orderId: item.used_in_order_id,
        confirmationCode: item.redemption?.confirmation_code,
        redeemedBy: {
          id: item.redemption?.redeemed_by?.id || item.user_id,
          name: item.redemption?.redeemed_by?.name || 'Unknown User',
          email: item.redemption?.redeemed_by?.email,
        },
        usedBy: item.used_by ? {
          id: item.used_by.id,
          name: item.used_by.name,
          email: item.used_by.email,
        } : undefined,
        companyId: item.company_id,
        companyName: appState.company?.name,
        redemptionSource: 'mobile' as const,
      }));
      
      dispatch({ type: 'LOAD_VOUCHER_HISTORY', payload: transformedHistory });
    } catch (error) {
      console.error('Error loading voucher history:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load voucher history' });
    }
  };

  // Voucher lifecycle management methods
  const processExpiredVouchers = async () => {
    return await pointsService.processExpiredVouchers();
  };

  const getVoucherStatusSummary = async () => {
    if (!appState.user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const { isCompanyUser } = await import('../types/user');
    const companyId = isCompanyUser(appState.user) ? appState.company?.id : undefined;
    
    return await pointsService.getVoucherStatusSummary(appState.user.id, companyId);
  };

  const getVouchersExpiringSoon = async (daysAhead: number = 7) => {
    if (!appState.user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const { isCompanyUser } = await import('../types/user');
    const companyId = isCompanyUser(appState.user) ? appState.company?.id : undefined;
    
    return await pointsService.getVouchersExpiringSoon(appState.user.id, daysAhead, companyId);
  };

  const validateVoucherForCheckout = async (voucherId: string, orderTotal: number) => {
    if (!appState.user) {
      return { success: false, canUse: false, error: 'User not authenticated' };
    }
    
    return await pointsService.validateVoucherForCheckout(voucherId, appState.user.id, orderTotal);
  };

  const reactivateVoucher = async (voucherId: string) => {
    if (!appState.user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    return await pointsService.reactivateVoucher(voucherId, appState.user.id);
  };

  const getVoucherUsageStats = async () => {
    if (!appState.user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const { isCompanyUser } = await import('../types/user');
    const companyId = isCompanyUser(appState.user) ? appState.company?.id : undefined;
    
    return await pointsService.getVoucherUsageStats(appState.user.id, companyId);
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
          userRewards.lifetimePoints = appState.company.lifetimePointsEarned || appState.company.totalPoints || 0;

          console.log('✅ Company user rewards loaded:', {
            user: appState.user.name,
            company: appState.company.name,
            points: appState.company.totalPoints,
            lifetimePoints: appState.company.lifetimePointsEarned,
            tierLevel: appState.company.tierLevel,
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

      // Load rewards catalog and user vouchers
      loadRewardsCatalog();
      loadUserVouchers();
      loadVoucherHistory();
    } else {
      // Clear rewards when user logs out
      dispatch({ type: 'CLEAR_USER_REWARDS' });
      console.log('🧹 User rewards cleared');
    }
  }, [appState.user?.id, appState.user?.points, appState.company?.totalPoints, appState.company?.lifetimePointsEarned]);

  // Sync points when user or company points change (from database)
  useEffect(() => {
    if (appState.user && state.userRewards) {
      const checkAndUpdatePoints = async () => {
        const { isCompanyUser } = await import('../types/user');
        const isCompany = isCompanyUser(appState.user);

        // For company users, sync with company points
        if (isCompany && appState.company) {
          const companyPoints = appState.company.totalPoints || 0;
          const lifetimePoints = appState.company.lifetimePointsEarned || companyPoints;
          
          if (companyPoints !== state.userRewards.points || lifetimePoints !== state.userRewards.lifetimePoints) {
            const updatedRewards = {
              ...state.userRewards,
              points: companyPoints,
              lifetimePoints: lifetimePoints,
              tier: calculateTier(lifetimePoints),
            };
            dispatch({ type: 'LOAD_USER_REWARDS', payload: updatedRewards });
            
            console.log('🔄 Company rewards synced:', {
              points: companyPoints,
              lifetimePoints: lifetimePoints,
              tier: calculateTier(lifetimePoints),
            });
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
    appState.company?.lifetimePointsEarned,
    state.userRewards?.points,
    state.userRewards?.lifetimePoints,
  ]);

  // Realtime subscription for database changes - DISABLED TO PREVENT SPAM
  // TODO: Fix company loading issue and re-enable
  // useEffect(() => {
  //   if (!appState.user) return;
  //   // Real-time subscription code will be re-enabled once company loading is fixed
  // }, [appState.user?.id, appState.company?.id]);

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

  // Periodically process expired vouchers
  useEffect(() => {
    if (appState.user && state.userRewards?.availableVouchers) {
      const processExpiredVouchersTask = async () => {
        try {
          const result = await processExpiredVouchers();
          if (result.success && result.expiredCount > 0) {
            console.log(`🗓️ Processed ${result.expiredCount} expired vouchers`);
            // Reload vouchers to update the UI
            loadUserVouchers();
          }
        } catch (error) {
          console.error('Error processing expired vouchers:', error);
        }
      };

      // Run immediately
      processExpiredVouchersTask();

      // Set up interval to run every 30 minutes
      const interval = setInterval(processExpiredVouchersTask, 30 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [appState.user?.id, state.userRewards?.availableVouchers?.length]);

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
        loadRewardsCatalog,
        loadUserVouchers,
        loadVoucherHistory,
        processExpiredVouchers,
        getVoucherStatusSummary,
        getVouchersExpiringSoon,
        validateVoucherForCheckout,
        reactivateVoucher,
        getVoucherUsageStats,
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
