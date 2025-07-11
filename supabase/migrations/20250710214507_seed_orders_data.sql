-- Seed existing order data from mock data
-- This migration populates the orders system with initial data

-- Insert sample orders for Mikael (individual user)
INSERT INTO orders (
  id, order_number, user_id, company_id, status, order_type,
  subtotal, gst, delivery_fee, total, currency,
  payment_method, payment_status,
  delivery_address, delivery_instructions, delivery_date, delivery_time_slot,
  estimated_delivery, actual_delivery,
  requires_approval, approval_status,
  created_by, created_at, updated_at
) VALUES 
(
  gen_random_uuid(),
  'ORD-2024-001',
  '33333333-3333-3333-3333-333333333333', -- Mikael's ID
  NULL, -- Individual order
  'delivered',
  'standard',
  135.50, 9.49, 5.00, 145.99, 'SGD',
  'credit_card', 'paid',
  '{"street": "123 Main St", "city": "Singapore", "postal_code": "123456", "country": "Singapore"}',
  'Leave at doorstep if no answer',
  '2024-01-15',
  '2-4 PM',
  '2024-01-15 16:00:00+08',
  '2024-01-15 15:30:00+08',
  false,
  'not_required',
  '33333333-3333-3333-3333-333333333333',
  '2024-01-15 10:00:00+08',
  '2024-01-15 15:30:00+08'
),
(
  gen_random_uuid(),
  'ORD-2024-002',
  '33333333-3333-3333-3333-333333333333',
  NULL,
  'out_for_delivery',
  'standard',
  275.70, 19.30, 5.00, 295.00, 'SGD',
  'credit_card', 'paid',
  '{"street": "123 Main St", "city": "Singapore", "postal_code": "123456", "country": "Singapore"}',
  'Ring doorbell twice',
  '2024-01-20',
  '10-12 PM',
  '2024-01-20 12:00:00+08',
  NULL,
  false,
  'not_required',
  '33333333-3333-3333-3333-333333333333',
  '2024-01-18 14:30:00+08',
  '2024-01-20 09:00:00+08'
),
(
  gen_random_uuid(),
  'ORD-2024-003',
  '33333333-3333-3333-3333-333333333333',
  NULL,
  'processing',
  'standard',
  186.00, 13.02, 5.00, 199.02, 'SGD',
  'paypal', 'paid',
  '{"street": "123 Main St", "city": "Singapore", "postal_code": "123456", "country": "Singapore"}',
  NULL,
  '2024-01-25',
  '4-6 PM',
  '2024-01-25 18:00:00+08',
  NULL,
  false,
  'not_required',
  '33333333-3333-3333-3333-333333333333',
  '2024-01-22 11:15:00+08',
  '2024-01-22 11:15:00+08'
);