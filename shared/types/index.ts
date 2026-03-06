/**
 * Shared types for the EASI ecosystem.
 *
 * Used by: EasiSales (salesman app), EasiDriver (driver app),
 *          EASI customer app, and admin-web dashboard.
 *
 * Property names use camelCase; the corresponding database columns
 * use snake_case.  Service layers are responsible for mapping between
 * the two conventions.
 */

// ---------------------------------------------------------------------------
// Enums / union types
// ---------------------------------------------------------------------------

export type StaffRole = 'salesman' | 'driver';

export type DeliveryAssignmentStatus =
  | 'assigned'
  | 'dispatched'
  | 'en_route'
  | 'arrived'
  | 'delivered'
  | 'failed';

export type DeliveryZone = 'north' | 'south' | 'east' | 'west';

export type OnboardingRequestStatus = 'pending' | 'approved' | 'rejected';

export type PaymentTerms =
  | 'CBD'
  | 'COD'
  | 'NET7'
  | 'NET14'
  | 'NET30'
  | 'NET45'
  | 'NET60';

export type PricingTier = 1 | 2 | 3 | 4 | 5;

// ---------------------------------------------------------------------------
// Staff profiles
// ---------------------------------------------------------------------------

export interface StaffProfile {
  id: string;
  userId: string;
  staffRole: StaffRole;
  employeeId: string | null;
  fullName: string;
  phone: string | null;
  email: string | null;
  /** Assigned region/zone — relevant for salesmen */
  territory: string | null;
  /** Delivery zone — relevant for drivers */
  deliveryZone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Delivery assignments
// ---------------------------------------------------------------------------

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  driverId: string;
  deliveryZone: DeliveryZone | null;
  status: DeliveryAssignmentStatus;
  assignedAt: string;
  dispatchedAt: string | null;
  arrivedAt: string | null;
  deliveredAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Delivery proofs
// ---------------------------------------------------------------------------

export interface DeliveryProof {
  id: string;
  deliveryAssignmentId: string;
  photoUrl: string | null;
  signatureUrl: string | null;
  recipientName: string | null;
  notes: string | null;
  capturedAt: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Digital handshakes (two-sided delivery confirmation)
// ---------------------------------------------------------------------------

export interface DigitalHandshake {
  id: string;
  orderId: string;
  customerConfirmed: boolean;
  customerConfirmedAt: string | null;
  driverConfirmed: boolean;
  driverConfirmedAt: string | null;
  /** True once both sides have confirmed */
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Customer onboarding requests
// ---------------------------------------------------------------------------

export interface CustomerOnboardingRequest {
  id: string;
  salesmanId: string;
  companyName: string;
  uen: string | null;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  proposedCreditLimit: number | null;
  proposedPaymentTerms: PaymentTerms | null;
  proposedPricingTier: PricingTier | null;
  status: OnboardingRequestStatus;
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Extended order type — adds staff/delivery fields to the base order
// ---------------------------------------------------------------------------

/**
 * Additional fields added to the `orders` table to support
 * salesman-placed orders and driver assignment.
 */
export interface SalesmanOrderFields {
  /** Staff profile id of the salesman who placed the order on behalf of a customer */
  placedByStaffId: string | null;
  /** Geographic zone for delivery routing */
  deliveryZone: string | null;
  /** Staff profile id of the assigned driver */
  assignedDriverId: string | null;
}

/**
 * A full order row including the new staff/delivery columns.
 * Extend or intersect with your existing Order type as needed.
 */
export interface SalesmanOrder extends SalesmanOrderFields {
  id: string;
  orderNumber: string;
  userId: string;
  companyId: string | null;
  status: string;
  orderType: string;
  subtotal: number;
  gst: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  currency: string;
  paymentMethod: string | null;
  paymentStatus: string;
  deliveryAddress: Record<string, unknown>;
  deliveryInstructions: string | null;
  deliveryDate: string | null;
  deliveryTimeSlot: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Database row types (snake_case — for direct Supabase query results)
// ---------------------------------------------------------------------------

export interface StaffProfileRow {
  id: string;
  user_id: string;
  staff_role: StaffRole;
  employee_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  territory: string | null;
  delivery_zone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryAssignmentRow {
  id: string;
  order_id: string;
  driver_id: string;
  delivery_zone: DeliveryZone | null;
  status: DeliveryAssignmentStatus;
  assigned_at: string;
  dispatched_at: string | null;
  arrived_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryProofRow {
  id: string;
  delivery_assignment_id: string;
  photo_url: string | null;
  signature_url: string | null;
  recipient_name: string | null;
  notes: string | null;
  captured_at: string;
  created_at: string;
}

export interface DigitalHandshakeRow {
  id: string;
  order_id: string;
  customer_confirmed: boolean;
  customer_confirmed_at: string | null;
  driver_confirmed: boolean;
  driver_confirmed_at: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface CustomerOnboardingRequestRow {
  id: string;
  salesman_id: string;
  company_name: string;
  uen: string | null;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  proposed_credit_limit: number | null;
  proposed_payment_terms: PaymentTerms | null;
  proposed_pricing_tier: PricingTier | null;
  status: OnboardingRequestStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}
