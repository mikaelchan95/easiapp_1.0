import React, { useRef, useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
  FlatList,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import * as Animations from '../../utils/animations';
import { supabaseService, Order } from '../../services/supabaseService';
import { AppContext } from '../../context/AppContext';
import { supabase } from '../../../utils/supabase';
import { HapticFeedback } from '../../utils/haptics';
import { formatFinancialAmount } from '../../utils/formatting';

const { width } = Dimensions.get('window');

const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    date: '2024-01-15',
    status: 'delivered',
    total: 145.99,
    items: [
      {
        id: '1',
        name: 'Macallan 18 Year Old',
        quantity: 1,
        price: 145.99,
        image: 'bottle1',
      },
    ],
    deliveryAddress: '123 Main St, San Francisco, CA',
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    date: '2024-01-20',
    status: 'out_for_delivery',
    total: 289.5,
    items: [
      {
        id: '2',
        name: 'Dom Pérignon 2013',
        quantity: 1,
        price: 189.5,
        image: 'bottle2',
      },
      {
        id: '3',
        name: 'Whiskey Glass Set',
        quantity: 1,
        price: 100.0,
        image: 'glasses',
      },
    ],
    deliveryAddress: '456 Oak Ave, Los Angeles, CA',
    estimatedDelivery: '2024-01-25',
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    date: '2024-01-22',
    status: 'preparing',
    total: 199.99,
    items: [
      {
        id: '4',
        name: 'Macallan 25 Year Old',
        quantity: 1,
        price: 199.99,
        image: 'bottle3',
      },
    ],
    deliveryAddress: '789 Pine St, Seattle, WA',
    estimatedDelivery: '2024-01-28',
  },
];

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Orders', icon: 'list-outline' },
  { id: 'delivered', label: 'Delivered', icon: 'checkmark-circle-outline' },
  {
    id: 'out_for_delivery',
    label: 'Out for Delivery',
    icon: 'airplane-outline',
  },
  { id: 'preparing', label: 'Preparing', icon: 'time-outline' },
  { id: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' },
];

