import React, { createContext, useReducer, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
// Mock products import removed - all data is now database-driven
import { productsService, ProductFilters } from '../services/productsService';
import { supabase } from '../../utils/supabase';
import { 
  Product, 
  CartItem, 
  UserRole
} from '../utils/pricing';
import { PurchaseAchievementData } from '../hooks/usePurchaseAchievement';
import { LocationSuggestion } from '../types/location';
import { User, Company, isCompanyUser, CompanyUser, IndividualUser } from '../types/user';
import { supabaseService } from '../services/supabaseService';
import { auditService } from '../services/auditService';

interface UserSettings {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Notification Preferences
  pushNotifications: boolean;
  emailNotifications: boolean;
  orderUpdates: boolean;
  promotionalEmails: boolean;
  smsNotifications: boolean;
  
  // App Preferences
  darkMode: boolean;
  language: string;
  currency: string;
  defaultView: 'grid' | 'list';
  
  // Privacy & Security
  profileVisibility: 'public' | 'private';
  shareDataForAnalytics: boolean;
  twoFactorAuth: boolean;
  
  // Delivery Preferences
  defaultDeliveryAddress: string;
  preferredDeliveryTime: string;
  deliveryInstructions: string;
}

interface AppState {
  user: User | null;
  company: Company | null;
  products: Product[];
  cart: CartItem[];
  loading: boolean;
  searchQuery: string;
  selectedCategory: string;
  selectedLocation: LocationSuggestion | null;
  userLocations: LocationSuggestion[];
  tabBarVisible: boolean;
  purchaseAchievement: {
    visible: boolean;
    data: PurchaseAchievementData | null;
  };
  userStats: {
    totalPoints: number;
    currentLevel: number;
    totalSavings: number;
    orderCount: number;
  };
  userSettings: UserSettings;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_COMPANY'; payload: Company | null }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_TO_CART'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_CATEGORY'; payload: string }
  | { type: 'SET_SELECTED_LOCATION'; payload: LocationSuggestion | null }
  | { type: 'SET_USER_LOCATIONS'; payload: LocationSuggestion[] }
  | { type: 'SET_TAB_BAR_VISIBLE'; payload: boolean }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<User> }
  | { type: 'UPDATE_COMPANY_PROFILE'; payload: Partial<Company> }
  | { type: 'SHOW_PURCHASE_ACHIEVEMENT'; payload: PurchaseAchievementData }
  | { type: 'HIDE_PURCHASE_ACHIEVEMENT' }
  | { type: 'UPDATE_USER_STATS'; payload: Partial<AppState['userStats']> }
  | { type: 'COMPLETE_PURCHASE'; payload: { orderTotal: number; orderId: string } }
  | { type: 'CALCULATE_INITIAL_POINTS'; payload: { userId: string } }
  | { type: 'SAVE_USER_SETTINGS'; payload: UserSettings }
  | { type: 'LOAD_USER_SETTINGS' }
  | { type: 'UPDATE_USER_SETTINGS'; payload: Partial<UserSettings> };

const DEFAULT_USER_SETTINGS: UserSettings = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  pushNotifications: true,
  emailNotifications: true,
  orderUpdates: true,
  promotionalEmails: false,
  smsNotifications: false,
  darkMode: false,
  language: 'English',
  currency: 'SGD',
  defaultView: 'grid',
  profileVisibility: 'private',
  shareDataForAnalytics: false,
  twoFactorAuth: false,
  defaultDeliveryAddress: '',
  preferredDeliveryTime: 'Any time',
  deliveryInstructions: ''
};

