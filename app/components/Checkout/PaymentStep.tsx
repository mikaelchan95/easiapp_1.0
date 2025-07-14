import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentMethod } from '../../types/checkout';
import { TYPOGRAPHY, COLORS, SPACING, SHADOWS } from '../../utils/theme';

// Payment method options
const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'digital_cod',
    name: 'Digital COD',
    icon: 'cash-outline',
    isDefault: true,
  },
  {
    id: 'wallet',
    name: 'Digital Wallet',
    icon: 'wallet-outline',
    isDefault: false,
  },
  {
    id: 'credit',
    name: 'Credit Terms',
    icon: 'card-outline',
    isDefault: false,
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: 'card-outline',
    isDefault: false,
  },
];

interface PaymentStepProps {
  onSelectMethod: (method: PaymentMethod) => void;
  total: number;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ onSelectMethod, total }) => {
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    PAYMENT_METHODS[0].id
  );

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethodId(method.id);
    onSelectMethod(method);
  };

  // Find selected payment method
  const selectedMethod =
    PAYMENT_METHODS.find(m => m.id === selectedMethodId) || PAYMENT_METHODS[0];

  // Digital wallet balance (mock)
  const walletBalance = 200;
  const hasEnoughBalance = walletBalance >= total;

  // Credit status (mock)
  const creditLimit = 5000;
  const creditAvailable = 3500;
  const isCreditApproved = true;

  return (
    <View style={styles.container}>
      <View style={styles.methodsContainer}>
        {PAYMENT_METHODS.map(method => {
          // Disable wallet option if balance is insufficient
          const isWalletDisabled = method.id === 'wallet' && !hasEnoughBalance;

          // Disable credit option if not approved
          const isCreditDisabled = method.id === 'credit' && !isCreditApproved;

          // Check if method is disabled
          const isDisabled = isWalletDisabled || isCreditDisabled;

          return (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethodId === method.id && styles.selectedMethodCard,
                isDisabled && styles.disabledMethodCard,
              ]}
              onPress={() => !isDisabled && handleSelectMethod(method)}
              disabled={isDisabled}
            >
              <View style={styles.methodContent}>
                <View
                  style={[
                    styles.methodIcon,
                    selectedMethodId === method.id && styles.selectedMethodIcon,
                  ]}
                >
                  <Ionicons
                    name={method.icon as any}
                    size={20}
                    color={selectedMethodId === method.id ? '#fff' : '#1a1a1a'}
                  />
                </View>

                <View style={styles.methodInfo}>
                  <Text
                    style={[
                      styles.methodName,
                      selectedMethodId === method.id &&
                        styles.selectedMethodText,
                      isDisabled && styles.disabledMethodText,
                    ]}
                  >
                    {method.name}
                  </Text>

                  {method.id === 'digital_cod' && (
                    <Text style={styles.methodDescription}>
                      Pay on delivery with digital confirmation
                    </Text>
                  )}

                  {method.id === 'wallet' && (
                    <Text
                      style={[
                        styles.methodDescription,
                        !hasEnoughBalance && styles.errorText,
                      ]}
                    >
                      {hasEnoughBalance
                        ? `Balance: $${walletBalance.toFixed(0)}`
                        : `Insufficient balance: $${walletBalance.toFixed(0)}`}
                    </Text>
                  )}

                  {method.id === 'credit' && (
                    <Text
                      style={[
                        styles.methodDescription,
                        !isCreditApproved && styles.errorText,
                      ]}
                    >
                      {isCreditApproved
                        ? `Available: $${creditAvailable.toFixed(0)} of $${creditLimit.toFixed(0)}`
                        : 'Not approved for credit terms'}
                    </Text>
                  )}

                  {method.id === 'card' && (
                    <Text style={styles.methodDescription}>
                      Visa, Mastercard, American Express
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radioOuter,
                    selectedMethodId === method.id && styles.selectedRadioOuter,
                  ]}
                >
                  {selectedMethodId === method.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Payment Method Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Payment Details</Text>

        {selectedMethod.id === 'digital_cod' && (
          <View style={styles.detailsContent}>
            <View style={styles.detailsIconContainer}>
              <Ionicons
                name="phone-portrait-outline"
                size={40}
                color="#1a1a1a"
              />
            </View>
            <Text style={styles.detailsText}>
              You'll be asked to confirm payment digitally when your order is
              delivered. No cash handling needed.
            </Text>
          </View>
        )}

        {selectedMethod.id === 'wallet' && hasEnoughBalance && (
          <View style={styles.detailsContent}>
            <View style={styles.detailsIconContainer}>
              <Ionicons name="wallet-outline" size={40} color="#1a1a1a" />
            </View>
            <Text style={styles.detailsText}>
              ${total.toFixed(2)} will be deducted from your wallet balance upon
              order confirmation.
            </Text>
          </View>
        )}

        {selectedMethod.id === 'credit' && isCreditApproved && (
          <View style={styles.detailsContent}>
            <View style={styles.detailsIconContainer}>
              <Ionicons
                name="document-text-outline"
                size={40}
                color="#1a1a1a"
              />
            </View>
            <Text style={styles.detailsText}>
              This purchase will be added to your credit account. Payment due
              according to your credit terms.
            </Text>
          </View>
        )}

        {selectedMethod.id === 'card' && (
          <View style={styles.detailsContent}>
            <View style={styles.detailsIconContainer}>
              <Ionicons name="card-outline" size={40} color="#1a1a1a" />
            </View>
            <Text style={styles.detailsText}>
              Your card will be charged ${total.toFixed(2)} when your order is
              confirmed.
            </Text>
            <View style={styles.cardLogos}>
              {/* Replace with actual card logos */}
              <View style={styles.cardLogo} />
              <View style={styles.cardLogo} />
              <View style={styles.cardLogo} />
            </View>
          </View>
        )}
      </View>

      {/* Security Note */}
      <View style={styles.securityNote}>
        <Ionicons name="shield-checkmark-outline" size={24} color="#4CAF50" />
        <Text style={styles.securityText}>
          All transactions are secure and encrypted
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  methodsContainer: {
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
    minHeight: 80,
  },
  selectedMethodCard: {
    borderColor: COLORS.text,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
    ...SHADOWS.medium,
  },
  disabledMethodCard: {
    opacity: 0.6,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedMethodIcon: {
    backgroundColor: COLORS.text,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    marginBottom: 4,
    color: COLORS.text,
  },
  selectedMethodText: {
    color: COLORS.text,
  },
  disabledMethodText: {
    color: COLORS.textSecondary,
    opacity: 0.6,
  },
  methodDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  errorText: {
    color: '#F44336',
    fontWeight: '600',
  },
  radioContainer: {
    marginLeft: 12,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadioOuter: {
    borderColor: COLORS.text,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.text,
  },
  detailsContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  detailsTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    marginBottom: SPACING.md,
    color: COLORS.text,
  },
  detailsContent: {
    alignItems: 'center',
  },
  detailsIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailsText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontWeight: '500',
    lineHeight: 22,
  },
  cardLogos: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  cardLogo: {
    width: 40,
    height: 25,
    backgroundColor: COLORS.background,
    borderRadius: 6,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  securityText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    fontWeight: '600',
  },
});

export default PaymentStep;
