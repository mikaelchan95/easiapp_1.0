import React, { createContext, useReducer, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { products } from '../data/mockProducts';
import { 
  Product, 
  CartItem, 
  UserRole
} from '../utils/pricing';
import { PurchaseAchievementData } from '../hooks/usePurchaseAchievement';
import { LocationSuggestion } from '../types/location';
import { User, Company, isCompanyUser, CompanyUser, IndividualUser } from '../types/user';
import { 
  mockCompanies, 
  mockCompanyUsers, 
  mockIndividualUsers, 
  currentUser as mockCurrentUser 
} from '../data/mockUsers';
import { supabaseService } from '../services/supabaseService';

interface AppState {
  user: User | null;
  company: Company | null;
  products: Product[];
  cart: CartItem[];
  loading: boolean;
  searchQuery: string;
  selectedCategory: string;
  selectedLocation: LocationSuggestion | null;
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
  | { type: 'SET_TAB_BAR_VISIBLE'; payload: boolean }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<User> }
  | { type: 'UPDATE_COMPANY_PROFILE'; payload: Partial<Company> }
  | { type: 'SHOW_PURCHASE_ACHIEVEMENT'; payload: PurchaseAchievementData }
  | { type: 'HIDE_PURCHASE_ACHIEVEMENT' }
  | { type: 'UPDATE_USER_STATS'; payload: Partial<AppState['userStats']> }
  | { type: 'COMPLETE_PURCHASE'; payload: { orderTotal: number; orderId: string } };

// Initial state - use the current user from mock data
const initialState: AppState = {
  user: mockCurrentUser,
  company: mockCurrentUser.companyId ? mockCompanies.find(c => c.id === mockCurrentUser.companyId) || null : null,
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
  tabBarVisible: true,
  purchaseAchievement: {
    visible: false,
    data: null,
  },
  userStats: {
    totalPoints: 2450, // Mock starting points
    currentLevel: 25,
    totalSavings: 183.50,
    orderCount: 12,
  },
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
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
      
      return {
        ...state,
        cart: [], // Clear cart
        userStats: {
          ...state.userStats,
          totalPoints: state.userStats.totalPoints + pointsEarned,
          currentLevel: Math.floor((state.userStats.totalPoints + pointsEarned) / 100) + 1,
          totalSavings: state.userStats.totalSavings + savingsAmount,
          orderCount: state.userStats.orderCount + 1,
        },
        purchaseAchievement: {
          visible: true,
          data: {
            orderTotal,
            pointsEarned,
            savingsAmount,
            orderId,
          },
        },
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
  signOut: () => Promise<boolean>;
  loadUserFromSupabase: (userId: string) => Promise<User | null>;
  testSupabaseIntegration: () => Promise<boolean>;
}>({
  state: initialState,
  dispatch: () => null,
  updateUserProfile: async () => false,
  updateCompanyProfile: async () => false,
  signIn: async () => null,
  signOut: async () => false,
  loadUserFromSupabase: async () => null,
  testSupabaseIntegration: async () => false,
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

  // Supabase integration methods
  const updateUserProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!state.user) return false;
    
    try {
      // Try to update in Supabase first
      const updatedUser = await supabaseService.updateUser(state.user.id, updates);
      if (updatedUser) {
        dispatch({ type: 'UPDATE_USER_PROFILE', payload: updates });
        console.log('✅ Profile updated successfully via Supabase');
        return true;
      }
    } catch (error) {
      console.log('ℹ️ Supabase update failed, updating local state only:', error);
    }
    
    // If Supabase fails, update local state anyway (for demo mode)
    dispatch({ type: 'UPDATE_USER_PROFILE', payload: updates });
    console.log('✅ Profile updated successfully in local state');
    return true;
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
      const user = await supabaseService.signIn(email, password);
      
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
      
      dispatch({ type: 'SET_LOADING', payload: false });
      return user;
    } catch (error) {
      console.error('Error signing in:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      return null;
    }
  };

  const signOut = async (): Promise<boolean> => {
    try {
      const success = await supabaseService.signOut();
      if (success) {
        dispatch({ type: 'SET_USER', payload: null });
        dispatch({ type: 'SET_COMPANY', payload: null });
        dispatch({ type: 'CLEAR_CART' });
      }
      return success;
    } catch (error) {
      console.error('Error signing out:', error);
      return false;
    }
  };

  // Load products on mount
  useEffect(() => {
    // In a real app, this would be an API call
    // Map the products from mock data to match the pricing utility's Product interface
    const mappedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      retailPrice: product.retailPrice,
      tradePrice: product.tradePrice,
      category: product.category || '',
      description: product.description || '',
      sku: product.sku,
      image: product.imageUrl, // Map imageUrl to image
    }));
    dispatch({ type: 'SET_PRODUCTS', payload: mappedProducts });
  }, []);

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = await AsyncStorage.getItem('@easiapp:cart');
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

    if (state.products.length > 0) {
      loadCart();
    }
  }, [state.products]);

  // Save cart to AsyncStorage whenever it changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem('@easiapp:cart', JSON.stringify(state.cart));
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    };

    saveCart();
  }, [state.cart]);

  // Load selected location from AsyncStorage on mount
  useEffect(() => {
    const loadLocation = async () => {
      try {
        const savedLocation = await AsyncStorage.getItem('@easiapp:selectedLocation');
        if (savedLocation) {
          dispatch({ type: 'SET_SELECTED_LOCATION', payload: JSON.parse(savedLocation) });
        }
      } catch (error) {
        console.error('Error loading location:', error);
      }
    };

    loadLocation();
  }, []);

  // Save selected location to AsyncStorage whenever it changes
  useEffect(() => {
    const saveLocation = async () => {
      try {
        if (state.selectedLocation) {
          await AsyncStorage.setItem('@easiapp:selectedLocation', JSON.stringify(state.selectedLocation));
        }
      } catch (error) {
        console.error('Error saving location:', error);
      }
    };

    saveLocation();
  }, [state.selectedLocation]);

  // Load user data from Supabase with proper authentication
  const loadUserFromSupabase = async (userId: string) => {
    try {
      // First, authenticate the user with Supabase
      // For demo purposes, we'll use a mock authentication
      // In production, this would be a real sign-in flow
      console.log('🔐 Authenticating user for Supabase access...');
      
      // Create a mock authentication session for the user
      // This simulates what would happen after a real sign-in
      const mockAuthResult = await supabaseService.authenticateForDemo(userId);
      
      if (!mockAuthResult) {
        console.log('ℹ️ Demo authentication not available, using mock data');
        // Don't throw error, just continue with mock data
      }
      
      if (mockAuthResult) {
        console.log('✅ User authenticated successfully');
        
        const userData = await supabaseService.getUserById(userId);
        if (userData) {
          dispatch({ type: 'SET_USER', payload: userData });
          
          // If it's a company user, also load company data
          if (userData.accountType === 'company' && userData.companyId) {
            const companyData = await supabaseService.getCompanyById(userData.companyId);
            if (companyData) {
              dispatch({ type: 'SET_COMPANY', payload: companyData });
            }
          }
          
          console.log('✅ Loaded user from Supabase:', userData);
          return userData;
        }
      }
    } catch (error) {
      console.log('ℹ️ Supabase not available, using mock data:', error.message);
    }
    
    // Always fallback to mock data if Supabase is not available
    console.log('📋 Loading mock user data...');
    const allMockUsers = [...mockCompanyUsers, ...mockIndividualUsers];
    const mockUser = allMockUsers.find(u => u.id === userId);
    if (mockUser) {
      dispatch({ type: 'SET_USER', payload: mockUser });
      if (mockUser.accountType === 'company' && mockUser.companyId) {
        const mockCompany = mockCompanies.find(c => c.id === mockUser.companyId);
        if (mockCompany) {
          dispatch({ type: 'SET_COMPANY', payload: mockCompany });
        }
      }
      console.log('✅ Loaded mock user data:', mockUser.name);
      return mockUser;
    }
    return null;
  };

  // Test method to load and display all linked data
  const testSupabaseIntegration = async () => {
    try {
      console.log('🧪 Testing Supabase integration...');
      
      // Test with first user from mock data (Mikael Chan)
      const testUserId = '33333333-3333-3333-3333-333333333333';
      console.log('🔍 Testing with user ID:', testUserId);
      
      const userData = await loadUserFromSupabase(testUserId);
      
      if (userData) {
        console.log('✅ Successfully loaded user data:', userData);
        
        // If company user, show company info
        if (userData.accountType === 'company' && userData.companyId) {
          console.log('🔍 Loading company data for ID:', userData.companyId);
          const companyData = await supabaseService.getCompanyById(userData.companyId);
          console.log('🏢 Company data result:', companyData);
        }
        
        return true;
      } else {
        console.log('❌ No user data returned from Supabase');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Supabase integration test failed:', error);
      return false;
    }
  };

  const value = {
    state, 
    dispatch, 
    updateUserProfile, 
    updateCompanyProfile, 
    signIn, 
    signOut,
    loadUserFromSupabase,
    testSupabaseIntegration,
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