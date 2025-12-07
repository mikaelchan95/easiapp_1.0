/**
 * UnifiedCheckoutScreen - Single-page checkout with collapsible sections
 *
 * Architecture:
 * - Single scrollable page with 4 collapsible sections
 * - Sticky footer with running total and CTA
 * - Progressive disclosure: sections expand on tap, auto-collapse when complete
 * - Real-time validation feedback
 */
import React, {
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AppContext, getUserRole } from '../../context/AppContext';
import { useCheckout } from '../../context/CheckoutContext';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import { formatFinancialAmount } from '../../utils/formatting';
import { calculateOrderTotal } from '../../utils/pricing';
import { HapticFeedback } from '../../utils/haptics';
import { supabaseService } from '../../services/supabaseService';
import {
  DeliveryAddress,
  DeliverySlot,
  PaymentMethod,
} from '../../types/checkout';

// Section Components
import CheckoutAddressSection from './sections/CheckoutAddressSection';
import CheckoutDeliverySection from './sections/CheckoutDeliverySection';
import CheckoutPaymentSection from './sections/CheckoutPaymentSection';
import CheckoutSummarySection from './sections/CheckoutSummarySection';

type SectionKey = 'address' | 'delivery' | 'payment' | 'summary';

interface SectionState {
  isExpanded: boolean;
  isComplete: boolean;
  isValid: boolean;
}

