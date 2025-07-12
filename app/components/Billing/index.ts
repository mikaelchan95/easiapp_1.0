// Company Billing Dashboard Components
export { CompanyCreditOverview } from './CompanyCreditOverview';
export { BillingDashboard } from './BillingDashboard';
export { InvoicesList } from './InvoicesList';
export { PaymentHistory } from './PaymentHistory';
export { BillingSettingsScreen } from './BillingSettings';

// New Enhanced Payment Components
export { default as PartialPaymentScreen } from './PartialPaymentScreen';
export { default as RealTimeBalanceWidget } from './RealTimeBalanceWidget';
export { default as PaymentAllocationPreview } from './PaymentAllocationPreview';
export { default as CreditAlertsNotification } from './CreditAlertsNotification';

// Export types from the billing service for convenience
export type {
  CompanyBillingStatus,
  CompanyInvoice,
  CompanyPayment,
  BillingSettings,
} from '../../services/companyBillingService';

// Export types from enhanced billing services
export type {
  PartialPaymentRequest,
  PaymentAllocation,
  PaymentResult,
  BalanceUpdate,
  RealTimeSubscription,
} from '../../services/realTimePaymentService';

export type {
  DashboardMetrics,
  PaymentCalendarEvent,
  CreditAlert,
  BillingPreferences,
} from '../../services/enhancedBillingService';