/**
 * OrderConfirmationScreen - Redesigned order success screen
 *
 * Features:
 * - Clean, celebratory design without clutter
 * - Clear next steps
 * - Points earned display
 * - Quick actions (track, continue shopping)
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Share,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import { formatFinancialAmount } from '../../utils/formatting';
import { HapticFeedback } from '../../utils/haptics';
import { RootStackParamList } from '../../types/navigation';

type OrderConfirmationRouteProp = RouteProp<
  RootStackParamList,
  'OrderConfirmation'
>;

export default function OrderConfirmationScreen() {
  const navigation = useNavigation();
  const route = useRoute<OrderConfirmationRouteProp>();
  const insets = useSafeAreaInsets();

  const {
    orderId,
    orderNumber,
    total,
    deliveryDate,
    deliveryTime,
    pointsEarned,
  } = route.params || {};

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Entry animations
  useEffect(() => {
    HapticFeedback.success();

    Animated.sequence([
      // Initial fade and scale
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Checkmark pop
      Animated.spring(checkmarkScale, {
        toValue: 1,
        tension: 150,
        friction: 6,
        useNativeDriver: true,
      }),
      // Content slide up
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleTrackOrder = () => {
    HapticFeedback.medium();
    navigation.navigate('OrderTracking', { orderId });
  };

  const handleContinueShopping = () => {
    HapticFeedback.light();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main', params: { screen: 'Home' } }],
    });
  };

  const handleViewOrders = () => {
    HapticFeedback.light();
    navigation.navigate('OrderHistory');
  };

  const handleShareOrder = async () => {
    try {
      await Share.share({
        message: `I just placed an order #${orderNumber} for ${formatFinancialAmount(total || 0)}! 🎉`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + SPACING.xl,
            paddingBottom: insets.bottom + SPACING.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <Animated.View
          style={[
            styles.successIconContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.successIcon,
              { transform: [{ scale: checkmarkScale }] },
            ]}
          >
            <Ionicons name="checkmark" size={64} color={COLORS.card} />
          </Animated.View>
        </Animated.View>

        {/* Success Message */}
        <Animated.View
          style={[
            styles.messageContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>Order Confirmed!</Text>
          <Text style={styles.subtitle}>
            Thank you for your order. We'll notify you when it's on its way.
          </Text>
        </Animated.View>

        {/* Order Details Card */}
        <Animated.View
          style={[
            styles.detailsCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Number</Text>
            <Text style={styles.detailValue}>#{orderNumber}</Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Paid</Text>
            <Text style={styles.detailValueLarge}>
              {formatFinancialAmount(total || 0)}
            </Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Delivery</Text>
            <View style={styles.detailValueContainer}>
              <Text style={styles.detailValue}>{deliveryDate}</Text>
              <Text style={styles.detailSubvalue}>{deliveryTime}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Points Earned Card */}
        {pointsEarned && pointsEarned > 0 && (
          <Animated.View
            style={[
              styles.pointsCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.pointsIconContainer}>
              <Ionicons name="star" size={28} color="#FFC107" />
            </View>
            <View style={styles.pointsContent}>
              <Text style={styles.pointsTitle}>
                You earned {pointsEarned} points!
              </Text>
              <Text style={styles.pointsSubtitle}>
                Use them on your next order for discounts
              </Text>
            </View>
          </Animated.View>
        )}

        {/* What's Next Card */}
        <Animated.View
          style={[
            styles.nextStepsCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.nextStepsTitle}>What happens next?</Text>

          <View style={styles.stepItem}>
            <View style={styles.stepIcon}>
              <Ionicons name="mail-outline" size={20} color={COLORS.text} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>Confirmation Email</Text>
              <Text style={styles.stepDescription}>
                Check your inbox for order details
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepIcon}>
              <Ionicons name="cube-outline" size={20} color={COLORS.text} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>Order Preparation</Text>
              <Text style={styles.stepDescription}>
                We'll start preparing your items
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepIcon}>
              <Ionicons name="car-outline" size={20} color={COLORS.text} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>Delivery</Text>
              <Text style={styles.stepDescription}>
                Track your order in real-time
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleTrackOrder}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate" size={20} color={COLORS.card} />
            <Text style={styles.primaryButtonText}>Track Order</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleViewOrders}
              activeOpacity={0.8}
            >
              <Ionicons name="receipt-outline" size={18} color={COLORS.text} />
              <Text style={styles.secondaryButtonText}>View Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleShareOrder}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={18} color={COLORS.text} />
              <Text style={styles.secondaryButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinueShopping}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    alignItems: 'center',
  },

  // Success Icon
  successIconContainer: {
    marginBottom: SPACING.xl,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },

  // Message
  messageContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    lineHeight: 22,
  },

  // Details Card
  detailsCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  detailValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  detailValueLarge: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.text,
  },
  detailValueContainer: {
    alignItems: 'flex-end',
  },
  detailSubvalue: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  detailDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },

  // Points Card
  pointsCard: {
    width: '100%',
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  pointsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  pointsContent: {
    flex: 1,
  },
  pointsTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: '#F57F17',
    marginBottom: 2,
  },
  pointsSubtitle: {
    ...TYPOGRAPHY.small,
    color: '#FFA000',
  },

  // Next Steps Card
  nextStepsCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
  },
  nextStepsTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  stepDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },

  // Actions
  actionsContainer: {
    width: '100%',
    gap: SPACING.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.text,
    borderRadius: 16,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.medium,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.card,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  continueButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  continueButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
