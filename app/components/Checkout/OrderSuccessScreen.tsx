import React, { useEffect, useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../types/navigation';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import { formatFinancialAmount } from '../../utils/formatting';
import { AppContext } from '../../context/AppContext';
import { HapticFeedback } from '../../utils/haptics';
import * as Animations from '../../utils/animations';

type OrderSuccessRouteProp = RouteProp<RootStackParamList, 'OrderSuccess'>;

const { width } = Dimensions.get('window');

const OrderSuccessScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<OrderSuccessRouteProp>();
  const insets = useSafeAreaInsets();
  const { state } = useContext(AppContext);
  const { orderId, deliveryDate, deliveryTime, total } = route.params || {};

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // State
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Order tracking steps
  const orderSteps = [
    {
      id: 'confirmed',
      title: 'Order Confirmed',
      icon: 'checkmark-circle',
      completed: true,
    },
    {
      id: 'processing',
      title: 'Processing',
      icon: 'hourglass',
      completed: false,
    },
    { id: 'shipped', title: 'Shipped', icon: 'airplane', completed: false },
    { id: 'delivered', title: 'Delivered', icon: 'home', completed: false },
  ];

  // Get recent order items from context (last few items that were in cart)
  const recentOrderItems = state.cart.slice(0, 3); // Show max 3 items

  // Mount animations
  useEffect(() => {
    HapticFeedback.success();

    // Staggered entrance animation
    Animated.sequence([
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
      ]),
      Animated.delay(200),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
      Animated.delay(300),
      Animated.timing(checkmarkAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.delay(400),
      Animated.timing(progressAnim, {
        toValue: 0.25, // First step completed
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start();

    // Stagger card animations
    const cardAnimSequence = cardAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 150,
        useNativeDriver: true,
      })
    );

    setTimeout(() => {
      Animated.parallel(cardAnimSequence).start();
    }, 1000);

    // Show confetti effect
    setTimeout(() => {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }, 500);
  }, []);

  const handleTrackOrder = () => {
    HapticFeedback.medium();
    navigation.navigate('OrderTracking', { orderId });
  };

  const handleContinueShopping = () => {
    HapticFeedback.light();
    navigation.navigate('Main', { screen: 'Home' });
  };

  const handleViewOrderHistory = () => {
    HapticFeedback.light();
    navigation.navigate('OrderHistory');
  };

  const renderOrderProgress = () => (
    <Animated.View
      style={[
        styles.progressCard,
        {
          opacity: cardAnimations[1],
          transform: [
            {
              translateY: cardAnimations[1].interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.progressHeader}>
        <Ionicons name="timeline" size={24} color={COLORS.text} />
        <Text style={styles.progressTitle}>Order Progress</Text>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <View style={styles.progressSteps}>
        {orderSteps.map((step, index) => (
          <View key={step.id} style={styles.progressStep}>
            <View
              style={[
                styles.stepIndicator,
                step.completed && styles.stepIndicatorCompleted,
              ]}
            >
              {step.completed ? (
                <Ionicons name="checkmark" size={16} color={COLORS.accent} />
              ) : (
                <Ionicons
                  name={step.icon as any}
                  size={16}
                  color={COLORS.inactive}
                />
              )}
            </View>
            <Text
              style={[
                styles.stepText,
                step.completed && styles.stepTextCompleted,
              ]}
            >
              {step.title}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );

  const renderOrderSummary = () => (
    <Animated.View
      style={[
        styles.summaryCard,
        {
          opacity: cardAnimations[2],
          transform: [
            {
              translateY: cardAnimations[2].interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.summaryHeader}>
        <Ionicons name="receipt" size={24} color={COLORS.text} />
        <Text style={styles.summaryTitle}>Order Summary</Text>
      </View>

      <View style={styles.orderInfo}>
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Order Number</Text>
          <Text style={styles.orderValue}>{orderId}</Text>
        </View>

        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Total Amount</Text>
          <Text style={styles.orderTotal}>
            {formatFinancialAmount(total || 0)}
          </Text>
        </View>

        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Estimated Delivery</Text>
          <Text style={styles.orderValue}>
            {deliveryDate}, {deliveryTime}
          </Text>
        </View>
      </View>

      {recentOrderItems.length > 0 && (
        <View style={styles.itemsSection}>
          <Text style={styles.itemsTitle}>Items Ordered</Text>
          {recentOrderItems.map((item, index) => (
            <View key={item.product.id} style={styles.orderItem}>
              <Image
                source={
                  typeof item.product.image === 'string'
                    ? { uri: item.product.image }
                    : item.product.image
                }
                style={styles.itemImage}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.product.name}
                </Text>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatFinancialAmount(
                  item.product.retailPrice * item.quantity
                )}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );

  const renderNextSteps = () => (
    <Animated.View
      style={[
        styles.nextStepsCard,
        {
          opacity: cardAnimations[3],
          transform: [
            {
              translateY: cardAnimations[3].interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.nextStepsHeader}>
        <Ionicons name="bulb" size={24} color="#FF9800" />
        <Text style={styles.nextStepsTitle}>What's Next?</Text>
      </View>

      <View style={styles.nextStepsList}>
        <View style={styles.nextStepItem}>
          <Ionicons name="mail" size={20} color={COLORS.primary} />
          <Text style={styles.nextStepText}>
            You'll receive an email confirmation shortly
          </Text>
        </View>

        <View style={styles.nextStepItem}>
          <Ionicons name="notifications" size={20} color={COLORS.primary} />
          <Text style={styles.nextStepText}>
            We'll send push notifications for order updates
          </Text>
        </View>

        <View style={styles.nextStepItem}>
          <Ionicons name="location" size={20} color={COLORS.primary} />
          <Text style={styles.nextStepText}>
            Track your order in real-time once it ships
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.success} />

      {/* Enhanced Header with Gradient */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Animated.View
            style={[
              styles.successIcon,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  {
                    rotate: checkmarkAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={80} color={COLORS.accent} />
          </Animated.View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text style={styles.headerTitle}>Order Confirmed!</Text>
            <Text style={styles.headerSubtitle}>
              Thank you for your order. We're preparing it for delivery.
            </Text>
          </Animated.View>
        </View>

        {/* Confetti Effect */}
        {showConfetti && (
          <View style={styles.confettiContainer}>
            {[...Array(20)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.confettiPiece,
                  {
                    left: Math.random() * width,
                    backgroundColor: [
                      COLORS.success,
                      COLORS.primary,
                      '#FF9800',
                      '#E91E63',
                    ][i % 4],
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 400],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderOrderProgress()}
        {renderOrderSummary()}
        {renderNextSteps()}

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.actionContainer,
            {
              opacity: cardAnimations[3],
              transform: [
                {
                  translateY: cardAnimations[3].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleTrackOrder}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate" size={24} color={COLORS.accent} />
            <Text style={styles.primaryButtonText}>Track Your Order</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleViewOrderHistory}
              activeOpacity={0.8}
            >
              <Ionicons name="time" size={20} color={COLORS.text} />
              <Text style={styles.secondaryButtonText}>Order History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleContinueShopping}
              activeOpacity={0.8}
            >
              <Ionicons name="storefront" size={20} color={COLORS.text} />
              <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
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
  header: {
    backgroundColor: COLORS.success,
    paddingBottom: SPACING.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  successIcon: {
    marginBottom: SPACING.lg,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.9,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },

  // Progress Card
  progressCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
    elevation: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  progressTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 2,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  stepIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  stepIndicatorCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  stepText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  stepTextCompleted: {
    color: COLORS.success,
    fontWeight: '700',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
    elevation: 6,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  summaryTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  orderInfo: {
    marginBottom: SPACING.md,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  orderLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  orderValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '700',
  },
  orderTotal: {
    ...TYPOGRAPHY.h4,
    color: COLORS.success,
    fontWeight: '800',
  },
  itemsSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  itemsTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
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
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  itemPrice: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Next Steps Card
  nextStepsCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  nextStepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  nextStepsTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  nextStepsList: {
    gap: SPACING.md,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextStepText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginLeft: SPACING.md,
    flex: 1,
    fontWeight: '500',
  },

  // Action Buttons
  actionContainer: {
    gap: SPACING.lg,
  },
  primaryButton: {
    backgroundColor: COLORS.text,
    borderRadius: 16,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
    elevation: 6,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.accent,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
    elevation: 3,
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
});

export default OrderSuccessScreen;
