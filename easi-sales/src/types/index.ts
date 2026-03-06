export interface StaffProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  staff_role: 'salesman' | 'admin' | 'driver' | 'warehouse';
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  uen?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  postal_code?: string;
  credit_limit: number;
  credit_used: number;
  payment_terms: string;
  pricing_tier: number;
  status: 'active' | 'on_hold' | 'suspended';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  unit_price: number;
  trade_price?: number;
  case_size?: number;
  stock_quantity: number;
  is_active: boolean;
  image_url?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  company_id: string;
  user_id?: string;
  placed_by_staff_id?: string;
  status: OrderStatus;
  total: number | null;
  total_amount?: number | null;
  delivery_address?: string;
  delivery_date?: string;
  order_notes?: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
  company?: Company;
  order_items?: OrderItem[];
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
}

export interface CustomerOnboardingRequest {
  id: string;
  salesman_id: string;
  company_name: string;
  uen?: string;
  address?: string;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  proposed_credit_limit?: number;
  proposed_payment_terms?: string;
  proposed_pricing_tier?: number;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface DigitalHandshake {
  id: string;
  order_id: string;
  driver_confirmed: boolean;
  driver_confirmed_at?: string;
  customer_confirmed: boolean;
  customer_confirmed_at?: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  company_id: string;
  order_id?: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date?: string;
  paid_at?: string;
  created_at: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  activeCustomers: number;
  pendingOnboardings: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
