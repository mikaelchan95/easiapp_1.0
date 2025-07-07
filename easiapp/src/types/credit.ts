export interface CreditAccount {
  id: string;
  userId: string;
  creditLimit: number;
  usedCredit: number;
  availableCredit: number;
  paymentTerms: number; // days
  status: 'active' | 'suspended' | 'pending';
  lastPaymentDate?: string;
  nextPaymentDue?: string;
  creditScore: number;
  approvedAt: string;
  approvedBy: string;
}

export interface CreditInvoice {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentTerms: number;
  items: InvoiceItem[];
  taxAmount: number;
  subtotal: number;
  total: number;
  paidDate?: string;
  paidAmount?: number;
}

export interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  sku: string;
}

export interface CreditApplication {
  id: string;
  userId: string;
  businessName: string;
  registrationNumber: string;
  businessType: string;
  annualRevenue: number;
  yearsInBusiness: number;
  requestedLimit: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  documents: CreditDocument[];
}

export interface CreditDocument {
  id: string;
  name: string;
  type: 'business_registration' | 'financial_statement' | 'bank_statement' | 'other';
  url: string;
  uploadedAt: string;
}

export interface CreditPayment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface CreditSettings {
  enableCredit: boolean;
  maxCreditLimit: number;
  defaultPaymentTerms: number;
  interestRate: number;
  lateFee: number;
  gracePeriod: number; // days
}