export default function UnifiedCheckoutScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  // Context
  const { state, dispatch } = useContext(AppContext);
  const {
    state: checkoutState,
    dispatch: checkoutDispatch,
    isCheckoutComplete,
  } = useCheckout();
  const { deliveryLocation } = useDeliveryLocation();

  // Local state
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [appliedVoucherId, setAppliedVoucherId] = useState<string | null>(null);

  // Section states
  const [sections, setSections] = useState<Record<SectionKey, SectionState>>({
    address: { isExpanded: true, isComplete: false, isValid: false },
    delivery: { isExpanded: false, isComplete: false, isValid: false },
    payment: { isExpanded: false, isComplete: false, isValid: false },
    summary: { isExpanded: false, isComplete: false, isValid: true },
  });

  // Animation values for sections
  const sectionAnimations = useRef<Record<SectionKey, Animated.Value>>({
    address: new Animated.Value(1),
    delivery: new Animated.Value(0),
    payment: new Animated.Value(0),
    summary: new Animated.Value(0),
  }).current;

  // Calculate order totals
  const orderTotals = calculateOrderTotal(
    state.cart,
    getUserRole(state.user),
    checkoutState.deliverySlot?.id === 'express' ? 'express' : 'standard',
    state.appSettings?.delivery
  );

  const finalTotal = Math.max(0, orderTotals.finalTotal - voucherDiscount);

  // Redirect if cart is empty
  useEffect(() => {
    if (state.cart.length === 0 && !isPlacingOrder) {
      navigation.navigate('Main', { screen: 'Cart' });
    }
  }, [state.cart.length, isPlacingOrder]);

  // Auto-populate address from delivery location
  useEffect(() => {
    if (deliveryLocation && !checkoutState.deliveryAddress?.address) {
      const address: DeliveryAddress = {
        id: deliveryLocation.id || `addr_${Date.now()}`,
        name: state.user?.full_name || state.user?.name || '',
        address: deliveryLocation.title || deliveryLocation.address || '',
        unitNumber: deliveryLocation.unitNumber || '',
        postalCode:
          deliveryLocation.postalCode ||
          extractPostalCode(deliveryLocation.subtitle || ''),
        phone: state.user?.phone || '',
        isDefault: false,
      };
      checkoutDispatch({ type: 'SET_DELIVERY_ADDRESS', payload: address });
    }
  }, [deliveryLocation, state.user]);

  // Update section validation states
  useEffect(() => {
    const addressValid = !!(
      checkoutState.deliveryAddress?.name &&
      checkoutState.deliveryAddress?.address &&
      checkoutState.deliveryAddress?.phone
    );
    const deliveryValid = !!checkoutState.deliverySlot;
    const paymentValid = !!checkoutState.paymentMethod;

    setSections(prev => ({
      ...prev,
      address: {
        ...prev.address,
        isValid: addressValid,
        isComplete: addressValid,
      },
      delivery: {
        ...prev.delivery,
        isValid: deliveryValid,
        isComplete: deliveryValid,
      },
      payment: {
        ...prev.payment,
        isValid: paymentValid,
        isComplete: paymentValid,
      },
    }));
  }, [checkoutState]);

  // Toggle section expansion
  const toggleSection = useCallback(
    (key: SectionKey) => {
      HapticFeedback.light();

      setSections(prev => {
        const newSections = { ...prev };

        // If expanding this section, collapse others
        if (!prev[key].isExpanded) {
          Object.keys(newSections).forEach(k => {
            newSections[k as SectionKey] = {
              ...newSections[k as SectionKey],
              isExpanded: k === key,
            };
          });
        } else {
          newSections[key] = { ...newSections[key], isExpanded: false };
        }

        return newSections;
      });

      // Animate section expansion
      Object.keys(sectionAnimations).forEach(k => {
        Animated.spring(sectionAnimations[k as SectionKey], {
          toValue: k === key && !sections[key].isExpanded ? 1 : 0,
          useNativeDriver: false,
          tension: 100,
          friction: 10,
        }).start();
      });
    },
    [sections]
  );

  // Auto-advance to next section when current is complete
  const advanceToNextSection = useCallback(
    (currentSection: SectionKey) => {
      const sectionOrder: SectionKey[] = [
        'address',
        'delivery',
        'payment',
        'summary',
      ];
      const currentIndex = sectionOrder.indexOf(currentSection);

      if (currentIndex < sectionOrder.length - 1) {
        const nextSection = sectionOrder[currentIndex + 1];

        setSections(prev => ({
          ...prev,
          [currentSection]: { ...prev[currentSection], isExpanded: false },
          [nextSection]: { ...prev[nextSection], isExpanded: true },
        }));

        // Animate
        Animated.spring(sectionAnimations[currentSection], {
          toValue: 0,
          useNativeDriver: false,
          tension: 100,
          friction: 10,
        }).start();

        Animated.spring(sectionAnimations[nextSection], {
          toValue: 1,
          useNativeDriver: false,
          tension: 100,
          friction: 10,
        }).start();

        // Scroll to next section
        setTimeout(() => {
          // Scroll implementation
        }, 300);
      }
    },
    [sectionAnimations]
  );

  // Handle address update
  const handleAddressUpdate = useCallback(
    (address: DeliveryAddress) => {
      checkoutDispatch({ type: 'SET_DELIVERY_ADDRESS', payload: address });
    },
    [checkoutDispatch]
  );

  // Handle delivery slot selection
  const handleDeliverySlotSelect = useCallback(
    (slot: DeliverySlot) => {
      checkoutDispatch({ type: 'SET_DELIVERY_SLOT', payload: slot });
    },
    [checkoutDispatch]
  );

  // Handle payment method selection
  const handlePaymentMethodSelect = useCallback(
    (method: PaymentMethod) => {
      checkoutDispatch({ type: 'SET_PAYMENT_METHOD', payload: method });
    },
    [checkoutDispatch]
  );

  // Handle voucher application
  const handleVoucherApply = useCallback((voucherId: string, value: number) => {
    if (voucherId === '') {
      setAppliedVoucherId(null);
      setVoucherDiscount(0);
    } else {
      setAppliedVoucherId(voucherId);
      setVoucherDiscount(value);
    }
  }, []);

  // Place order
  const handlePlaceOrder = async () => {
    if (!isCheckoutComplete()) {
      HapticFeedback.error();
      setOrderError('Please complete all checkout steps');
      return;
    }

    try {
      setIsPlacingOrder(true);
      setOrderError(null);
      HapticFeedback.medium();

      console.log('📦 Navigating to OrderProcessing with params:', {
        cartItemsCount: state.cart.length,
        subtotal: orderTotals.subtotal,
        total: finalTotal,
        hasDeliveryAddress: !!checkoutState.deliveryAddress,
        hasDeliverySlot: !!checkoutState.deliverySlot,
        hasPaymentMethod: !!checkoutState.paymentMethod,
      });

      // Navigate to processing screen
      navigation.navigate('OrderProcessing', {
        cartItems: state.cart,
        orderTotals: {
          subtotal: orderTotals.subtotal,
          gst: orderTotals.gst,
          deliveryFee: orderTotals.deliveryFee,
          voucherDiscount,
          total: finalTotal,
        },
        deliveryAddress: checkoutState.deliveryAddress,
        deliverySlot: checkoutState.deliverySlot,
        paymentMethod: checkoutState.paymentMethod,
        appliedVoucherId,
        orderNotes: checkoutState.orderNotes,
      });

      // Reset after navigation
      setTimeout(() => {
        setIsPlacingOrder(false);
      }, 500);
    } catch (error) {
      console.error('Error initiating order:', error);
      setIsPlacingOrder(false);
      setOrderError('Failed to place order. Please try again.');
      HapticFeedback.error();
    }
  };

  // Check if can place order
  const canPlaceOrder =
    isCheckoutComplete() && state.cart.length > 0 && !isPlacingOrder;

  // Render section header
  const renderSectionHeader = (
    key: SectionKey,
    title: string,
    icon: string,
    subtitle?: string
  ) => {
    const section = sections[key];

    return (
      <TouchableOpacity
        style={[
          styles.sectionHeader,
          section.isExpanded && styles.sectionHeaderExpanded,
          section.isComplete &&
            !section.isExpanded &&
            styles.sectionHeaderComplete,
        ]}
        onPress={() => toggleSection(key)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <View
            style={[
              styles.sectionIcon,
              section.isComplete && styles.sectionIconComplete,
            ]}
          >
            {section.isComplete && !section.isExpanded ? (
              <Ionicons name="checkmark" size={18} color={COLORS.card} />
            ) : (
              <Ionicons
                name={icon as any}
                size={18}
                color={section.isExpanded ? COLORS.card : COLORS.text}
              />
            )}
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text
              style={[
                styles.sectionTitle,
                section.isExpanded && styles.sectionTitleExpanded,
              ]}
            >
              {title}
            </Text>
            {subtitle && !section.isExpanded && (
              <Text style={styles.sectionSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        <Ionicons
          name={section.isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 160 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Address Section */}
          <View style={styles.section}>
            {renderSectionHeader(
              'address',
              'Delivery Address',
              'location-outline',
              checkoutState.deliveryAddress?.address
            )}
            {sections.address.isExpanded && (
              <Animated.View style={styles.sectionContent}>
                <CheckoutAddressSection
                  address={checkoutState.deliveryAddress}
                  onUpdate={handleAddressUpdate}
                  onComplete={() => advanceToNextSection('address')}
                />
              </Animated.View>
            )}
          </View>

          {/* Delivery Section */}
          <View style={styles.section}>
            {renderSectionHeader(
              'delivery',
              'Delivery Schedule',
              'calendar-outline',
              checkoutState.deliverySlot
                ? `${checkoutState.deliverySlot.date} • ${checkoutState.deliverySlot.timeSlot}`
                : undefined
            )}
            {sections.delivery.isExpanded && (
              <Animated.View style={styles.sectionContent}>
                <CheckoutDeliverySection
                  address={checkoutState.deliveryAddress}
                  selectedSlot={checkoutState.deliverySlot}
                  onSelectSlot={handleDeliverySlotSelect}
                  onComplete={() => advanceToNextSection('delivery')}
                  subtotal={orderTotals.subtotal}
                />
              </Animated.View>
            )}
          </View>

          {/* Payment Section */}
          <View style={styles.section}>
            {renderSectionHeader(
              'payment',
              'Payment Method',
              'card-outline',
              checkoutState.paymentMethod?.name
            )}
            {sections.payment.isExpanded && (
              <Animated.View style={styles.sectionContent}>
                <CheckoutPaymentSection
                  selectedMethod={checkoutState.paymentMethod}
                  onSelectMethod={handlePaymentMethodSelect}
                  onComplete={() => advanceToNextSection('payment')}
                  total={finalTotal}
                  onVoucherApply={handleVoucherApply}
                  appliedVoucherId={appliedVoucherId}
                />
              </Animated.View>
            )}
          </View>

          {/* Order Summary Section */}
          <View style={styles.section}>
            {renderSectionHeader(
              'summary',
              'Order Summary',
              'receipt-outline',
              `${state.cart.length} items`
            )}
            {sections.summary.isExpanded && (
              <Animated.View style={styles.sectionContent}>
                <CheckoutSummarySection
                  cartItems={state.cart}
                  subtotal={orderTotals.subtotal}
                  gst={orderTotals.gst}
                  deliveryFee={orderTotals.deliveryFee}
                  voucherDiscount={voucherDiscount}
                  total={finalTotal}
                  deliveryAddress={checkoutState.deliveryAddress}
                  deliverySlot={checkoutState.deliverySlot}
                  paymentMethod={checkoutState.paymentMethod}
                />
              </Animated.View>
            )}
          </View>

          {/* Error Message */}
          {orderError && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#F44336" />
              <Text style={styles.errorText}>{orderError}</Text>
            </View>
          )}
        </ScrollView>

        {/* Sticky Footer */}
        <View
          style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}
        >
          {/* Running Total */}
          <View style={styles.footerTotals}>
            <View style={styles.footerTotalRow}>
              <Text style={styles.footerSubtotalLabel}>
                Subtotal ({state.cart.length} items)
              </Text>
              <Text style={styles.footerSubtotalValue}>
                {formatFinancialAmount(orderTotals.subtotal)}
              </Text>
            </View>
            {orderTotals.deliveryFee > 0 && (
              <View style={styles.footerTotalRow}>
                <Text style={styles.footerDeliveryLabel}>Delivery</Text>
                <Text style={styles.footerDeliveryValue}>
                  {formatFinancialAmount(orderTotals.deliveryFee)}
                </Text>
              </View>
            )}
            {voucherDiscount > 0 && (
              <View style={styles.footerTotalRow}>
                <Text style={styles.footerDiscountLabel}>Discount</Text>
                <Text style={styles.footerDiscountValue}>
                  -{formatFinancialAmount(voucherDiscount)}
                </Text>
              </View>
            )}
            <View style={[styles.footerTotalRow, styles.footerTotalRowFinal]}>
              <Text style={styles.footerTotalLabel}>Total (incl. GST)</Text>
              <Text style={styles.footerTotalValue}>
                {formatFinancialAmount(finalTotal)}
              </Text>
            </View>
          </View>

          {/* Place Order Button */}
          <TouchableOpacity
            style={[
              styles.placeOrderButton,
              !canPlaceOrder && styles.placeOrderButtonDisabled,
            ]}
            onPress={handlePlaceOrder}
            disabled={!canPlaceOrder}
            activeOpacity={0.8}
          >
            {isPlacingOrder ? (
              <ActivityIndicator color={COLORS.card} size="small" />
            ) : (
              <>
                <Text style={styles.placeOrderButtonText}>Place Order</Text>
                <Text style={styles.placeOrderButtonAmount}>
                  {formatFinancialAmount(finalTotal)}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.securityText}>
              Secure checkout • SSL encrypted
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// Helper function
function extractPostalCode(text: string): string {
  const match = text.match(/\b\d{6}\b/);
  return match ? match[0] : '';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.light,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 44,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },

  // Sections
  section: {
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
  },
  sectionHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionHeaderComplete: {
    backgroundColor: COLORS.background,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionIconComplete: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionTitleExpanded: {
    fontWeight: '700',
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionContent: {
    padding: SPACING.md,
    paddingTop: SPACING.sm,
  },

  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    marginTop: SPACING.sm,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: '#F44336',
    marginLeft: SPACING.sm,
    flex: 1,
  },

  // Footer
  footer: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    ...SHADOWS.medium,
  },
  footerTotals: {
    marginBottom: SPACING.md,
  },
  footerTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  footerTotalRowFinal: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: 0,
  },
  footerSubtotalLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  footerSubtotalValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  footerDeliveryLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  footerDeliveryValue: {
    ...TYPOGRAPHY.small,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  footerDiscountLabel: {
    ...TYPOGRAPHY.small,
    color: '#4CAF50',
  },
  footerDiscountValue: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    color: '#4CAF50',
  },
  footerTotalLabel: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.text,
  },
  footerTotalValue: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.text,
  },
  placeOrderButton: {
    backgroundColor: COLORS.text,
    borderRadius: 16,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.medium,
    minHeight: 56,
  },
  placeOrderButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  placeOrderButtonText: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.card,
  },
  placeOrderButtonAmount: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.card,
    opacity: 0.9,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  securityText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
});
