/**
 * CheckoutSummarySection - Order summary for unified checkout
 */
import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DeliveryAddress,
  DeliverySlot,
  PaymentMethod,
} from '../../../types/checkout';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../../utils/theme';
import { formatFinancialAmount } from '../../../utils/formatting';
import { getProductImageSource } from '../../../utils/imageUtils';

interface CartItem {
  product: {
    id: string;
    name: string;
    retailPrice: number;
    tradePrice?: number;
    image?: string;
    imageUrl?: string;
  };
  quantity: number;
}

interface Props {
  cartItems: CartItem[];
  subtotal: number;
  gst: number;
  deliveryFee: number;
  voucherDiscount: number;
  total: number;
  deliveryAddress: DeliveryAddress | null;
  deliverySlot: DeliverySlot | null;
  paymentMethod: PaymentMethod | null;
}

export default function CheckoutSummarySection({
  cartItems,
  subtotal,
  gst,
  deliveryFee,
  voucherDiscount,
  total,
  deliveryAddress,
  deliverySlot,
  paymentMethod,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items ({cartItems.length})</Text>
        <View style={styles.itemsList}>
          {cartItems.map((item, index) => {
            const imageSource = getProductImageSource(
              item.product.image || item.product.imageUrl,
              item.product.name
            );
            const price = item.product.tradePrice || item.product.retailPrice;

            return (
              <View
                key={item.product.id}
                style={[
                  styles.itemRow,
                  index === cartItems.length - 1 && styles.itemRowLast,
                ]}
              >
                <Image
                  source={
                    imageSource || {
                      uri: 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?w=100&h=100&fit=crop',
                    }
                  }
                  style={styles.itemImage}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.itemQuantity}>
                    Qty: {item.quantity} × {formatFinancialAmount(price)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  {formatFinancialAmount(price * item.quantity)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Delivery Details */}
      {deliveryAddress && deliverySlot && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={COLORS.text}
                />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>{deliveryAddress.name}</Text>
                <Text style={styles.detailSubvalue}>
                  {deliveryAddress.address}
                  {deliveryAddress.unitNumber
                    ? `, ${deliveryAddress.unitNumber}`
                    : ''}
                </Text>
                <Text style={styles.detailSubvalue}>
                  Singapore {deliveryAddress.postalCode}
                </Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={COLORS.text}
                />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Schedule</Text>
                <Text style={styles.detailValue}>{deliverySlot.date}</Text>
                <Text style={styles.detailSubvalue}>
                  {deliverySlot.timeSlot}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Payment Method */}
      {paymentMethod && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name={(paymentMethod.icon as any) || 'card-outline'}
                  size={18}
                  color={COLORS.text}
                />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailValue}>{paymentMethod.name}</Text>
                <Text style={styles.detailSubvalue}>
                  {paymentMethod.type === 'COD' && 'Pay on delivery'}
                  {paymentMethod.type === 'credit_card' &&
                    'Charged on confirmation'}
                  {(paymentMethod.type === 'NET30' ||
                    paymentMethod.type === 'NET60') &&
                    'Added to credit account'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Price Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price Summary</Text>
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>
              {formatFinancialAmount(subtotal)}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>GST (9%)</Text>
            <Text style={styles.priceValue}>{formatFinancialAmount(gst)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery</Text>
            <Text
              style={[
                styles.priceValue,
                deliveryFee === 0 && styles.priceValueFree,
              ]}
            >
              {deliveryFee === 0 ? 'FREE' : formatFinancialAmount(deliveryFee)}
            </Text>
          </View>

          {voucherDiscount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, styles.discountLabel]}>
                Voucher
              </Text>
              <Text style={styles.discountValue}>
                -{formatFinancialAmount(voucherDiscount)}
              </Text>
            </View>
          )}

          <View style={styles.priceDivider} />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatFinancialAmount(total)}
            </Text>
          </View>
        </View>
      </View>

      {/* Terms */}
      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>
          By placing your order, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>.
        </Text>
      </View>
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
  itemsList: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemRowLast: {
    borderBottomWidth: 0,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    marginRight: SPACING.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  itemQuantity: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  itemTotal: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  detailCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  detailSubvalue: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  detailDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  priceCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  priceLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  priceValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  priceValueFree: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  discountLabel: {
    color: '#4CAF50',
  },
  discountValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: '#4CAF50',
  },
  priceDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  totalLabel: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.text,
  },
  termsContainer: {
    padding: SPACING.sm,
  },
  termsText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.text,
    fontWeight: '600',
  },
});
