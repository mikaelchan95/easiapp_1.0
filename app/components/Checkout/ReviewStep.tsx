import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeliveryAddress, DeliverySlot, PaymentMethod } from '../../types/checkout';
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
  total
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
          Please go back and complete all previous steps before reviewing your order.
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <Text style={styles.title}>Review Your Order</Text>
        <Text style={styles.subtitle}>Please confirm all details before placing your order</Text>
        
        {/* Items */}
        <Animated.View 
          style={[
            styles.section,
            {
              transform: [{ scale: cardScaleAnim }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="bag" size={24} color={COLORS.text} />
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>Order Items</Text>
              <Text style={styles.sectionSubtitle}>{cart.length} {cart.length === 1 ? 'item' : 'items'}</Text>
            </View>
          </View>
          
          {cart.map((item, index) => {
            const imageSource = getProductImageSource(item.product.imageUrl, item.product.name);
            return (
              <View key={item.product.id} style={[styles.itemRow, index === cart.length - 1 && styles.lastItemRow]}>
                <Image 
                  source={imageSource || { uri: 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?w=400&h=400&fit=crop' }} 
                  style={styles.itemImage} 
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.product.name}</Text>
                  <Text style={styles.itemMeta}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>{formatFinancialAmount(item.product.price * item.quantity)}</Text>
              </View>
            );
          })}
        </Animated.View>
        
        {/* Delivery Details */}
        <Animated.View 
          style={[
            styles.section,
            {
              transform: [{ scale: cardScaleAnim }]
            }
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
            <Text style={styles.detailText}>
              {address.name}
            </Text>
            <Text style={styles.detailText}>
              {address.street}{address.unit ? `, ${address.unit}` : ''}
            </Text>
            <Text style={styles.detailText}>
              {address.city}, {address.postalCode}
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
              {deliverySlot.queueCount} {deliverySlot.queueCount === 1 ? 'order' : 'orders'} ahead
            </Text>
          </View>
        </View>
        </Animated.View>
        
        {/* Payment Method */}
        <Animated.View 
          style={[
            styles.section,
            {
              transform: [{ scale: cardScaleAnim }]
            }
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
            <Ionicons name={paymentMethod.icon as any} size={20} color="#fff" />
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentName}>{paymentMethod.name}</Text>
            {paymentMethod.id === 'digital_cod' && (
              <Text style={styles.paymentDescription}>Pay on delivery</Text>
            )}
            {paymentMethod.id === 'wallet' && (
              <Text style={styles.paymentDescription}>Payment from digital wallet</Text>
            )}
            {paymentMethod.id === 'credit' && (
              <Text style={styles.paymentDescription}>Added to your credit account</Text>
            )}
            {paymentMethod.id === 'card' && (
              <Text style={styles.paymentDescription}>Will be charged on confirmation</Text>
            )}
          </View>
        </View>
        </Animated.View>
        
        {/* Order Summary */}
        <Animated.View 
          style={[
            styles.summarySection,
            {
              transform: [{ scale: cardScaleAnim }]
            }
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
          <Text style={styles.summaryValue}>{formatFinancialAmount(subtotal)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={styles.summaryValue}>
            {deliveryFee === 0 ? 'FREE' : formatFinancialAmount(deliveryFee)}
          </Text>
        </View>
        
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatFinancialAmount(total)}</Text>
        </View>
        </Animated.View>
        
        {/* Policy Note */}
        <View style={styles.policyNote}>
          <Text style={styles.policyText}>
            By placing your order, you agree to our Terms of Service and Privacy Policy.
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
    padding: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lastItemRow: {
    borderBottomWidth: 0,
  },
  itemImage: {
    width: 60,
    height: 60,
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
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  itemMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  itemPrice: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
    minWidth: 80,
    textAlign: 'right',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.sm,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailText: {
    ...TYPOGRAPHY.caption,
    color: '#666',
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
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: '#FF9800',
  },
  queueText: {
    ...TYPOGRAPHY.caption,
    color: '#666',
    marginTop: 4,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    ...TYPOGRAPHY.h6,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentDescription: {
    ...TYPOGRAPHY.caption,
    color: '#666',
  },
  summarySection: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
    elevation: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  summaryLabel: {
    ...TYPOGRAPHY.caption,
    color: '#666',
  },
  summaryValue: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    ...TYPOGRAPHY.h5,
    fontWeight: '700',
  },
  totalValue: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
  },
  policyNote: {
    marginBottom: 16,
  },
  policyText: {
    ...TYPOGRAPHY.caption,
    color: '#666',
    textAlign: 'center',
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