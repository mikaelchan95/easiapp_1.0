import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import MobileHeader from '../Layout/MobileHeader';

const { width } = Dimensions.get('window');

// Mock milestones data
const mockMilestones = [
  {
    id: '1',
    title: 'First Steps',
    description: 'Start your journey with EASI',
    targetAmount: 100,
    currentAmount: 100,
    reward: 'S$10 credit + 100 points',
    icon: 'footsteps',
    color: '#4CAF50',
    completed: true,
    completedDate: '2024-01-10',
  },
  {
    id: '2',
    title: 'Getting Started',
    description: 'Build your premium collection',
    targetAmount: 500,
    currentAmount: 500,
    reward: 'S$25 credit + 250 points',
    icon: 'rocket',
    color: '#2196F3',
    completed: true,
    completedDate: '2024-01-15',
  },
  {
    id: '3',
    title: 'Connoisseur',
    description: 'Explore premium selections',
    targetAmount: 1000,
    currentAmount: 1000,
    reward: 'S$50 credit + 500 points',
    icon: 'wine',
    color: '#FF9800',
    completed: true,
    completedDate: '2024-01-20',
  },
  {
    id: '4',
    title: 'Enthusiast',
    description: 'Deepen your appreciation',
    targetAmount: 2500,
    currentAmount: 1850,
    reward: 'S$100 credit + 1000 points',
    icon: 'star',
    color: '#9C27B0',
    completed: false,
    completedDate: null,
  },
  {
    id: '5',
    title: 'Collector',
    description: 'Build an impressive collection',
    targetAmount: 5000,
    currentAmount: 1850,
    reward: 'S$200 credit + 2000 points + Exclusive Access',
    icon: 'library',
    color: '#FF5722',
    completed: false,
    completedDate: null,
  },
  {
    id: '6',
    title: 'Master',
    description: 'Achieve mastery in premium spirits',
    targetAmount: 10000,
    currentAmount: 1850,
    reward: 'S$500 credit + 5000 points + VIP Status',
    icon: 'trophy',
    color: '#795548',
    completed: false,
    completedDate: null,
  },
];

const currentSpending = 1850;
const yearlyTarget = 10000;

// Mock spending history for the year
const mockSpendingHistory = [
  { month: 'Jan', amount: 450 },
  { month: 'Feb', amount: 320 },
  { month: 'Mar', amount: 280 },
  { month: 'Apr', amount: 190 },
  { month: 'May', amount: 220 },
  { month: 'Jun', amount: 160 },
  { month: 'Jul', amount: 140 },
  { month: 'Aug', amount: 90 },
  { month: 'Sep', amount: 0 },
  { month: 'Oct', amount: 0 },
  { month: 'Nov', amount: 0 },
  { month: 'Dec', amount: 0 },
];

