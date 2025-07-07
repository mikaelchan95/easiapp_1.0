import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';

type OrderSuccessRouteProp = RouteProp<RootStackParamList, 'OrderSuccess'>;

const OrderSuccessScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<OrderSuccessRouteProp>();
  const { orderId, deliveryDate, deliveryTime } = route.params || {};
  const [countdown, setCountdown] = useState(5);
  const [autoRedirect, setAutoRedirect] = useState(true);
  
  // Auto-redirect countdown with actual navigation (only if enabled)
  useEffect(() => {
    if (autoRedirect && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (autoRedirect && countdown === 0) {
      // Auto redirect to home when countdown reaches 0
      handleContinueShopping();
    }
  }, [countdown, autoRedirect]);
  
  const handleTrackOrder = () => {
    // Navigate to order tracking screen
    navigation.navigate('OrderTracking', { orderId });
  };
  
  const handleContinueShopping = () => {
    // Navigate back to home
    navigation.navigate('Main', { screen: 'Home' });
  };
  
  // Estimated delivery time for email receipt
  const estimatedDelivery = `${deliveryDate}, ${deliveryTime}`;
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Success Animation */}
      <View style={styles.successAnimation}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={64} color="#fff" />
        </View>
      </View>
      
      <Text style={styles.title}>Order Confirmed!</Text>
      <Text style={styles.subtitle}>Your order has been placed successfully</Text>
      
      <View style={styles.orderDetails}>
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Order Number</Text>
          <Text style={styles.orderId}>{orderId}</Text>
        </View>
        
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Estimated Delivery</Text>
          <Text style={styles.orderValue}>{estimatedDelivery}</Text>
        </View>
      </View>
      
      {/* Delivery Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Ionicons name="time-outline" size={20} color="#1a1a1a" />
          <Text style={styles.statusHeaderText}>Order Status</Text>
        </View>
        
        <View style={styles.stepRow}>
          <View style={[styles.stepCircle, styles.activeStep]}>
            <Ionicons name="checkmark" size={14} color="#fff" />
          </View>
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>Order Received</Text>
            <Text style={styles.stepTime}>Just now</Text>
          </View>
        </View>
        
        <View style={styles.stepConnector} />
        
        <View style={styles.stepRow}>
          <View style={styles.stepCircle}>
            <View style={styles.stepDot} />
          </View>
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>Being Prepared</Text>
            <Text style={styles.stepTime}>Upcoming</Text>
          </View>
        </View>
        
        <View style={styles.stepConnector} />
        
        <View style={styles.stepRow}>
          <View style={styles.stepCircle}>
            <View style={styles.stepDot} />
          </View>
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>Out for Delivery</Text>
            <Text style={styles.stepTime}>Upcoming</Text>
          </View>
        </View>
        
        <View style={styles.stepConnector} />
        
        <View style={styles.stepRow}>
          <View style={styles.stepCircle}>
            <View style={styles.stepDot} />
          </View>
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>Delivered</Text>
            <Text style={styles.stepTime}>Upcoming</Text>
          </View>
        </View>
      </View>
      
      {/* Notification Info */}
      <View style={styles.notificationCard}>
        <View style={styles.notificationIconContainer}>
          <Ionicons name="notifications" size={24} color="#1a1a1a" />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>Stay Updated</Text>
          <Text style={styles.notificationText}>
            We'll send you notifications about your order status. A confirmation email has been sent to your email address.
          </Text>
        </View>
      </View>
      
      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.trackButton} onPress={handleTrackOrder}>
          <Text style={styles.trackButtonText}>Track Order</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.shopButton} onPress={handleContinueShopping}>
          <Text style={styles.shopButtonText}>Continue Shopping</Text>
          {autoRedirect && (
            <TouchableOpacity 
              onPress={() => setAutoRedirect(false)} 
              style={styles.cancelAutoRedirect}
              accessibilityLabel="Cancel auto-redirect"
              accessibilityHint="Tap to stay on this page"
            >
              <Text style={styles.redirectText}>
                Auto-redirect in {countdown}s • <Text style={styles.cancelText}>Cancel</Text>
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
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
    paddingTop: 40,
    alignItems: 'center',
  },
  successAnimation: {
    marginBottom: 24,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  orderDetails: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  orderRow: {
    marginBottom: 12,
  },
  orderLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 1,
  },
  orderValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activeStep: {
    backgroundColor: '#4CAF50',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  stepInfo: {
    flex: 1,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  stepTime: {
    fontSize: 13,
    color: '#666',
  },
  stepConnector: {
    width: 2,
    height: 20,
    backgroundColor: '#f0f0f0',
    marginLeft: 11,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  notificationIconContainer: {
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  trackButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  shopButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  shopButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  redirectText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  cancelAutoRedirect: {
    marginTop: 4,
    paddingVertical: 4,
  },
  cancelText: {
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default OrderSuccessScreen; 