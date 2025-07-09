import { NavigatorScreenParams, RouteProp } from '@react-navigation/native';
import { Product } from '../data/mockProducts';
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
  Profile: undefined;
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
  OrderSuccess: undefined;
  OrderTracking: undefined;
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
  // Company-related screens
  CompanyProfile: undefined;
  TeamManagement: undefined;
  PendingApprovals: undefined;
  CompanyReports: undefined;
  EditCompanyInfo: undefined;
  EditTeamMember: { userId: string };
  BillingInvoices: undefined;
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
  OrderSuccess: { orderId: string; deliveryDate: string; deliveryTime: string };
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
  // Company-related screens
  CompanyProfile: undefined;
  TeamManagement: undefined;
  PendingApprovals: undefined;
  CompanyReports: undefined;
  EditCompanyInfo: undefined;
  EditTeamMember: { userId: string };
  BillingInvoices: undefined;
  // Auth screen
  Auth: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 