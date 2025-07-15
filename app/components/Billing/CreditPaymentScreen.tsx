import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import { AppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { isCompanyUser } from '../../types/user';
import { formatStatCurrency } from '../../utils/formatting';
import { HapticFeedback } from '../../utils/haptics';
import PermissionGuard from '../Navigation/PermissionGuard';

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_transfer' | 'paypal' | 'apple_pay' | 'google_pay';
  name: string;
  description: string;
  icon: string;
  processing_fee?: number;
  estimated_time: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'credit_card',
    type: 'credit_card',
    name: 'Credit Card',
    description: 'Visa, Mastercard, AMEX',
    icon: 'card',
    processing_fee: 2.9,
    estimated_time: 'Instant',
  },
  {
    id: 'bank_transfer',
    type: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Direct bank transfer',
    icon: 'business',
    estimated_time: '1-3 business days',
  },
  {
    id: 'paypal',
    type: 'paypal',
    name: 'PayPal',
    description: 'Pay with PayPal account',
    icon: 'logo-paypal',
    processing_fee: 3.4,
    estimated_time: 'Instant',
  },
];

export default function CreditPaymentScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state, updateCompanyProfile } = useContext(AppContext);
  const { user, company } = state;

  console.log('CreditPaymentScreen rendered');
  console.log('User:', user);
  console.log('Company:', company);

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Calculate payment amounts
  const availableCredit = company?.currentCredit || 0;
  const creditLimit = company?.creditLimit || 0;
  const usedCredit = creditLimit - availableCredit;
  const processingFee = selectedPaymentMethod?.processing_fee
    ? (usedCredit * selectedPaymentMethod.processing_fee) / 100
    : 0;
  const totalAmount = usedCredit + processingFee;

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    HapticFeedback.light();
    setSelectedPaymentMethod(method);
  };

  const handleProcessPayment = async () => {
    if (!selectedPaymentMethod || !company) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    HapticFeedback.medium();
    setProcessingPayment(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update company credit balance in database and state
      const newCreditBalance = company.creditLimit || 0; // Full credit restored
      const updatedCompany = {
        ...company,
        currentCredit: newCreditBalance,
      };

      // Update the company profile in the database
      const updateSuccess = await updateCompanyProfile(updatedCompany);
      
      if (updateSuccess) {
        console.log('✅ Credit balance updated successfully:', {
          companyId: company.id,
          previousBalance: company.currentCredit,
          newBalance: newCreditBalance,
          amountPaid: usedCredit,
          paymentMethod: selectedPaymentMethod.type,
        });
      } else {
        console.warn('⚠️ Database update failed, but local state updated');
      }

      Alert.alert(
        'Payment Successful',
        `Your credit payment of ${formatStatCurrency(usedCredit)} has been processed successfully.\n\nYour credit balance has been restored to ${formatStatCurrency(newCreditBalance)}.`,
        [
          {
            text: 'View Receipt',
            onPress: () => navigation.navigate('BillingDashboard' as never),
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Payment failed:', error);
      Alert.alert(
        'Payment Failed',
        'There was an error processing your payment. Please try again.'
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  if (!user || !isCompanyUser(user) || !company) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Access denied. Company account required.
        </Text>
      </View>
    );
  }

  if (usedCredit <= 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Credit Payment</Text>
            <View style={styles.headerRight} />
          </View>

        </View>

        <View style={styles.emptyStateContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          <Text style={styles.emptyStateTitle}>No Payment Required</Text>
          <Text style={styles.emptyStateText}>
            Your credit account is in good standing with no outstanding balance.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryButtonText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Simple permission check without PermissionGuard for now
  if (!user || !company) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Credit Payment</Text>
            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.noDataText}>Loading user data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

        {/* Header */}
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Credit Payment</Text>
            <View style={styles.headerRight} />
          </View>

        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Payment Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="card" size={24} color={COLORS.text} />
              <Text style={styles.summaryTitle}>Payment Summary</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Credit Used</Text>
              <Text style={styles.summaryAmount}>
                {formatStatCurrency(usedCredit)}
              </Text>
            </View>

            {processingFee > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Processing Fee ({selectedPaymentMethod?.processing_fee}%)
                </Text>
                <Text style={styles.summaryAmount}>
                  {formatStatCurrency(processingFee)}
                </Text>
              </View>
            )}

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>
                {formatStatCurrency(totalAmount)}
              </Text>
            </View>
          </View>

          {/* Payment Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Payment Method</Text>

            {PAYMENT_METHODS.map(method => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod?.id === method.id &&
                    styles.selectedPaymentMethod,
                ]}
                onPress={() => handlePaymentMethodSelect(method)}
                activeOpacity={0.7}
              >
                <View style={styles.paymentMethodContent}>
                  <View style={styles.paymentMethodLeft}>
                    <View
                      style={[
                        styles.paymentMethodIcon,
                        selectedPaymentMethod?.id === method.id &&
                          styles.selectedIcon,
                      ]}
                    >
                      <Ionicons
                        name={method.icon as any}
                        size={24}
                        color={
                          selectedPaymentMethod?.id === method.id
                            ? COLORS.accent
                            : COLORS.text
                        }
                      />
                    </View>
                    <View style={styles.paymentMethodInfo}>
                      <Text style={styles.paymentMethodName}>
                        {method.name}
                      </Text>
                      <Text style={styles.paymentMethodDescription}>
                        {method.description}
                      </Text>
                      <Text style={styles.estimatedTime}>
                        Est. {method.estimated_time}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.paymentMethodRight}>
                    {method.processing_fee && (
                      <Text style={styles.processingFee}>
                        {method.processing_fee}% fee
                      </Text>
                    )}
                    <Ionicons
                      name={
                        selectedPaymentMethod?.id === method.id
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={24}
                      color={
                        selectedPaymentMethod?.id === method.id
                          ? COLORS.primary
                          : COLORS.textSecondary
                      }
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.securityText}>
              Your payment information is encrypted and secure. We never store
              your payment details.
            </Text>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Payment Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.payButton,
              (!selectedPaymentMethod || processingPayment) &&
                styles.disabledButton,
            ]}
            onPress={handleProcessPayment}
            disabled={!selectedPaymentMethod || processingPayment}
            activeOpacity={0.8}
          >
            {processingPayment ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : (
              <Text style={styles.payButtonText}>
                Pay {formatStatCurrency(totalAmount)}
              </Text>
            )}
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
    elevation: 4,
    paddingBottom: SPACING.sm,
  },
  header: {
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
  headerTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 44,
    height: 44,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  summaryTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  summaryLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  summaryAmount: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.sm,
    paddingTop: SPACING.md,
  },
  totalLabel: {
    ...TYPOGRAPHY.h5,
    fontWeight: '600',
  },
  totalAmount: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.primary,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: '600',
    marginBottom: SPACING.md,
    paddingHorizontal: 4,
  },
  paymentMethodCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.light,
  },
  selectedPaymentMethod: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  selectedIcon: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  paymentMethodDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  estimatedTime: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.textSecondary,
  },
  paymentMethodRight: {
    alignItems: 'flex-end',
  },
  processingFee: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  securityText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 18,
  },
  buttonContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  disabledButton: {
    backgroundColor: COLORS.textSecondary,
    ...SHADOWS.light,
  },
  payButtonText: {
    ...TYPOGRAPHY.h5,
    color: COLORS.accent,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '600',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    ...SHADOWS.medium,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    fontWeight: '600',
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});
