import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';

// Types
export type TierLevel = 'Bronze' | 'Silver' | 'Gold';

export interface PointsHistory {
  id: string;
  date: string;
  description: string;
  points: number;
  type: 'earned' | 'redeemed';
  orderId?: string;
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
}

interface RewardsState {
  userRewards: UserRewards;
  rewardsCatalog: RewardItem[];
  loading: boolean;
  error: string | null;
}

type RewardsAction =
  | { type: 'EARN_POINTS'; payload: { points: number; description: string; orderId?: string } }
  | { type: 'REDEEM_REWARD'; payload: { rewardId: string } }
  | { type: 'USE_VOUCHER'; payload: { voucherId: string } }
  | { type: 'UPDATE_TIER' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_USER_REWARDS'; payload: UserRewards }
  | { type: 'SET_REWARDS_CATALOG'; payload: RewardItem[] };

// Tier thresholds (based on 12-month rolling spend)
const TIER_THRESHOLDS = {
  Bronze: { min: 0, max: 50000 },
  Silver: { min: 50001, max: 200000 },
  Gold: { min: 200001, max: Infinity }
};

// Calculate tier based on 12-month spend
const calculateTier = (yearlySpend: number): TierLevel => {
  if (yearlySpend >= TIER_THRESHOLDS.Gold.min) return 'Gold';
  if (yearlySpend >= TIER_THRESHOLDS.Silver.min) return 'Silver';
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

// Initial state
const initialState: RewardsState = {
  userRewards: {
    points: 125000, // Mock starting points
    tier: 'Silver',
    lifetimePoints: 250000,
    yearlySpend: 125000,
    pointsHistory: [
      {
        id: '1',
        date: '2024-01-15',
        description: 'Q4 2023 Volume Milestone',
        points: 25000,
        type: 'earned'
      },
      {
        id: '2',
        date: '2024-01-10',
        description: 'Order #ORD-2024-001',
        points: 15000,
        type: 'earned',
        orderId: 'ORD-2024-001'
      },
      {
        id: '3',
        date: '2023-12-20',
        description: 'Annual Renewal Bonus',
        points: 15000,
        type: 'earned'
      }
    ],
    redeemedRewards: [],
    availableVouchers: []
  },
  rewardsCatalog: mockRewardsCatalog,
  loading: false,
  error: null
};

// Reducer
const rewardsReducer = (state: RewardsState, action: RewardsAction): RewardsState => {
  switch (action.type) {
    case 'EARN_POINTS':
      const newPoints = state.userRewards.points + action.payload.points;
      const newLifetimePoints = state.userRewards.lifetimePoints + action.payload.points;
      const newYearlySpend = state.userRewards.yearlySpend + action.payload.points;
      
      const newHistory: PointsHistory = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        description: action.payload.description,
        points: action.payload.points,
        type: 'earned',
        orderId: action.payload.orderId
      };
      
      return {
        ...state,
        userRewards: {
          ...state.userRewards,
          points: newPoints,
          lifetimePoints: newLifetimePoints,
          yearlySpend: newYearlySpend,
          tier: calculateTier(newYearlySpend),
          pointsHistory: [newHistory, ...state.userRewards.pointsHistory]
        }
      };
      
    case 'REDEEM_REWARD':
      const reward = state.rewardsCatalog.find(r => r.id === action.payload.rewardId);
      if (!reward || state.userRewards.points < reward.points) {
        return { ...state, error: 'Insufficient points or invalid reward' };
      }
      
      const redemptionHistory: PointsHistory = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        description: `Redeemed: ${reward.title}`,
        points: -reward.points,
        type: 'redeemed'
      };
      
      let newVouchers = [...state.userRewards.availableVouchers];
      
      if (reward.type === 'voucher' && reward.value) {
        const newVoucher = {
          id: `voucher-${Date.now()}`,
          rewardId: reward.id,
          value: reward.value,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          used: false
        };
        newVouchers.push(newVoucher);
      }
      
      return {
        ...state,
        userRewards: {
          ...state.userRewards,
          points: state.userRewards.points - reward.points,
          pointsHistory: [redemptionHistory, ...state.userRewards.pointsHistory],
          redeemedRewards: [...state.userRewards.redeemedRewards, reward.id],
          availableVouchers: newVouchers
        }
      };
      
    case 'USE_VOUCHER':
      return {
        ...state,
        userRewards: {
          ...state.userRewards,
          availableVouchers: state.userRewards.availableVouchers.map(v =>
            v.id === action.payload.voucherId ? { ...v, used: true } : v
          )
        }
      };
      
    case 'UPDATE_TIER':
      return {
        ...state,
        userRewards: {
          ...state.userRewards,
          tier: calculateTier(state.userRewards.yearlySpend)
        }
      };
      
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    case 'LOAD_USER_REWARDS':
      return { ...state, userRewards: action.payload };
      
    case 'SET_REWARDS_CATALOG':
      return { ...state, rewardsCatalog: action.payload };
      
    default:
      return state;
  }
};

// Context
const RewardsContext = createContext<{
  state: RewardsState;
  dispatch: React.Dispatch<RewardsAction>;
  earnPoints: (points: number, description: string, orderId?: string) => void;
  redeemReward: (rewardId: string) => Promise<boolean>;
  getAvailableVouchers: () => typeof initialState.userRewards.availableVouchers;
  getTierBenefits: (tier: TierLevel) => string[];
  getPointsToNextTier: () => number;
} | undefined>(undefined);

// Provider
export const RewardsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(rewardsReducer, initialState);
  
  const earnPoints = (points: number, description: string, orderId?: string) => {
    dispatch({ type: 'EARN_POINTS', payload: { points, description, orderId } });
  };
  
  const redeemReward = async (rewardId: string): Promise<boolean> => {
    const reward = state.rewardsCatalog.find(r => r.id === rewardId);
    if (!reward || state.userRewards.points < reward.points) {
      return false;
    }
    
    dispatch({ type: 'REDEEM_REWARD', payload: { rewardId } });
    return true;
  };
  
  const getAvailableVouchers = () => {
    return state.userRewards.availableVouchers.filter(v => !v.used);
  };
  
  const getTierBenefits = (tier: TierLevel): string[] => {
    const benefits = {
      Bronze: ['Access to weekly flash-deal alerts'],
      Silver: ['2% off all orders', 'Early-bird slots on same-day delivery', 'All Bronze benefits'],
      Gold: ['5% off all orders', 'Free same-day delivery', 'Exclusive volume bundles', 'All Silver benefits']
    };
    return benefits[tier];
  };
  
  const getPointsToNextTier = (): number => {
    const currentSpend = state.userRewards.yearlySpend;
    if (state.userRewards.tier === 'Bronze') {
      return TIER_THRESHOLDS.Silver.min - currentSpend;
    } else if (state.userRewards.tier === 'Silver') {
      return TIER_THRESHOLDS.Gold.min - currentSpend;
    }
    return 0; // Already Gold
  };
  
  return (
    <RewardsContext.Provider 
      value={{ 
        state, 
        dispatch, 
        earnPoints, 
        redeemReward, 
        getAvailableVouchers,
        getTierBenefits,
        getPointsToNextTier
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