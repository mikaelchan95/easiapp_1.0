import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../context/NotificationContext';
import NotificationItem from '../components/Notifications/NotificationItem';
import NotificationFilters from '../components/Notifications/NotificationFilters';
import { NotificationData, NotificationType } from '../types/notification';
import { SafeAreaView } from 'react-native-safe-area-context';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
    hasMore,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<NotificationType | 'all'>(
    'all'
  );
  const [filteredNotifications, setFilteredNotifications] = useState<
    NotificationData[]
  >([]);

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredNotifications(notifications);
    } else {
      setFilteredNotifications(
        notifications.filter(n => n.type === activeFilter)
      );
    }
  }, [notifications, activeFilter]);

  const handleNotificationPress = (notification: NotificationData) => {
    if (notification.status === 'unread') {
      markAsRead(notification.id);
    }

    // Handle deep linking based on type
    if (notification.metadata?.orderId) {
      // Navigate to order details
      // navigation.navigate('OrderDetails', { orderId: notification.metadata.orderId });
      // Assuming specific route names, update as needed
    }
    // Add other navigations here
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead} disabled={unreadCount === 0}>
          <Text
            style={[
              styles.markAllRead,
              unreadCount === 0 && styles.disabledText,
            ]}
          >
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>
      <NotificationFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={64} color="#3A3A3C" />
      <Text style={styles.emptyStateTitle}>No Notifications</Text>
      <Text style={styles.emptyStateText}>
        You're all caught up! Check back later for updates.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      <FlatList
        data={filteredNotifications}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={handleNotificationPress}
          />
        )}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshNotifications}
            tintColor="#FFFFFF"
          />
        }
        onEndReached={loadMoreNotifications}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        ListFooterComponent={
          hasMore && filteredNotifications.length > 0 ? (
            <ActivityIndicator style={{ padding: 20 }} color="#8E8E93" />
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  markAllRead: {
    fontSize: 14,
    color: '#0A84FF',
    fontWeight: '600',
  },
  disabledText: {
    color: '#3A3A3C',
  },
  listContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default NotificationsScreen;
