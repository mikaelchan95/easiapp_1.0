import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
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
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';
import AddressStep from './AddressStep';
import CheckoutStepIndicator from './CheckoutStepIndicator';

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

export default function CheckoutAddressScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state } = useContext(AppContext);
  const { state: checkoutState, dispatch: checkoutDispatch } = useCheckout();
  const { deliveryLocation } = useDeliveryLocation();

  // Can continue if we have a delivery location OR a complete checkout address
  const canContinue = !!(
    deliveryLocation ||
    (checkoutState.deliveryAddress?.name &&
      checkoutState.deliveryAddress?.address)
  );

  const handleContinue = () => {
    // Additional safety check: if we have a delivery location but no checkout address, set it
    if (deliveryLocation && !checkoutState.deliveryAddress) {
      checkoutDispatch({
        type: 'SET_DELIVERY_ADDRESS',
        payload: {
          id: deliveryLocation.id || 'temp-id',
          name: deliveryLocation.title || 'Selected Location', // Use title from LocationSuggestion
          address: deliveryLocation.address || deliveryLocation.subtitle || '',
          unitNumber: deliveryLocation.unitNumber || '',
          postalCode: deliveryLocation.postalCode || '',
          phone: '', // LocationSuggestion doesn't have phone
          isDefault: false,
        },
      });

      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        navigation.navigate('CheckoutDelivery' as never);
      }, 100);
    } else {
      navigation.navigate('CheckoutDelivery' as never);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

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
            <Text style={styles.headerTitle}>Delivery Address</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <AddressStep
          address={checkoutState.deliveryAddress || DEFAULT_ADDRESS}
          onContinue={address => {
            checkoutDispatch({
              type: 'SET_DELIVERY_ADDRESS',
              payload: address,
            });
          }}
        />
      </ScrollView>

      {/* Step Indicator */}
      <CheckoutStepIndicator currentStep={1} totalSteps={4} />

      {/* Bottom Button */}
      <View
        style={[
          styles.bottomContainer,
          { paddingBottom: insets.bottom + SPACING.sm }, // Just safe area + small padding
        ]}
      >
        <TouchableOpacity
          style={[
            styles.continueButton,
            !canContinue && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={styles.continueButtonText}>Continue to Delivery</Text>
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
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: 0,
    backgroundColor: COLORS.card,
  },
  continueButton: {
    backgroundColor: COLORS.text,
    borderRadius: 16,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.medium,
    elevation: 6,
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
