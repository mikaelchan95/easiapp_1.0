import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import * as Animations from '../../utils/animations';
import MobileHeader from '../Layout/MobileHeader';

const { width } = Dimensions.get('window');

interface ActivityOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  screen: string;
  badge?: number;
  isNew?: boolean;
}

const ACTIVITY_OPTIONS: ActivityOption[] = [
  {
    id: 'orders',
    title: 'Order History',
    subtitle: 'Track past & current orders',
    icon: 'receipt-outline',
    color: '#4CAF50',
    screen: 'OrderHistory',
    badge: 2,
  },
  {
    id: 'wishlist',
    title: 'Wishlist',
    subtitle: 'Saved items & favorites',
    icon: 'heart-outline',
    color: '#E91E63',
    screen: 'Wishlist',
    badge: 5,
  },
  {
    id: 'reviews',
    title: 'Reviews & Ratings',
    subtitle: 'Share your experience',
    icon: 'star-outline',
    color: '#FF9800',
    screen: 'Reviews',
    isNew: true,
  },
  {
    id: 'rewards',
    title: 'Rewards & Points',
    subtitle: 'Earn points, get rewards',
    icon: 'gift-outline',
    color: '#9C27B0',
    screen: 'Rewards',
  },
  {
    id: 'referrals',
    title: 'Refer Friends',
    subtitle: 'Share and earn together',
    icon: 'people-outline',
    color: '#2196F3',
    screen: 'Referrals',
    isNew: true,
  },
  {
    id: 'support',
    title: 'Help & Support',
    subtitle: 'Get assistance anytime',
    icon: 'help-circle-outline',
    color: '#607D8B',
    screen: 'Support',
  },
];

const QUICK_ACTIONS = [
  {
    id: 'reorder',
    title: 'Reorder',
    icon: 'refresh-outline',
    color: '#4CAF50',
  },
  {
    id: 'track',
    title: 'Track Order',
    icon: 'location-outline',
    color: '#2196F3',
  },
  {
    id: 'chat',
    title: 'Live Chat',
    icon: 'chatbubble-outline',
    color: '#FF9800',
  },
  {
    id: 'phone',
    title: 'Call Support',
    icon: 'call-outline',
    color: '#9C27B0',
  },
];

export default function ActivitiesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const cardAnimations = useRef(
    ACTIVITY_OPTIONS.map(() => new Animated.Value(0))
  ).current;

  // State
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(
    null
  );

  useEffect(() => {
    // Initial entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut,
      }),
    ]).start();

    // Stagger card animations
    const cardAnimSequence = cardAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut,
      })
    );

    Animated.stagger(100, cardAnimSequence).start();
  }, []);

  const handleActivityPress = (activity: ActivityOption) => {
    // Provide haptic feedback and navigation
    navigation.navigate(activity.screen as any);
  };

  const handleQuickAction = (actionId: string) => {
    setActiveQuickAction(actionId);

    // Reset after animation
    setTimeout(() => setActiveQuickAction(null), 200);

    switch (actionId) {
      case 'reorder':
        navigation.navigate('OrderHistory');
        break;
      case 'track':
        navigation.navigate('OrderTracking');
        break;
      case 'chat':
        navigation.navigate('Support');
        break;
      case 'phone':
        // Handle phone call
        break;
    }
  };

  const renderActivityCard = (activity: ActivityOption, index: number) => {
    const cardAnim = cardAnimations[index];

    return (
      <Animated.View
        key={activity.id}
        style={[
          styles.activityCard,
          {
            opacity: cardAnim,
            transform: [
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
              {
                scale: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.cardTouchable}
          onPress={() => handleActivityPress(activity)}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${activity.title}: ${activity.subtitle}`}
        >
          <View style={styles.cardContent}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${activity.color}15` },
              ]}
            >
              <Ionicons
                name={activity.icon as any}
                size={28}
                color={activity.color}
              />
              {activity.badge && (
                <View
                  style={[styles.badge, { backgroundColor: activity.color }]}
                >
                  <Text style={styles.badgeText}>{activity.badge}</Text>
                </View>
              )}
              {activity.isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>

            <View style={styles.textContent}>
              <Text style={styles.cardTitle}>{activity.title}</Text>
              <Text style={styles.cardSubtitle}>{activity.subtitle}</Text>
            </View>

            <View style={styles.chevronContainer}>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.inactive}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderQuickAction = (action: any) => {
    const isActive = activeQuickAction === action.id;

    return (
      <TouchableOpacity
        key={action.id}
        style={[styles.quickActionButton, isActive && styles.quickActionActive]}
        onPress={() => handleQuickAction(action.id)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={action.title}
      >
        <View
          style={[
            styles.quickActionIcon,
            { backgroundColor: `${action.color}15` },
          ]}
        >
          <Ionicons name={action.icon as any} size={24} color={action.color} />
        </View>
        <Text style={styles.quickActionText}>{action.title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Status Bar Background */}
      <View style={[styles.statusBarSpacer, { height: insets.top }]} />

      {/* Header */}
      <MobileHeader
        title="Activities"
        showBackButton={false}
        showSearch={false}
        showCartButton={false}
      />

      {/* Header Description */}
      <Animated.View
        style={[
          styles.headerDescription,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.headerSubtitle}>
          Manage your account & preferences
        </Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <Animated.View
          style={[
            styles.quickActionsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map(renderQuickAction)}
          </View>
        </Animated.View>

        {/* Main Activities */}
        <View style={styles.activitiesSection}>
          <Text style={styles.sectionTitle}>Your Activities</Text>
          <View style={styles.activitiesGrid}>
            {ACTIVITY_OPTIONS.map(renderActivityCard)}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Frame background (98% lightness)
  },
  statusBarSpacer: {
    backgroundColor: COLORS.card,
  },
  headerDescription: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  quickActionsSection: {
    marginBottom: SPACING.xl,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.lg,
  },
  quickActionButton: {
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: 12,
    minWidth: 80,
    minHeight: 88, // iOS touch optimization
    backgroundColor: COLORS.card, // Canvas white
    marginHorizontal: 4,
    ...SHADOWS.light,
  },
  quickActionActive: {
    backgroundColor: COLORS.background,
    transform: [{ scale: 0.95 }],
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  quickActionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  activitiesSection: {
    flex: 1,
  },
  activitiesGrid: {
    paddingHorizontal: SPACING.lg,
  },
  activityCard: {
    marginBottom: SPACING.md,
  },
  cardTouchable: {
    backgroundColor: COLORS.card, // Canvas white
    borderRadius: 16,
    ...SHADOWS.medium,
    minHeight: 80, // iOS touch optimization
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    minHeight: 64, // iOS touch optimization
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  badgeText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  newBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: 'bold',
  },
  textContent: {
    flex: 1,
    marginLeft: SPACING.lg,
  },
  cardTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  chevronContainer: {
    padding: SPACING.xs,
  },
});
