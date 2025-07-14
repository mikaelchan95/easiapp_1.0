import React, { useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { AppContext } from '../../context/AppContext';
import { useCheckout } from '../../context/CheckoutContext';
import ProcessingStep from './ProcessingStep';

export default function CheckoutProcessingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state } = useContext(AppContext);
  const { state: checkoutState } = useCheckout();

  // This screen is shown during order processing
  // The actual order creation happens in CheckoutReviewScreen
  // and then navigates to OrderSuccess after completion

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={COLORS.background} />
      
      <View style={styles.content}>
        <ProcessingStep />
        
        <View style={styles.messageContainer}>
          <Text style={styles.processingTitle}>Processing Your Order</Text>
          <Text style={styles.processingSubtitle}>
            Please wait while we confirm your order details and prepare for delivery.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  messageContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  processingTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  processingSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});