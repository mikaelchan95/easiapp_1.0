import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from './AuthContext'; // Assuming AuthContext exists
import notificationService from '../services/notificationService';
import {
  NotificationData,
  NotificationSettings,
  NotificationFilters,
} from '../types/notification';

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  isLoading: boolean;
  settings: NotificationSettings | null;
  refreshNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  hasMore: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth(); // Assuming user object with id property
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const appState = useRef(AppState.currentState);
  const offsetRef = useRef(0);
  const LIMIT = 20;

  // Initialize service and load initial data
  useEffect(() => {
    if (user?.id) {
      notificationService.initialize(user.id);
      loadInitialData();

      // Subscribe to real-time updates
      const unsubscribe = notificationService.subscribeToUserNotifications(
        user.id,
        newNotification => {
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      );

      return () => {
        unsubscribe();
        notificationService.unsubscribeAll();
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setSettings(null);
    }
  }, [user?.id]);

  // Handle app foregrounding to refresh unread count
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        user?.id
      ) {
        refreshUnreadCount();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user?.id]);

  const loadInitialData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const [batch, userSettings] = await Promise.all([
        notificationService.getNotifications(user.id, undefined, LIMIT, 0),
        notificationService.getSettings(user.id),
      ]);

      setNotifications(batch.notifications);
      setUnreadCount(batch.unreadCount);
      setHasMore(batch.hasMore);
      setSettings(userSettings);
      offsetRef.current = batch.notifications.length;
    } catch (error) {
      console.error('Error loading notification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUnreadCount = async () => {
    if (!user?.id) return;
    const count = await notificationService.getUnreadCount(user.id);
    setUnreadCount(count);
  };

  const refreshNotifications = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const batch = await notificationService.getNotifications(
        user.id,
        undefined,
        LIMIT,
        0
      );
      setNotifications(batch.notifications);
      setUnreadCount(batch.unreadCount);
      setHasMore(batch.hasMore);
      offsetRef.current = batch.notifications.length;
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const loadMoreNotifications = useCallback(async () => {
    if (!user?.id || !hasMore || isLoading) return;

    // Avoid setting full loading state for pagination to prevent UI flicker
    // Alternatively, use a separate isLoadingMore state
    try {
      const batch = await notificationService.getNotifications(
        user.id,
        undefined,
        LIMIT,
        offsetRef.current
      );

      setNotifications(prev => [...prev, ...batch.notifications]);
      setHasMore(batch.hasMore);
      offsetRef.current += batch.notifications.length;
    } catch (error) {
      console.error('Error loading more notifications:', error);
    }
  }, [user?.id, hasMore, isLoading]);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!user?.id) return;

      // Optimistic update
      setNotifications(prev =>
        prev.map(n =>
          n.id === id
            ? { ...n, status: 'read', readAt: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      await notificationService.markAsRead(user.id, id);
      // Re-sync count to be sure
      refreshUnreadCount();
    },
    [user?.id]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    // Optimistic update
    setNotifications(prev =>
      prev.map(n => ({
        ...n,
        status: 'read',
        readAt: new Date().toISOString(),
      }))
    );
    setUnreadCount(0);

    await notificationService.markAllAsRead(user.id);
  }, [user?.id]);

  const updateSettings = useCallback(
    async (newSettings: Partial<NotificationSettings>) => {
      if (!user?.id) return;

      // Optimistic update
      setSettings(prev => (prev ? { ...prev, ...newSettings } : null));

      const success = await notificationService.updateSettings(
        user.id,
        newSettings
      );
      if (!success) {
        // Revert on failure (could be improved with previous state)
        const current = await notificationService.getSettings(user.id);
        setSettings(current);
      }
    },
    [user?.id]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        settings,
        refreshNotifications,
        loadMoreNotifications,
        markAsRead,
        markAllAsRead,
        updateSettings,
        hasMore,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
};