export default function MilestonesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState('year');
  const progressAnims = useRef(
    mockMilestones.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Animate progress bars
    mockMilestones.forEach((milestone, index) => {
      const progress = Math.min(
        (milestone.currentAmount / milestone.targetAmount) * 100,
        100
      );
      Animated.timing(progressAnims[index], {
        toValue: progress,
        duration: 1000 + index * 200,
        useNativeDriver: false,
      }).start();
    });
  }, []);

  const getCurrentMilestone = () => {
    return (
      mockMilestones.find(m => !m.completed) ||
      mockMilestones[mockMilestones.length - 1]
    );
  };

  const getNextMilestone = () => {
    const currentIndex = mockMilestones.findIndex(m => !m.completed);
    return currentIndex < mockMilestones.length - 1
      ? mockMilestones[currentIndex + 1]
      : null;
  };

  const currentMilestone = getCurrentMilestone();
  const nextMilestone = getNextMilestone();

  const renderMilestone = (
    milestone: (typeof mockMilestones)[0],
    index: number
  ) => {
    const progress = Math.min(
      (milestone.currentAmount / milestone.targetAmount) * 100,
      100
    );
    const remaining = Math.max(
      milestone.targetAmount - milestone.currentAmount,
      0
    );

    return (
      <View
        key={milestone.id}
        style={[
          styles.milestoneCard,
          milestone.completed && styles.completedCard,
        ]}
      >
        <View style={styles.milestoneHeader}>
          <View
            style={[
              styles.milestoneIcon,
              { backgroundColor: `${milestone.color}15` },
            ]}
          >
            <Ionicons
              name={milestone.icon as any}
              size={24}
              color={milestone.color}
            />
          </View>
          <View style={styles.milestoneInfo}>
            <Text
              style={[
                styles.milestoneTitle,
                milestone.completed && styles.completedTitle,
              ]}
            >
              {milestone.title}
            </Text>
            <Text style={styles.milestoneDescription}>
              {milestone.description}
            </Text>
          </View>
          {milestone.completed && (
            <View style={styles.completedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={COLORS.success}
              />
            </View>
          )}
        </View>

        <View style={styles.milestoneProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              S${milestone.currentAmount.toLocaleString()} / S$
              {milestone.targetAmount.toLocaleString()}
            </Text>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
          </View>

          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  backgroundColor: milestone.color,
                  width: progressAnims[index].interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          {!milestone.completed && (
            <Text style={styles.remainingText}>
              S${remaining.toLocaleString()} remaining
            </Text>
          )}
        </View>

        <View style={styles.milestoneReward}>
          <Text style={styles.rewardLabel}>Reward:</Text>
          <Text style={styles.rewardText}>{milestone.reward}</Text>
        </View>

        {milestone.completed && milestone.completedDate && (
          <View style={styles.completedInfo}>
            <Text style={styles.completedText}>
              Completed on {milestone.completedDate}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSpendingChart = () => {
    const maxAmount = Math.max(...mockSpendingHistory.map(h => h.amount));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Monthly Spending</Text>
        <View style={styles.chart}>
          {mockSpendingHistory.map((item, index) => (
            <View key={index} style={styles.chartColumn}>
              <View style={styles.chartBar}>
                <View
                  style={[
                    styles.chartBarFill,
                    {
                      height: `${(item.amount / maxAmount) * 100}%`,
                      backgroundColor:
                        item.amount > 0 ? COLORS.buttonBg : COLORS.border,
                    },
                  ]}
                />
              </View>
              <Text style={styles.chartLabel}>{item.month}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      {/* Status Bar Background */}
      <View style={[styles.statusBarBackground, { height: insets.top }]} />

      {/* Mobile Header */}
      <MobileHeader
        title="Milestones"
        showBackButton={true}
        showCartButton={true}
        showSearch={false}
        showLocationHeader={false}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Progress Widget */}
        <View style={styles.progressWidget}>
          <View style={styles.widgetContainer}>
            <Text style={styles.widgetTitle}>Your Progress This Year</Text>

            <View style={styles.currentStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  S${currentSpending.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {mockMilestones.filter(m => m.completed).length}
                </Text>
                <Text style={styles.statLabel}>Milestones</Text>
              </View>
            </View>

            <View style={styles.nextMilestoneInfo}>
              <Text style={styles.nextMilestoneTitle}>
                Next: {currentMilestone.title}
              </Text>
              <Text style={styles.nextMilestoneAmount}>
                S$
                {(
                  currentMilestone.targetAmount - currentMilestone.currentAmount
                ).toLocaleString()}{' '}
                to go
              </Text>
            </View>
          </View>
        </View>

        {/* Spending Chart */}
        <View style={styles.chartSection}>
          <View style={styles.chartWidget}>{renderSpendingChart()}</View>
        </View>

        {/* Milestones List */}
        <View style={styles.milestonesSection}>
          <Text style={styles.sectionTitle}>All Milestones</Text>
          {mockMilestones.map((milestone, index) =>
            renderMilestone(milestone, index)
          )}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Tips to Reach Your Goals</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tip}>
              <View style={styles.tipIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={COLORS.text}
                />
              </View>
              <Text style={styles.tipText}>
                Set a monthly budget to steadily progress towards your
                milestones
              </Text>
            </View>

            <View style={styles.tip}>
              <View style={styles.tipIcon}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={COLORS.text}
                />
              </View>
              <Text style={styles.tipText}>
                Enable notifications to stay updated on special offers and
                promotions
              </Text>
            </View>

            <View style={styles.tip}>
              <View style={styles.tipIcon}>
                <Ionicons name="people-outline" size={20} color={COLORS.text} />
              </View>
              <Text style={styles.tipText}>
                Refer friends to earn bonus credits that count towards your
                milestones
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statusBarBackground: {
    backgroundColor: COLORS.card,
  },
  scrollView: {
    flex: 1,
  },

  // Progress Widget
  progressWidget: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  widgetContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  widgetTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.lg,
  },
  currentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 28,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  nextMilestoneInfo: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextMilestoneTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    fontWeight: '600',
  },
  nextMilestoneAmount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // Chart Section
  chartSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  chartWidget: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.light,
  },
  chartContainer: {
    width: '100%',
  },
  chartTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.lg,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: SPACING.xs,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  chartBar: {
    width: '100%',
    height: 80,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    justifyContent: 'flex-end',
    marginBottom: SPACING.sm,
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 2,
  },
  chartLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 10,
  },

  // Milestones Section
  milestonesSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  milestoneCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  completedCard: {
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  milestoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    fontWeight: '600',
  },
  completedTitle: {
    color: COLORS.success,
  },
  milestoneDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  completedBadge: {
    marginLeft: SPACING.sm,
  },
  milestoneProgress: {
    marginBottom: SPACING.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '600',
  },
  progressPercent: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  remainingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  milestoneReward: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  rewardLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  rewardText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  completedInfo: {
    alignItems: 'center',
  },
  completedText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontWeight: '500',
  },

  // Tips Section
  tipsSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  tipsContainer: {
    gap: SPACING.md,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 12,
    ...SHADOWS.light,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  tipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
  },

  bottomPadding: {
    height: SPACING.xxl,
  },
});
