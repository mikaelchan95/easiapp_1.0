import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DeliveryAddress,
  DeliverySlot,
  PaymentMethod,
} from '../../types/checkout';
import { TYPOGRAPHY, COLORS, SPACING, SHADOWS } from '../../utils/theme';
import { formatFinancialAmount } from '../../utils/formatting';
import { getProductImageSource } from '../../utils/imageUtils';

interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: any;
  };
  quantity: number;
}

interface ReviewStepProps {
  cart: CartItem[];
  address: DeliveryAddress;
  deliverySlot: DeliverySlot | null;
  paymentMethod: PaymentMethod | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  onPlaceOrder: () => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  cart,
  address,
  deliverySlot,
  paymentMethod,
  subtotal,
  deliveryFee,
  total,
}) => {
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const cardScaleAnim = useState(new Animated.Value(0.95))[0];

  // Mount animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.stagger(100, [
        Animated.spring(cardScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }),
      ]),
    ]).start();
  }, []);
  if (!deliverySlot || !paymentMethod) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#F44336" />
        <Text style={styles.errorTitle}>Incomplete Information</Text>
        <Text style={styles.errorText}>
          Please go back and complete all previous steps before reviewing your
          order.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Items */}
        <Animated.View
          style={[
            styles.section,
            {
              transform: [{ scale: cardScaleAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="bag" size={24} color={COLORS.text} />
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>Order Items</Text>
              <Text style={styles.sectionSubtitle}>
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>

          {cart.map((item, index) => {
            const imageSource = getProductImageSource(
              item.product.imageUrl,
              item.product.name
            );
            return (
              <View
                key={item.product.id}
                style={[
                  styles.itemRow,
                  index === cart.length - 1 && styles.lastItemRow,
                ]}
              >
                <Image
                  source={
                    imageSource || {
                      uri: 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?w=400&h=400&fit=crop',
                    }
                  }
                  style={styles.itemImage}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.product.name}</Text>
                  <Text style={styles.itemMeta}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  {formatFinancialAmount(item.product.price * item.quantity)}
                </Text>
              </View>
            );
          })}
        </Animated.View>

        {/* Delivery Details */}
        <Animated.View
          style={[
            styles.section,
            {
              transform: [{ scale: cardScaleAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="location" size={24} color={COLORS.text} />
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>Delivery Details</Text>
              <Text style={styles.sectionSubtitle}>Address and timing</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="location" size={20} color="#1a1a1a" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailText}>{address.name}</Text>
              <Text style={styles.detailText}>
                {address.address}
                {address.unitNumber ? `, ${address.unitNumber}` : ''}
              </Text>
              <Text style={styles.detailText}>
                Singapore {address.postalCode}
              </Text>
              <Text style={styles.detailText}>{address.phone}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar" size={20} color="#1a1a1a" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Delivery Date</Text>
              <Text style={styles.detailText}>{deliverySlot.date}</Text>
              <View style={styles.badgeContainer}>
                {deliverySlot.sameDayAvailable && (
                  <View style={styles.sameDayBadge}>
                    <Text style={styles.sameDayText}>Same Day</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="time" size={20} color="#1a1a1a" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Time Slot</Text>
              <Text style={styles.detailText}>{deliverySlot.timeSlot}</Text>
              <Text style={styles.queueText}>
                {deliverySlot.queueCount}{' '}
                {deliverySlot.queueCount === 1 ? 'order' : 'orders'} ahead
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Payment Method */}
        <Animated.View
          style={[
            styles.section,
            {
              transform: [{ scale: cardScaleAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="card" size={24} color={COLORS.text} />
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <Text style={styles.sectionSubtitle}>How you'll pay</Text>
            </View>
          </View>

          <View style={styles.paymentRow}>
            <View style={styles.paymentIconContainer}>
              <Ionicons
                name={paymentMethod.icon as any}
                size={20}
                color="#fff"
              />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>{paymentMethod.name}</Text>
              {paymentMethod.id === 'digital_cod' && (
                <Text style={styles.paymentDescription}>Pay on delivery</Text>
              )}
              {paymentMethod.id === 'wallet' && (
                <Text style={styles.paymentDescription}>
                  Payment from digital wallet
                </Text>
              )}
              {paymentMethod.id === 'credit' && (
                <Text style={styles.paymentDescription}>
                  Added to your credit account
                </Text>
              )}
              {paymentMethod.id === 'card' && (
                <Text style={styles.paymentDescription}>
                  Will be charged on confirmation
                </Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Order Summary */}
        <Animated.View
          style={[
            styles.summarySection,
            {
              transform: [{ scale: cardScaleAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="receipt" size={24} color={COLORS.text} />
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <Text style={styles.sectionSubtitle}>Total breakdown</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {formatFinancialAmount(subtotal)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>
              {deliveryFee === 0 ? 'FREE' : formatFinancialAmount(deliveryFee)}
            </Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatFinancialAmount(total)}
            </Text>
          </View>
        </Animated.View>

        {/* Policy Note */}
        <View style={styles.policyNote}>
          <Text style={styles.policyText}>
            By placing your order, you agree to our Terms of Service and Privacy
            Policy.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  sectionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeaderContent: {
    flex: 1,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lastItemRow: {
    borderBottomWidth: 0,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: SPACING.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  itemMeta: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  itemPrice: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
    minWidth: 80,
    textAlign: 'right',
    letterSpacing: -0.3,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    ...TYPOGRAPHY.small,
    fontWeight: '700',
    marginBottom: 4,
    color: COLORS.text,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  detailText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  sameDayBadge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sameDayText: {
    ...TYPOGRAPHY.small,
    fontWeight: '700',
    color: '#FF9800',
    letterSpacing: 0.3,
  },
  queueText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    marginBottom: 4,
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  paymentDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  summarySection: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  summaryLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  summaryValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    marginTop: SPACING.xs,
  },
  totalLabel: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  totalValue: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  policyNote: {
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm,
  },
  policyText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: '#666',
    textAlign: 'center',
  },
});

export default ReviewStep;
