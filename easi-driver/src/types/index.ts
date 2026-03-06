export type DeliveryStatus =
  | 'assigned'
  | 'dispatched'
  | 'en_route'
  | 'arrived'
  | 'delivered'
  | 'failed';

export type DeliveryZone = 'North' | 'South' | 'East' | 'West' | 'Central';

export interface StaffProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  staff_role: 'driver' | 'warehouse' | 'admin' | 'manager';
  is_active: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  company_id: string | null;
  status: string;
  total: number | null;
  subtotal: number | null;
  delivery_address: string;
  delivery_zone: DeliveryZone | null;
  order_notes: string | null;
  created_at: string;
  updated_at: string;
  company?: { name: string } | null;
  order_items?: OrderItem[];
}

export interface DeliveryAssignment {
  id: string;
  order_id: string;
  driver_id: string;
  status: DeliveryStatus;
  assigned_at: string;
  dispatched_at: string | null;
  arrived_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  notes: string | null;
  created_at: string;
  order?: Order;
}

export interface DeliveryProof {
  id: string;
  delivery_assignment_id: string;
  recipient_name: string;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface DigitalHandshake {
  id: string;
  order_id: string;
  driver_confirmed: boolean;
  driver_confirmed_at: string | null;
  customer_confirmed: boolean;
  customer_confirmed_at: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface AuthState {
  user: StaffProfile | null;
  loading: boolean;
  error: string | null;
}

export const STATUS_ORDER: DeliveryStatus[] = [
  'assigned',
  'dispatched',
  'en_route',
  'arrived',
  'delivered',
];

export const STATUS_LABELS: Record<DeliveryStatus, string> = {
  assigned: 'Assigned',
  dispatched: 'Dispatched',
  en_route: 'En Route',
  arrived: 'Arrived',
  delivered: 'Delivered',
  failed: 'Failed',
};

export const ZONE_COLORS: Record<string, string> = {
  North: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  South: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  East: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  West: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
  Central: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
};
