import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationData } from '../../types/notification';

interface NotificationItemProps {
  notification: NotificationData;
  onPress: (notification: NotificationData) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
}) => {
  const isUnread = notification.status === 'unread';

  const getIcon = () => {
    switch (notification.type) {
      case 'order_status':
        return 'cube-outline';
      case 'payment':
        return 'card-outline';
      case 'approval':
        return 'checkmark-circle-outline';
      case 'credit_alert':
        return 'alert-circle-outline';
      case 'billing':
        return 'receipt-outline';
      case 'marketing':
        return 'pricetag-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'credit_alert':
      case 'approval':
        return '#FF3B30'; // Red
      case 'order_status':
        return '#007AFF'; // Blue
      case 'payment':
      case 'billing':
        return '#34C759'; // Green
      default:
        return '#8E8E93'; // Gray
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 172800000) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[styles.container, isUnread && styles.unreadContainer]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${getIconColor()}20` },
        ]}
      >
        <Ionicons name={getIcon()} size={24} color={getIconColor()} />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text
            style={[styles.title, isUnread && styles.unreadText]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text style={styles.time}>{formatTime(notification.createdAt)}</Text>
        </View>
        <Text
          style={[styles.message, isUnread && styles.unreadMessage]}
          numberOfLines={2}
        >
          {notification.message}
        </Text>
      </View>
      {isUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#000000', // Assuming dark mode
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  unreadContainer: {
    backgroundColor: '#1C1C1E',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    color: '#8E8E93',
  },
  message: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  unreadMessage: {
    color: '#D1D1D6',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0A84FF',
    alignSelf: 'center',
    marginLeft: 8,
  },
});

export default NotificationItem;
