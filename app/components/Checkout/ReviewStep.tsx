import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeliveryAddress, DeliverySlot, PaymentMethod } from './CheckoutScreen';

interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: any;
  };
  quantity: number;
}

interface ReviewStepProps {
  cart: CartItem[];
  address: DeliveryAddress;
  deliverySlot: DeliverySlot | null;
  paymentMethod: PaymentMethod | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  onPlaceOrder: () => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  cart,
  address,
  deliverySlot,
  paymentMethod,
  subtotal,
  deliveryFee,
  total
}) => {
  if (!deliverySlot || !paymentMethod) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#F44336" />
        <Text style={styles.errorTitle}>Incomplete Information</Text>
        <Text style={styles.errorText}>
          Please go back and complete all previous steps before reviewing your order.
        </Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Review Your Order</Text>
      <Text style={styles.subtitle}>Please confirm the details below</Text>
      
      {/* Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {cart.map((item, index) => (
          <View key={item.product.id} style={styles.itemRow}>
            <Image source={item.product.imageUrl} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemMeta}>Qty: {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>${(item.product.price * item.quantity).toFixed(0)}</Text>
          </View>
        ))}
      </View>
      
      {/* Delivery Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Details</Text>
        
        <View style={styles.detailRow}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="location" size={20} color="#1a1a1a" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailText}>
              {address.name}
            </Text>
            <Text style={styles.detailText}>
              {address.street}{address.unit ? `, ${address.unit}` : ''}
            </Text>
            <Text style={styles.detailText}>
              {address.city}, {address.postalCode}
            </Text>
            <Text style={styles.detailText}>{address.phone}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="calendar" size={20} color="#1a1a1a" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Delivery Date</Text>
            <Text style={styles.detailText}>{deliverySlot.date}</Text>
            <View style={styles.badgeContainer}>
              {deliverySlot.sameDayAvailable && (
                <View style={styles.sameDayBadge}>
                  <Text style={styles.sameDayText}>Same Day</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="time" size={20} color="#1a1a1a" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Time Slot</Text>
            <Text style={styles.detailText}>{deliverySlot.timeSlot}</Text>
            <Text style={styles.queueText}>
              {deliverySlot.queueCount} {deliverySlot.queueCount === 1 ? 'order' : 'orders'} in queue
            </Text>
          </View>
        </View>
      </View>
      
      {/* Payment Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        
        <View style={styles.paymentRow}>
          <View style={styles.paymentIconContainer}>
            <Ionicons name={paymentMethod.icon as any} size={20} color="#fff" />
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentName}>{paymentMethod.name}</Text>
            {paymentMethod.id === 'digital_cod' && (
              <Text style={styles.paymentDescription}>Pay on delivery</Text>
            )}
            {paymentMethod.id === 'wallet' && (
              <Text style={styles.paymentDescription}>Payment from digital wallet</Text>
            )}
            {paymentMethod.id === 'credit' && (
              <Text style={styles.paymentDescription}>Added to your credit account</Text>
            )}
            {paymentMethod.id === 'card' && (
              <Text style={styles.paymentDescription}>Will be charged on confirmation</Text>
            )}
          </View>
        </View>
      </View>
      
      {/* Order Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={styles.summaryValue}>
            {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
          </Text>
        </View>
        
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>
      </View>
      
      {/* Policy Note */}
      <View style={styles.policyNote}>
        <Text style={styles.policyText}>
          By placing your order, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 13,
    color: '#666',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  sameDayBadge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sameDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
  },
  queueText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 13,
    color: '#666',
  },
  summarySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  policyNote: {
    marginBottom: 16,
  },
  policyText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ReviewStep; 