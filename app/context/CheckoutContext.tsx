import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DeliveryAddress,
  DeliverySlot,
  PaymentMethod,
} from '../types/checkout';

interface CheckoutState {
  deliveryAddress: DeliveryAddress | null;
  deliverySlot: DeliverySlot | null;
  paymentMethod: PaymentMethod | null;
  orderNotes: string;
  isProcessing: boolean;
  error: string | null;
}

type CheckoutAction =
  | { type: 'SET_DELIVERY_ADDRESS'; payload: DeliveryAddress }
  | { type: 'SET_DELIVERY_SLOT'; payload: DeliverySlot }
  | { type: 'SET_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'SET_ORDER_NOTES'; payload: string }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_CHECKOUT' }
  | { type: 'LOAD_SAVED_DATA'; payload: Partial<CheckoutState> };

const initialState: CheckoutState = {
  deliveryAddress: null,
  deliverySlot: null,
  paymentMethod: null,
  orderNotes: '',
  isProcessing: false,
  error: null,
};

const CheckoutContext = createContext<
  | {
      state: CheckoutState;
      dispatch: React.Dispatch<CheckoutAction>;
      isCheckoutComplete: () => boolean;
    }
  | undefined
>(undefined);

const STORAGE_KEY = '@checkout_data';

function checkoutReducer(
  state: CheckoutState,
  action: CheckoutAction
): CheckoutState {
  switch (action.type) {
    case 'SET_DELIVERY_ADDRESS':
      return { ...state, deliveryAddress: action.payload };
    case 'SET_DELIVERY_SLOT':
      return { ...state, deliverySlot: action.payload };
    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };
    case 'SET_ORDER_NOTES':
      return { ...state, orderNotes: action.payload };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET_CHECKOUT':
      return initialState;
    case 'LOAD_SAVED_DATA':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export const CheckoutProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(checkoutReducer, initialState);

  // Load saved checkout data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          dispatch({ type: 'LOAD_SAVED_DATA', payload: parsedData });
        }
      } catch (error) {
        console.error('Error loading saved checkout data:', error);
      }
    };
    loadSavedData();
  }, []);

  // Save checkout data whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        const dataToSave = {
          deliveryAddress: state.deliveryAddress,
          deliverySlot: state.deliverySlot,
          paymentMethod: state.paymentMethod,
          orderNotes: state.orderNotes,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (error) {
        console.error('Error saving checkout data:', error);
      }
    };

    // Don't save if processing or if there's an error
    if (!state.isProcessing && !state.error) {
      saveData();
    }
  }, [
    state.deliveryAddress,
    state.deliverySlot,
    state.paymentMethod,
    state.orderNotes,
  ]);

  const isCheckoutComplete = () => {
    return !!(
      state.deliveryAddress &&
      state.deliverySlot &&
      state.paymentMethod
    );
  };

  return (
    <CheckoutContext.Provider value={{ state, dispatch, isCheckoutComplete }}>
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
};

export default CheckoutContext;
