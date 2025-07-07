import { Gift, CreditCard, Package, Percent, Star, MapPin } from 'lucide-react';
import { Reward, RewardCategory, DeliveryMethod, RedeemedVoucher } from '../types/rewards';

export const REWARDS_DATA: Reward[] = [
  {
    id: '1',
    title: '$20 Grocery',
    description: 'Major stores',
    points: 2000,
    category: 'vouchers',
    type: 'voucher',
    icon: Package,
    originalValue: 20,
    validUntil: '6 months',
    available: true,
    trending: true
  },
  {
    id: '2',
    title: '$50 Dining',
    description: 'Premium restaurants',
    points: 5000,
    category: 'vouchers',
    type: 'voucher',
    icon: Star,
    originalValue: 50,
    validUntil: '3 months',
    available: true
  },
  {
    id: '3',
    title: 'Hotel Stay',
    description: '1 night + breakfast',
    points: 25000,
    category: 'experiences',
    type: 'experience',
    icon: MapPin,
    originalValue: 350,
    validUntil: '12 months',
    available: true,
    exclusive: true
  },
  {
    id: '4',
    title: 'Premium Gin',
    description: '700ml bottle',
    points: 8000,
    category: 'products',
    type: 'product',
    icon: Gift,
    brand: 'Tanqueray',
    originalValue: 65,
    available: true
  },
  {
    id: '5',
    title: '15% Off',
    description: 'Orders $200+',
    points: 3000,
    category: 'discounts',
    type: 'discount',
    icon: Percent,
    discount: '15%',
    validUntil: '30 days',
    available: true,
    trending: true
  },
  {
    id: '6',
    title: '$100 Credit',
    description: 'Account balance',
    points: 10000,
    category: 'vouchers',
    type: 'credit',
    icon: CreditCard,
    originalValue: 100,
    available: true
  }
];

export const REWARD_CATEGORIES: RewardCategory[] = [
  { id: 'all', name: 'All', icon: Gift },
  { id: 'vouchers', name: 'Vouchers', icon: CreditCard },
  { id: 'products', name: 'Products', icon: Package },
  { id: 'discounts', name: 'Discounts', icon: Percent }
];

export const DELIVERY_METHODS: DeliveryMethod[] = [
  { id: 'app', name: 'In-App', icon: Package, description: 'Digital voucher', time: 'Instant' },
  { id: 'shipping', name: 'Shipping', icon: Package, description: 'Physical delivery', time: '3-5 days' }
];

export const MOCK_REDEEMED_VOUCHERS: RedeemedVoucher[] = [
  {
    id: 'rv1',
    reward: REWARDS_DATA[0],
    voucherCode: 'VCH2K9X7B4',
    redeemedAt: '2024-01-15T10:30:00Z',
    expiresAt: '2024-07-15T23:59:59Z',
    status: 'active',
    deliveryMethod: 'In-App'
  },
  {
    id: 'rv2',
    reward: REWARDS_DATA[1],
    voucherCode: 'VCH8M3N5Q1',
    redeemedAt: '2024-01-10T14:20:00Z',
    expiresAt: '2024-04-10T23:59:59Z',
    status: 'used',
    usedAt: '2024-01-12T18:45:00Z',
    deliveryMethod: 'In-App'
  }
];