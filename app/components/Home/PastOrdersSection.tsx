import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../../utils/theme';
import { HapticFeedback } from '../../utils/haptics';

interface PastOrder {
  id: string;
  orderNumber: string;
  date: string;
  status: 'delivered' | 'processing' | 'shipped';
  total: number;
  itemCount: number;
  firstItemName: string;
  firstItemImage?: any;
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
    firstItemImage: require('../../assets/MAC-2024-18YO-Sherry-Cask-BottleBox-Front-REFLECTION-5000x5000-PNG-300dpi-2xl.webp')
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    date: '2024-01-20',
    status: 'delivered',
    total: 289.50,
    itemCount: 2,
    firstItemName: 'Dom Pérignon 2013',
    firstItemImage: require('../../assets/Dom Perignon 2013 750ml.webp')
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    date: '2024-01-22',
    status: 'shipped',
    total: 199.99,
    itemCount: 1,
    firstItemName: 'Macallan 25 Year Old',
    firstItemImage: require('../../assets/MAC-2024-25YO-Sherry-Oak-BottleBox-Front-REFLECTION-5000x5000-PNG-300dpi-2xl.webp')
  }
];

interface PastOrdersSectionProps {
  onOrderPress: (order: PastOrder) => void;
  onViewAll: () => void;
  onReorderPress: (order: PastOrder) => void;
}

export default function PastOrdersSection({ onOrderPress, onViewAll, onReorderPress }: PastOrdersSectionProps) {
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
      case 'delivered': return COLORS.success;
      case 'shipped': return '#2196F3';
      case 'processing': return '#FF9800';
      default: return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return 'checkmark-circle';
      case 'shipped': return 'airplane';
      case 'processing': return 'time';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
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
          <Image source={order.firstItemImage} style={styles.orderImage} />
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
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}15` }]}>
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
          <Text style={styles.orderDate}>
            {formatDate(order.date)}
          </Text>
          <Text style={styles.orderTotal}>
            ${order.total.toFixed(2)}
          </Text>
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
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="receipt" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Past Orders</Text>
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
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ordersContainer}
        style={styles.ordersScrollView}
      >
        {RECENT_ORDERS.map(renderOrderCard)}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.h4,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  viewAllText: {
    fontSize: FONT_SIZES.bodySmall,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  ordersScrollView: {
    marginHorizontal: -SPACING.md,
  },
  ordersContainer: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  orderCard: {
    width: 280,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
    ...SHADOWS.light,
  },
  orderImageContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  orderImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  placeholderImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  itemCountText: {
    fontSize: FONT_SIZES.tiny,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.card,
  },
  orderInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: SPACING.xs,
  },
  orderItemName: {
    fontSize: FONT_SIZES.label,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    fontSize: FONT_SIZES.label,
    color: COLORS.textSecondary,
  },
  orderTotal: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  reorderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
}); 