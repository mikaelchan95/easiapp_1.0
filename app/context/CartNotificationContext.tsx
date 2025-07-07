import React, { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Cart notification context type
export type CartNotificationType = {
  visible: boolean;
  itemCount: number;
  lastItemName?: string;
  showCartNotification: (itemName?: string, quantity?: number) => void;
  hideCartNotification: () => void;
  clearNotificationQueue: () => void;
};

// Create the context with default values
export const CartNotificationContext = createContext<CartNotificationType>({
  visible: false,
  itemCount: 0,
  lastItemName: undefined,
  showCartNotification: () => {},
  hideCartNotification: () => {},
  clearNotificationQueue: () => {},
});

// Provider component
export const CartNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Notification state
  const [notification, setNotification] = useState({
    visible: false,
    itemCount: 0,
    lastItemName: undefined as string | undefined,
  });

  // Refs for batching and debouncing
  const batchTimer = useRef<NodeJS.Timeout | null>(null);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const pendingItems = useRef<Array<{ name?: string; quantity: number }>>([]);
  const isProcessing = useRef(false);

  // Batch window duration (ms) - items added within this window are batched together
  const BATCH_WINDOW = 500;
  // How long to show the notification
  const DISPLAY_DURATION = 3000;

  // Process batched notifications
  const processBatch = useCallback(() => {
    if (pendingItems.current.length === 0) return;

    const totalItems = pendingItems.current.reduce((sum, item) => sum + item.quantity, 0);
    const lastItem = pendingItems.current[pendingItems.current.length - 1];

    // Update notification state
    setNotification({
      visible: true,
      itemCount: totalItems,
      lastItemName: lastItem.name,
    });

    // Clear pending items
    pendingItems.current = [];

    // Set auto-hide timer
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }

    hideTimer.current = setTimeout(() => {
      setNotification(prev => ({
        ...prev,
        visible: false,
      }));
    }, DISPLAY_DURATION);
  }, []);

  // Show notification with batching
  const showCartNotification = useCallback((itemName?: string, quantity: number = 1) => {
    // Add to pending items
    pendingItems.current.push({ name: itemName, quantity });

    // If we're already showing a notification, extend it
    if (notification.visible) {
      // Clear existing hide timer
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }

      // Update current notification immediately
      const totalItems = pendingItems.current.reduce((sum, item) => sum + item.quantity, 0);
      const lastItem = pendingItems.current[pendingItems.current.length - 1];

      setNotification({
        visible: true,
        itemCount: notification.itemCount + totalItems,
        lastItemName: lastItem.name,
      });

      // Clear pending items since we've processed them
      pendingItems.current = [];
      
      // Set new hide timer
      hideTimer.current = setTimeout(() => {
        setNotification(prev => ({
          ...prev,
          visible: false,
        }));
      }, DISPLAY_DURATION);

      return;
    }

    // If not currently showing, start batch timer
    if (batchTimer.current) {
      clearTimeout(batchTimer.current);
    }

    batchTimer.current = setTimeout(() => {
      processBatch();
      batchTimer.current = null;
    }, BATCH_WINDOW);
  }, [notification.visible, notification.itemCount, processBatch]);

  // Hide notification immediately
  const hideCartNotification = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    setNotification(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);
    
  // Clear notification queue
  const clearNotificationQueue = useCallback(() => {
    if (batchTimer.current) {
      clearTimeout(batchTimer.current);
      batchTimer.current = null;
    }
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    pendingItems.current = [];
    setNotification({
      visible: false,
      itemCount: 0,
      lastItemName: undefined,
    });
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimer.current) {
        clearTimeout(batchTimer.current);
      }
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
    }
    };
  }, []);

  // Memoize the context value
  const contextValue = useMemo(() => ({
    visible: notification.visible,
    itemCount: notification.itemCount,
    lastItemName: notification.lastItemName,
    showCartNotification,
    hideCartNotification,
    clearNotificationQueue,
  }), [
    notification.visible,
    notification.itemCount,
    notification.lastItemName,
    showCartNotification, 
    hideCartNotification, 
    clearNotificationQueue,
  ]);

  return (
    <CartNotificationContext.Provider value={contextValue}>
      {children}
    </CartNotificationContext.Provider>
  );
};

export default CartNotificationProvider; 