// Initial state - no user until authenticated
const initialState: AppState = {
  user: null,
  company: null,
  products: [],
  cart: [],
  loading: false,
  searchQuery: '',
  selectedCategory: 'all',
  selectedLocation: {
    id: 'marina-bay',
    title: 'Marina Bay',
    subtitle: 'Marina Bay, Singapore',
    type: 'suggestion',
    coordinate: {
      latitude: 1.2834,
      longitude: 103.8607
    }
  }, // Default location
  userLocations: [], // Will be loaded from live user data
  tabBarVisible: true,
  purchaseAchievement: {
    visible: false,
    data: null,
  },
  userStats: {
    totalPoints: 0, // Will be loaded from live user data
    currentLevel: 1,
    totalSavings: 0,
    orderCount: 0,
  },
  userSettings: DEFAULT_USER_SETTINGS,
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      console.log('SET_USER action dispatched:', action.payload?.name);
      
      // If user doesn't have points set, they need to be calculated from order history
      if (action.payload && (action.payload.points === undefined || action.payload.points === null)) {
        console.log('User has no points set, will calculate from order history');
        // This will be handled in the provider via useEffect
      }
      
      return { ...state, user: action.payload };
    case 'SET_COMPANY':
      return { ...state, company: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'ADD_TO_CART':
      const existingItem = state.cart.find(item => item.product.id === action.payload.product.id);
      const currentCartQuantity = existingItem ? existingItem.quantity : 0;
      const newTotalQuantity = currentCartQuantity + action.payload.quantity;
      
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.product.id === action.payload.product.id
              ? { ...item, quantity: newTotalQuantity }
              : item
          ),
        };
      }
      return { ...state, cart: [...state.cart, action.payload] };
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter(item => item.product.id !== action.payload) };
    case 'UPDATE_CART_QUANTITY':
      if (action.payload.quantity === 0) {
        return { ...state, cart: state.cart.filter(item => item.product.id !== action.payload.productId) };
      }
      
      return {
        ...state,
        cart: state.cart.map(item =>
          item.product.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategory: action.payload };
    case 'SET_SELECTED_LOCATION':
      return { ...state, selectedLocation: action.payload };
    case 'SET_USER_LOCATIONS':
      return { ...state, userLocations: action.payload };
    case 'SET_TAB_BAR_VISIBLE':
      return { ...state, tabBarVisible: action.payload };
    case 'UPDATE_USER_PROFILE':
      if (state.user) {
        return { ...state, user: { ...state.user, ...action.payload } };
      }
      return state;
    case 'UPDATE_COMPANY_PROFILE':
      if (state.company) {
        return { ...state, company: { ...state.company, ...action.payload } };
      }
      return state;
    case 'SHOW_PURCHASE_ACHIEVEMENT':
      return {
        ...state,
        purchaseAchievement: {
          visible: true,
          data: action.payload,
        },
      };
    case 'HIDE_PURCHASE_ACHIEVEMENT':
      return {
        ...state,
        purchaseAchievement: {
          visible: false,
          data: null,
        },
      };
    case 'UPDATE_USER_STATS':
      return {
        ...state,
        userStats: { ...state.userStats, ...action.payload },
      };
    case 'COMPLETE_PURCHASE':
      const { orderTotal, orderId } = action.payload;
      const pointsEarned = Math.floor(orderTotal * 2); // 2 points per dollar
      const savingsAmount = orderTotal * 0.15; // 15% savings
      
      // NOTE: Points are NOT awarded immediately upon order completion
      // Points will be awarded when payment status changes to 'paid'
      // This is handled by the payment processor webhook or RewardsContext
      
      // Update user stats in database (orders count, total spent, but not points yet)
      if (state.user && state.user.accountType === 'individual') {
        const updatedUser = {
          ...state.user,
          totalOrders: (state.user as IndividualUser).totalOrders + 1,
          totalSpent: (state.user as IndividualUser).totalSpent + orderTotal,
          // points: NOT updated here - only when payment is confirmed
        };
        // Async update to database (fire and forget)
        supabaseService.updateUser(state.user.id, updatedUser).catch(error => 
          console.error('Error updating user stats:', error)
        );
      }
      
      // For company users, update company stats (but not points until payment)
      if (state.user && state.user.accountType === 'company' && state.company) {
        console.log('Updating company stats for purchase:', { orderTotal, orderId, companyId: state.company.id });
        
        // Update company stats in database (fire and forget)
        supabaseService.updateCompanyStats(state.company.id, {
          totalOrders: 1, // Increment order count
          totalSpent: orderTotal, // This will be deducted from company credit
          // pointsEarned: NOT updated here - only when payment is confirmed
        }).then(() => {
          // Refresh company data to show updated credit balance
          if (state.company) {
            supabaseService.getCompanyById(state.company.id).then(updatedCompany => {
              if (updatedCompany) {
                console.log('Company credit updated:', updatedCompany.currentCredit);
                dispatch({ type: 'SET_COMPANY', payload: updatedCompany });
              }
            });
          }
        }).catch(error => 
          console.error('Error updating company stats:', error)
        );
      }
      
      // NOTE: Audit trail for points will be logged when payment is confirmed
      // This prevents awarding points for unpaid orders
      
      return {
        ...state,
        cart: [], // Clear cart
        // NOTE: User points are NOT updated here - only when payment is confirmed
        userStats: {
          ...state.userStats,
          // totalPoints: NOT updated here - only when payment is confirmed
          totalSavings: state.userStats.totalSavings + savingsAmount,
          orderCount: state.userStats.orderCount + 1,
        },
        purchaseAchievement: {
          visible: false, // Disable achievement notification until payment is confirmed
          data: {
            orderTotal,
            pointsEarned, // This will be used when payment is confirmed
            savingsAmount,
            orderId,
          },
        },
      };
    case 'CALCULATE_INITIAL_POINTS':
      // This action will calculate initial points based on order history
      // Implementation will be done in the provider
      return state;
    case 'SAVE_USER_SETTINGS':
      // Save to AsyncStorage and update state
      AsyncStorage.setItem('userSettings', JSON.stringify(action.payload));
      return {
        ...state,
        userSettings: action.payload,
      };
    case 'LOAD_USER_SETTINGS':
      // This will be handled in the provider
      return state;
    case 'UPDATE_USER_SETTINGS':
      const updatedSettings = { ...state.userSettings, ...action.payload };
      AsyncStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      return {
        ...state,
        userSettings: updatedSettings,
      };
    default:
      return state;
  }
};

