export interface DeliveryAddress {
  id: string;
  name: string;
  address: string;
  unitNumber?: string;
  postalCode: string;
  phone: string;
  email?: string;
  isDefault?: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface DeliverySlot {
  id: string;
  date: string;
  timeSlot: string;
  startTime?: string;
  endTime?: string;
  available?: boolean;
  fee: number;
  price?: number;
  isFree?: boolean;
  isExpress?: boolean;
  queueCount?: number;
  sameDayAvailable?: boolean;
  isSpecialLocation?: boolean;
}

export type PaymentMethodType = 
  | 'credit_card' 
  | 'debit_card' 
  | 'paypal' 
  | 'apple_pay' 
  | 'google_pay'
  | 'COD'
  | 'NET7'
  | 'NET30'
  | 'NET60';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  name: string;
  last4?: string;
  brand?: string;
  isDefault?: boolean;
  expiryMonth?: number;
  expiryYear?: number;
  creditTerms?: {
    days: number;
    description: string;
  };
}

export interface CheckoutStep {
  id: string;
  title: string;
  completed: boolean;
  active: boolean;
}

export interface OrderSummary {
  subtotal: number;
  deliveryFee: number;
  gst: number;
  discount: number;
  total: number;
  savings: number;
  pointsEarned: number;
}