export interface CartAddress {
  name: string;
  street: string;
  unit?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface DeliverySlot {
  id: string;
  date: string;
  timeSlot: string;
  price: number;
  label: string;
  sameDayAvailable?: boolean;
}

export interface CheckoutState {
  step: CheckoutStep;
  address: CartAddress;
  deliverySlot: DeliverySlot | null;
  paymentMethod: string;
  processing: boolean;
  orderId?: string;
}

export type CheckoutStep = 'address' | 'delivery' | 'payment' | 'review';

export interface CartSummary {
  subtotal: number;
  delivery: number;
  discount: number;
  total: number;
  itemCount: number;
}

export interface CartAnimationState {
  removingItems: Set<string>;
  addingItem: string | null;
  showSuccess: boolean;
}