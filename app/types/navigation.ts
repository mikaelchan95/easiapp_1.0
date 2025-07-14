import { NavigatorScreenParams, RouteProp } from '@react-navigation/native';
import { Product } from '../utils/pricing';
import { LocationSuggestion } from './location';

export type MainTabParamList = {
  Home: undefined;
  Products: undefined;
  Explore: undefined;
  Cart: { count?: number };
  Rewards: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Home: undefined;
  Products: undefined;
  Cart: undefined;
  Checkout: undefined;

  // New individual checkout screens
  CheckoutAddress: undefined;
  CheckoutDelivery: undefined;
  CheckoutPayment: undefined;
  CheckoutReview: undefined;
  CheckoutProcessing: undefined;

  // Enhanced checkout screens
  CheckoutValidation: {
    cartItems: Array<{ product: any; quantity: number }>;
    address: any;
    deliverySlot: any;
    paymentMethod: any;
  };
  PaymentProcessing: {
    orderId: string;
    orderNumber: string;
    paymentMethod: any;
    totalAmount: number;
  };
  OrderApprovalStatus: {
    orderId: string;
  };

  // Notification screens
  NotificationCenter: undefined;
  NotificationDetail: {
    notificationId: string;
  };

  Profile: { highlightRecentOrder?: boolean };
  Rewards: undefined;
  Activities: undefined;
  LocationPickerDemo: undefined;
  UberStyleLocationScreen: undefined;
  DeliveryLocationScreen: {
    returnToScreen?: string;
  };
  SavedLocations: undefined;
  ProductDetail: { id: string };
  SmartSearch: { category?: string };
  Main: { screen: string };
  OrderSuccess: {
    orderId: string;
    total: number;
    deliveryDate: string;
    deliveryTime: string;
  };
  OrderTracking: { orderId: string };
  MomentumShowcase: undefined;
  OrderHistory: undefined;
  OrderDetails: undefined;
  Wishlist: undefined;
  Reviews: undefined;
  Support: undefined;
  Referrals: undefined;
  LocationPickerScreen: undefined;
  // Rewards-related screens
  VoucherTracking: undefined;
  RewardsFAQ: undefined;
  ReferralScreen: undefined;
  ReferralHistory: undefined;
  InviteFriends: undefined;
  AchievementsScreen: undefined;
  MilestonesScreen: undefined;
  RewardsAnalytics: undefined;
  TierBenefitsScreen: undefined;
  // Company-related screens
  CompanyProfile: undefined;
  TeamManagement: undefined;
  PendingApprovals: undefined;
  CompanyReports: undefined;
  EditCompanyInfo: undefined;
  EditTeamMember: { userId: string };
  BillingInvoices: undefined;
  // BillingDashboard: undefined; // Duplicate removed
  CreditPayment: undefined;
  // Approval workflow screens
  OrderApprovalList: {
    filter?: 'pending' | 'history' | 'all';
  };
  OrderApprovalDetail: {
    orderId: string;
    approvalId?: string;
  };
  ApprovalWorkflow: {
    orderId: string;
    workflowId?: string;
  };
  ApprovalHistory: {
    filter?: 'approved' | 'rejected' | 'all';
  };

  // Billing-related screens
  BillingDashboard: {
    companyId?: string;
    companyName?: string;
  };
  BillingSettings: {
    companyId?: string;
    companyName?: string;
  };
  InvoiceGeneration: undefined;
  InvoiceViewer: {
    invoiceId?: string;
  };
  InvoicesList: {
    companyId?: string;
    status?: 'pending' | 'paid' | 'overdue' | 'all';
  };
  InvoiceDetail: {
    invoiceId: string;
  };
  PaymentHistory: {
    companyId?: string;
  };
  PaymentDetail: {
    paymentId: string;
  };
  CompanyCreditOverview: {
    companyId?: string;
  };
  PartialPayment: {
    companyId: string;
    companyName: string;
  };
  RealTimeBalance: {
    companyId: string;
    companyName: string;
  };
  PaymentAllocation: {
    companyId: string;
    paymentAmount: number;
    allocationStrategy: 'oldest_first' | 'largest_first' | 'manual';
  };

  // Admin screens
  AdminBillingDashboard: undefined;
  CompanyBillingManager: {
    companyId: string;
  };
  BillingAnalytics: {
    companyId?: string;
    dateRange?: string;
  };
  BulkBillingProcessor: undefined;
  PaymentReconciliation: undefined;
  // Settings screen
  Settings: undefined;
  // Auth screen
  Auth: undefined;
};

