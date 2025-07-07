import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  StatusBar
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
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../utils/theme';
import { AppContext } from '../../context/AppContext';

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
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    address: {
      name: 'John Doe',
      street: '123 Marina Bay Sands',
      unit: '#12-34',
      city: 'Singapore',
      postalCode: '018956',
      phone: '+65 9123 4567',
      isDefault: true
    },
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
  
  // Calculate subtotal and total
  const subtotal = cartItems.reduce(
    (sum, item) => {
      const price = state.user?.role === 'trade' ? item.product.tradePrice : item.product.retailPrice;
      return sum + price * item.quantity;
    }, 
    0
  );
  const deliveryFee = checkoutState.deliverySlot?.price || 0;
  const total = subtotal + deliveryFee;
  
  const handleUpdateAddress = (address: DeliveryAddress) => {
    setCheckoutState({
      ...checkoutState,
      address
    });
    setCurrentStep('delivery');
  };
  
  const handleSelectDeliverySlot = (slot: DeliverySlot) => {
    setCheckoutState({
      ...checkoutState,
      deliverySlot: slot
    });
    setCurrentStep('payment');
  };
  
  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setCheckoutState({
      ...checkoutState,
      paymentMethod: method
    });
    setCurrentStep('review');
  };
  
  const handlePlaceOrder = () => {
    setCurrentStep('processing');
    setIsProcessing(true);
    
    // Simulate order processing
    setTimeout(() => {
      setIsProcessing(false);
      
      // Clear the cart after successful order
      dispatch({ type: 'CLEAR_CART' });
      
      // Navigate to order confirmation with proper params
      navigation.navigate('OrderSuccess', {
        orderId: `ORD-${Math.floor(Math.random() * 10000)}`,
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
      setCurrentStep('address');
    } else if (currentStep === 'payment') {
      setCurrentStep('delivery');
    } else if (currentStep === 'review') {
      setCurrentStep('payment');
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleGoBack}
          disabled={currentStep === 'processing'}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getStepTitle()}</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View 
            style={[
              styles.progressBar,
              { width: getProgressPercentage() }
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
      
      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
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
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Footer Actions */}
      {currentStep !== 'processing' && currentStep !== 'review' && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <AnimatedButton
            label="Continue"
            onPress={() => {
              if (currentStep === 'address' && canContinue()) {
                setCurrentStep('delivery');
              } else if (currentStep === 'delivery' && canContinue()) {
                setCurrentStep('payment');
              } else if (currentStep === 'payment' && canContinue()) {
                setCurrentStep('review');
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
            label={`Place Order • $${total.toFixed(0)}`}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 2,
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
    padding: 16,
    paddingTop: 8,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.medium,
  },
}); 