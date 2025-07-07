import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentMethod } from './CheckoutScreen';

// Payment method options
const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'digital_cod',
    name: 'Digital COD',
    icon: 'cash-outline',
    isDefault: true
  },
  {
    id: 'wallet',
    name: 'Digital Wallet',
    icon: 'wallet-outline',
    isDefault: false
  },
  {
    id: 'credit',
    name: 'Credit Terms',
    icon: 'card-outline',
    isDefault: false
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: 'card-outline',
    isDefault: false
  }
];

interface PaymentStepProps {
  onSelectMethod: (method: PaymentMethod) => void;
  total: number;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ 
  onSelectMethod,
  total
}) => {
  const [selectedMethodId, setSelectedMethodId] = useState<string>(PAYMENT_METHODS[0].id);
  
  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethodId(method.id);
    onSelectMethod(method);
  };
  
  // Find selected payment method
  const selectedMethod = PAYMENT_METHODS.find(m => m.id === selectedMethodId) || PAYMENT_METHODS[0];
  
  // Digital wallet balance (mock)
  const walletBalance = 200;
  const hasEnoughBalance = walletBalance >= total;
  
  // Credit status (mock)
  const creditLimit = 5000;
  const creditAvailable = 3500;
  const isCreditApproved = true;
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Payment Method</Text>
      <Text style={styles.subtitle}>Choose how you want to pay</Text>
      
      <View style={styles.methodsContainer}>
        {PAYMENT_METHODS.map((method) => {
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
                isDisabled && styles.disabledMethodCard
              ]}
              onPress={() => !isDisabled && handleSelectMethod(method)}
              disabled={isDisabled}
            >
              <View style={styles.methodContent}>
                <View style={[styles.methodIcon, selectedMethodId === method.id && styles.selectedMethodIcon]}>
                  <Ionicons
                    name={method.icon as any}
                    size={20}
                    color={selectedMethodId === method.id ? '#fff' : '#1a1a1a'}
                  />
                </View>
                
                <View style={styles.methodInfo}>
                  <Text style={[
                    styles.methodName,
                    selectedMethodId === method.id && styles.selectedMethodText,
                    isDisabled && styles.disabledMethodText
                  ]}>
                    {method.name}
                  </Text>
                  
                  {method.id === 'digital_cod' && (
                    <Text style={styles.methodDescription}>Pay on delivery with digital confirmation</Text>
                  )}
                  
                  {method.id === 'wallet' && (
                    <Text style={[styles.methodDescription, !hasEnoughBalance && styles.errorText]}>
                      {hasEnoughBalance 
                        ? `Balance: $${walletBalance.toFixed(0)}`
                        : `Insufficient balance: $${walletBalance.toFixed(0)}`
                      }
                    </Text>
                  )}
                  
                  {method.id === 'credit' && (
                    <Text style={[styles.methodDescription, !isCreditApproved && styles.errorText]}>
                      {isCreditApproved
                        ? `Available: $${creditAvailable.toFixed(0)} of $${creditLimit.toFixed(0)}`
                        : 'Not approved for credit terms'
                      }
                    </Text>
                  )}
                  
                  {method.id === 'card' && (
                    <Text style={styles.methodDescription}>Visa, Mastercard, American Express</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.radioContainer}>
                <View style={[
                  styles.radioOuter,
                  selectedMethodId === method.id && styles.selectedRadioOuter
                ]}>
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
              <Ionicons name="phone-portrait-outline" size={40} color="#1a1a1a" />
            </View>
            <Text style={styles.detailsText}>
              You'll be asked to confirm payment digitally when your order is delivered. No cash handling needed.
            </Text>
          </View>
        )}
        
        {selectedMethod.id === 'wallet' && hasEnoughBalance && (
          <View style={styles.detailsContent}>
            <View style={styles.detailsIconContainer}>
              <Ionicons name="wallet-outline" size={40} color="#1a1a1a" />
            </View>
            <Text style={styles.detailsText}>
              ${total.toFixed(2)} will be deducted from your wallet balance upon order confirmation.
            </Text>
          </View>
        )}
        
        {selectedMethod.id === 'credit' && isCreditApproved && (
          <View style={styles.detailsContent}>
            <View style={styles.detailsIconContainer}>
              <Ionicons name="document-text-outline" size={40} color="#1a1a1a" />
            </View>
            <Text style={styles.detailsText}>
              This purchase will be added to your credit account. Payment due according to your credit terms.
            </Text>
          </View>
        )}
        
        {selectedMethod.id === 'card' && (
          <View style={styles.detailsContent}>
            <View style={styles.detailsIconContainer}>
              <Ionicons name="card-outline" size={40} color="#1a1a1a" />
            </View>
            <Text style={styles.detailsText}>
              Your card will be charged ${total.toFixed(2)} when your order is confirmed.
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
  methodsContainer: {
    marginBottom: 24,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  selectedMethodCard: {
    borderColor: '#1a1a1a',
    backgroundColor: '#f9f9f9',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedMethodIcon: {
    backgroundColor: '#1a1a1a',
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  selectedMethodText: {
    color: '#1a1a1a',
  },
  disabledMethodText: {
    color: '#999',
  },
  methodDescription: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    color: '#F44336',
  },
  radioContainer: {
    marginLeft: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadioOuter: {
    borderColor: '#1a1a1a',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
  },
  detailsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  detailsContent: {
    alignItems: 'center',
  },
  detailsIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
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
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
  },
  securityText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default PaymentStep; 