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
  credit_limit: number;
  current_credit: number;
  status: 'active' | 'suspended' | 'pending_verification';
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  company_id?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  total: number;
  payment_method?: string;
  shipping_address?: string;
  created_at: string;
  user?: User; // Joined
  items?: any[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: {
    name: string;
    image_url?: string;
  };
}

export interface Invoice {
  id: string;
  invoice_number: string;
  company_id: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'outstanding' | 'partial_paid' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  created_at: string;
  company?: Company; // Joined
}
