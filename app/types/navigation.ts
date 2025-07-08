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
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 