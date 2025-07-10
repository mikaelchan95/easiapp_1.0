import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Animated, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../types/navigation';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';

type OrderSuccessRouteProp = RouteProp<RootStackParamList, 'OrderSuccess'>;

const OrderSuccessScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<OrderSuccessRouteProp>();
  const insets = useSafeAreaInsets();
  const { orderId, deliveryDate, deliveryTime, total } = route.params || {};
  const [countdown, setCountdown] = useState(5);
  const [autoRedirect, setAutoRedirect] = useState(true);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];
  
  // Mount animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 6,
      }),
    ]).start();
  }, []);
  
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
    <View style={styles.container}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
        {/* Success Animation */}
        <Animated.View 
          style={[
            styles.successAnimation,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={64} color={COLORS.card} />
          </View>
        </Animated.View>
        
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
            <Ionicons name="navigate" size={20} color={COLORS.card} style={styles.buttonIcon} />
            <Text style={styles.trackButtonText}>Track Order</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shopButton} onPress={handleContinueShopping}>
            <Ionicons name="storefront" size={20} color={COLORS.text} style={styles.buttonIcon} />
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
      </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statusBarBackground: {
    backgroundColor: COLORS.background, // Match main background for success screen
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl * 2,
    alignItems: 'center',
  },
  successAnimation: {
    marginBottom: SPACING.xl,
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
    elevation: 12,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    fontWeight: '500',
  },
  orderDetails: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    width: '100%',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
    elevation: 6,
  },
  orderRow: {
    marginBottom: SPACING.md,
  },
  orderLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  orderId: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1,
  },
  orderValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '700',
  },
  statusCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    width: '100%',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
    elevation: 6,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  statusHeaderText: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  activeStep: {
    backgroundColor: '#4CAF50',
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.textSecondary,
  },
  stepInfo: {
    flex: 1,
    paddingBottom: SPACING.lg,
  },
  stepTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  stepTime: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  stepConnector: {
    width: 3,
    height: 24,
    backgroundColor: COLORS.border,
    marginLeft: 14.5,
    borderRadius: 1.5,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: SPACING.lg,
    width: '100%',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  notificationIconContainer: {
    marginRight: SPACING.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  notificationText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
    fontWeight: '500',
  },
  actions: {
    width: '100%',
    gap: SPACING.md,
  },
  trackButton: {
    backgroundColor: COLORS.text,
    borderRadius: 16,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...SHADOWS.medium,
    elevation: 6,
  },
  trackButtonText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.card,
    fontWeight: '700',
  },
  shopButton: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
    elevation: 3,
  },
  shopButtonText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '700',
  },
  buttonIcon: {
    marginRight: SPACING.sm,
  },
  redirectText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
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