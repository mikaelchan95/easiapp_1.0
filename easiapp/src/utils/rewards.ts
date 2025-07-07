export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-50 text-green-700 border-green-100';
    case 'used': return 'bg-gray-50 text-gray-700 border-gray-100';
    case 'expired': return 'bg-red-50 text-red-700 border-red-100';
    default: return 'bg-gray-50 text-gray-700 border-gray-100';
  }
};

export const generateVoucherCode = () => {
  return 'VCH' + Math.random().toString(36).substr(2, 8).toUpperCase();
};

export const shareVoucher = (title: string, code: string) => {
  if (navigator.share) {
    navigator.share({
      title: `${title} Voucher`,
      text: `Voucher Code: ${code}`,
      url: window.location.href
    });
  }
};

// New loyalty tier system
export interface LoyaltyTier {
  name: string;
  requiredPoints: number;
  color: string;
  benefits: string[];
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    name: 'Bronze',
    requiredPoints: 0,
    color: 'bg-amber-600',
    benefits: ['Free delivery on orders $250+', 'Early access to sales']
  },
  {
    name: 'Silver',
    requiredPoints: 10000,
    color: 'bg-gray-400',
    benefits: ['Free delivery on orders $200+', '5% discount on selected items', 'Priority customer support']
  },
  {
    name: 'Gold',
    requiredPoints: 30000,
    color: 'bg-yellow-500',
    benefits: ['Free delivery on all orders', '10% discount on selected items', 'Exclusive tasting events']
  },
  {
    name: 'Platinum',
    requiredPoints: 75000,
    color: 'bg-blue-600',
    benefits: ['Free delivery on all orders', '15% discount on all items', 'Personal shopping assistant', 'VIP events access']
  }
];

// Get the user's current loyalty tier
export const getLoyaltyLevelInfo = (points: number): {
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  pointsToNextTier: number;
  currentTierStartPoints: number;
} => {
  let currentTier = LOYALTY_TIERS[0];
  let nextTier: LoyaltyTier | null = LOYALTY_TIERS[1];
  
  // Find the current tier
  for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
    if (points >= LOYALTY_TIERS[i].requiredPoints) {
      currentTier = LOYALTY_TIERS[i];
      nextTier = LOYALTY_TIERS[i + 1] || null;
      break;
    }
  }
  
  // Calculate points needed for next tier
  const pointsToNextTier = nextTier ? nextTier.requiredPoints - points : 0;
  
  return {
    currentTier,
    nextTier,
    pointsToNextTier,
    currentTierStartPoints: currentTier.requiredPoints
  };
};

// Calculate progress percentage within current tier
export const getLoyaltyProgressPercentage = (points: number): number => {
  const { currentTier, nextTier, currentTierStartPoints } = getLoyaltyLevelInfo(points);
  
  if (!nextTier) {
    return 100; // Already at max tier
  }
  
  const tierRange = nextTier.requiredPoints - currentTierStartPoints;
  const userProgress = points - currentTierStartPoints;
  
  return Math.min(Math.floor((userProgress / tierRange) * 100), 100);
};