import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { AppContext } from '../../context/AppContext';
import { useCheckout } from '../../context/CheckoutContext';
import ReviewStep from './ReviewStep';
import CheckoutStepIndicator from './CheckoutStepIndicator';
import { supabaseService } from '../../services/supabaseService';
import { calculateOrderTotal } from '../../utils/pricing';
import { getUserRole } from '../../context/AppContext';
import { HapticFeedback } from '../../utils/haptics';
import { formatFinancialAmount } from '../../utils/formatting';

// Default address object - created once to prevent re-render loops
const DEFAULT_ADDRESS = {
  id: '',
  name: '',
  address: '',
  unitNumber: '',
  postalCode: '',
  phone: '',
  isDefault: false,
};

export default function CheckoutReviewScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useContext(AppContext);
  const {
    state: checkoutState,
    dispatch: checkoutDispatch,
    isCheckoutComplete,
  } = useCheckout();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handlePlaceOrder = async () => {
    if (!isCheckoutComplete()) {
      Alert.alert('Error', 'Please complete all checkout steps');
      return;
    }

    try {
      setIsPlacingOrder(true);
      HapticFeedback.medium();

      // Skip processing screen and go directly to order creation

      // Calculate totals
      const orderSummary = calculateOrderTotal(
        state.cart,
        getUserRole(state.user),
        checkoutState.deliverySlot?.id === 'express' ? 'express' : 'standard'
      );

      // Create order
      const orderData = {
        userId: state.user?.id,
        companyId:
          state.user?.account_type === 'company' ? state.company?.id : null,
        items: state.cart.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.tradePrice || item.product.retailPrice,
          total_price:
            (item.product.tradePrice || item.product.retailPrice) *
            item.quantity,
          product: item.product, // Include full product object for fallback
        })),
        deliveryAddress: checkoutState.deliveryAddress,
        deliverySlot: checkoutState.deliverySlot,
        paymentMethod: checkoutState.paymentMethod,
        orderNotes: checkoutState.orderNotes,
        subtotal: orderSummary.subtotal,
        deliveryFee: orderSummary.deliveryFee,
        gst: orderSummary.gst,
        total: orderSummary.finalTotal,
        status: 'pending',
      };

      const result = await supabaseService.createOrder(orderData);

      if (result && result.orderId && result.orderNumber) {
        // Clear cart and checkout state
        dispatch({ type: 'CLEAR_CART' });
        checkoutDispatch({ type: 'RESET_CHECKOUT' });

        // Navigate directly to success screen
        navigation.navigate('OrderSuccess' as never, {
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          total: orderSummary.finalTotal,
          deliveryDate: checkoutState.deliverySlot?.date,
          deliveryTime: checkoutState.deliverySlot?.timeSlot,
        });
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setIsPlacingOrder(false);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const orderSummary = calculateOrderTotal(
    state.cart,
    getUserRole(state.user),
    checkoutState.deliverySlot?.id === 'express' ? 'express' : 'standard'
  );

  return (
    <View style={styles.container}>
      {/* Header Container */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.simpleHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Review Order</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ReviewStep
          cart={state.cart}
          address={checkoutState.deliveryAddress || DEFAULT_ADDRESS}
          deliverySlot={checkoutState.deliverySlot}
          paymentMethod={checkoutState.paymentMethod}
          subtotal={orderSummary.subtotal}
          deliveryFee={orderSummary.deliveryFee}
          total={orderSummary.total}
          onPlaceOrder={handlePlaceOrder}
        />
      </ScrollView>

      {/* Step Indicator */}
      <CheckoutStepIndicator currentStep={4} totalSteps={4} />

      {/* Bottom Button */}
      <View
        style={[
          styles.bottomContainer,
          { paddingBottom: insets.bottom + SPACING.sm }, // Just safe area + small padding
        ]}
      >
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>
            {formatFinancialAmount(orderSummary.finalTotal)}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (!isCheckoutComplete() || isPlacingOrder) &&
              styles.placeOrderButtonDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={!isCheckoutComplete() || isPlacingOrder}
        >
          <Text
            style={[
              styles.placeOrderButtonText,
              (!isCheckoutComplete() || isPlacingOrder) &&
                styles.placeOrderButtonTextDisabled,
            ]}
          >
            {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    backgroundColor: COLORS.card,
    zIndex: 10,
    ...SHADOWS.medium,
    paddingBottom: SPACING.sm,
  },
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 56,
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
    ...SHADOWS.light,
  },
  headerTitleContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
    textAlign: 'center',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 0,
    backgroundColor: COLORS.card,
    ...SHADOWS.light,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  totalLabel: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
  },
  totalAmount: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  placeOrderButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
    elevation: 6,
    minHeight: 56,
  },
  placeOrderButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  placeOrderButtonText: {
    ...TYPOGRAPHY.h4,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  placeOrderButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
});
