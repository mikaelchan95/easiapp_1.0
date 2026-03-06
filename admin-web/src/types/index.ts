export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  account_type: 'individual' | 'company';
  role?: string;
  company_id?: string;
  points: number;
  total_orders: number;
  total_spent: number;
  created_at: string;
  companies?: {
    name: string;
  };
}

export interface Company {
  id: string;
  name: string;
  company_name: string;
  uen: string;
  address: string;
  phone?: string;
  email?: string;
  logo?: string;
  credit_limit: number;
  current_credit: number;
  payment_terms?: string;
  require_approval?: boolean;
  approval_threshold?: number;
  multi_level_approval?: boolean;
  auto_approve_below?: number;
  status: 'active' | 'suspended' | 'pending_verification';
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  company_id?: string;
  status:
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled';
  order_type?: 'standard' | 'company' | 'bulk';
  subtotal: number;
  gst: number;
  delivery_fee: number;
  discount_amount: number;
  total: number;
  currency?: string;
  payment_method?: string;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_reference?: string;
  delivery_address?: any;
  delivery_instructions?: string;
  delivery_date?: string;
  delivery_time_slot?: string;
  delivery_start_time?: string;
  delivery_end_time?: string;
  is_same_day_delivery?: boolean;
  estimated_delivery?: string;
  actual_delivery?: string;
  tracking_number?: string;
  shipping_address?: string;
  voucher_id?: string;
  voucher_discount?: number;
  order_notes?: string;
  created_at: string;
  updated_at?: string;
  user?: User; // Joined
  items?: any[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  product_description?: string;
  product_image_url?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount?: number;
  product_metadata?: any;
  price: number; // For backward compatibility
  product?: {
    name: string;
    image_url?: string;
  };
}

export interface Invoice {
  id: string;
  invoice_number: string;
  company_id: string;
  // Support both old and new schema field names
  total_amount?: number;
  billing_amount?: number;
  paid_amount?: number;
  remaining_amount?: number;
  outstanding_amount?: number;
  status:
    | 'outstanding'
    | 'partial_paid'
    | 'paid'
    | 'overdue'
    | 'cancelled'
    | 'pending';
  due_date?: string;
  payment_due_date?: string;
  invoice_date?: string;
  payment_terms?: string;
  created_at: string;
  updated_at?: string;
  company?: Company; // Joined
}

// Staff & Driver/Salesman types

export type StaffRole =
  | 'driver'
  | 'salesman'
  | 'warehouse'
  | 'admin'
  | 'manager';

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
  staff_role: StaffRole;
  is_active: boolean;
  created_at: string;
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
  driver?: StaffProfile;
}

export interface DeliveryProof {
  id: string;
  delivery_assignment_id: string;
  recipient_name: string;
  photo_url: string | null;
  signature_url: string | null;
  notes: string | null;
  captured_at: string | null;
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

export type OnboardingStatus = 'pending' | 'approved' | 'rejected';

export interface CustomerOnboardingRequest {
  id: string;
  salesman_id: string;
  company_name: string;
  uen: string | null;
  address: string | null;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  proposed_credit_limit: number | null;
  proposed_payment_terms: string | null;
  proposed_pricing_tier: number | null;
  notes: string | null;
  status: OnboardingStatus;
  created_at: string;
  salesman?: StaffProfile;
}

export type { User, Company, Order, OrderItem };