// Context
export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  updateUserProfile: (updates: Partial<User>) => Promise<boolean>;
  updateCompanyProfile: (updates: Partial<Company>) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<User | null>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<User | null>;
  signOut: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  loadProducts: (filters?: ProductFilters) => Promise<void>;
  searchProducts: (searchTerm: string) => Promise<Product[]>;
  getProductsByCategory: (category: string) => Promise<Product[]>;
  getFeaturedProducts: () => Promise<Product[]>;
  getProductCategories: () => Promise<string[]>;
  loadCurrentUser: () => Promise<User | null>;
  isAuthenticated: () => Promise<boolean>;
  loadUserFromSupabase: (userId: string) => Promise<User | null>;
  testSupabaseIntegration: () => Promise<boolean>;
  refreshUserLocations: () => Promise<void>;
}>({
  state: initialState,
  dispatch: () => null,
  updateUserProfile: async () => false,
  updateCompanyProfile: async () => false,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => false,
  resetPassword: async () => false,
  updatePassword: async () => false,
  loadProducts: async () => {},
  searchProducts: async () => [],
  getProductsByCategory: async () => [],
  getFeaturedProducts: async () => [],
  getProductCategories: async () => [],
  loadCurrentUser: async () => null,
  isAuthenticated: async () => false,
  loadUserFromSupabase: async () => null,
  testSupabaseIntegration: async () => false,
  refreshUserLocations: async () => {},
});

// Helper function to get user role for pricing
const getUserRole = (user: User | null): UserRole => {
  if (!user) return 'retail';
  
  // Company users get trade pricing
  if (isCompanyUser(user) && user.permissions?.canViewTradePrice) {
    return 'trade';
  }
  
  return 'retail';
};

// Provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Calculate initial points based on order history
  const calculateInitialPoints = async (userId: string): Promise<number> => {
    try {
      console.log('Calculating initial points for user:', userId);
      
      // Get all orders for this user
      const orders = await supabaseService.getUserOrders(userId);
      
      // Calculate total points (2 points per dollar)
      let totalPoints = 0;
      orders.forEach(order => {
        const pointsForOrder = Math.floor(order.total * 2);
        totalPoints += pointsForOrder;
        console.log(`  ${order.orderNumber}: $${order.total} → ${pointsForOrder} points`);
      });
      
      console.log(`Total points calculated: ${totalPoints} (from ${orders.length} orders)`);
      return totalPoints;
    } catch (error) {
      console.error('❌ Error calculating initial points:', error);
      return 0;
    }
  };

  // Supabase integration methods
  const updateUserProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!state.user) return false;
    
    try {
      // First check if user exists in Supabase, if not, try to sync them
      const existingUser = await supabaseService.getUserById(state.user.id);
      if (!existingUser) {
        console.log('User not found in Supabase, attempting to sync...');
        await syncUserToSupabase(state.user);
      }
      
      // Try to update in Supabase
      const updatedUser = await supabaseService.updateUser(state.user.id, updates);
      if (updatedUser) {
        dispatch({ type: 'UPDATE_USER_PROFILE', payload: updates });
        console.log('Profile updated successfully via Supabase');
        return true;
      }
    } catch (error) {
      console.log('Supabase update failed, updating local state only:', error);
    }
    
    // If Supabase fails, update local state anyway (for demo mode)
    dispatch({ type: 'UPDATE_USER_PROFILE', payload: updates });
    console.log('Profile updated successfully in local state');
    return true;
  };

  const syncUserToSupabase = async (user: User): Promise<boolean> => {
    try {
      console.log('Syncing user to Supabase:', user.id);
      
      // First check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (existingUser) {
        console.log('User already exists in Supabase, skipping sync');
        return true;
      }
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking user existence:', checkError);
        return false;
      }
      
      // User doesn't exist, create them
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        account_type: user.accountType,
        company_id: user.companyId,
        role: isCompanyUser(user) ? user.role : undefined,
        department: isCompanyUser(user) ? user.department : undefined,
        position: isCompanyUser(user) ? user.position : undefined,
        profile_image: user.profileImage,
        member_since: user.memberSince,
        total_orders: user.totalOrders,
        total_spent: user.totalSpent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('users')
        .insert([userData]);
      
      if (error) {
        console.error('❌ Error syncing user to Supabase:', error);
        return false;
      }
      
      console.log('User synced to Supabase successfully');
      return true;
    } catch (error) {
      console.error('❌ Error syncing user to Supabase:', error);
      return false;
    }
  };

  const updateCompanyProfile = async (updates: Partial<Company>): Promise<boolean> => {
    if (!state.company) return false;
    
    try {
      const updatedCompany = await supabaseService.updateCompany(state.company.id, updates);
      if (updatedCompany) {
        dispatch({ type: 'UPDATE_COMPANY_PROFILE', payload: updates });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating company profile:', error);
      return false;
    }
  };

  const signIn = async (email: string, password: string): Promise<User | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Simply call Supabase signIn - let auth state listener handle everything
      const user = await supabaseService.signIn(email, password);
      
      if (user) {
        console.log('SignIn successful, auth state listener will handle user loading');
        return user;
      }
      
      console.log('Authentication failed');
      dispatch({ type: 'SET_LOADING', payload: false });
      return null;
    } catch (error) {
      console.error('Error signing in:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      return null;
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<User>): Promise<User | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Simply call Supabase signUp - let auth state listener handle everything
      const user = await supabaseService.signUp(email, password, userData);
      
      if (user) {
        console.log('SignUp successful, auth state listener will handle user loading');
        return user;
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
      return null;
    } catch (error) {
      console.error('Error signing up:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      return null;
    }
  };

  const signOut = async (): Promise<boolean> => {
    try {
      console.log('SignOut method called');
      
      // Set loading state briefly
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Force cleanup of all subscriptions first to prevent hanging
      console.log('Force cleaning up all Supabase channels before signOut...');
      try {
        supabase.removeAllChannels();
      } catch (cleanupError) {
        console.log('Error cleaning up channels:', cleanupError);
      }
      
      // Clear session from AsyncStorage manually first
      try {
        console.log('Clearing session from AsyncStorage...');
        await AsyncStorage.removeItem('sb-vqxnkxaeriizizfmqvua-auth-token');
        
        // Also clear any other potential session keys
        const keys = await AsyncStorage.getAllKeys();
        const authKeys = keys.filter(key => key.includes('auth-token') || key.includes('supabase'));
        if (authKeys.length > 0) {
          await AsyncStorage.multiRemove(authKeys);
          console.log('Cleared additional auth keys:', authKeys);
        }
      } catch (storageError) {
        console.log('Error clearing AsyncStorage:', storageError);
      }
      
      // Call Supabase signOut with proper scope
      let success = false;
      try {
        console.log('Calling Supabase signOut...');
        // Use global scope to ensure complete sign out
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        if (error) {
          console.error('❌ Supabase signOut error:', error);
          throw error;
        }
        success = true;
        console.log('Supabase signOut successful');
      } catch (signOutError) {
        console.error('❌ SignOut error:', signOutError);
        
        // If signOut fails, force a local sign out
        try {
          console.log('Forcing local sign out...');
          await supabase.auth.signOut({ scope: 'local' });
          success = true;
        } catch (forceError) {
          console.error('❌ Force sign out failed:', forceError);
          // Clear local state anyway - auth state listener will handle the rest
          success = true; 
        }
      }
      
      if (success) {
        console.log('SignOut successful, auth state listener will handle cleanup');
      } else {
        console.log('SignOut failed');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
      
      return success;
    } catch (error) {
      console.error('Error signing out:', error);
      // Auth state listener will handle cleanup
      return true; 
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      return await supabaseService.resetPassword(email);
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    }
  };

  const updatePassword = async (newPassword: string): Promise<boolean> => {
    try {
      return await supabaseService.updatePassword(newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  };

  const loadProducts = async (filters?: ProductFilters): Promise<void> => {
    try {
      console.log('Loading products from Supabase...');
      
      const products = await productsService.getProducts(filters);
      
      // Map products to match the existing Product interface for the cart/pricing system
      const mappedProducts = products.map(product => {
        // Ensure we have valid price data
        const retailPrice = product.retailPrice || 0;
        const tradePrice = product.tradePrice || retailPrice * 0.9;
        
        return {
          id: product.id,
          name: product.name,
          retailPrice,
          tradePrice,
          price: retailPrice, // Set price for backward compatibility
          originalPrice: product.originalPrice, // Keep original price for discount calculation
          category: product.category || '',
          description: product.description || '',
          sku: product.sku,
          image: product.imageUrl, // Map imageUrl to image
          imageUrl: product.imageUrl, // Keep imageUrl for components that use it
          rating: product.rating || 4.5, // Default rating if not provided
          stock: product.stock || 10, // Default stock if not provided
          inStock: (product.stock || 10) > 0, // Calculate inStock based on stock
        };
      });
      
      console.log(`Loaded ${mappedProducts.length} products from Supabase`);
      dispatch({ type: 'SET_PRODUCTS', payload: mappedProducts });
    } catch (error) {
      console.error('Error loading products from Supabase:', error);
      console.log('Falling back to mock data...');
      
      // No fallback - all data must come from database
      console.log('Failed to load products from database, no fallback available');
      dispatch({ type: 'SET_PRODUCTS', payload: [] });
    }
  };

  const loadCurrentUser = async (): Promise<User | null> => {
    try {
      const user = await supabaseService.getCurrentUser();
      if (user) {
        dispatch({ type: 'SET_USER', payload: user });
        
        // Load company if user is a company user
        if (user.accountType === 'company' && user.companyId) {
          const company = await supabaseService.getCompanyById(user.companyId);
          if (company) {
            dispatch({ type: 'SET_COMPANY', payload: company });
          }
        }
      }
      return user;
    } catch (error) {
      console.error('Error loading current user:', error);
      return null;
    }
  };

  const isAuthenticated = async (): Promise<boolean> => {
    try {
      return await supabaseService.isAuthenticated();
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  };

  // Additional product methods
  const searchProducts = async (searchTerm: string): Promise<Product[]> => {
    try {
      const products = await productsService.searchProducts(searchTerm);
      return products.map(product => ({
        id: product.id,
        name: product.name,
        retailPrice: product.retailPrice,
        tradePrice: product.tradePrice,
        category: product.category || '',
        description: product.description || '',
        sku: product.sku,
        image: product.imageUrl,
      }));
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  };

  const getProductsByCategory = async (category: string): Promise<Product[]> => {
    try {
      const products = await productsService.getProductsByCategory(category);
      return products.map(product => ({
        id: product.id,
        name: product.name,
        retailPrice: product.retailPrice,
        tradePrice: product.tradePrice,
        category: product.category || '',
        description: product.description || '',
        sku: product.sku,
        image: product.imageUrl,
      }));
    } catch (error) {
      console.error('Error getting products by category:', error);
      return [];
    }
  };

  const getFeaturedProducts = async (): Promise<Product[]> => {
    try {
      const products = await productsService.getFeaturedProducts();
      return products.map(product => ({
        id: product.id,
        name: product.name,
        retailPrice: product.retailPrice,
        tradePrice: product.tradePrice,
        category: product.category || '',
        description: product.description || '',
        sku: product.sku,
        image: product.imageUrl,
      }));
    } catch (error) {
      console.error('Error getting featured products:', error);
      return [];
    }
  };

  const getProductCategories = async (): Promise<string[]> => {
    try {
      return await productsService.getProductCategories();
    } catch (error) {
      console.error('Error getting product categories:', error);
      return ['Scotch', 'Champagne', 'Cognac', 'Japanese Whisky'];
    }
  };

  const loadUserFromSupabase = async (userId: string): Promise<User | null> => {
    try {
      console.log('Loading user from Supabase:', userId);
      const user = await supabaseService.getUserById(userId);
      if (user) {
        dispatch({ type: 'SET_USER', payload: user });
        
        // Load company if user is a company user
        if (user.accountType === 'company' && user.companyId) {
          const company = await supabaseService.getCompanyById(user.companyId);
          if (company) {
            dispatch({ type: 'SET_COMPANY', payload: company });
          }
        }
        console.log('Successfully loaded user from Supabase');
      } else {
        console.log('User not found in Supabase');
      }
      return user;
    } catch (error) {
      console.error('❌ Error loading user from Supabase:', error);
      return null;
    }
  };

  const testSupabaseIntegration = async (): Promise<boolean> => {
    try {
      console.log('Testing Supabase integration...');
      
      // Test 1: Check if Supabase client is configured
      if (!supabase) {
        console.error('❌ Supabase client not configured');
        return false;
      }
      console.log('Supabase client configured');
      
      // Test 2: Check auth session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ Auth session error:', sessionError);
        // Don't return false here - user might not be authenticated
      }
      console.log('Auth session checked:', session ? 'Active' : 'No active session');
      
      // Test 3: Test database connection by fetching products
      try {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name')
          .limit(1);
        
        if (productsError) {
          console.error('❌ Products query error:', productsError);
          return false;
        }
        console.log('Database connection successful, products count:', products?.length || 0);
      } catch (dbError) {
        console.error('❌ Database connection failed:', dbError);
        return false;
      }
      
      // Test 4: Test products service integration
      try {
        const testProducts = await productsService.getProducts({ limit: 1 });
        console.log('Products service integration successful, loaded:', testProducts.length, 'products');
      } catch (serviceError) {
        console.error('❌ Products service integration failed:', serviceError);
        return false;
      }
      
      // Test 5: Test authentication service
      try {
        const isAuth = await supabaseService.isAuthenticated();
        console.log('✅ Authentication service successful, authenticated:', isAuth);
      } catch (authError) {
        console.error('❌ Authentication service failed:', authError);
        return false;
      }
      
      console.log('🎉 All Supabase integration tests passed!');
      return true;
    } catch (error) {
      console.error('❌ Supabase integration test failed:', error);
      return false;
    }
  };

  const seedMockData = async (): Promise<boolean> => {
    try {
      console.log('🌱 Starting mock data seeding from AppContext...');
      const success = await supabaseService.seedMockData();
      
      if (success) {
        // Reload the current user and company from Supabase after seeding
        if (state.user) {
          const updatedUser = await supabaseService.getUserById(state.user.id);
          if (updatedUser) {
            dispatch({ type: 'SET_USER', payload: updatedUser });
            
            // Load company if user is a company user
            if (updatedUser.accountType === 'company' && updatedUser.companyId) {
              const company = await supabaseService.getCompanyById(updatedUser.companyId);
              if (company) {
                dispatch({ type: 'SET_COMPANY', payload: company });
              }
            }
          }
        }
        console.log('✅ Mock data seeded and state updated successfully');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error seeding mock data:', error);
      return false;
    }
  };

  // Load user settings from AsyncStorage
  const loadUserSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        dispatch({ type: 'UPDATE_USER_SETTINGS', payload: parsedSettings });
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  // Load user and products on mount
  useEffect(() => {
    const initializeApp = async () => {
      // Load user settings first
      await loadUserSettings();
      
      // Check if user is already authenticated
      const authenticated = await isAuthenticated();
      if (authenticated) {
        const user = await loadCurrentUser();
        if (user) {
          await loadProducts();
        }
      } else {
        console.log('⚠️ User not authenticated - limited functionality');
        // Load public catalog only
        await loadProducts();
      }
    };
    
    initializeApp();
  }, []);

  // Set up real-time subscriptions (following Supabase best practices)
  useEffect(() => {
    let userSubscription: any = null;
    let companySubscription: any = null;
    let ordersSubscription: any = null;
    let productsSubscription: any = null;
    let locationSubscription: any = null;
    let isSubscribed = true; // Flag to prevent setting up subscriptions after cleanup

    const setupSubscriptions = async () => {
      // Only set up subscriptions if user exists and we haven't been cleaned up
      if (state.user && isSubscribed) {
        console.log('🔄 Setting up real-time subscriptions for user:', state.user.name);

        try {
          // Add small delay to ensure auth state is stable
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check if still subscribed after delay
          if (!isSubscribed) return;

          // Subscribe to user changes with error handling
          try {
            userSubscription = supabaseService.subscribeToUserChanges(
              state.user.id,
              (user) => {
                if (isSubscribed) {
                  console.log('👤 Real-time user update:', user?.name);
                  if (user) {
                    dispatch({ type: 'SET_USER', payload: user });
                  }
                }
              }
            );
          } catch (error) {
            console.log('⚠️ Failed to set up user subscription:', error);
          }

          // Subscribe to user orders with error handling
          try {
            ordersSubscription = supabaseService.subscribeToUserOrders(
              state.user.id,
              (orders) => {
                if (isSubscribed) {
                  console.log('📦 Real-time orders update:', orders.length, 'orders');
                }
              }
            );
          } catch (error) {
            console.log('⚠️ Failed to set up orders subscription:', error);
          }

          // Subscribe to user location changes with error handling
          try {
            locationSubscription = supabaseService.subscribeToUserLocationChanges(
              state.user.id,
              (locations) => {
                if (isSubscribed) {
                  // Convert database locations to LocationSuggestion format
                  const formattedLocations: LocationSuggestion[] = locations.map(loc => ({
                    id: loc.location_id,
                    title: loc.title,
                    subtitle: loc.subtitle || loc.address || '',
                    type: loc.location_type,
                    coordinate: {
                      latitude: parseFloat(loc.latitude.toString()),
                      longitude: parseFloat(loc.longitude.toString()),
                    }
                  }));
                  
                  // Update user locations in global state
                  dispatch({ type: 'SET_USER_LOCATIONS', payload: formattedLocations });
                  
                  // Find current location and update selectedLocation (prevent circular updates)
                  const currentLocation = locations.find(loc => loc.is_current);
                  if (currentLocation) {
                    const locationSuggestion: LocationSuggestion = {
                      id: currentLocation.location_id,
                      title: currentLocation.title,
                      subtitle: currentLocation.subtitle || currentLocation.address || '',
                      type: currentLocation.location_type,
                      coordinate: {
                        latitude: parseFloat(currentLocation.latitude.toString()),
                        longitude: parseFloat(currentLocation.longitude.toString()),
                      }
                    };
                    
                    // Only update if different from current selection to prevent loops
                    if (state.selectedLocation?.id !== locationSuggestion.id) {
                      dispatch({ type: 'SET_SELECTED_LOCATION', payload: locationSuggestion });
                    }
                  }
                }
              }
            );
          } catch (error) {
            console.log('⚠️ Failed to set up location subscription:', error);
          }

          // Subscribe to company changes if user is a company user
          if (state.user.accountType === 'company' && state.user.companyId) {
            try {
              companySubscription = supabaseService.subscribeToCompanyChanges(
                state.user.companyId,
                (company) => {
                  if (isSubscribed) {
                    console.log('🏢 Real-time company update:', company?.name);
                    if (company) {
                      dispatch({ type: 'SET_COMPANY', payload: company });
                    }
                  }
                }
              );
            } catch (error) {
              console.log('⚠️ Failed to set up company subscription:', error);
            }
          }

          // Subscribe to product changes with debouncing
          if (!productsSubscription && isSubscribed) {
            try {
              let productReloadTimeout: NodeJS.Timeout;
              productsSubscription = productsService.subscribeToProductChanges(
                (payload) => {
                  if (!isSubscribed) return;
                  
                  // Clear existing timeout to debounce rapid changes
                  if (productReloadTimeout) {
                    clearTimeout(productReloadTimeout);
                  }
                  
                  // Only reload if it's an actual change, not just a heartbeat
                  if (payload.eventType && ['INSERT', 'UPDATE', 'DELETE'].includes(payload.eventType)) {
                    // Debounce the reload to prevent infinite loops
                    productReloadTimeout = setTimeout(() => {
                      if (isSubscribed) {
                        console.log('🔄 Products updated');
                        loadProducts();
                      }
                    }, 1000);
                  }
                }
              );
            } catch (error) {
              console.log('⚠️ Failed to set up products subscription:', error);
            }
          }

          console.log('✅ Real-time subscriptions active');
        } catch (error) {
          console.log('❌ Error setting up subscriptions:', error);
        }
      }
    };

    setupSubscriptions();

    // Cleanup subscriptions on unmount or user change
    return () => {
      console.log('🧽 Cleaning up real-time subscriptions...');
      isSubscribed = false; // Mark as unsubscribed to prevent callbacks
      
      try {
        if (userSubscription) {
          supabase.removeChannel(userSubscription);
          console.log('🔔 User subscription status:', userSubscription.state);
        }
        if (companySubscription) {
          supabase.removeChannel(companySubscription);
          console.log('🔔 Company subscription status:', companySubscription.state);
        }
        if (ordersSubscription) {
          supabase.removeChannel(ordersSubscription);
          console.log('🔔 Orders subscription status:', ordersSubscription.state);
        }
        if (locationSubscription) {
          supabase.removeChannel(locationSubscription);
        }
        if (productsSubscription) {
          productsService.unsubscribeFromProductChanges(productsSubscription);
        }
      } catch (cleanupError) {
        console.log('⚠️ Error during subscription cleanup:', cleanupError);
      }
    };
  }, [state.user?.id]); // Re-run when user changes

  // Load cart from AsyncStorage on mount (user-specific)
  useEffect(() => {
    const loadCart = async () => {
      if (!state.user) return;
      
      try {
        const cartKey = `@easiapp:cart:${state.user.id}`;
        const savedCart = await AsyncStorage.getItem(cartKey);
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          // Validate each item in the saved cart
          const validCart = parsedCart.filter((item: CartItem) => {
            const product = state.products.find(p => p.id === item.product.id);
            return product !== undefined; // Just check if product exists
          });
          
          if (validCart.length > 0) {
            // Re-create cart with current product data
            validCart.forEach((item: CartItem) => {
              const product = state.products.find(p => p.id === item.product.id);
              if (product) {
                dispatch({ type: 'ADD_TO_CART', payload: { product, quantity: item.quantity } });
              }
            });
          }
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    };

    if (state.products.length > 0 && state.user) {
      loadCart();
    }
  }, [state.products, state.user?.id]);

  // Save cart to AsyncStorage whenever it changes (user-specific)
  useEffect(() => {
    const saveCart = async () => {
      if (!state.user) return;
      
      try {
        const cartKey = `@easiapp:cart:${state.user.id}`;
        await AsyncStorage.setItem(cartKey, JSON.stringify(state.cart));
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    };

    if (state.user) {
      saveCart();
    }
  }, [state.cart, state.user?.id]);

  // Load user location from database on mount
  useEffect(() => {
    const loadUserLocation = async () => {
      if (state.user) {
        try {
          console.log('📍 Loading user location data from database...');
          
          // Load current location
          const currentLocation = await supabaseService.getCurrentUserLocation(state.user.id);
          if (currentLocation) {
            dispatch({ type: 'SET_SELECTED_LOCATION', payload: currentLocation });
            console.log('✅ Current location loaded:', currentLocation.title);
          } else {
            console.log('📍 No current location found - user will build location history organically');
          }
          
          // Load location history
          const locationHistory = await supabaseService.getUserLocationHistory(state.user.id, 10);
          dispatch({ type: 'SET_USER_LOCATIONS', payload: locationHistory });
          console.log('✅ Location history loaded:', locationHistory.length, 'locations');
          
        } catch (error) {
          console.error('Error loading user location data:', error);
          // Fallback to AsyncStorage for compatibility
          try {
            const savedLocation = await AsyncStorage.getItem('@easiapp:selectedLocation');
            if (savedLocation) {
              dispatch({ type: 'SET_SELECTED_LOCATION', payload: JSON.parse(savedLocation) });
              console.log('✅ Fallback location loaded from AsyncStorage');
            }
          } catch (fallbackError) {
            console.error('Error loading fallback location:', fallbackError);
          }
        }
      }
    };

    loadUserLocation();
    
    // Load user location only for authenticated users
    if (state.user) {
      loadUserLocation();
    }
  }, []);

  // Save selected location to database whenever it changes (debounced to prevent infinite loops)
  useEffect(() => {
    let saveTimeout: NodeJS.Timeout;
    
    const saveUserLocation = async () => {
      if (state.user && state.selectedLocation) {
        try {
          // Only save if location was changed by user, not by realtime updates
          const isFromRealtime = state.selectedLocation.id && state.userLocations.some(loc => loc.id === state.selectedLocation.id);
          
          if (!isFromRealtime) {
            await supabaseService.setCurrentLocation(state.user.id, state.selectedLocation.id);
          }
          
          // Always save to AsyncStorage as backup
          await AsyncStorage.setItem('@easiapp:selectedLocation', JSON.stringify(state.selectedLocation));
        } catch (error) {
          console.error('Error saving user location:', error);
          // Fallback to AsyncStorage only
          try {
            await AsyncStorage.setItem('@easiapp:selectedLocation', JSON.stringify(state.selectedLocation));
          } catch (fallbackError) {
            console.error('Error saving fallback location:', fallbackError);
          }
        }
      }
    };

    // Debounce the save operation to prevent rapid calls
    saveTimeout = setTimeout(saveUserLocation, 500);
    
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [state.selectedLocation, state.user?.id]);

  // Load company data when user changes
  useEffect(() => {
    const loadCompanyData = async () => {
      if (state.user?.accountType === 'company' && state.user?.companyId && !state.company) {
        console.log('🏢 Loading company data for user change...');
        const company = await supabaseService.getCompanyById(state.user.companyId);
        if (company) {
          console.log('✅ Company loaded on user change:', company.name);
          dispatch({ type: 'SET_COMPANY', payload: company });
        }
      }
    };
    
    loadCompanyData();
  }, [state.user?.id, state.user?.accountType, state.user?.companyId]);

  // Listen for auth state changes (following Supabase React best practices)
  useEffect(() => {
    console.log('🔧 Setting up auth state listener');
    
    // Auth state change handler
    const handleAuthStateChange = async (event: string, session: any) => {
      try {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
            console.log('✅ User signed in, loading real user data...');
            console.log('🔍 Session user ID:', session.user.id);
            console.log('🔍 Session user email:', session.user.email);
            
            // Set loading state while we fetch real user data
            dispatch({ type: 'SET_LOADING', payload: true });
            
            // Global safety timeout - always clear loading after 30 seconds
            const globalTimeout = setTimeout(() => {
              console.log('⚠️ Global timeout reached - forcing loading state clear');
              dispatch({ type: 'SET_LOADING', payload: false });
            }, 30000);
            
            try {
              // Add timeout wrapper for the entire user loading process
              const loadUserWithTimeout = async () => {
                // Get real user data from database with generous timeout
                const userDataPromise = supabaseService.getUserById(session.user.id);
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('User data loading timeout')), 20000)
                );
                
                let realUser = await Promise.race([userDataPromise, timeoutPromise]) as any;
                
                if (!realUser && session.user.email) {
                  console.log('🔍 User not found by ID, trying by email...');
                  const emailUserPromise = supabaseService.getUserByEmail(session.user.email);
                  const emailTimeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('User email query timeout')), 20000)
                  );
                  realUser = await Promise.race([emailUserPromise, emailTimeoutPromise]) as any;
                }
                
                return realUser;
              };
              
              const realUser = await loadUserWithTimeout();
              
              if (realUser) {
                if (__DEV__) {
                  console.log('✅ User loaded:', realUser.name);
                }
                dispatch({ type: 'SET_USER', payload: realUser });
                
                // Load company data if user is a company user (with timeout)
                if (realUser.accountType === 'company' && realUser.companyId) {
                  console.log('🏢 Loading company for user:', realUser.companyId);
                  try {
                    const companyPromise = supabaseService.getCompanyById(realUser.companyId);
                    const companyTimeout = new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Company loading timeout')), 15000)
                    );
                    const company = await Promise.race([companyPromise, companyTimeout]) as any;
                    
                    if (company) {
                      console.log('✅ Company loaded from database:', company.name);
                      dispatch({ type: 'SET_COMPANY', payload: company });
                    } else {
                      console.log('⚠️ Company not found for ID:', realUser.companyId);
                    }
                  } catch (error) {
                    console.log('❌ Failed to load company data:', error);
                  }
                }
                
                // Load products for authenticated user (with timeout)
                try {
                  const productsPromise = loadProducts();
                  const productsTimeout = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Products loading timeout')), 15000)
                  );
                  await Promise.race([productsPromise, productsTimeout]);
                } catch (error) {
                  console.log('❌ Failed to load products:', error);
                  // Continue anyway - products can be loaded later
                }
                
                // Clear loading state - user can now enter app
                clearTimeout(globalTimeout);
                dispatch({ type: 'SET_LOADING', payload: false });
                console.log('✅ Authentication complete, user can enter app');
              } else {
                console.log('❌ No user found in database - authentication failed');
                clearTimeout(globalTimeout);
                dispatch({ type: 'SET_LOADING', payload: false });
                // Sign out due to missing user data
                console.log('🔄 Signing out due to missing user data...');
                await supabase.auth.signOut({ scope: 'local' });
              }
            } catch (error) {
              console.log('❌ Error loading user data:', error);
              clearTimeout(globalTimeout);
              dispatch({ type: 'SET_LOADING', payload: false });
              // Sign out due to error
              console.log('🔄 Signing out due to error...');
              await supabase.auth.signOut({ scope: 'local' });
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('📝 User signed out, clearing state...');
            
            // Simple, direct state cleanup
            dispatch({ type: 'SET_LOADING', payload: false });
            dispatch({ type: 'SET_USER', payload: null });
            dispatch({ type: 'SET_COMPANY', payload: null });
            dispatch({ type: 'CLEAR_CART' });
            
            // Load products for non-authenticated user
            await loadProducts();
            console.log('🔄 Sign out complete, should show auth screen');
          }
        } catch (error) {
          console.error('❌ Error in auth state listener:', error);
          dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // Initialize session and set up auth listener
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Error getting initial session:', error);
        } else {
          console.log('📍 Initial session check:', session ? 'Active session' : 'No session');
          // Handle initial session
          if (session) {
            await handleAuthStateChange('INITIAL_SESSION', session);
          }
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    
    // Initialize auth state
    initializeAuth();

    return () => {
      console.log('🔧 Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, []);

  // Handle AppState changes for token refresh (React Native best practice)
  useEffect(() => {
    console.log('🔧 Setting up AppState listener for token refresh');
    
    const handleAppStateChange = (nextAppState: string) => {
      console.log('📱 AppState changed to:', nextAppState);
      
      if (nextAppState === 'active') {
        console.log('🔄 App became active, starting auto refresh');
        // Add small delay to avoid interfering with ongoing auth operations
        setTimeout(() => {
          supabase.auth.startAutoRefresh();
        }, 1000);
      } else {
        console.log('⏸️ App became inactive, stopping auto refresh');
        supabase.auth.stopAutoRefresh();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      console.log('🔧 Cleaning up AppState listener');
      subscription?.remove();
    };
  }, []);


  const refreshUserLocations = async (): Promise<void> => {
    if (state.user) {
      try {
        console.log('🔄 Manually refreshing user locations...');
        const locations = await supabaseService.getUserLocationHistory(state.user.id, 10);
        dispatch({ type: 'SET_USER_LOCATIONS', payload: locations });
        console.log('✅ User locations refreshed:', locations.length, 'locations');
      } catch (error) {
        console.error('❌ Error refreshing user locations:', error);
      }
    }
  };

  const value = {
    state, 
    dispatch, 
    updateUserProfile, 
    updateCompanyProfile, 
    signIn,
    signUp, 
    signOut,
    resetPassword,
    updatePassword,
    loadProducts,
    loadCurrentUser,
    isAuthenticated,
    searchProducts,
    getProductsByCategory,
    getFeaturedProducts,
    getProductCategories,
    loadUserFromSupabase,
    testSupabaseIntegration,
      refreshUserLocations,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Hook
export const useAppContext = () => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Export helper function for use in other components
export { getUserRole }; 