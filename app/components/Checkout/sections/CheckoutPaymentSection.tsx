/**
 * CheckoutPaymentSection - Payment method selection for unified checkout
 */
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentMethod } from '../../../types/checkout';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../../utils/theme';
import { HapticFeedback } from '../../../utils/haptics';
import { AppContext } from '../../../context/AppContext';
import { formatFinancialAmount } from '../../../utils/formatting';

interface Props {
  selectedMethod: PaymentMethod | null;
  onSelectMethod: (method: PaymentMethod) => void;
  onComplete: () => void;
  total: number;
  onVoucherApply?: (voucherId: string, value: number) => void;
  appliedVoucherId?: string | null;
}

// Payment method options
const PAYMENT_METHODS: Array<{
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'COD' | 'credit_card' | 'NET30' | 'NET60';
  requiresCompany?: boolean;
}> = [
  {
    id: 'digital_cod',
    name: 'Digital COD',
    description: 'Pay on delivery with digital confirmation',
    icon: 'phone-portrait-outline',
    type: 'COD',
  },
  {
    id: 'card',
    name: 'Credit / Debit Card',
    description: 'Visa, Mastercard, American Express',
    icon: 'card-outline',
    type: 'credit_card',
  },
  {
    id: 'credit_net30',
    name: 'Credit Terms (NET30)',
    description: 'Pay within 30 days',
    icon: 'calendar-outline',
    type: 'NET30',
    requiresCompany: true,
  },
];

// Mock vouchers
const AVAILABLE_VOUCHERS = [
  {
    id: 'WELCOME10',
    code: 'WELCOME10',
    discount: 10,
    type: 'percentage',
    minOrder: 50,
  },
  { id: 'FLAT20', code: 'FLAT20', discount: 20, type: 'fixed', minOrder: 100 },
];

