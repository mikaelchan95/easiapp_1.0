import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { HapticFeedback } from '../../utils/haptics';
import { supabaseService, Order } from '../../services/supabaseService';
import { AppContext } from '../../context/AppContext';
import { supabase } from '../../../utils/supabase';
import {
  getProductImageSource,
  getProductFallbackImage,
} from '../../utils/imageUtils';

interface PastOrdersSectionProps {
  onOrderPress: (order: Order) => void;
  onViewAll: () => void;
  onReorderPress: (order: Order) => void;
}

export default function PastOrdersSection({
  onOrderPress,
  onViewAll,
  onReorderPress,
}: PastOrdersSectionProps) {
  const { state } = useContext(AppContext);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load recent orders on component mount and set up real-time subscription
  useEffect(() => {
    console.log('🏠 PastOrdersSection mounted');
    loadRecentOrders();

    // Set up real-time subscription for order updates
    let orderSubscription: any = null;

    if (state.user) {
      console.log(
        '🏠 Setting up real-time order subscription for past orders section',
        state.user.id
      );
      try {
        orderSubscription = supabaseService.subscribeToUserOrders(
          state.user.id,
          updatedOrders => {
            console.log(
              '📦 Real-time order update in past orders:',
              updatedOrders.length,
              'orders'
            );
            // Get the 3 most recent orders
            const recent = updatedOrders.slice(0, 3);
            setRecentOrders(recent);
          }
        );
      } catch (err) {
        console.error('🏠 Error setting up subscription:', err);
      }
    }

    // Cleanup subscription on unmount
    return () => {
      if (orderSubscription) {
        console.log('🏠 Cleaning up past orders subscription');
        supabase.removeChannel(orderSubscription);
      }
    };
  }, [state.user?.id]);

  const loadRecentOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use context user (now live user) or try to get from Supabase
      const currentUser =
        state.user || (await supabaseService.getCurrentUser());

      if (currentUser) {
        console.log(
          '🏠 Loading recent orders for user:',
          currentUser.name,
          'ID:',
          currentUser.id
        );
        const orders = await supabaseService.getRecentOrders(currentUser.id, 3);
        console.log('🏠 Recent orders loaded:', orders.length, 'orders');
        setRecentOrders(orders);
      } else {
        console.log('🏠 No user found for loading recent orders');
        setRecentOrders([]);
      }
    } catch (error) {
      console.error('🏠 Error loading recent orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderPress = (order: Order) => {
    HapticFeedback.selection();
    onOrderPress(order);
  };

  const handleViewAllPress = () => {
    HapticFeedback.selection();
    onViewAll();
  };

  const handleReorderPress = (order: Order) => {
    HapticFeedback.light();
    onReorderPress(order);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return COLORS.success;
      case 'out_for_delivery':
        return '#2196F3';
      case 'preparing':
        return '#FF9800';
      case 'confirmed':
        return '#4CAF50';
      case 'ready':
        return '#9C27B0';
      case 'pending':
        return '#795548';
      case 'returned':
        return '#607D8B';
      case 'cancelled':
        return '#F44336';
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'checkmark-circle';
      case 'out_for_delivery':
        return 'airplane';
      case 'preparing':
        return 'time';
      case 'confirmed':
        return 'checkmark-circle';
      case 'ready':
        return 'cube';
      case 'pending':
        return 'hourglass';
      case 'returned':
        return 'return-up-back';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatPrice = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderOrderCard = (order: Order) => {
    // Get first item for display
    const firstItem =
      order.items && order.items.length > 0 ? order.items[0] : null;
    const productName = firstItem?.name || 'Unknown Item';
    const otherItemsCount = Math.max(0, (order.items?.length || 0) - 1);

    // Resolve image
    const imageSource = getProductImageSource(firstItem?.image, productName);
    const imageUrl = imageSource?.uri || getProductFallbackImage().uri;

    return (
      <TouchableOpacity
        key={order.id}
        style={styles.orderCard}
        onPress={() => handleOrderPress(order)}
        activeOpacity={0.8}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Order ${order.orderNumber} details`}
      >
        {/* Product Image */}
        <View style={styles.orderImageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.orderImage}
            onError={error => {
              console.log(
                'Image load error for order item:',
                productName,
                error
              );
            }}
          />
          {otherItemsCount > 0 && (
            <View style={styles.itemCountBadge}>
              <Text style={styles.itemCountText}>+{otherItemsCount}</Text>
            </View>
          )}
        </View>

        {/* Order Info */}
        <View style={styles.orderInfo}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber} numberOfLines={1}>
              {order.orderNumber}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusColor(order.status)}15` },
              ]}
            >
              <Ionicons
                name={getStatusIcon(order.status) as any}
                size={12}
                color={getStatusColor(order.status)}
              />
            </View>
          </View>

          <Text style={styles.orderItemName} numberOfLines={1}>
            {productName}
            {otherItemsCount > 0 && ` +${otherItemsCount} more`}
          </Text>

          <View style={styles.orderFooter}>
            <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
            <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
          </View>
        </View>

        {/* Reorder Button */}
        <TouchableOpacity
          style={styles.reorderButton}
          onPress={() => handleReorderPress(order)}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Reorder items"
        >
          <Ionicons name="refresh" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (!state.user && !loading && recentOrders.length === 0) {
    return null; // Don't show if not logged in and no orders
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons
            name="receipt"
            size={20}
            color={COLORS.primary}
            style={styles.icon}
          />
          <Text style={styles.title}>Past Orders</Text>
          {recentOrders.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{recentOrders.length}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={handleViewAllPress}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="View all orders"
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ordersContainer}
        style={styles.ordersScrollView}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.errorText}>Could not load orders</Text>
            <TouchableOpacity
              onPress={loadRecentOrders}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : recentOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recent orders</Text>
          </View>
        ) : (
          recentOrders.map(order => renderOrderCard(order))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: SPACING.element,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  countBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '10',
    minWidth: 80,
    justifyContent: 'center',
  },
  viewAllText: {
    ...TYPOGRAPHY.button,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 4,
  },
  ordersScrollView: {
    // Remove negative margin to align with other sections
  },
  ordersContainer: {
    paddingLeft: SPACING.md,
    paddingRight: SPACING.element,
  },
  orderCard: {
    width: 320,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.light,
  },
  orderImageContainer: {
    position: 'relative',
    marginRight: SPACING.lg,
  },
  orderImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  placeholderImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemCountBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  itemCountText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.card,
  },
  orderInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderNumber: {
    ...TYPOGRAPHY.h4,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: SPACING.sm,
  },
  orderItemName: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  orderTotal: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.text,
  },
  reorderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  retryButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  retryText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