export default function OrderHistoryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useContext(AppContext);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Load orders on component mount and set up real-time subscription
  useEffect(() => {
    loadOrders();

    // Set up real-time subscription for order updates
    let orderSubscription: any = null;

    if (state.user) {
      console.log(
        '🔔 Setting up real-time order subscription for history screen'
      );
      orderSubscription = supabaseService.subscribeToUserOrders(
        state.user.id,
        updatedOrders => {
          console.log(
            '📦 Real-time order update in history:',
            updatedOrders.length,
            'orders'
          );
          setOrders(updatedOrders);
          // Apply current filters to the updated orders
          let filtered = updatedOrders;
          if (selectedFilter !== 'all') {
            filtered = filtered.filter(
              order => order.status === selectedFilter
            );
          }
          if (searchQuery) {
            filtered = filtered.filter(
              order =>
                order.orderNumber
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                order.items.some(item =>
                  item.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
          }
          setFilteredOrders(filtered);
        }
      );
    }

    // Cleanup subscription on unmount
    return () => {
      if (orderSubscription) {
        console.log('🧽 Cleaning up order history subscription');
        supabase.removeChannel(orderSubscription);
      }
    };
  }, [state.user?.id]);

  // Load orders from database
  const loadOrders = async () => {
    try {
      setLoading(true);
      // Use context user (now live user) or try to get from Supabase
      const currentUser =
        state.user || (await supabaseService.getCurrentUser());
      if (currentUser) {
        console.log('📋 Loading orders for user:', currentUser.name);
        const userOrders = await supabaseService.getUserOrders(currentUser.id);
        setOrders(userOrders);
        setFilteredOrders(userOrders);
      } else {
        console.log('⚠️ No user found for loading orders');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut,
      }),
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Filter orders based on search and filter
    let filtered = orders;

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(order => order.status === selectedFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        order =>
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.items.some(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    setFilteredOrders(filtered);
  }, [searchQuery, selectedFilter, orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return '#4CAF50';
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
      case 'cancelled':
        return '#F44336';
      case 'returned':
        return '#607D8B';
      default:
        return COLORS.inactive;
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
      case 'cancelled':
        return 'close-circle';
      case 'returned':
        return 'return-up-back';
      default:
        return 'help-circle';
    }
  };

  const handleOrderPress = (order: Order) => {
    navigation.navigate('OrderDetails', { orderId: order.id });
  };

  const handleReorder = (order: Order) => {
    // Clear current cart and add order items back to cart
    console.log('Reordering:', order.orderNumber);

    // Clear current cart first
    dispatch({ type: 'CLEAR_CART' });

    // Add each item from the order to the cart
    order.items.forEach(item => {
      dispatch({
        type: 'ADD_TO_CART',
        payload: {
          product: {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            retailPrice: item.price,
            tradePrice: item.price * 0.9, // Assume 10% trade discount
            stockQuantity: 999, // Assume in stock
            description: `Reordered: ${item.name}`,
            category: 'Reorder',
            isAvailable: true,
          },
          quantity: item.quantity,
        },
      });
    });

    // Navigate to cart to show the recreated cart
    navigation.navigate('Main', { screen: 'Cart' });

    // Show success feedback
    HapticFeedback.success();
  };

  const handleTrackOrder = (order: Order) => {
    navigation.navigate('OrderTracking', { orderId: order.id });
  };

  const renderFilterButton = (filter: any) => {
    const isSelected = selectedFilter === filter.id;

    return (
      <TouchableOpacity
        key={filter.id}
        style={[styles.filterButton, isSelected && styles.filterButtonSelected]}
        onPress={() => setSelectedFilter(filter.id)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Filter by ${filter.label}`}
      >
        <Ionicons
          name={filter.icon as any}
          size={16}
          color={isSelected ? COLORS.accent : COLORS.inactive}
        />
        <Text
          style={[
            styles.filterButtonText,
            isSelected && styles.filterButtonTextSelected,
          ]}
        >
          {filter.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderOrderCard = ({
    item: order,
    index,
  }: {
    item: Order;
    index: number;
  }) => {
    const statusColor = getStatusColor(order.status);
    const statusIcon = getStatusIcon(order.status);

    return (
      <Animated.View
        style={[
          styles.orderCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.orderCardTouchable}
          onPress={() => handleOrderPress(order)}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Order ${order.orderNumber} details`}
        >
          {/* Header */}
          <View style={styles.orderHeader}>
            <View style={styles.orderHeaderLeft}>
              <Text style={styles.orderNumber}>{order.orderNumber}</Text>
              <Text style={styles.orderDate}>
                {new Date(order.date).toLocaleDateString()}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${statusColor}15` },
              ]}
            >
              <Ionicons
                name={statusIcon as any}
                size={16}
                color={statusColor}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Text>
            </View>
          </View>

          {/* Items Summary */}
          <View style={styles.itemsSection}>
            <Text style={styles.itemsTitle}>
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </Text>
            {order.items.slice(0, 2).map((item, idx) => (
              <Text key={idx} style={styles.itemName} numberOfLines={1}>
                {item.quantity}x {item.name}
              </Text>
            ))}
            {order.items.length > 2 && (
              <Text style={styles.moreItems}>
                +{order.items.length - 2} more
              </Text>
            )}
          </View>

          {/* Total and Actions */}
          <View style={styles.orderFooter}>
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>
                {formatFinancialAmount(order.total)}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.trackButton]}
                  onPress={() => handleTrackOrder(order)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Track order"
                >
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={COLORS.primary}
                  />
                  <Text style={styles.trackButtonText}>Track</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.reorderButton]}
                onPress={() => handleReorder(order)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Reorder items"
              >
                <Ionicons
                  name="refresh-outline"
                  size={16}
                  color={COLORS.accent}
                />
                <Text style={styles.reorderButtonText}>Reorder</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Estimated Delivery */}
          {order.estimatedDelivery && order.status !== 'delivered' && (
            <View style={styles.deliveryInfo}>
              <Ionicons name="time-outline" size={14} color={COLORS.inactive} />
              <Text style={styles.deliveryText}>
                Est. delivery:{' '}
                {new Date(order.estimatedDelivery).toLocaleDateString()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color={COLORS.inactive} />
      <Text style={styles.emptyStateTitle}>No Orders Found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery || selectedFilter !== 'all'
          ? 'Try adjusting your search or filters'
          : 'Start shopping to see your orders here'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={[styles.statusBarSpacer, { height: insets.top }]} />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Order History</Text>
          <Text style={styles.headerSubtitle}>
            {filteredOrders.length} orders
          </Text>
        </View>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchSection,
          {
            opacity: searchAnim,
            transform: [
              {
                translateY: searchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.searchContainer,
            isSearchFocused && styles.searchContainerFocused,
          ]}
        >
          <Ionicons name="search-outline" size={20} color={COLORS.inactive} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders or items..."
            placeholderTextColor={COLORS.inactive}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            accessible={true}
            accessibilityLabel="Search orders"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={20} color={COLORS.inactive} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Filter Buttons */}
      <Animated.View style={[styles.filterSection, { opacity: searchAnim }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {FILTER_OPTIONS.map(renderFilterButton)}
        </ScrollView>
      </Animated.View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.ordersList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statusBarSpacer: {
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginRight: SPACING.md,
    ...SHADOWS.light,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchContainerFocused: {
    borderColor: COLORS.primary,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  filterSection: {
    marginBottom: SPACING.lg,
  },
  filterScrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.inactive,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  filterButtonTextSelected: {
    color: COLORS.accent,
  },
  ordersList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  orderCard: {
    marginBottom: SPACING.md,
  },
  orderCardTouchable: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderNumber: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  orderDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  itemsSection: {
    marginBottom: SPACING.md,
  },
  itemsTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  itemName: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
  },
  moreItems: {
    ...TYPOGRAPHY.caption,
    color: COLORS.inactive,
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalSection: {
    flex: 1,
  },
  totalLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
  },
  totalAmount: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    marginLeft: SPACING.sm,
  },
  trackButton: {
    backgroundColor: `${COLORS.primary}15`,
  },
  trackButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  reorderButton: {
    backgroundColor: COLORS.primary,
  },
  reorderButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  deliveryText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.inactive,
    marginLeft: SPACING.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
