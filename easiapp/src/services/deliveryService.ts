import { DeliveryRegion, CartItem } from '../types';

// Mock delivery regions - in real app, this would come from API
const deliveryRegions: DeliveryRegion[] = [
  {
    postalCodes: ['018956', '018981', '049321', '048616'],
    name: 'Central Business District',
    cutoffTime: '11:30',
    sameDayAvailable: true
  },
  {
    postalCodes: ['238858', '238859', '238860'],
    name: 'Orchard',
    cutoffTime: '11:30',
    sameDayAvailable: true
  },
  {
    postalCodes: ['059413', '059414', '059415'],
    name: 'Raffles Place',
    cutoffTime: '11:30',
    sameDayAvailable: true
  }
];

export const deliveryService = {
  // Check if same-day delivery is available for a postal code
  isSameDayAvailable: (postalCode: string): boolean => {
    // Check if past cutoff time
    if (isPastCutoffTime()) {
      return false;
    }
    
    return deliveryRegions.some(region => 
      region.sameDayAvailable && region.postalCodes.includes(postalCode)
    );
  },

  // Get cutoff time for a postal code
  getCutoffTime: (postalCode: string): string | null => {
    const region = deliveryRegions.find(region => 
      region.postalCodes.includes(postalCode)
    );
    return region?.cutoffTime || null;
  },

  // Check if all cart items are eligible for same-day delivery
  areItemsSameDayEligible: (items: CartItem[]): boolean => {
    return items.every(item => item.product.sameDayEligible !== false);
  },

  // Get time until cutoff
  getTimeUntilCutoff: (): { hours: number; minutes: number; expired: boolean } => {
    const now = new Date();
    const cutoffTime = new Date();
    cutoffTime.setHours(11, 30, 0, 0);
    
    if (now > cutoffTime) {
      return { hours: 0, minutes: 0, expired: true };
    }
    
    const diff = cutoffTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes, expired: false };
  },

  // Format time until cutoff for display
  formatTimeUntilCutoff: (): string => {
    const { hours, minutes, expired } = deliveryService.getTimeUntilCutoff();
    
    if (expired) {
      return 'Cutoff passed - not available for today';
    }
    
    if (hours === 0) {
      return `${minutes} minutes until cutoff`;
    }
    
    if (minutes === 0) {
      return `${hours} hour${hours === 1 ? '' : 's'} until cutoff`;
    }
    
    return `${hours}h ${minutes}m until cutoff`;
  },
  
  // Calculate delivery fee based on order total
  calculateDeliveryFee: (orderTotal: number, baseDeliveryFee: number): number => {
    return orderTotal >= 250 ? 0 : baseDeliveryFee;
  },
  
  // Check if past cutoff time (11:30 AM)
  isPastCutoffTime: (): boolean => {
    return isPastCutoffTime();
  }
};

// Helper function to check if current time is past 11:30 AM
function isPastCutoffTime(): boolean {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Past cutoff if it's after 11:30 AM
  return hours > 11 || (hours === 11 && minutes >= 30);
}

export default deliveryService;