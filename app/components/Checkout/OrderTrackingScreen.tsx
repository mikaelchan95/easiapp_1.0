import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../types/navigation';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import { supabaseService } from '../../services/supabaseService';

type OrderTrackingRouteProp = RouteProp<RootStackParamList, 'OrderTracking'>;

// Order status mapping
const ORDER_STATUSES = [
  {
    id: 'pending',
    label: 'Order Received',
    icon: 'receipt-outline',
    description: 'Your order has been received and is awaiting confirmation.',
  },
  {
    id: 'confirmed',
    label: 'Order Confirmed',
    icon: 'checkmark-circle-outline',
    description: 'Your order has been confirmed by the store.',
  },
  {
    id: 'preparing',
    label: 'Being Prepared',
    icon: 'cube-outline',
    description: 'We are picking and packing your items.',
  },
  {
    id: 'ready',
    label: 'Ready',
    icon: 'gift-outline',
    description: 'Your order is ready for delivery/pickup.',
  },
  {
    id: 'out_for_delivery',
    label: 'Out for Delivery',
    icon: 'car-outline',
    description: 'Your order is on its way to you.',
  },
  {
    id: 'delivered',
    label: 'Delivered',
    icon: 'checkmark-circle',
    description: 'Your order has been delivered. Enjoy!',
  },
];

const OrderTrackingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<OrderTrackingRouteProp>();
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();

  // Mock order details - in a real app, this would come from an API
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch real order data from Supabase
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderData = await supabaseService.getOrderById(orderId);
        if (orderData) {
          setOrder(orderData);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // Set up real-time order updates
  useEffect(() => {
    if (!order) return;

    const subscription = supabaseService.subscribeToOrderUpdates(
      orderId,
      updatedOrder => {
        setOrder(updatedOrder);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [orderId, order]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContactDriver = () => {
    // In a real app, this would initiate a call
    console.log('Contacting driver for order:', orderId);
  };

  const getCurrentStatusIndex = () => {
    if (!order) return 0;
    return ORDER_STATUSES.findIndex(status => status.id === order.status);
  };

  const currentStatusIndex = getCurrentStatusIndex();

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
        <View style={[styles.statusBarSpacer, { height: insets.top }]} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
        <View style={[styles.statusBarSpacer, { height: insets.top }]} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
      <View style={[styles.statusBarSpacer, { height: insets.top }]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Order ID */}
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>Order Number</Text>
          <Text style={styles.orderId}>{order.orderNumber}</Text>
        </View>

        {/* Status Timeline */}
        {order.status === 'cancelled' ? (
          <View
            style={[
              styles.timelineContainer,
              { borderColor: COLORS.error, borderWidth: 1 },
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Ionicons name="close-circle" size={32} color={COLORS.error} />
              <Text
                style={{
                  ...TYPOGRAPHY.h4,
                  color: COLORS.error,
                  marginLeft: 12,
                  fontWeight: '700',
                }}
              >
                Order Cancelled
              </Text>
            </View>
            <Text style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary }}>
              This order has been cancelled. Please contact support if you
              believe this is a mistake.
            </Text>
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            {ORDER_STATUSES.map((status, index) => {
              const isActive = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;

              return (
                <View key={status.id} style={styles.timelineItem}>
                  <View style={styles.iconColumn}>
                    <View
                      style={[
                        styles.statusIcon,
                        isActive && styles.activeStatusIcon,
                        isCurrent && styles.currentStatusIcon,
                      ]}
                    >
                      <Ionicons
                        name={status.icon as any}
                        size={20}
                        color={isActive ? '#fff' : '#ccc'}
                      />
                    </View>
                    {index < ORDER_STATUSES.length - 1 && (
                      <View
                        style={[
                          styles.connector,
                          index < currentStatusIndex && styles.activeConnector,
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.statusContent}>
                    <Text
                      style={[
                        styles.statusLabel,
                        isActive && styles.activeStatusLabel,
                      ]}
                    >
                      {status.label}
                    </Text>
                    <Text style={styles.statusDescription}>
                      {status.description}
                    </Text>

                    {isCurrent && status.id === 'out_for_delivery' && (
                      <TouchableOpacity
                        style={styles.contactButton}
                        onPress={handleContactDriver}
                      >
                        <Ionicons name="call-outline" size={16} color="#fff" />
                        <Text style={styles.contactButtonText}>
                          Contact Driver
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Delivery Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Delivery Details</Text>

          <View style={styles.detailRow}>
            <Ionicons
              name="time-outline"
              size={20}
              color={COLORS.textSecondary}
            />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Estimated Delivery</Text>
              <View style={styles.deliveryTimeContainer}>
                <Text style={styles.deliveryTimeText}>
                  {order.estimatedDelivery || 'Processing'}
                </Text>
                {order.estimatedDelivery && (
                  <View style={styles.deliveryTimeBadge}>
                    <Ionicons name="flash" size={12} color="#4CAF50" />
                    <Text style={styles.deliveryTimeBadgeText}>On Time</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons
              name="location-outline"
              size={20}
              color={COLORS.textSecondary}
            />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Delivery Address</Text>
              <Text style={styles.detailValue}>{order.deliveryAddress}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons
              name="cube-outline"
              size={20}
              color={COLORS.textSecondary}
            />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>
                Items ({order.items.length})
              </Text>
              {order.items.map(item => (
                <Text key={item.id} style={styles.detailValue}>
                  {item.quantity}x {item.name}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons
              name="card-outline"
              size={20}
              color={COLORS.textSecondary}
            />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Order Total</Text>
              <Text style={styles.detailValue}>${order.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statusBarSpacer: {
    backgroundColor: COLORS.card,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.medium,
    elevation: 6,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  backButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  orderIdContainer: {
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
    elevation: 6,
  },
  orderIdLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  orderId: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1,
  },
  timelineContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
    elevation: 6,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  iconColumn: {
    alignItems: 'center',
    width: 44,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  activeStatusIcon: {
    backgroundColor: '#4CAF50',
  },
  currentStatusIcon: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  connector: {
    width: 3,
    height: 32,
    backgroundColor: COLORS.border,
    marginVertical: 4,
    borderRadius: 1.5,
  },
  activeConnector: {
    backgroundColor: '#4CAF50',
  },
  statusContent: {
    flex: 1,
    paddingLeft: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  statusLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  activeStatusLabel: {
    color: COLORS.text,
  },
  statusDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    fontWeight: '500',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.text,
    borderRadius: 12,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    ...SHADOWS.light,
  },
  contactButtonText: {
    color: COLORS.card,
    ...TYPOGRAPHY.small,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  detailsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
    elevation: 6,
  },
  detailsTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
  },
  detailContent: {
    flex: 1,
    paddingLeft: SPACING.md,
  },
  detailLabel: {
    ...TYPOGRAPHY.small,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  detailValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
    fontWeight: '500',
  },
  deliveryTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deliveryTimeText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '700',
    flex: 1,
  },
  deliveryTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: SPACING.sm,
  },
  deliveryTimeBadgeText: {
    ...TYPOGRAPHY.caption,
    color: '#4CAF50',
    fontWeight: '700',
    marginLeft: 2,
  },
});

export default OrderTrackingScreen;
