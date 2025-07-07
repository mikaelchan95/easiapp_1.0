export interface User {
  id: string;
  email: string;
  name: string;
  role: 'retail' | 'trade' | 'admin';
  creditLimit?: number;
  usedCredit?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  retailPrice: number;
  tradePrice: number;
  category: string;
  stock: number;
  image: string;
  sku: string;
  featured: boolean;
  sameDayEligible?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'outForDelivery' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  shippingAddress: Address;
  paymentMethod: string;
  trackingNumber?: string;
  sameDay?: boolean;
  statusTimestamps?: Record<string, string>;
  deliveryNotes?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'delivery';
  read: boolean;
  createdAt: string;
  orderId?: string;
}

export type DeliveryRegion = {
  postalCodes: string[];
  name: string;
  cutoffTime: string;
  sameDayAvailable: boolean;
};