import { NavigatorScreenParams, RouteProp } from '@react-navigation/native';
import { Product } from '../data/mockProducts';

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
  Main: { screen?: keyof MainTabParamList };
  Auth: undefined;
  ProductDetail: { id: string };
  SmartSearch: { query?: string; category?: string };
  Checkout: undefined;
  OrderSuccess: { orderId: string };
  OrderTracking: { orderId: string };
  MomentumShowcase: undefined;
  OrderHistory: undefined;
  OrderDetails: { orderId: string };
  Wishlist: undefined;
  Reviews: undefined;
  Support: undefined;
  Rewards: undefined;
  Referrals: undefined;
  LocationPickerDemo: undefined;
  LocationPickerScreen: undefined;
  UberStyleLocationScreen: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 