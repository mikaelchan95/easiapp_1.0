import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  StatusBar,
  Animated,
  Dimensions,
  InteractionManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddressStep from './AddressStep';
import DeliveryStep from './DeliveryStep';
import PaymentStep from './PaymentStep';
import ReviewStep from './ReviewStep';
import ProcessingStep from './ProcessingStep';

import AnimatedButton from '../UI/AnimatedButton';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING } from '../../utils/theme';
import { AppContext, getUserRole } from '../../context/AppContext';
import { useCheckout } from '../../context/CheckoutContext';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';
import { useCheckoutNavigation } from '../../hooks/useCheckoutNavigation';
import { calculateOrderTotal } from '../../utils/pricing';
import { HapticFeedback } from '../../utils/haptics';
import notificationService from '../../services/notificationService';
import { supabaseService } from '../../services/supabaseService';
import { formatFinancialAmount } from '../../utils/formatting';
import { DeliveryAddress, DeliverySlot, PaymentMethod } from '../../types/checkout';

const { width } = Dimensions.get('window');

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = React.useContext(AppContext);
  const { state: checkoutState, dispatch: checkoutDispatch, isCheckoutComplete } = useCheckout();
  const { deliveryLocation } = useDeliveryLocation();
  const [orderCompleted, setOrderCompleted] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Use checkout navigation hook
  const {
    currentStep,
    currentStepIndex,
    steps,
    isAnimating,
    slideAnim,
    fadeAnim,
    progressAnim,
    navigateToStep,
    goToNextStep,
    goToPreviousStep,
    updateProgress,
    validateStep,
    getStepTitle,
    getProgressPercentage,
    isStepCompleted,
    isStepActive
  } = useCheckoutNavigation({
    onStepChange: (step) => {
      // Update progress animation when step changes
      updateProgress();
      // Scroll to top when step changes
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
    }
  });
  
  const stepAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;
  const headerScaleAnim = useRef(new Animated.Value(1)).current;
  
  // Initialize checkout state with user data
  useEffect(() => {
    const userName = state.user?.name || 'Guest User';
    const userPhone = state.user?.phone || '+65 9123 4567';
    
    if (deliveryLocation && !checkoutState.address) {
      const postalCodeMatch = deliveryLocation.subtitle?.match(/\b\d{6}\b/);
      const postalCode = postalCodeMatch ? postalCodeMatch[0] : '';
      const city = deliveryLocation.subtitle?.includes('Singapore') ? 'Singapore' : '';
      
      const address: DeliveryAddress = {
        name: userName,
        street: deliveryLocation.title,
        unit: '',
        city: city,
        postalCode: postalCode,
        phone: userPhone,
        isDefault: false
      };
      
      checkoutDispatch({ type: 'SET_ADDRESS', payload: address });
    } else if (!checkoutState.address) {
      // Default address if no delivery location is set
      const defaultAddress: DeliveryAddress = {
        name: userName,
        street: '123 Marina Bay Sands',
        unit: '#12-34',
        city: 'Singapore',
        postalCode: '018956',
        phone: userPhone,
        isDefault: true
      };
      
      checkoutDispatch({ type: 'SET_ADDRESS', payload: defaultAddress });
    }
  }, [state.user?.name, state.user?.phone, deliveryLocation, checkoutState.address, checkoutDispatch]);
  
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
    quantity: item.quantity
  }));
  
  // State for order totals to handle dynamic recalculation
  const [orderTotals, setOrderTotals] = useState(() => 
    calculateOrderTotal(
      cartItems, 
      getUserRole(state.user),
      checkoutState.deliverySlot?.id === 'express' ? 'express' : 'standard'
    )
  );
  
  // Recalculate totals when user data or delivery slot changes
  useEffect(() => {
    const newTotals = calculateOrderTotal(
      cartItems, 
      getUserRole(state.user),
      checkoutState.deliverySlot?.id === 'express' ? 'express' : 'standard'
    );
    setOrderTotals(newTotals);
  }, [state.user?.role, state.user?.accountType, checkoutState.deliverySlot, cartItems.length]);
  
  const subtotal = orderTotals.subtotal;
  const gst = orderTotals.gst;
  const deliveryFee = orderTotals.deliveryFee;
  const total = orderTotals.finalTotal;
  
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
    
    checkoutDispatch({ type: 'SET_ADDRESS', payload: address });
    
    // Auto-advance to next step after address is set
    InteractionManager.runAfterInteractions(() => {
      goToNextStep({ address });
    });
  };
  
  const handleSelectDeliverySlot = (slot: DeliverySlot) => {
    if (isAnimating) return;
    
    checkoutDispatch({ type: 'SET_DELIVERY_SLOT', payload: slot });
    
    // Auto-advance to next step after slot is selected
    InteractionManager.runAfterInteractions(() => {
      goToNextStep({ deliverySlot: slot });
    });
  };
  
  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    if (isAnimating) return;
    
    checkoutDispatch({ type: 'SET_PAYMENT_METHOD', payload: method });
    
    // Auto-advance to next step after payment method is selected
    InteractionManager.runAfterInteractions(() => {
      goToNextStep({ paymentMethod: method });
    });
  };
  
  const handlePlaceOrder = async () => {
    if (!checkoutState.address || !checkoutState.deliverySlot || !checkoutState.paymentMethod) {
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
        companyId: currentUser.accountType === 'company' ? currentUser.companyId : undefined,
        items: cartItems,
        deliveryAddress: `${checkoutState.address.street}${checkoutState.address.unit ? `, ${checkoutState.address.unit}` : ''}, ${checkoutState.address.city}, ${checkoutState.address.postalCode}`,
        deliverySlot: checkoutState.deliverySlot,
        paymentMethod: checkoutState.paymentMethod,
        subtotal: subtotal,
        gst: gst,
        deliveryFee: deliveryFee,
        total: total,
      };
      
      // Create order in database
      const result = await supabaseService.createOrder(orderData);
      
      if (result) {
        const { orderId, orderNumber } = result;
        
        // Schedule order notifications
        notificationService.simulateOrderProgress(orderNumber);
        
        // Simulate order progression for real-time demo (after 10 seconds)
        setTimeout(() => {
          supabaseService.simulateOrderProgression(orderId);
        }, 10000);
        
        // Wait for processing animation to complete
        setTimeout(() => {
          // Navigate to order confirmation
          navigation.navigate('OrderSuccess', {
            orderId: orderNumber,
            total: total,
            deliveryDate: checkoutState.deliverySlot?.date || 'Tomorrow',
            deliveryTime: checkoutState.deliverySlot?.timeSlot || '2-4 PM'
          });
          
          // Complete purchase - this will clear cart, update stats
          dispatch({ 
            type: 'COMPLETE_PURCHASE', 
            payload: { 
              orderTotal: total, 
              orderId: orderNumber 
            } 
          });
          
          // Reset checkout state for next order
          checkoutDispatch({ type: 'RESET_CHECKOUT' });
        }, 8000); // Wait for processing animation
      } else {
        console.error('Failed to create order');
        checkoutDispatch({ type: 'SET_ERROR', payload: 'Failed to create order. Please try again.' });
      }
    } catch (error) {
      console.error('Error creating order:', error);
      checkoutDispatch({ type: 'SET_ERROR', payload: 'An error occurred while processing your order.' });
    } finally {
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
      address: checkoutState.address,
      deliverySlot: checkoutState.deliverySlot,
      paymentMethod: checkoutState.paymentMethod,
      cartItems: cartItems,
      orderTotal: total
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
              transform: [{ scale: headerScaleAnim }]
            }
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
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
      
      {/* Content with Animation */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: 200 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }]
          }}
          removeClippedSubviews={true}
          renderToHardwareTextureAndroid={true}
        >
          {currentStep === 'address' && checkoutState.address && (
            <AddressStep 
              address={checkoutState.address}
              onContinue={handleUpdateAddress}
            />
          )}
          
          {currentStep === 'delivery' && checkoutState.address && (
            <DeliveryStep
              address={checkoutState.address}
              onSelectSlot={handleSelectDeliverySlot}
              subtotal={subtotal}
            />
          )}
          
          {currentStep === 'payment' && (
            <PaymentStep
              onSelectMethod={handleSelectPaymentMethod}
              total={total}
            />
          )}
          
          {currentStep === 'review' && checkoutState.address && (
            <ReviewStep
              cart={cartItems.map(item => ({
                product: {
                  id: item.product.id,
                  name: item.product.name,
                  price: getUserRole(state.user) === 'trade' ? item.product.tradePrice : item.product.retailPrice,
                  imageUrl: item.product.imageUrl
                },
                quantity: item.quantity
              }))}
              address={checkoutState.address}
              deliverySlot={checkoutState.deliverySlot}
              paymentMethod={checkoutState.paymentMethod}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              total={total}
              onPlaceOrder={handlePlaceOrder}
            />
          )}
          
          {currentStep === 'processing' && (
            <ProcessingStep
              onComplete={() => {
                // Processing complete - order should be created by now
                console.log('Processing complete');
              }}
            />
          )}
          
          {/* Extra padding to ensure footer button doesn't cover content */}
          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>
      
      {/* Footer Actions */}
      {currentStep !== 'processing' && (
        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom }]}>
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
                    })
                  }
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
                          transform: [{
                            scale: stepAnimations[index].interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1.1],
                            })
                          }]
                        }
                      ]}
                    >
                      {isCompleted && (
                        <Animated.View
                          style={{
                            opacity: stepAnimations[index],
                            transform: [{ scale: stepAnimations[index] }]
                          }}
                        >
                          <Ionicons name="checkmark" size={14} color={COLORS.accent} />
                        </Animated.View>
                      )}
                      {isActive && (
                        <Animated.View
                          style={{
                            opacity: stepAnimations[index],
                            transform: [{ scale: stepAnimations[index] }]
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
                            })
                          }
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
                currentStep === 'address' ? 'Continue to Delivery' :
                currentStep === 'delivery' ? 'Continue to Payment' :
                currentStep === 'payment' ? 'Continue to Review' :
                currentStep === 'review' ? `Place Order • ${formatFinancialAmount(total)}` :
                'Continue'
              }
              onPress={currentStep === 'review' ? handlePlaceOrder : () => {
                if (isAnimating || !canContinue()) return;
                
                const validationData = {
                  address: checkoutState.address,
                  deliverySlot: checkoutState.deliverySlot,
                  paymentMethod: checkoutState.paymentMethod
                };
                
                goToNextStep(validationData);
              }}
              disabled={!canContinue() || isAnimating || checkoutState.isProcessing}
              type={currentStep === 'review' ? "success" : "primary"}
              icon={currentStep === 'review' ? "checkmark-circle" : "arrow-forward"}
              iconPosition={currentStep === 'review' ? "left" : "right"}
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
    backgroundColor: COLORS.surface,
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
}); 