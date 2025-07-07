import { CartItem } from '../types';

export const formatPrice = (price: number): string => {
  return `$${price.toFixed(0)}`;
};

export const getItemPrice = (item: CartItem, userRole?: string): number => {
  return userRole === 'trade' ? item.product.tradePrice : item.product.retailPrice;
};

export const calculateItemTotal = (item: CartItem, userRole?: string): number => {
  return getItemPrice(item, userRole) * item.quantity;
};

export const generateOrderId = (): string => {
  return `ORD-${Date.now()}`;
};

export const formatDeliveryTime = (timeSlot: string): string => {
  return timeSlot.replace(' - ', '-');
};

export const getDeliveryFee = (orderTotal: number, deliveryPrice: number): number => {
  return orderTotal >= 100 ? 0 : deliveryPrice;
};

export const getProgressWidth = (step: string): number => {
  const steps = ['address', 'delivery', 'payment', 'review'];
  const currentIndex = steps.indexOf(step);
  return ((currentIndex + 1) / steps.length) * 100;
};

export const getStepIcon = (step: string) => {
  const iconMap = {
    address: '📍',
    delivery: '🚚', 
    payment: '💳',
    review: '✅'
  };
  return iconMap[step as keyof typeof iconMap] || '📦';
};