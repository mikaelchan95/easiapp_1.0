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
  Main: { screen?: string; params?: any };
  Auth: undefined;
  ProductDetail: { id: string };
  SmartSearch: { category?: string; query?: string };
  Checkout: undefined;
  OrderSuccess: { orderId: string };
  OrderTracking: { orderId: string };
  MomentumShowcase: undefined;
  OrderHistory: undefined;
  Wishlist: undefined;
  Reviews: undefined;
  Support: undefined;
  Rewards: undefined;
  Referrals: undefined;
  OrderDetails: { orderId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 