import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useCredit } from './useCredit';
import { CheckoutState, CheckoutStep, CartAddress, DeliverySlot } from '../types/cart';

const defaultAddress: CartAddress = {
  name: 'John Doe',
  street: '123 Marina Bay Sands',
  unit: '#12-34',
  city: 'Singapore',
  state: 'Singapore',
  postalCode: '018956',
  country: 'Singapore',
  phone: '+65 9123 4567'
};

export const useCheckout = () => {
  const { placeOrder, state } = useApp();
  const { useCreditForOrder, isCreditEligible } = useCredit();
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    step: 'address',
    address: defaultAddress,
    deliverySlot: null,
    paymentMethod: 'card',
    processing: false
  });

  // Calculate total cart amount
  const cartTotal = state.cart.reduce((total, item) => {
    const price = state.user?.role === 'trade' ? item.product.tradePrice : item.product.retailPrice;
    return total + price * item.quantity;
  }, 0);

  const nextStep = useCallback(() => {
    const steps: CheckoutStep[] = ['address', 'delivery', 'payment', 'review'];
    const currentIndex = steps.indexOf(checkoutState.step);
    if (currentIndex < steps.length - 1) {
      setCheckoutState(prev => ({
        ...prev,
        step: steps[currentIndex + 1]
      }));
    }
  }, [checkoutState.step]);

  const prevStep = useCallback(() => {
    const steps: CheckoutStep[] = ['address', 'delivery', 'payment', 'review'];
    const currentIndex = steps.indexOf(checkoutState.step);
    if (currentIndex > 0) {
      setCheckoutState(prev => ({
        ...prev,
        step: steps[currentIndex - 1]
      }));
    }
  }, [checkoutState.step]);

  const updateAddress = useCallback((address: Partial<CartAddress>) => {
    setCheckoutState(prev => ({
      ...prev,
      address: { ...prev.address, ...address }
    }));
  }, []);

  const selectDeliverySlot = useCallback((slot: DeliverySlot) => {
    setCheckoutState(prev => ({
      ...prev,
      deliverySlot: slot
    }));
  }, []);

  const selectPaymentMethod = useCallback((method: string) => {
    setCheckoutState(prev => ({
      ...prev,
      paymentMethod: method
    }));
  }, []);

  const processOrder = useCallback(async () => {
    setCheckoutState(prev => ({ ...prev, processing: true }));
    
    try {
      // Add haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const orderId = await placeOrder(
        {
          street: checkoutState.address.street,
          city: checkoutState.address.city,
          state: checkoutState.address.state,
          postalCode: checkoutState.address.postalCode,
          country: checkoutState.address.country
        },
        checkoutState.paymentMethod
      );

      // If using credit, process credit payment
      if (checkoutState.paymentMethod === 'credit' && isCreditEligible) {
        const cartTotal = state.cart.reduce((total, item) => {
          const price = state.user?.role === 'trade' ? item.product.tradePrice : item.product.retailPrice;
          return total + price * item.quantity;
        }, 0);
        
        await useCreditForOrder(cartTotal, orderId);
      }
      
      setCheckoutState(prev => ({
        ...prev,
        processing: false,
        orderId
      }));
      
      return orderId;
    } catch (error) {
      setCheckoutState(prev => ({ ...prev, processing: false }));
      throw error;
    }
  }, [checkoutState, placeOrder, useCreditForOrder, isCreditEligible, state.cart, state.user]);

  const canProceed = useCallback(() => {
    switch (checkoutState.step) {
      case 'address':
        return checkoutState.address.street && checkoutState.address.postalCode;
      case 'delivery':
        return checkoutState.deliverySlot !== null;
      case 'payment':
        return checkoutState.paymentMethod !== '';
      case 'review':
        return true;
      default:
        return false;
    }
  }, [checkoutState]);

  return {
    checkoutState,
    orderTotal: cartTotal,
    nextStep,
    prevStep,
    updateAddress,
    selectDeliverySlot,
    selectPaymentMethod,
    processOrder,
    canProceed: canProceed()
  };
};