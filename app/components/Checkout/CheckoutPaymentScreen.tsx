import React, { useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { AppContext } from '../../context/AppContext';
import { useCheckout } from '../../context/CheckoutContext';
import PaymentStep from './PaymentStep';
import CheckoutStepIndicator from './CheckoutStepIndicator';

export default function CheckoutPaymentScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state } = useContext(AppContext);
  const { state: checkoutState, dispatch: checkoutDispatch } = useCheckout();

  const handleContinue = () => {
    if (checkoutState.paymentMethod) {
      navigation.navigate('CheckoutReview' as never);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const isValid = checkoutState.paymentMethod !== null;

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
            <Text style={styles.headerTitle}>Payment Method</Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <PaymentStep 
          onSelectMethod={(method) => {
            checkoutDispatch({ type: 'SET_PAYMENT_METHOD', payload: method });
          }}
          total={state.cart.reduce((sum, item) => sum + (item.product.trade_price || item.product.retail_price) * item.quantity, 0)}
        />
      </ScrollView>

      {/* Step Indicator */}
      <CheckoutStepIndicator 
        currentStep={3}
        totalSteps={4}
      />

      {/* Bottom Button */}
      <View style={[
        styles.bottomContainer,
        { paddingBottom: insets.bottom + SPACING.sm } // Just safe area + small padding
      ]}>
        <TouchableOpacity 
          style={[
            styles.continueButton,
            !isValid && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!isValid}
        >
          <Text style={[
            styles.continueButtonText,
            !isValid && styles.continueButtonTextDisabled
          ]}>
            Review Order
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
    ...SHADOWS.light,
    paddingBottom: SPACING.sm,
  },
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
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
    marginBottom: 2,
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
  continueButton: {
    backgroundColor: COLORS.text,
    borderRadius: 16,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
    elevation: 6,
    minHeight: 56,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  continueButtonText: {
    ...TYPOGRAPHY.h4,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  continueButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
});