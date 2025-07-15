import React, { useEffect, useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
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

    // Removed confetti animation for cleaner design
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
        <View style={styles.progressHeaderLeft}>
          <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
          <View style={styles.progressHeaderText}>
            <Text style={styles.progressTitle}>Order Confirmed</Text>
            <Text style={styles.progressSubtitle}>#{orderId?.slice(-8)}</Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>Confirmed</Text>
        </View>
      </View>

      <View style={styles.progressSteps}>
        {orderSteps.map((step, index) => (
          <View key={step.id} style={styles.progressStep}>
            <View style={styles.stepLine}>
              <View
                style={[
                  styles.stepIndicator,
                  step.completed && styles.stepIndicatorCompleted,
                ]}
              >
                {step.completed ? (
                  <Ionicons name="checkmark" size={14} color={COLORS.accent} />
                ) : (
                  <View style={styles.stepIndicatorEmpty} />
                )}
              </View>
              {index < orderSteps.length - 1 && (
                <View
                  style={[
                    styles.stepConnector,
                    step.completed && styles.stepConnectorCompleted,
                  ]}
                />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text
                style={[
                  styles.stepText,
                  step.completed && styles.stepTextCompleted,
                ]}
              >
                {step.title}
              </Text>
              {step.completed && (
                <Text style={styles.stepTime}>Just now</Text>
              )}
            </View>
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
        <Text style={styles.summaryTitle}>Order Details</Text>
      </View>

      <View style={styles.orderDetailsGrid}>
        <View style={styles.orderDetailItem}>
          <Text style={styles.detailLabel}>Order Number</Text>
          <Text style={styles.detailValue}>#{orderId?.slice(-8)}</Text>
        </View>
        <View style={styles.orderDetailItem}>
          <Text style={styles.detailLabel}>Total Amount</Text>
          <Text style={styles.detailValuePrimary}>
            {formatFinancialAmount(total || 0)}
          </Text>
        </View>
        <View style={styles.orderDetailItem}>
          <Text style={styles.detailLabel}>Delivery Date</Text>
          <Text style={styles.detailValue}>{deliveryDate}</Text>
        </View>
        <View style={styles.orderDetailItem}>
          <Text style={styles.detailLabel}>Time Slot</Text>
          <Text style={styles.detailValue}>{deliveryTime}</Text>
        </View>
      </View>

      {recentOrderItems.length > 0 && (
        <View style={styles.itemsSection}>
          <Text style={styles.itemsTitle}>Items ({recentOrderItems.length})</Text>
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
                <Text style={styles.itemName} numberOfLines={2}>
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
        <Ionicons name="information-circle" size={24} color={COLORS.text} />
        <Text style={styles.nextStepsTitle}>What's Next?</Text>
      </View>

      <View style={styles.nextStepsList}>
        <View style={styles.nextStepItem}>
          <Ionicons name="mail" size={20} color={COLORS.text} />
          <Text style={styles.nextStepText}>
            You'll receive an email confirmation shortly
          </Text>
        </View>

        <View style={styles.nextStepItem}>
          <Ionicons name="notifications" size={20} color={COLORS.text} />
          <Text style={styles.nextStepText}>
            We'll send push notifications for order updates
          </Text>
        </View>

        <View style={styles.nextStepItem}>
          <Ionicons name="location" size={20} color={COLORS.text} />
          <Text style={styles.nextStepText}>
            Track your order in real-time once it ships
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      {/* Standard Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Main', { screen: 'Home' })}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Order Confirmed</Text>
          
          <View style={styles.headerSpacer} />
        </View>
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
            <Ionicons name="navigate" size={20} color={COLORS.accent} />
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
    backgroundColor: COLORS.card,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.light,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 56,
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
    fontWeight: '700',
    textAlign: 'center',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 44,
    height: 44,
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
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  progressHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressHeaderText: {
    marginLeft: SPACING.md,
  },
  progressTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  progressSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    fontWeight: '600',
    fontSize: 12,
  },
  progressSteps: {
    gap: SPACING.md,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepLine: {
    alignItems: 'center',
    marginRight: SPACING.md,
    minHeight: 48,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicatorCompleted: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  stepIndicatorEmpty: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.inactive,
  },
  stepConnector: {
    width: 2,
    height: 32,
    backgroundColor: COLORS.border,
    marginTop: 4,
  },
  stepConnectorCompleted: {
    backgroundColor: COLORS.text,
  },
  stepContent: {
    flex: 1,
    paddingTop: 2,
  },
  stepText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  stepTextCompleted: {
    color: COLORS.text,
    fontWeight: '600',
  },
  stepTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
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
    marginBottom: SPACING.lg,
  },
  summaryTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.text,
  },
  orderDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  orderDetailItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
  },
  detailLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  detailValuePrimary: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '700',
  },
  itemsSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.lg,
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
    paddingVertical: SPACING.xs,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: SPACING.md,
    backgroundColor: COLORS.background,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  itemQuantity: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  itemPrice: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'right',
  },

  // Next Steps Card
  nextStepsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
    elevation: 6,
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
    minHeight: 56,
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
