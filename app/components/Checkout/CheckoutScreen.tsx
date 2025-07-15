import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Dimensions,
  InteractionManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddressStep from './AddressStep';
import DeliveryStep from './DeliveryStep';
import PaymentStep from './PaymentStep';
import ReviewStep from './ReviewStep';

import AnimatedButton from '../UI/AnimatedButton';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING } from '../../utils/theme';
import { AppContext, getUserRole } from '../../context/AppContext';
import { useCheckout } from '../../context/CheckoutContext';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';
import {
  useCheckoutNavigation,
  CheckoutStep,
} from '../../hooks/useCheckoutNavigation';
import { calculateOrderTotal } from '../../utils/pricing';
import notificationService from '../../services/notificationService';
import { supabaseService } from '../../services/supabaseService';
import { formatFinancialAmount } from '../../utils/formatting';
import {
  DeliveryAddress,
  DeliverySlot,
  PaymentMethod,
} from '../../types/checkout';

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = React.useContext(AppContext);
  const { state: checkoutState, dispatch: checkoutDispatch } = useCheckout();
  const { deliveryLocation } = useDeliveryLocation();
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [appliedVoucherId, setAppliedVoucherId] = useState<string | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Use checkout navigation hook
  const {
    currentStep,
    currentStepIndex,
    steps,
    navigateToStep,
    nextStep: goToNextStep,
    previousStep: goToPreviousStep,
    getStepTitle,
  } = useCheckoutNavigation();

  // Animation states
  const [isAnimating] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Validate step
  const validateStep = (step: CheckoutStep, data: any) => {
    switch (step) {
      case 'address':
        return !!data.address;
      case 'delivery':
        return !!data.deliverySlot;
      case 'payment':
        return !!data.paymentMethod;
      case 'review':
        return !!data.cartItems && data.cartItems.length > 0;
      default:
        return true;
    }
  };

  const stepAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const headerScaleAnim = useRef(new Animated.Value(1)).current;

  // Initialize checkout state with user data
  useEffect(() => {
    const userName = state.user?.name || 'Guest User';
    const userPhone = state.user?.phone || '+65 9123 4567';

    if (deliveryLocation && !checkoutState.deliveryAddress) {
      const postalCodeMatch = deliveryLocation.subtitle?.match(/\b\d{6}\b/);
      const postalCode = postalCodeMatch ? postalCodeMatch[0] : '';

      const address: DeliveryAddress = {
        id: 'temp-' + Date.now(),
        name: userName,
        address: deliveryLocation.title,
        unitNumber: '',
        postalCode: postalCode,
        phone: userPhone,
        isDefault: false,
      };

      checkoutDispatch({ type: 'SET_DELIVERY_ADDRESS', payload: address });
    } else if (!checkoutState.deliveryAddress) {
      // Default address if no delivery location is set
      const defaultAddress: DeliveryAddress = {
        id: 'default-' + Date.now(),
        name: userName,
        address: '123 Marina Bay Sands',
        unitNumber: '#12-34',
        postalCode: '018956',
        phone: userPhone,
        isDefault: true,
      };

      checkoutDispatch({
        type: 'SET_DELIVERY_ADDRESS',
        payload: defaultAddress,
      });
    }
  }, [
    state.user?.name,
    state.user?.phone,
    deliveryLocation,
    checkoutState.deliveryAddress,
    checkoutDispatch,
  ]);

  // Use actual cart items from context - redirect if empty
  const contextCartItems = state.cart;

  // Redirect if no user or empty cart (but not during order completion)
  React.useEffect(() => {
    if (!state.user) {
      (navigation as any).navigate('Auth', { screen: 'SignIn' });
      return;
    }
    if (contextCartItems.length === 0 && !orderCompleted) {
      navigation.navigate('Main', { screen: 'Cart' });
    }
  }, [contextCartItems.length, state.user, navigation, orderCompleted]);

  // Transform context cart items to checkout format
  const cartItems = contextCartItems.map(item => ({
    product: {
      ...item.product,
      imageUrl: item.product.image, // Map image to imageUrl for compatibility
    },
    quantity: item.quantity,
  }));

  // State for order totals to handle dynamic recalculation
  const [orderTotals, setOrderTotals] = useState(() =>
    calculateOrderTotal(
      cartItems,
      getUserRole(state.user),
      checkoutState.deliverySlot?.id === 'express' ? 'express' : 'standard'
    )
  );

  // Recalculate totals when user data, delivery slot, or voucher changes
  useEffect(() => {
    const newTotals = calculateOrderTotal(
      cartItems,
      getUserRole(state.user),
      checkoutState.deliverySlot?.id === 'express' ? 'express' : 'standard'
    );
    setOrderTotals(newTotals);
  }, [
    state.user?.role,
    state.user?.accountType,
    checkoutState.deliverySlot,
    cartItems.length,
    voucherDiscount,
  ]);

  const subtotal = orderTotals.subtotal;
  const gst = orderTotals.gst;
  const deliveryFee = orderTotals.deliveryFee;
  const total = Math.max(0, orderTotals.finalTotal - voucherDiscount); // Apply voucher discount to total

  // Animate step indicators when step changes
  useEffect(() => {
    stepAnimations.forEach((anim, index) => {
      const targetValue = index <= currentStepIndex ? 1 : 0;
      Animated.spring(anim, {
        toValue: targetValue,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    });
  }, [currentStepIndex]);

  // Step navigation handlers are now handled by the useCheckoutNavigation hook

  const handleUpdateAddress = (address: DeliveryAddress) => {
    if (isAnimating) return;

    checkoutDispatch({ type: 'SET_DELIVERY_ADDRESS', payload: address });

    // Auto-advance to next step after address is set
    InteractionManager.runAfterInteractions(() => {
      goToNextStep();
    });
  };

  const handleSelectDeliverySlot = (slot: DeliverySlot) => {
    if (isAnimating) return;

    checkoutDispatch({ type: 'SET_DELIVERY_SLOT', payload: slot });

    // Auto-advance to next step after slot is selected
    InteractionManager.runAfterInteractions(() => {
      goToNextStep();
    });
  };

  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    if (isAnimating) return;

    checkoutDispatch({ type: 'SET_PAYMENT_METHOD', payload: method });

    // Auto-advance to next step after payment method is selected
    InteractionManager.runAfterInteractions(() => {
      goToNextStep();
    });
  };

  const handleVoucherApply = (voucherId: string, value: number) => {
    if (voucherId === '') {
      // Remove voucher
      setAppliedVoucherId(null);
      setVoucherDiscount(0);
    } else {
      // Apply voucher
      setAppliedVoucherId(voucherId);
      setVoucherDiscount(value);
    }
  };

  const handlePlaceOrder = async () => {
    if (
      !checkoutState.deliveryAddress ||
      !checkoutState.deliverySlot ||
      !checkoutState.paymentMethod
    ) {
      console.error('❌ Missing required checkout data');
      return;
    }

    checkoutDispatch({ type: 'SET_PROCESSING', payload: true });
    setOrderCompleted(true); // Prevent cart redirect during order completion

    // Navigate to processing step
    navigateToStep('processing');

    try {
      // Ensure user is authenticated
      if (!state.user) {
        console.error('❌ No authenticated user found - redirecting to login');
        checkoutDispatch({ type: 'SET_PROCESSING', payload: false });
        (navigation as any).navigate('Auth', { screen: 'SignIn' });
        return;
      }

      const currentUser = state.user;

      console.log('🛒 Creating order for user:', currentUser.name);

      // Prepare order data
      const orderData = {
        userId: currentUser.id,
        companyId:
          currentUser.accountType === 'company'
            ? currentUser.companyId
            : undefined,
        items: cartItems,
        deliveryAddress: `${checkoutState.deliveryAddress.address}${checkoutState.deliveryAddress.unitNumber ? `, ${checkoutState.deliveryAddress.unitNumber}` : ''}, ${checkoutState.deliveryAddress.postalCode}`,
        deliverySlot: checkoutState.deliverySlot,
        paymentMethod: checkoutState.paymentMethod,
        subtotal: subtotal,
        gst: gst,
        deliveryFee: deliveryFee,
        total: total,
        appliedVoucherId: appliedVoucherId,
        voucherDiscount: voucherDiscount,
      };

      // Create order in database
      const result = await supabaseService.createOrder(orderData);

      if (result && result.orderId && result.orderNumber) {
        const { orderId, orderNumber, pointsAwarded } = result;

        // Schedule order notifications
        notificationService.simulateOrderProgress(orderNumber);

        // Simulate order progression for real-time demo (after 10 seconds)
        setTimeout(() => {
          supabaseService.simulateOrderProgression(orderId);
        }, 10000);

        // Update user points in AppContext if points were awarded
        if (pointsAwarded && state.user) {
          dispatch({
            type: 'UPDATE_USER_PROFILE',
            payload: {
              points: pointsAwarded.currentPoints,
            },
          });
        }

        // Wait for processing animation to complete
        setTimeout(() => {
          // Navigate to order confirmation
          navigation.navigate('OrderSuccess', {
            orderId: orderNumber,
            total: total,
            deliveryDate: checkoutState.deliverySlot?.date || 'Tomorrow',
            deliveryTime: checkoutState.deliverySlot?.timeSlot || '2-4 PM',
          });

          // Complete purchase - this will clear cart, update stats
          dispatch({
            type: 'COMPLETE_PURCHASE',
            payload: {
              orderTotal: total,
              orderId: orderNumber,
            },
          });

          // Show purchase achievement to trigger points award in RewardsContext
          // Use the actual points earned from the database
          const pointsEarned = pointsAwarded?.pointsEarned || Math.floor(total * 2);
          dispatch({
            type: 'SHOW_PURCHASE_ACHIEVEMENT',
            payload: {
              pointsEarned,
              orderId: orderNumber,
              orderTotal: total,
            },
          });

          // Reset checkout state for next order
          checkoutDispatch({ type: 'RESET_CHECKOUT' });
        }, 8000); // Wait for processing animation
      } else {
        console.error('Failed to create order - result:', result);
        checkoutDispatch({
          type: 'SET_ERROR',
          payload: 'Failed to create order. Please try again.',
        });
        checkoutDispatch({ type: 'SET_PROCESSING', payload: false });
      }
    } catch (error) {
      console.error('Error placing order:', error);
      checkoutDispatch({
        type: 'SET_ERROR',
        payload: 'An error occurred while processing your order.',
      });
      checkoutDispatch({ type: 'SET_PROCESSING', payload: false });
    }
  };

  const handleGoBack = () => {
    if (isAnimating) return;

    if (currentStep === 'address') {
      navigation.goBack();
    } else if (currentStep === 'processing') {
      // Don't allow going back during processing
      return;
    } else {
      goToPreviousStep();
    }
  };

  const canContinue = () => {
    return validateStep(currentStep, {
      address: checkoutState.deliveryAddress,
      deliverySlot: checkoutState.deliverySlot,
      paymentMethod: checkoutState.paymentMethod,
      cartItems: cartItems,
      orderTotal: total,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      {/* Enhanced Header with proper safe area */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Animated.View
          style={[
            styles.header,
            {
              transform: [{ scale: headerScaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getStepTitle(currentStep)}</Text>
          <TouchableOpacity
            style={styles.stepFlowButton}
            onPress={() => navigation.navigate('CheckoutAddress' as never)}
            activeOpacity={0.8}
          >
            <Ionicons name="layers-outline" size={16} color={COLORS.text} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Step-by-step flow option */}
      <View style={styles.flowOptionContainer}>
        <TouchableOpacity
          style={styles.flowOptionButton}
          onPress={() => navigation.navigate('CheckoutAddress' as never)}
          activeOpacity={0.8}
        >
          <Ionicons name="list-outline" size={20} color={COLORS.text} />
          <Text style={styles.flowOptionText}>Use step-by-step checkout</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Content with Animation */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: 200 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          }}
          removeClippedSubviews={true}
          renderToHardwareTextureAndroid={true}
        >
          {currentStep === 'address' && checkoutState.deliveryAddress && (
            <AddressStep
              address={checkoutState.deliveryAddress}
              onContinue={handleUpdateAddress}
            />
          )}

          {currentStep === 'delivery' && checkoutState.deliveryAddress && (
            <DeliveryStep
              address={checkoutState.deliveryAddress}
              onSelectSlot={handleSelectDeliverySlot}
              subtotal={subtotal}
            />
          )}

          {currentStep === 'payment' && (
            <PaymentStep
              onSelectMethod={handleSelectPaymentMethod}
              total={total}
              subtotal={subtotal}
              onVoucherApply={handleVoucherApply}
              appliedVoucherId={appliedVoucherId}
            />
          )}

          {currentStep === 'review' && checkoutState.deliveryAddress && (
            <ReviewStep
              cart={cartItems.map(item => ({
                product: {
                  id: item.product.id,
                  name: item.product.name,
                  price:
                    getUserRole(state.user) === 'trade'
                      ? item.product.tradePrice
                      : item.product.retailPrice,
                  imageUrl: item.product.imageUrl,
                },
                quantity: item.quantity,
              }))}
              address={checkoutState.deliveryAddress}
              deliverySlot={checkoutState.deliverySlot}
              paymentMethod={checkoutState.paymentMethod}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              total={total}
              voucherDiscount={voucherDiscount}
              onPlaceOrder={handlePlaceOrder}
            />
          )}

          {currentStep === 'processing' && (
            <View style={styles.processingContainer}>
              <View style={styles.processingContent}>
                <Ionicons name="hourglass" size={48} color={COLORS.primary} />
                <Text style={styles.processingTitle}>
                  Processing Your Order
                </Text>
                <Text style={styles.processingDescription}>
                  Please wait while we process your order...
                </Text>
              </View>
            </View>
          )}

          {/* Extra padding to ensure footer button doesn't cover content */}
          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      {/* Footer Actions */}
      {currentStep !== 'processing' && (
        <View
          style={[styles.bottomContainer, { paddingBottom: insets.bottom }]}
        >
          {/* Progress Bar */}
          <View style={styles.bottomProgressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>

            {/* Step indicators */}
            <View style={styles.stepIndicators}>
              {steps.slice(0, 4).map((step, index) => {
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;
                const isInactive = index > currentStepIndex;

                return (
                  <React.Fragment key={step}>
                    <Animated.View
                      style={[
                        styles.stepDot,
                        isCompleted && styles.completedStepDot,
                        isActive && styles.activeStepDot,
                        isInactive && styles.inactiveStepDot,
                        {
                          transform: [
                            {
                              scale: stepAnimations[index].interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.8, 1.1],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      {isCompleted && (
                        <Animated.View
                          style={{
                            opacity: stepAnimations[index],
                            transform: [{ scale: stepAnimations[index] }],
                          }}
                        >
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color={COLORS.accent}
                          />
                        </Animated.View>
                      )}
                      {isActive && (
                        <Animated.View
                          style={{
                            opacity: stepAnimations[index],
                            transform: [{ scale: stepAnimations[index] }],
                          }}
                        >
                          <View style={styles.activeStepIndicator} />
                        </Animated.View>
                      )}
                    </Animated.View>
                    {index < 3 && (
                      <Animated.View
                        style={[
                          styles.stepLine,
                          isCompleted && styles.completedStepLine,
                          {
                            opacity: stepAnimations[index].interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.3, 1],
                            }),
                          },
                        ]}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>

          {/* Continue Button */}
          <View style={styles.footer}>
            <AnimatedButton
              label={
                currentStep === 'address'
                  ? 'Continue to Delivery'
                  : currentStep === 'delivery'
                    ? 'Continue to Payment'
                    : currentStep === 'payment'
                      ? 'Continue to Review'
                      : currentStep === 'review'
                        ? `Place Order • ${formatFinancialAmount(total)}`
                        : 'Continue'
              }
              onPress={
                currentStep === 'review'
                  ? handlePlaceOrder
                  : () => {
                      if (isAnimating || !canContinue()) return;

                      goToNextStep();
                    }
              }
              disabled={
                !canContinue() || isAnimating || checkoutState.isProcessing
              }
              type={currentStep === 'review' ? 'success' : 'primary'}
              icon={
                currentStep === 'review' ? 'checkmark-circle' : 'arrow-forward'
              }
              iconPosition={currentStep === 'review' ? 'left' : 'right'}
              fullWidth={true}
            />
          </View>
        </View>
      )}
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
    ...SHADOWS.medium,
    elevation: 6,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  headerTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeholder: {
    width: 44,
  },
  progressContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.light,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStepDot: {
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#66BB6A',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveStepDot: {
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    opacity: 0.6,
  },
  completedStepDot: {
    backgroundColor: '#4CAF50',
    borderWidth: 0,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepFlowButton: {
    padding: 8,
    borderRadius: 6,
  },
  flowOptionContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  flowOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  flowOptionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  completedStepLine: {
    backgroundColor: '#4CAF50',
  },
  activeStepIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  bottomContainer: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.medium,
    elevation: 6,
  },
  bottomProgressContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.card,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.card,
  },
  processingContainer: {
    flex: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  processingContent: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  processingTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  processingDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
