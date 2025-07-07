import React, { createContext, useReducer, ReactNode, useEffect } from 'react';
import { products } from '../data/mockProducts';
import { 
  Product, 
  CartItem, 
  UserRole, 
  validateAddToCart, 
  getMaxQuantity,
  isProductInStock 
} from '../utils/pricing';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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
      const currentCartQuantity = existingItem ? existingItem.quantity : 0;
      const newTotalQuantity = currentCartQuantity + action.payload.quantity;
      
      // Validate stock before adding
      const validation = validateAddToCart(action.payload.product, newTotalQuantity);
      if (!validation.valid) {
        // In a real app, you'd want to show this error to the user
        console.warn('Cannot add to cart:', validation.error);
        return state; // Don't add to cart if validation fails
      }
      
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
      // Validate stock before updating quantity
      const itemToUpdate = state.cart.find(item => item.product.id === action.payload.productId);
      if (itemToUpdate) {
        const quantityValidation = validateAddToCart(itemToUpdate.product, action.payload.quantity);
        if (!quantityValidation.valid && action.payload.quantity > 0) {
          console.warn('Cannot update quantity:', quantityValidation.error);
          return state; // Don't update if validation fails
        }
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
      image: product.imageUrl,
      category: product.category || '',
      description: product.description || '',
      sku: product.sku,
      stock: product.stock,
      retailPrice: product.retailPrice,
      tradePrice: product.tradePrice,
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