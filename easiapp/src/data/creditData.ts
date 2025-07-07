import { CreditAccount, CreditInvoice } from '../types/credit';

// Credit accounts for different users
export const MOCK_CREDIT_ACCOUNTS: CreditAccount[] = [
  {
    id: 'cred-001',
    userId: '3', // Trade user from mockData.ts
    creditLimit: 25000,
    usedCredit: 8500,
    availableCredit: 16500,
    paymentTerms: 30,
    status: 'active',
    lastPaymentDate: '2024-01-15T00:00:00Z',
    nextPaymentDue: '2024-02-15T00:00:00Z',
    creditScore: 750,
    approvedAt: '2023-12-01T00:00:00Z',
    approvedBy: 'admin-001'
  },
  {
    id: 'cred-002',
    userId: '4', // Another trade user (if needed)
    creditLimit: 50000,
    usedCredit: 12000,
    availableCredit: 38000,
    paymentTerms: 45,
    status: 'active',
    lastPaymentDate: '2024-01-05T00:00:00Z',
    nextPaymentDue: '2024-02-20T00:00:00Z',
    creditScore: 820,
    approvedAt: '2023-11-15T00:00:00Z',
    approvedBy: 'admin-001'
  }
];

// Mock invoices - these would be linked to specific users
export const MOCK_INVOICES: CreditInvoice[] = [
  {
    id: 'INV-001',
    orderId: 'ORD-1701234567891',
    userId: '3',
    amount: 5399.91,
    issueDate: '2024-01-20T09:15:00Z',
    dueDate: '2024-02-19T09:15:00Z',
    status: 'pending',
    paymentTerms: 30,
    items: [
      {
        productId: '1',
        name: 'Macallan 18 Year Old Single Malt Scotch Whisky',
        quantity: 6,
        unitPrice: 719.99,
        total: 4319.94,
        sku: 'MAC-18-700'
      },
      {
        productId: '3',
        name: 'Hennessy XO Cognac',
        quantity: 3,
        unitPrice: 359.99,
        total: 1079.97,
        sku: 'HEN-XO-700'
      }
    ],
    taxAmount: 445.77, // 9% GST
    subtotal: 4954.14,
    total: 5399.91
  }
];