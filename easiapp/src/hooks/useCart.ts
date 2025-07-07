import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { CartSummary, CartAnimationState } from '../types/cart';

export const useCart = () => {
  const { state, dispatch, getCartTotal, getCartItemCount } = useApp();
  const [animationState, setAnimationState] = useState<CartAnimationState>({
    removingItems: new Set(),
    addingItem: null,
    showSuccess: false
  });

  const cartSummary: CartSummary = {
    subtotal: getCartTotal(),
    delivery: 0, // Free delivery
    discount: 0,
    total: getCartTotal(),
    itemCount: getCartItemCount()
  };

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      // Start removal animation
      setAnimationState(prev => ({
        ...prev,
        removingItems: new Set([...prev.removingItems, productId])
      }));
      
      setTimeout(() => {
        dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
        setAnimationState(prev => ({
          ...prev,
          removingItems: new Set([...prev.removingItems].filter(id => id !== productId))
        }));
      }, 200);
    } else {
      dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { productId, quantity } });
    }
  }, [dispatch]);

  const removeItem = useCallback((productId: string) => {
    setAnimationState(prev => ({
      ...prev,
      removingItems: new Set([...prev.removingItems, productId]),
      showSuccess: true
    }));
    
    setTimeout(() => {
      setAnimationState(prev => ({ ...prev, showSuccess: false }));
    }, 1600);
    
    setTimeout(() => {
      dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
      setAnimationState(prev => ({
        ...prev,
        removingItems: new Set([...prev.removingItems].filter(id => id !== productId))
      }));
    }, 200);
  }, [dispatch]);

  const addToCart = useCallback((product: any, quantity: number = 1) => {
    setAnimationState(prev => ({ ...prev, addingItem: product.id }));
    
    dispatch({ type: 'ADD_TO_CART', payload: { product, quantity } });
    
    setTimeout(() => {
      setAnimationState(prev => ({ ...prev, addingItem: null }));
    }, 800);
  }, [dispatch]);

  return {
    cart: state.cart,
    cartSummary,
    animationState,
    updateQuantity,
    removeItem,
    addToCart,
    user: state.user
  };
};