import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { User, Product, CartItem, Order, AppNotification } from '../types';
import { mockProducts, mockUsers, mockOrders } from '../data/mockData';

interface AppState {
  user: User | null;
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  notifications: AppNotification[];
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
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: Order['status'] } }
  | { type: 'SET_NOTIFICATIONS'; payload: AppNotification[] }
  | { type: 'ADD_NOTIFICATION'; payload: AppNotification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_CATEGORY'; payload: string };

const initialState: AppState = {
  user: null,
  products: mockProducts,
  cart: [],
  orders: mockOrders,
  notifications: [],
  loading: false,
  searchQuery: '',
  selectedCategory: 'all',
};

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
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'ADD_ORDER':
      return { ...state, orders: [action.payload, ...state.orders] };
    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.orderId
            ? { 
                ...order, 
                status: action.payload.status, 
                updatedAt: new Date().toISOString(),
                statusTimestamps: {
                  ...order.statusTimestamps,
                  [action.payload.status]: new Date().toISOString()
                }
              }
            : order
        ),
      };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notif =>
          notif.id === action.payload ? { ...notif, read: true } : notif
        ),
      };
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

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addToCart: (product: Product, quantity: number) => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  placeOrder: (shippingAddress: any, paymentMethod: string) => Promise<string>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('easi-cart');
    if (savedCart) {
      const cartItems = JSON.parse(savedCart);
      cartItems.forEach((item: CartItem) => {
        dispatch({ type: 'ADD_TO_CART', payload: item });
      });
    }

    // Load user from localStorage
    const savedUser = localStorage.getItem('easi-user');
    if (savedUser) {
      dispatch({ type: 'SET_USER', payload: JSON.parse(savedUser) });
    }
  }, []);

  useEffect(() => {
    // Save cart to localStorage
    localStorage.setItem('easi-cart', JSON.stringify(state.cart));
  }, [state.cart]);

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = mockUsers.find(u => u.email === email);
    if (user) {
      dispatch({ type: 'SET_USER', payload: user });
      localStorage.setItem('easi-user', JSON.stringify(user));
      dispatch({ type: 'SET_LOADING', payload: false });
      return true;
    }
    
    dispatch({ type: 'SET_LOADING', payload: false });
    return false;
  };

  const logout = () => {
    dispatch({ type: 'SET_USER', payload: null });
    localStorage.removeItem('easi-user');
  };

  const addToCart = (product: Product, quantity: number) => {
    dispatch({ type: 'ADD_TO_CART', payload: { product, quantity } });
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: Date.now().toString(),
        title: 'Added to Cart',
        message: `${product.name} has been added to your cart`,
        type: 'success',
        read: false,
        createdAt: new Date().toISOString(),
      },
    });
  };

  const getCartTotal = (): number => {
    return state.cart.reduce((total, item) => {
      const price = state.user?.role === 'trade' ? item.product.tradePrice : item.product.retailPrice;
      return total + price * item.quantity;
    }, 0);
  };

  const getCartItemCount = (): number => {
    return state.cart.reduce((count, item) => count + item.quantity, 0);
  };

  const placeOrder = async (shippingAddress: any, paymentMethod: string): Promise<string> => {
    const orderId = `ORD-${Date.now()}`;
    const sameDay = paymentMethod !== 'credit'; // Credit orders are not same-day by default
    
    const newOrder: Order = {
      id: orderId,
      userId: state.user!.id,
      items: [...state.cart],
      total: getCartTotal(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      shippingAddress,
      paymentMethod,
      sameDay,
      statusTimestamps: {
        pending: new Date().toISOString()
      }
    };

    dispatch({ type: 'ADD_ORDER', payload: newOrder });
    dispatch({ type: 'CLEAR_CART' });
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: Date.now().toString(),
        title: 'Order Placed',
        message: `Your order ${orderId} has been placed successfully`,
        type: 'success',
        read: false,
        createdAt: new Date().toISOString(),
      },
    });

    return orderId;
  };

  const value: AppContextType = {
    state,
    dispatch,
    login,
    logout,
    addToCart,
    getCartTotal,
    getCartItemCount,
    placeOrder,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};