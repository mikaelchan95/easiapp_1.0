import React, { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Cart notification context type
export type CartNotificationType = {
  visible: boolean;
  itemName?: string;
  showCartNotification: (itemName?: string) => void;
  hideCartNotification: () => void;
  purchaseStreak: number;
  increasePurchaseStreak: () => void;
  resetPurchaseStreak: () => void;
  showAnimation: boolean;
  animationType: 'standard' | 'streak' | 'levelUp';
  setAnimationType: (type: 'standard' | 'streak' | 'levelUp') => void;
};

// Create the context with default values
export const CartNotificationContext = createContext<CartNotificationType>({
  visible: false,
  itemName: undefined,
  showCartNotification: () => {},
  hideCartNotification: () => {},
  purchaseStreak: 0,
  increasePurchaseStreak: () => {},
  resetPurchaseStreak: () => {},
  showAnimation: false,
  animationType: 'standard',
  setAnimationType: () => {},
});

// Provider component
export const CartNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Notification state (single object to prevent partial updates)
  const [cartNotification, setCartNotification] = useState({
    visible: false,
    itemName: undefined as string | undefined,
  });

  // Animation state
  const [purchaseStreak, setPurchaseStreak] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<'standard' | 'streak' | 'levelUp'>('standard');
  
  // Refs for debouncing
  const pendingNotificationTimer = useRef<NodeJS.Timeout | null>(null);
  const pendingHideTimer = useRef<NodeJS.Timeout | null>(null);
  const isNotificationBusy = useRef(false);

  // Auto-hide notification after a delay
  useEffect(() => {
    if (cartNotification.visible) {
      // Clear any pending hide timer
      if (pendingHideTimer.current) {
        clearTimeout(pendingHideTimer.current);
        pendingHideTimer.current = null;
      }
      
      // Set new hide timer
      pendingHideTimer.current = setTimeout(() => {
        hideCartNotification();
        pendingHideTimer.current = null;
      }, 3000);
    }
    
    return () => {
      if (pendingHideTimer.current) {
        clearTimeout(pendingHideTimer.current);
        pendingHideTimer.current = null;
      }
    };
  }, [cartNotification.visible]);

  // Auto-hide animation after a delay
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (showAnimation) {
      timer = setTimeout(() => {
        setShowAnimation(false);
      }, 2000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showAnimation]);

  // Update animation type based on streak value
  useEffect(() => {
    if (purchaseStreak > 0 && purchaseStreak % 3 === 0) {
      setAnimationType('streak');
    } else {
      setAnimationType('standard');
    }
  }, [purchaseStreak]);

  // Memoized functions to prevent unnecessary rerenders
  
  // Hide notification with debounce
  const hideCartNotification = useCallback(() => {
    // If we're already processing a notification change, defer this
    if (isNotificationBusy.current) {
      if (pendingHideTimer.current) {
        clearTimeout(pendingHideTimer.current);
      }
      
      pendingHideTimer.current = setTimeout(() => {
        hideCartNotification();
      }, 50);
      return;
    }
    
    isNotificationBusy.current = true;
    
    // Clear any pending notification timer
    if (pendingNotificationTimer.current) {
      clearTimeout(pendingNotificationTimer.current);
      pendingNotificationTimer.current = null;
    }
    
    setCartNotification({
      visible: false,
      itemName: undefined,
    });
    
    // Reset busy flag after a small delay
    setTimeout(() => {
      isNotificationBusy.current = false;
    }, 50);
  }, []);
  
  // Safely increment streak counter
  const increasePurchaseStreak = useCallback(() => {
    setPurchaseStreak(prev => prev + 1);
  }, []);
  
  // Reset streak counter
  const resetPurchaseStreak = useCallback(() => {
    setPurchaseStreak(0);
    setAnimationType('standard');
  }, []);

  // Show notification with debounce
  const showCartNotification = useCallback((itemName?: string) => {
    // If we're already showing a notification, queue this one
    if (isNotificationBusy.current) {
      if (pendingNotificationTimer.current) {
        clearTimeout(pendingNotificationTimer.current);
      }
      
      pendingNotificationTimer.current = setTimeout(() => {
        showCartNotification(itemName);
      }, 50);
      return;
    }
    
    isNotificationBusy.current = true;
    
    // Hide any existing notification first
    if (cartNotification.visible) {
      setCartNotification({
        visible: false,
        itemName: undefined,
      });
      
      // Short delay before showing the new notification
      setTimeout(() => {
        setCartNotification({
          visible: true,
          itemName,
        });
        
        // Show animation feedback
        setShowAnimation(true);
        
        // Auto-increment purchase streak
        setPurchaseStreak(prev => prev + 1);
        
        // Reset busy flag
        setTimeout(() => {
          isNotificationBusy.current = false;
        }, 50);
      }, 100);
    } else {
      // Show immediately if no notification is visible
      setCartNotification({
        visible: true,
        itemName,
      });
      
      // Show animation feedback
      setShowAnimation(true);
      
      // Auto-increment purchase streak
      setPurchaseStreak(prev => prev + 1);
      
      // Reset busy flag
      setTimeout(() => {
        isNotificationBusy.current = false;
      }, 50);
    }
  }, [cartNotification.visible]);

  // Memoize setAnimationType
  const handleSetAnimationType = useCallback((type: 'standard' | 'streak' | 'levelUp') => {
    setAnimationType(type);
  }, []);

  // Memoize the entire context value
  const contextValue = useMemo(() => ({
    ...cartNotification,
    showCartNotification,
    hideCartNotification,
    purchaseStreak,
    increasePurchaseStreak,
    resetPurchaseStreak,
    showAnimation,
    animationType,
    setAnimationType: handleSetAnimationType,
  }), [
    cartNotification, 
    showCartNotification, 
    hideCartNotification, 
    purchaseStreak, 
    increasePurchaseStreak, 
    resetPurchaseStreak, 
    showAnimation, 
    animationType, 
    handleSetAnimationType
  ]);

  return (
    <CartNotificationContext.Provider value={contextValue}>
      {children}
    </CartNotificationContext.Provider>
  );
};

export default CartNotificationProvider; 