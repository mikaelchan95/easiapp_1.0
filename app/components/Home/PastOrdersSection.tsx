import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SHADOWS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  TYPOGRAPHY,
} from '../../utils/theme';
import { HapticFeedback } from '../../utils/haptics';
import { supabaseService, Order } from '../../services/supabaseService';
import { AppContext } from '../../context/AppContext';
import { supabase } from '../../../utils/supabase';
import {
  getProductImageSource,
  getProductFallbackImage,
} from '../../utils/imageUtils';

interface PastOrder {
  id: string;
  orderNumber: string;
  date: string;
  status:
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled'
    | 'returned';
  total: number;
  itemCount: number;
  firstItemName: string;
  firstItemImage?: string;
}

const RECENT_ORDERS: PastOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    date: '2024-01-15',
    status: 'delivered',
    total: 145.99,
    itemCount: 1,
    firstItemName: 'Macallan 18 Year Old',
    firstItemImage:
      'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/macallan-18-sherry-oak.webp',
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    date: '2024-01-20',
    status: 'delivered',
    total: 289.5,
    itemCount: 2,
    firstItemName: 'Dom Pérignon 2013',
    firstItemImage:
      'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/dom-perignon-2013.webp',
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    date: '2024-01-22',
    status: 'out_for_delivery',
    total: 199.99,
    itemCount: 1,
    firstItemName: 'Macallan 25 Year Old',
    firstItemImage:
      'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/macallan-25-sherry-oak.webp',
  },
];

interface PastOrdersSectionProps {
  onOrderPress: (order: PastOrder) => void;
  onViewAll: () => void;
  onReorderPress: (order: PastOrder) => void;
}

export default function PastOrdersSection({
  onOrderPress,
  onViewAll,
  onReorderPress,
}: PastOrdersSectionProps) {
  const { state } = useContext(AppContext);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Load recent orders on component mount and set up real-time subscription
  useEffect(() => {
    loadRecentOrders();

    // Set up real-time subscription for order updates
    let orderSubscription: any = null;

    if (state.user) {
      console.log(
        'Setting up real-time order subscription for past orders section'
      );
      orderSubscription = supabaseService.subscribeToUserOrders(
        state.user.id,
        updatedOrders => {
          console.log(
            '📦 Real-time order update in past orders:',
            updatedOrders.length,
            'orders'
          );
          // Get the 3 most recent orders
          const recentOrders = updatedOrders.slice(0, 3);
          setRecentOrders(recentOrders);
        }
      );
    }

    // Cleanup subscription on unmount
    return () => {
      if (orderSubscription) {
        console.log('Cleaning up past orders subscription');
        supabase.removeChannel(orderSubscription);
      }
    };
  }, [state.user?.id]);

  const loadRecentOrders = async () => {
    try {
      setLoading(true);
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
        if (orders.length > 0) {
          console.log(
            '🏠 First order:',
            orders[0].orderNumber,
            'Items:',
            orders[0].items.length
          );
          if (orders[0].items.length > 0) {
            const firstItem = orders[0].items[0];
            const productName = firstItem?.name || 'Unknown Item';
            const imageSource = getProductImageSource(
              firstItem?.image,
              productName
            );
            const imageUrl = imageSource?.uri || getProductFallbackImage().uri;
            console.log(
              '🏠 First item:',
              productName,
              'Original image:',
              firstItem?.image,
              'Resolved image:',
              imageUrl
            );
          }
        }
        setRecentOrders(orders);
      } else {
        console.log('No user found for loading recent orders');
      }
    } catch (error) {
      console.error('Error loading recent orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderPress = (order: PastOrder) => {
    HapticFeedback.selection();
    onOrderPress(order);
  };

  const handleViewAllPress = () => {
    HapticFeedback.selection();
    onViewAll();
  };

  const handleReorderPress = (order: PastOrder) => {
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
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderOrderCard = (order: PastOrder) => (
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
        {order.firstItemImage ? (
          <Image
            source={{ uri: order.firstItemImage }}
            style={styles.orderImage}
            onError={error => {
              console.log('Image load error:', error);
              // You could set a flag here to show placeholder on error
            }}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="wine" size={24} color={COLORS.textSecondary} />
          </View>
        )}
        {order.itemCount > 1 && (
          <View style={styles.itemCountBadge}>
            <Text style={styles.itemCountText}>+{order.itemCount - 1}</Text>
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
          {order.firstItemName}
          {order.itemCount > 1 && ` +${order.itemCount - 1} more`}
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

  return (
    <View style={styles.container}>
      {/* Section Header - Match ProductSectionCard pattern */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons
            name="receipt"
            size={20}
            color={COLORS.primary}
            style={styles.icon}
          />
          <Text style={styles.title}>Past Orders</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{recentOrders.length}</Text>
          </View>
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
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : recentOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recent orders</Text>
          </View>
        ) : (
          recentOrders.map(order => {
            const firstItem = order.items[0];
            const productName =
              firstItem?.name || firstItem?.product?.name || 'Unknown Item';

            // Use the same image logic as EnhancedProductCard
            const imageSource = getProductImageSource(
              firstItem?.image,
              productName
            );
            const imageUrl = imageSource?.uri || getProductFallbackImage().uri;

            return renderOrderCard({
              id: order.id,
              orderNumber: order.orderNumber,
              date: order.date,
              status: order.status,
              total: order.total,
              itemCount: order.items.length,
              firstItemName: productName,
              firstItemImage: imageUrl,
            });
          })
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
  },

  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },

  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
});