export default function CheckoutPaymentSection({
  selectedMethod,
  onSelectMethod,
  onComplete,
  total,
  onVoucherApply,
  appliedVoucherId,
}: Props) {
  const { state } = useContext(AppContext);
  const { user, company } = state;

  const [voucherCode, setVoucherCode] = useState('');
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

  const isCompanyUser = user?.accountType === 'company';
  const isCreditApproved = isCompanyUser && company?.status === 'active';
  const creditLimit = company?.creditLimit || 0;
  const creditAvailable = company?.currentCredit || 0;

  const handleSelectMethod = (method: (typeof PAYMENT_METHODS)[0]) => {
    HapticFeedback.selection();

    const paymentMethod: PaymentMethod = {
      id: method.id,
      type: method.type,
      name: method.name,
      icon: method.icon,
    };

    onSelectMethod(paymentMethod);
  };

  const handleApplyVoucher = () => {
    if (!voucherCode.trim()) {
      setVoucherError('Enter a voucher code');
      return;
    }

    setIsApplyingVoucher(true);
    setVoucherError(null);

    // Simulate API call
    setTimeout(() => {
      const voucher = AVAILABLE_VOUCHERS.find(
        v => v.code.toLowerCase() === voucherCode.trim().toLowerCase()
      );

      if (!voucher) {
        setVoucherError('Invalid voucher code');
        setIsApplyingVoucher(false);
        HapticFeedback.error();
        return;
      }

      if (total < voucher.minOrder) {
        setVoucherError(`Minimum order of $${voucher.minOrder} required`);
        setIsApplyingVoucher(false);
        HapticFeedback.error();
        return;
      }

      const discountValue =
        voucher.type === 'percentage'
          ? total * (voucher.discount / 100)
          : voucher.discount;

      onVoucherApply?.(voucher.id, discountValue);
      setIsApplyingVoucher(false);
      HapticFeedback.success();
    }, 500);
  };

  const handleRemoveVoucher = () => {
    HapticFeedback.light();
    onVoucherApply?.('', 0);
    setVoucherCode('');
    setVoucherError(null);
  };

  const handleContinue = () => {
    if (selectedMethod) {
      HapticFeedback.success();
      onComplete();
    } else {
      HapticFeedback.error();
    }
  };

  const appliedVoucher = appliedVoucherId
    ? AVAILABLE_VOUCHERS.find(v => v.id === appliedVoucherId)
    : null;

  return (
    <View style={styles.container}>
      {/* Voucher Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Voucher Code</Text>
        {appliedVoucher ? (
          <View style={styles.appliedVoucher}>
            <View style={styles.appliedVoucherContent}>
              <Ionicons name="pricetag" size={20} color="#4CAF50" />
              <View style={styles.appliedVoucherText}>
                <Text style={styles.appliedVoucherCode}>
                  {appliedVoucher.code}
                </Text>
                <Text style={styles.appliedVoucherDiscount}>
                  {appliedVoucher.type === 'percentage'
                    ? `${appliedVoucher.discount}% off`
                    : `$${appliedVoucher.discount} off`}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeVoucherButton}
              onPress={handleRemoveVoucher}
            >
              <Ionicons name="close" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.voucherInput}>
            <TextInput
              style={styles.voucherTextInput}
              value={voucherCode}
              onChangeText={setVoucherCode}
              placeholder="Enter voucher code"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[
                styles.applyVoucherButton,
                !voucherCode.trim() && styles.applyVoucherButtonDisabled,
              ]}
              onPress={handleApplyVoucher}
              disabled={!voucherCode.trim() || isApplyingVoucher}
            >
              <Text style={styles.applyVoucherButtonText}>
                {isApplyingVoucher ? 'Applying...' : 'Apply'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {voucherError && (
          <Text style={styles.voucherErrorText}>{voucherError}</Text>
        )}
      </View>

      {/* Payment Methods */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.methodsContainer}>
          {PAYMENT_METHODS.map(method => {
            // Skip company-only methods for non-company users
            if (method.requiresCompany && !isCompanyUser) return null;

            // Check if credit is approved
            const isCreditMethod =
              method.type === 'NET30' || method.type === 'NET60';
            const isDisabled = isCreditMethod && !isCreditApproved;
            const isSelected = selectedMethod?.id === method.id;

            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodCard,
                  isSelected && styles.methodCardSelected,
                  isDisabled && styles.methodCardDisabled,
                ]}
                onPress={() => !isDisabled && handleSelectMethod(method)}
                disabled={isDisabled}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.methodIcon,
                    isSelected && styles.methodIconSelected,
                  ]}
                >
                  <Ionicons
                    name={method.icon as any}
                    size={22}
                    color={isSelected ? COLORS.card : COLORS.text}
                  />
                </View>
                <View style={styles.methodInfo}>
                  <Text
                    style={[
                      styles.methodName,
                      isSelected && styles.methodNameSelected,
                      isDisabled && styles.methodNameDisabled,
                    ]}
                  >
                    {method.name}
                  </Text>
                  <Text
                    style={[
                      styles.methodDescription,
                      isDisabled && styles.methodDescriptionDisabled,
                    ]}
                  >
                    {isCreditMethod && !isCreditApproved
                      ? 'Not approved for credit terms'
                      : isCreditMethod && isCreditApproved
                        ? `Available: ${formatFinancialAmount(creditAvailable)}`
                        : method.description}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Security Note */}
      <View style={styles.securityNote}>
        <Ionicons name="shield-checkmark-outline" size={18} color="#4CAF50" />
        <Text style={styles.securityText}>
          All transactions are secure and encrypted
        </Text>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          !selectedMethod && styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        disabled={!selectedMethod}
        activeOpacity={0.8}
      >
        <Text style={styles.continueButtonText}>Review Order</Text>
        <Ionicons name="arrow-forward" size={18} color={COLORS.card} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.lg,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  voucherInput: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  voucherTextInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  applyVoucherButton: {
    backgroundColor: COLORS.text,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    justifyContent: 'center',
  },
  applyVoucherButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  applyVoucherButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.card,
  },
  voucherErrorText: {
    ...TYPOGRAPHY.small,
    color: '#F44336',
  },
  appliedVoucher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  appliedVoucherContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  appliedVoucherText: {
    gap: 2,
  },
  appliedVoucherCode: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: '#2E7D32',
  },
  appliedVoucherDiscount: {
    ...TYPOGRAPHY.small,
    color: '#4CAF50',
  },
  removeVoucherButton: {
    padding: SPACING.xs,
  },
  methodsContainer: {
    gap: SPACING.sm,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  methodCardSelected: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.text,
    borderWidth: 2,
    ...SHADOWS.light,
  },
  methodCardDisabled: {
    opacity: 0.5,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  methodIconSelected: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  methodNameSelected: {
    fontWeight: '700',
  },
  methodNameDisabled: {
    color: COLORS.textSecondary,
  },
  methodDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  methodDescriptionDisabled: {
    color: COLORS.textSecondary,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  radioOuterSelected: {
    borderColor: COLORS.text,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.text,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    padding: SPACING.sm,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  securityText: {
    ...TYPOGRAPHY.small,
    color: '#2E7D32',
    fontWeight: '500',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.text,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  continueButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.card,
  },
});
