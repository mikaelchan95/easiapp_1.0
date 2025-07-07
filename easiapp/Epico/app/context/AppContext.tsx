import React, { createContext, useReducer, ReactNode, useEffect } from 'react';
import { products } from '../data/mockProducts';

// Types
interface Product {
  id: string;
  name: string;
  price: number;
  image: any;
  category: string;
  description: string;
  sku: string;
  stock: number;
  retailPrice: number;
  tradePrice: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'retail' | 'trade';
}

interface AppState {
  user: User | null;
  products: Product[];
  cart: CartItem[];
  loading: boolean;
  searchQuery: string;
  selectedCategory: string;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_TO_CART'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_CATEGORY'; payload: string };

// Initial state
const initialState: AppState = {
  user: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'retail'
  }, // Default user for testing
  products: [],
  cart: [],
  loading: false,
  searchQuery: '',
  selectedCategory: 'all',
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'ADD_TO_CART':
      const existingItem = state.cart.find(item => item.product.id === action.payload.product.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.product.id === action.payload.product.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }
      return { ...state, cart: [...state.cart, action.payload] };
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter(item => item.product.id !== action.payload) };
    case 'UPDATE_CART_QUANTITY':
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
    default:
      return state;
  }
};

// Context
export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

// Provider
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load products from mock data
  useEffect(() => {
    // Map the products from mock data to our format
    const mappedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.imageUrl,
      category: product.category || '',
      description: product.description || '',
      sku: product.sku || '',
      stock: product.inStock ? 10 : 0,
      retailPrice: product.price,
      tradePrice: product.price * 0.9,
    }));

    dispatch({ type: 'SET_PRODUCTS', payload: mappedProducts });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
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