export type AppStackParamList = {
  Main: undefined;
  Home: undefined;
  Products: undefined;
  Cart: undefined;
  Checkout: undefined;
  Chat: undefined;
  Rewards: undefined;
  Profile: undefined;
  ProductDetail: { productId: string };
  OrderSuccess: {
    orderId: string;
    deliveryDate: string;
    deliveryTime: string;
    total?: number;
  };
  OrderTracking: { orderId: string };
  SmartSearch: undefined;
  ThemeShowcase: undefined;
  MomentumShowcase: undefined;
  LocationPicker: undefined;
  LocationPickerDemo: undefined;
  UberStyleLocationPicker: undefined;
  DeliveryLocationScreen: {
    onLocationSelect?: (location: LocationSuggestion) => void;
    currentLocation?: LocationSuggestion;
  };
  SavedLocations: undefined;
  LocationPickerScreen: undefined;
  OrderHistory: undefined;
  Wishlist: undefined;
  Reviews: undefined;
  Support: undefined;
  // Rewards-related screens
  VoucherTracking: undefined;
  RewardsFAQ: undefined;
  ReferralScreen: undefined;
  ReferralHistory: undefined;
  InviteFriends: undefined;
  AchievementsScreen: undefined;
  MilestonesScreen: undefined;
  RewardsAnalytics: undefined;
  TierBenefitsScreen: undefined;
  // Company-related screens
  CompanyProfile: undefined;
  TeamManagement: undefined;
  PendingApprovals: undefined;
  CompanyReports: undefined;
  EditCompanyInfo: undefined;
  EditTeamMember: { userId: string };
  BillingInvoices: undefined;
  // BillingDashboard: undefined; // Duplicate removed
  CreditPayment: undefined;
  // Approval workflow screens
  OrderApprovalList: {
    filter?: 'pending' | 'history' | 'all';
  };
  OrderApprovalDetail: {
    orderId: string;
    approvalId?: string;
  };
  ApprovalWorkflow: {
    orderId: string;
    workflowId?: string;
  };
  ApprovalHistory: {
    filter?: 'approved' | 'rejected' | 'all';
  };

  // Billing-related screens
  BillingDashboard: {
    companyId?: string;
    companyName?: string;
  };
  BillingSettings: {
    companyId?: string;
    companyName?: string;
  };
  InvoiceGeneration: undefined;
  InvoiceViewer: {
    invoiceId?: string;
  };
  InvoicesList: {
    companyId?: string;
    status?: 'pending' | 'paid' | 'overdue' | 'all';
  };
  InvoiceDetail: {
    invoiceId: string;
  };
  PaymentHistory: {
    companyId?: string;
  };
  PaymentDetail: {
    paymentId: string;
  };
  CompanyCreditOverview: {
    companyId?: string;
  };
  PartialPayment: {
    companyId: string;
    companyName: string;
  };
  RealTimeBalance: {
    companyId: string;
    companyName: string;
  };
  PaymentAllocation: {
    companyId: string;
    paymentAmount: number;
    allocationStrategy: 'oldest_first' | 'largest_first' | 'manual';
  };

  // Admin screens
  AdminBillingDashboard: undefined;
  CompanyBillingManager: {
    companyId: string;
  };
  BillingAnalytics: {
    companyId?: string;
    dateRange?: string;
  };
  BulkBillingProcessor: undefined;
  PaymentReconciliation: undefined;
  // Settings screen
  Settings: undefined;
  // Auth screen
  Auth: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
