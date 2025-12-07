/**
 * OrderProcessingScreen - Order submission with real-time status updates
 *
 * This screen:
 * 1. Creates the order in Supabase
 * 2. Shows animated progress through processing stages
 * 3. Handles errors gracefully
 * 4. Navigates to success on completion
 */
import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

import { AppContext, getUserRole } from '../../context/AppContext';
import { useCheckout } from '../../context/CheckoutContext';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import { formatFinancialAmount } from '../../utils/formatting';
import { HapticFeedback } from '../../utils/haptics';
import { supabaseService } from '../../services/supabaseService';
import notificationService from '../../services/notificationService';
import { RootStackParamList } from '../../types/navigation';

type OrderProcessingRouteProp = RouteProp<
  RootStackParamList,
  'OrderProcessing'
>;

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}

export default function OrderProcessingScreen() {
  const navigation = useNavigation();
  const route = useRoute<OrderProcessingRouteProp>();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useContext(AppContext);
  const { dispatch: checkoutDispatch } = useCheckout();

  // Extract params
  const {
    cartItems,
    orderTotals,
    deliveryAddress,
    deliverySlot,
    paymentMethod,
    appliedVoucherId,
    orderNotes,
  } = route.params || {};

  // Processing state
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'validate', label: 'Validating order', status: 'pending' },
    { id: 'create', label: 'Creating order', status: 'pending' },
    { id: 'payment', label: 'Processing payment', status: 'pending' },
    { id: 'confirm', label: 'Confirming order', status: 'pending' },
  ]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{
    orderId: string;
    orderNumber: string;
    pointsAwarded: any;
  } | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Spinning animation for loader
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Process order
  useEffect(() => {
    processOrder();
  }, []);

  const updateStep = (index: number, status: ProcessingStep['status']) => {
    setSteps(prev =>
      prev.map((step, i) => (i === index ? { ...step, status } : step))
    );

    // Animate progress
    Animated.timing(progressAnim, {
      toValue: (index + (status === 'complete' ? 1 : 0.5)) / steps.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const processOrder = async () => {
    console.log('📦 OrderProcessing params:', {
      hasCartItems: !!cartItems,
      cartItemsLength: cartItems?.length,
      hasDeliveryAddress: !!deliveryAddress,
      hasDeliverySlot: !!deliverySlot,
      hasPaymentMethod: !!paymentMethod,
      hasOrderTotals: !!orderTotals,
    });

    if (!cartItems || cartItems.length === 0) {
      setError('Your cart is empty. Please add items before checkout.');
      return;
    }

    if (!deliveryAddress) {
      setError(
        'Delivery address is missing. Please go back and enter your address.'
      );
      return;
    }

    if (!deliverySlot) {
      setError(
        'Delivery schedule is missing. Please go back and select a delivery time.'
      );
      return;
    }

    if (!paymentMethod) {
      setError(
        'Payment method is missing. Please go back and select a payment method.'
      );
      return;
    }

    if (!orderTotals) {
      setError('Order totals are missing. Please go back and try again.');
      return;
    }

    try {
      // Step 1: Validate
      updateStep(0, 'active');
      setCurrentStepIndex(0);
      await delay(800);

      // Validate cart has items
      if (cartItems.length === 0) {
        throw new Error('Your cart is empty');
      }

      // Validate user
      if (!state.user) {
        throw new Error('Please sign in to place an order');
      }

      updateStep(0, 'complete');
      HapticFeedback.light();

      // Step 2: Create Order
      updateStep(1, 'active');
      setCurrentStepIndex(1);
      await delay(500);

      // Prepare order data
      const orderData = {
        userId: state.user.id,
        companyId:
          state.user.accountType === 'company' ? state.company?.id : undefined,
        items: cartItems.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.tradePrice || item.product.retailPrice,
          total_price:
            (item.product.tradePrice || item.product.retailPrice) *
            item.quantity,
          product: item.product,
        })),
        deliveryAddress: deliveryAddress, // Pass full object for better data in admin
        deliverySlot: deliverySlot,
        paymentMethod: paymentMethod,
        subtotal: orderTotals.subtotal,
        gst: orderTotals.gst || orderTotals.subtotal * 0.09,
        deliveryFee: orderTotals.deliveryFee,
        total: orderTotals.total,
        appliedVoucherId: appliedVoucherId,
        voucherDiscount: orderTotals.voucherDiscount || 0,
        orderNotes: orderNotes,
      };

      console.log(
        '📦 Creating order with data:',
        JSON.stringify(orderData, null, 2)
      );

      // Create order in Supabase
      let result;
      try {
        result = await supabaseService.createOrder(orderData);
      } catch (createError: any) {
        console.error('❌ Supabase createOrder error:', createError);
        throw new Error(
          createError?.message || 'Database error while creating order'
        );
      }

      if (!result || !result.orderId || !result.orderNumber) {
        console.error('❌ Invalid order result:', result);
        throw new Error('Order creation returned incomplete data');
      }

      setOrderResult(result);
      updateStep(1, 'complete');
      HapticFeedback.light();

      // Step 3: Process Payment
      updateStep(2, 'active');
      setCurrentStepIndex(2);
      await delay(1000);

      // Payment processing is simulated based on payment method
      // In production, this would integrate with payment gateway
      if (paymentMethod.type === 'credit_card') {
        // Simulate card processing
        await delay(500);
      }

      updateStep(2, 'complete');
      HapticFeedback.light();

      // Step 4: Confirm
      updateStep(3, 'active');
      setCurrentStepIndex(3);
      await delay(600);

      // Schedule notifications
      notificationService.simulateOrderProgress(result.orderNumber);

      // Simulate order progression (for demo)
      setTimeout(() => {
        supabaseService.simulateOrderProgression(result.orderId);
      }, 10000);

      // Update user points if awarded
      if (result.pointsAwarded && state.user) {
        dispatch({
          type: 'UPDATE_USER_PROFILE',
          payload: {
            points: result.pointsAwarded.currentPoints,
          },
        });
      }

      updateStep(3, 'complete');
      HapticFeedback.success();

      // Small delay before navigation for visual completion
      await delay(800);

      // Clear cart and checkout state
      dispatch({ type: 'CLEAR_CART' });
      checkoutDispatch({ type: 'RESET_CHECKOUT' });

      // Show purchase achievement
      const earnRate = state.appSettings?.loyalty?.earn_rate || 2;
      const pointsEarned =
        result.pointsAwarded?.pointsEarned ||
        Math.floor(orderTotals.total * earnRate);

      dispatch({
        type: 'SHOW_PURCHASE_ACHIEVEMENT',
        payload: {
          pointsEarned,
          orderId: result.orderNumber,
          orderTotal: orderTotals.total,
        },
      });

      // Navigate to success
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'OrderConfirmation',
            params: {
              orderId: result.orderId,
              orderNumber: result.orderNumber,
              total: orderTotals.total,
              deliveryDate: deliverySlot.date,
              deliveryTime: deliverySlot.timeSlot,
              pointsEarned,
            },
          },
        ],
      });
    } catch (err: any) {
      console.error('Order processing error:', err);
      setError(err.message || 'Failed to process order. Please try again.');

      // Mark current step as error
      updateStep(currentStepIndex, 'error');
      HapticFeedback.error();
    }
  };

  const handleRetry = () => {
    setError(null);
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
    setCurrentStepIndex(0);
    processOrder();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.xl }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Header Icon */}
        <View style={styles.iconContainer}>
          {error ? (
            <View style={styles.errorIcon}>
              <Ionicons name="close" size={48} color="#F44336" />
            </View>
          ) : (
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <View style={styles.processingIcon}>
                <Ionicons name="sync" size={48} color={COLORS.text} />
              </View>
            </Animated.View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {error ? 'Order Failed' : 'Processing Order'}
        </Text>
        <Text style={styles.subtitle}>
          {error || 'Please wait while we process your order...'}
        </Text>

        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={step.id} style={styles.stepRow}>
              <View
                style={[
                  styles.stepIndicator,
                  step.status === 'complete' && styles.stepIndicatorComplete,
                  step.status === 'active' && styles.stepIndicatorActive,
                  step.status === 'error' && styles.stepIndicatorError,
                ]}
              >
                {step.status === 'complete' ? (
                  <Ionicons name="checkmark" size={16} color={COLORS.card} />
                ) : step.status === 'error' ? (
                  <Ionicons name="close" size={16} color={COLORS.card} />
                ) : step.status === 'active' ? (
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Ionicons name="sync" size={14} color={COLORS.card} />
                  </Animated.View>
                ) : (
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  step.status === 'complete' && styles.stepLabelComplete,
                  step.status === 'active' && styles.stepLabelActive,
                  step.status === 'error' && styles.stepLabelError,
                ]}
              >
                {step.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarTrack}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
                error && styles.progressBarFillError,
              ]}
            />
          </View>
        </View>

        {/* Order Total */}
        {orderTotals && (
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Order Total</Text>
            <Text style={styles.totalValue}>
              {formatFinancialAmount(orderTotals.total)}
            </Text>
          </View>
        )}

        {/* Error Actions */}
        {error && (
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={20} color={COLORS.card} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Security Note */}
        {!error && (
          <View style={styles.securityNote}>
            <Ionicons
              name="shield-checkmark"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.securityText}>
              Your order is being processed securely
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// Utility
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Import TouchableOpacity for error actions
import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  processingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.text,
    ...SHADOWS.medium,
  },
  errorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F44336',
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  stepsContainer: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  stepIndicatorComplete: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  stepIndicatorActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  stepIndicatorError: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  stepNumber: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  stepLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    flex: 1,
  },
  stepLabelComplete: {
    color: COLORS.text,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
  stepLabelError: {
    color: '#F44336',
    fontWeight: '600',
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.text,
    borderRadius: 3,
  },
  progressBarFillError: {
    backgroundColor: '#F44336',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
  },
  totalLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  totalValue: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.text,
  },
  errorActions: {
    width: '100%',
    gap: SPACING.sm,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.text,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  retryButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.card,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  securityText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
});
