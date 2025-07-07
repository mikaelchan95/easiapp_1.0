export interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
  category: RewardCategory;
  type: 'voucher' | 'experience' | 'product' | 'discount' | 'credit';
  icon: React.ComponentType<any>;
  originalValue?: number;
  discount?: string;
  brand?: string;
  validUntil?: string;
  available: boolean;
  trending?: boolean;
  exclusive?: boolean;
}

export interface RedeemedVoucher {
  id: string;
  reward: Reward;
  voucherCode: string;
  discountCode?: string;
  redeemedAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'used';
  usedAt?: string;
  deliveryMethod: string;
}

export interface DeliveryMethod {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  time: string;
}

export interface RewardCategory {
  id: RewardCategoryId;
  name: string;
  icon: React.ComponentType<any>;
}

export type RewardCategoryId = 'all' | 'vouchers' | 'experiences' | 'products' | 'discounts';
export type RedemptionStep = 'confirm' | 'details' | 'processing' | 'success';
export type ViewMode = 'browse' | 'redeemed';