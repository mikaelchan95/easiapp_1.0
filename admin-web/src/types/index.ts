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
  status: 'outstanding' | 'partial_paid' | 'paid' | 'overdue' | 'cancelled' | 'pending';
  due_date?: string;
  payment_due_date?: string;
  invoice_date?: string;
  payment_terms?: string;
  created_at: string;
  updated_at?: string;
  company?: Company; // Joined
}

export type { User, Company, Order, OrderItem };
