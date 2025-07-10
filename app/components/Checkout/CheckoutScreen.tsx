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
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddressStep from './AddressStep';
import DeliveryStep from './DeliveryStep';
import PaymentStep from './PaymentStep';
import ReviewStep from './ReviewStep';
import ProcessingStep from './ProcessingStep';
import { products } from '../../data/mockProducts';
import AnimatedButton from '../UI/AnimatedButton';
import AnimatedFeedback from '../UI/AnimatedFeedback';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING } from '../../utils/theme';
import { AppContext } from '../../context/AppContext';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';
import { calculateOrderTotal, formatPrice } from '../../utils/pricing';
import { HapticFeedback } from '../../utils/haptics';
import notificationService from '../../services/notificationService';

const { width } = Dimensions.get('window');

// Mock cart items for checkout demo
const mockCartItems = [
  { 
    product: products[0],
    quantity: 1
  },
  { 
    product: products[1],
    quantity: 1
  }
];

// Checkout steps
type CheckoutStep = 'address' | 'delivery' | 'payment' | 'review' | 'processing';

// Address type
export interface DeliveryAddress {
  name: string;
  street: string;
  unit?: string;
  city: string;
  postalCode: string;
  phone: string;
  isDefault?: boolean;
}

// Delivery slot type
export interface DeliverySlot {
  id: string;
  date: string;
  timeSlot: string;
  queueCount: number;
  sameDayAvailable: boolean;
  price: number;
}

// Payment method type
export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  isDefault?: boolean;
}

