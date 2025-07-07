import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { useNavigation } from '../context/NavigationContext';

export const useProduct = (initialProduct?: Product | null) => {
  const { state, addToCart } = useApp();
  const { hideNavigation, showNavigation } = useNavigation();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialProduct || null);

  const isLoggedIn = !!state.user;
  
  // Calculate price based on user role
  const getPrice = useCallback((product: Product) => {
    return state.user?.role === 'trade' ? product.tradePrice : product.retailPrice;
  }, [state.user?.role]);
  
  // Calculate savings for trade accounts
  const getSavings = useCallback((product: Product) => {
    return state.user?.role === 'trade' ? product.retailPrice - product.tradePrice : 0;
  }, [state.user?.role]);
  
  // Handle adding to cart with animations and feedback
  const handleAddToCart = useCallback((product: Product, qty: number = 1) => {
    if (!isLoggedIn || isAdding || product.stock <= 0) return;
    
    setIsAdding(true);
    
    // Haptic feedback for mobile devices
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    setTimeout(() => {
      addToCart(product, qty);
      setIsAdding(false);
      setJustAdded(true);
      
      setTimeout(() => {
        setJustAdded(false);
      }, 2000);
    }, 600);
  }, [isLoggedIn, isAdding, addToCart]);
  
  // Toggle product as favorite
  const toggleFavorite = useCallback(() => {
    setIsFavorite(prev => !prev);
    
    if (!isFavorite && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [isFavorite]);
  
  // Open product detail modal
  const openProductDetail = useCallback((product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    hideNavigation();
  }, [hideNavigation]);
  
  // Close product detail modal
  const closeProductDetail = useCallback(() => {
    setSelectedProduct(null);
    showNavigation();
  }, [showNavigation]);
  
  // Share product
  const shareProduct = useCallback((product: Product) => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} on EASI`,
        url: window.location.href
      }).catch(err => console.log('Error sharing', err));
    }
  }, []);

  return {
    quantity,
    setQuantity,
    isFavorite,
    isAdding,
    justAdded,
    selectedProduct,
    isLoggedIn,
    getPrice,
    getSavings,
    handleAddToCart,
    toggleFavorite,
    openProductDetail,
    closeProductDetail,
    shareProduct
  };
};