// Checkout state
interface CheckoutState {
  address: DeliveryAddress;
  deliverySlot: DeliverySlot | null;
  paymentMethod: PaymentMethod | null;
}

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = React.useContext(AppContext);
  const { deliveryLocation } = useDeliveryLocation();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
  const [isProcessing, setIsProcessing] = useState(false);
  // Create a ref for the scroll view
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation values for smooth transitions
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const headerScaleAnim = useRef(new Animated.Value(1)).current;
  
  // Convert delivery location to address format
  const getInitialAddress = (): DeliveryAddress => {
    if (deliveryLocation) {
      // Extract postal code from subtitle
      const postalCodeMatch = deliveryLocation.subtitle?.match(/\b\d{6}\b/);
      const postalCode = postalCodeMatch ? postalCodeMatch[0] : '';
      
      // Extract city (usually Singapore for SG addresses)
      const city = deliveryLocation.subtitle?.includes('Singapore') ? 'Singapore' : '';
      
      return {
        name: 'John Doe', // This will be filled by user in the form
        street: deliveryLocation.title,
        unit: '',
        city: city,
        postalCode: postalCode,
        phone: '+65 9123 4567', // This will be filled by user in the form
        isDefault: false
      };
    }
    
    // Default address if no delivery location is set
    return {
      name: 'John Doe',
      street: '123 Marina Bay Sands',
      unit: '#12-34',
      city: 'Singapore',
      postalCode: '018956',
      phone: '+65 9123 4567',
      isDefault: true
    };
  };

  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    address: getInitialAddress(),
    deliverySlot: null,
    paymentMethod: null
  });
  
  // Use actual cart items from context - redirect if empty
  const contextCartItems = state.cart;
  
  // Redirect to cart if empty
  React.useEffect(() => {
    if (contextCartItems.length === 0) {
      navigation.navigate('Main', { screen: 'Cart' });
    }
  }, [contextCartItems.length, navigation]);
  
  // Transform context cart items to checkout format
  const cartItems = contextCartItems.map(item => ({
    product: {
      ...item.product,
      imageUrl: item.product.image, // Map image to imageUrl for compatibility
    },
    quantity: item.quantity
  }));
  
  // Calculate totals using centralized pricing utility
  const orderTotals = calculateOrderTotal(
    cartItems, 
    state.user?.role || 'retail',
    checkoutState.deliverySlot?.id === 'same_day' ? 'same_day' : 
    checkoutState.deliverySlot?.id === 'express' ? 'express' : 'standard'
  );
  
  const subtotal = orderTotals.subtotal;
  const gst = orderTotals.gst;
  const deliveryFee = orderTotals.deliveryFee;
  const total = orderTotals.finalTotal;
  
  // Calculate current step index for animations
  const steps: CheckoutStep[] = ['address', 'delivery', 'payment', 'review', 'processing'];
  const currentStepIndex = steps.indexOf(currentStep);
  
  // Animate progress bar when step changes
  useEffect(() => {
    const progressValue = currentStepIndex / (steps.length - 1);
    Animated.timing(progressAnim, {
      toValue: progressValue,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentStepIndex]);
  
  // Helper function to change step with smooth animations
  const changeStep = (newStep: CheckoutStep, direction: 'forward' | 'backward' = 'forward') => {
    HapticFeedback.light();
    
    const slideDirection = direction === 'forward' ? -width : width;
    const slideStart = direction === 'forward' ? width : -width;
    
    // Animate slide transition
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: slideDirection,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(newStep);
      slideAnim.setValue(slideStart);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Scroll to top when changing steps
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    });
  };
  
  const handleUpdateAddress = (address: DeliveryAddress) => {
    setCheckoutState({
      ...checkoutState,
      address
    });
    changeStep('delivery', 'forward');
  };
  
  const handleSelectDeliverySlot = (slot: DeliverySlot) => {
    setCheckoutState({
      ...checkoutState,
      deliverySlot: slot
    });
    changeStep('payment', 'forward');
  };
  
  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setCheckoutState({
      ...checkoutState,
      paymentMethod: method
    });
    changeStep('review', 'forward');
  };
  
  const handlePlaceOrder = () => {
    changeStep('processing', 'forward');
    setIsProcessing(true);
    
    // Simulate order processing
    setTimeout(() => {
      setIsProcessing(false);
      
      const orderId = `ORD-${Math.floor(Math.random() * 10000)}`;
      
      // Complete purchase - this will clear cart, update stats, and show achievement
      dispatch({ 
        type: 'COMPLETE_PURCHASE', 
        payload: { 
          orderTotal: total, 
          orderId 
        } 
      });
      
      // Schedule order notifications
      notificationService.simulateOrderProgress(orderId);
      
      // Navigate to order confirmation with proper params
      navigation.navigate('OrderSuccess', {
        orderId,
        total: total,
        deliveryDate: checkoutState.deliverySlot?.date || 'Tomorrow',
        deliveryTime: checkoutState.deliverySlot?.timeSlot || '2-4 PM'
      });
    }, 2500);
  };
  
  const handleGoBack = () => {
    if (currentStep === 'address') {
      navigation.goBack();
    } else if (currentStep === 'delivery') {
      changeStep('address', 'backward');
    } else if (currentStep === 'payment') {
      changeStep('delivery', 'backward');
    } else if (currentStep === 'review') {
      changeStep('payment', 'backward');
    }
  };
  
  const getStepTitle = () => {
    switch (currentStep) {
      case 'address':
        return 'Delivery Address';
      case 'delivery':
        return 'Delivery Time';
      case 'payment':
        return 'Payment Method';
      case 'review':
        return 'Review Order';
      case 'processing':
        return 'Processing';
    }
  };
  
  const canContinue = () => {
    switch (currentStep) {
      case 'address':
        return checkoutState.address.street && checkoutState.address.postalCode;
      case 'delivery':
        return checkoutState.deliverySlot !== null;
      case 'payment':
        return checkoutState.paymentMethod !== null;
      case 'review':
        return true;
      case 'processing':
        return false;
    }
  };
  
  // Calculate progress percentage for progress bar
  const getProgressPercentage = (): string => {
    switch (currentStep) {
      case 'address':
        return '25%';
      case 'delivery':
        return '50%';
      case 'payment':
        return '75%';
      case 'review':
      case 'processing':
        return '100%';
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <StatusBar barStyle="dark-content" />
      
      {/* Enhanced Header */}
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
          disabled={currentStep === 'processing'}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getStepTitle()}</Text>
        <View style={styles.placeholder} />
      </Animated.View>
      
      {/* Enhanced Progress Bar */}
      <View style={styles.progressContainer}>
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
          <View style={[
            styles.stepDot, 
            currentStep !== 'address' ? styles.completedStepDot : styles.activeStepDot
          ]}>
            {currentStep !== 'address' && <Ionicons name="checkmark" size={14} color={COLORS.accent} />}
          </View>
          
          <View style={styles.stepLine} />
          
          <View style={[
            styles.stepDot, 
            currentStep === 'address' ? styles.inactiveStepDot : 
            currentStep !== 'delivery' ? styles.completedStepDot : 
            styles.activeStepDot
          ]}>
            {currentStep !== 'address' && currentStep !== 'delivery' && 
              <Ionicons name="checkmark" size={14} color={COLORS.accent} />
            }
          </View>
          
          <View style={styles.stepLine} />
          
          <View style={[
            styles.stepDot, 
            (currentStep === 'address' || currentStep === 'delivery') ? styles.inactiveStepDot : 
            currentStep !== 'payment' ? styles.completedStepDot : 
            styles.activeStepDot
          ]}>
            {(currentStep === 'review' || currentStep === 'processing') && 
              <Ionicons name="checkmark" size={14} color={COLORS.accent} />
            }
          </View>
          
          <View style={styles.stepLine} />
          
          <View style={[
            styles.stepDot, 
            (currentStep === 'address' || currentStep === 'delivery' || currentStep === 'payment') ? 
              styles.inactiveStepDot : styles.activeStepDot
          ]}>
            {currentStep === 'processing' && 
              <Ionicons name="checkmark" size={14} color={COLORS.accent} />
            }
          </View>
        </View>
      </View>
      
      {/* Content with Animation */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }]
          }}
        >
          {currentStep === 'address' && (
            <AddressStep 
              address={checkoutState.address}
              onContinue={handleUpdateAddress}
            />
          )}
          
          {currentStep === 'delivery' && (
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
          
          {currentStep === 'review' && (
            <ReviewStep
              cart={cartItems}
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
            <ProcessingStep />
          )}
          
          {/* Extra padding to ensure footer button doesn't cover content */}
          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>
      
      {/* Footer Actions */}
      {currentStep !== 'processing' && currentStep !== 'review' && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <AnimatedButton
            label="Continue"
            onPress={() => {
              if (currentStep === 'address' && canContinue()) {
                changeStep('delivery', 'forward');
              } else if (currentStep === 'delivery' && canContinue()) {
                changeStep('payment', 'forward');
              } else if (currentStep === 'payment' && canContinue()) {
                changeStep('review', 'forward');
              }
            }}
            disabled={!canContinue()}
            icon="arrow-forward"
            iconPosition="right"
            fullWidth={true}
          />
        </View>
      )}
      
      {currentStep === 'review' && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <AnimatedButton
            label={`Place Order • ${formatPrice(total, false)}`}
            onPress={handlePlaceOrder}
            type="primary"
            icon="checkmark-circle"
            iconPosition="left"
            fullWidth={true}
          />
        </View>
      )}
      
      {/* Feedback notification */}
      <AnimatedFeedback
        visible={currentStep === 'processing'}
        message="Processing your order..."
        type="loading"
        position="bottom"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statusBarBackground: {
    backgroundColor: COLORS.card, // Extends header color into notch
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
    backgroundColor: COLORS.text,
    borderRadius: 3,
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
    backgroundColor: COLORS.primary,
    borderWidth: 0,
  },
  inactiveStepDot: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  completedStepDot: {
    backgroundColor: COLORS.success,
    borderWidth: 0,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  footer: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.medium,
    elevation: 8,
  },
}); 