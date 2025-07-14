import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import MobileHeader from '../Layout/MobileHeader';

const { width } = Dimensions.get('window');

// Mock analytics data
const mockAnalytics = {
  overview: {
    totalPointsEarned: 3250,
    totalPointsRedeemed: 1200,
    currentBalance: 2050,
    totalSpent: 1850,
    averageOrderValue: 185,
    totalOrders: 10,
    referralEarnings: 400,
    achievementPoints: 850,
  },
  monthlyData: [
    { month: 'Jan', earned: 450, redeemed: 0, spent: 450 },
    { month: 'Feb', earned: 320, redeemed: 200, spent: 320 },
    { month: 'Mar', earned: 280, redeemed: 0, spent: 280 },
    { month: 'Apr', earned: 190, redeemed: 300, spent: 190 },
    { month: 'May', earned: 220, redeemed: 0, spent: 220 },
    { month: 'Jun', earned: 160, redeemed: 400, spent: 160 },
    { month: 'Jul', earned: 140, redeemed: 0, spent: 140 },
    { month: 'Aug', earned: 90, redeemed: 300, spent: 90 },
  ],
  categoryBreakdown: [
    { category: 'Whisky', percentage: 45, amount: 832.5, color: '#FF9800' },
    { category: 'Champagne', percentage: 25, amount: 462.5, color: '#2196F3' },
    { category: 'Gin', percentage: 15, amount: 277.5, color: '#4CAF50' },
    { category: 'Vodka', percentage: 10, amount: 185, color: '#9C27B0' },
    { category: 'Other', percentage: 5, amount: 92.5, color: '#607D8B' },
  ],
  rewardSources: [
    { source: 'Purchases', points: 1850, percentage: 57 },
    { source: 'Achievements', points: 850, percentage: 26 },
    { source: 'Referrals', points: 400, percentage: 12 },
    { source: 'Bonuses', points: 150, percentage: 5 },
  ],
  insights: [
    {
      id: '1',
      type: 'spending',
      title: 'Peak Spending Month',
      description: 'January was your highest spending month with S$450',
      icon: 'trending-up',
      color: '#4CAF50',
    },
    {
      id: '2',
      type: 'category',
      title: 'Whisky Preference',
      description:
        'Whisky makes up 45% of your purchases - you have great taste!',
      icon: 'wine',
      color: '#FF9800',
    },
    {
      id: '3',
      type: 'efficiency',
      title: 'Point Efficiency',
      description: 'You earn an average of 17.6 points per dollar spent',
      icon: 'calculator',
      color: '#2196F3',
    },
    {
      id: '4',
      type: 'achievement',
      title: 'Achievement Hunter',
      description: "You've unlocked 4 out of 8 achievements - keep going!",
      icon: 'trophy',
      color: '#9C27B0',
    },
  ],
};

const timePeriods = [
  { id: 'month', label: 'This Month' },
  { id: 'quarter', label: 'Quarter' },
  { id: 'year', label: 'Year' },
  { id: 'all', label: 'All Time' },
];

export default function RewardsAnalyticsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState('year');
  const [selectedTab, setSelectedTab] = useState('overview');
  const progressAnims = useRef(
    mockAnalytics.categoryBreakdown.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Animate category breakdown
    mockAnalytics.categoryBreakdown.forEach((category, index) => {
      Animated.timing(progressAnims[index], {
        toValue: category.percentage,
        duration: 1000 + index * 100,
        useNativeDriver: false,
      }).start();
    });
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'analytics' },
    { id: 'spending', label: 'Spending', icon: 'card' },
    { id: 'insights', label: 'Insights', icon: 'bulb' },
  ];

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {mockAnalytics.overview.currentBalance.toLocaleString()}
          </Text>
          <Text style={styles.metricLabel}>Current Points</Text>
          <View style={styles.metricChange}>
            <Ionicons name="arrow-up" size={12} color={COLORS.success} />
            <Text style={styles.metricChangeText}>+15%</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            S${mockAnalytics.overview.totalSpent.toLocaleString()}
          </Text>
          <Text style={styles.metricLabel}>Total Spent</Text>
          <View style={styles.metricChange}>
            <Ionicons name="arrow-up" size={12} color={COLORS.success} />
            <Text style={styles.metricChangeText}>+8%</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {mockAnalytics.overview.totalOrders}
          </Text>
          <Text style={styles.metricLabel}>Orders</Text>
          <View style={styles.metricChange}>
            <Ionicons name="arrow-up" size={12} color={COLORS.success} />
            <Text style={styles.metricChangeText}>+2</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            S${mockAnalytics.overview.averageOrderValue}
          </Text>
          <Text style={styles.metricLabel}>Avg Order</Text>
          <View style={styles.metricChange}>
            <Ionicons name="arrow-down" size={12} color={COLORS.error} />
            <Text style={[styles.metricChangeText, { color: COLORS.error }]}>
              -5%
            </Text>
          </View>
        </View>
      </View>

      {/* Points Sources */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Points Sources</Text>
        {mockAnalytics.rewardSources.map((source, index) => (
          <View key={index} style={styles.sourceItem}>
            <View style={styles.sourceInfo}>
              <Text style={styles.sourceName}>{source.source}</Text>
              <Text style={styles.sourcePoints}>
                {source.points.toLocaleString()} pts
              </Text>
            </View>
            <View style={styles.sourceProgress}>
              <View style={styles.sourceProgressBar}>
                <View
                  style={[
                    styles.sourceProgressFill,
                    { width: `${source.percentage}%` },
                  ]}
                />
              </View>
              <Text style={styles.sourcePercentage}>{source.percentage}%</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSpending = () => (
    <View style={styles.tabContent}>
      {/* Monthly Chart */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Monthly Activity</Text>
        <View style={styles.chart}>
          {mockAnalytics.monthlyData.map((item, index) => (
            <View key={index} style={styles.chartColumn}>
              <View style={styles.chartBars}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: `${(item.earned / 500) * 100}%`,
                      backgroundColor: COLORS.success,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: `${(item.redeemed / 500) * 100}%`,
                      backgroundColor: COLORS.error,
                    },
                  ]}
                />
              </View>
              <Text style={styles.chartLabel}>{item.month}</Text>
            </View>
          ))}
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: COLORS.success }]}
            />
            <Text style={styles.legendText}>Earned</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: COLORS.error }]}
            />
            <Text style={styles.legendText}>Redeemed</Text>
          </View>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Spending by Category</Text>
        {mockAnalytics.categoryBreakdown.map((category, index) => (
          <View key={index} style={styles.categoryItem}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryInfo}>
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: category.color },
                  ]}
                />
                <Text style={styles.categoryName}>{category.category}</Text>
              </View>
              <Text style={styles.categoryAmount}>
                S${category.amount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.categoryProgress}>
              <View style={styles.categoryProgressBar}>
                <Animated.View
                  style={[
                    styles.categoryProgressFill,
                    {
                      backgroundColor: category.color,
                      width: progressAnims[index].interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.categoryPercentage}>
                {category.percentage}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderInsights = () => (
    <View style={styles.tabContent}>
      <View style={styles.insightsGrid}>
        {mockAnalytics.insights.map(insight => (
          <View key={insight.id} style={styles.insightCard}>
            <View
              style={[
                styles.insightIcon,
                { backgroundColor: `${insight.color}15` },
              ]}
            >
              <Ionicons
                name={insight.icon as any}
                size={24}
                color={insight.color}
              />
            </View>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <Text style={styles.insightDescription}>{insight.description}</Text>
          </View>
        ))}
      </View>

      {/* Recommendations */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        <View style={styles.recommendationsList}>
          <View style={styles.recommendation}>
            <Ionicons name="star" size={20} color={COLORS.text} />
            <Text style={styles.recommendationText}>
              Try exploring gin selections to diversify your collection
            </Text>
          </View>
          <View style={styles.recommendation}>
            <Ionicons name="people" size={20} color={COLORS.text} />
            <Text style={styles.recommendationText}>
              Refer 3 more friends to unlock the Social Butterfly achievement
            </Text>
          </View>
          <View style={styles.recommendation}>
            <Ionicons name="calendar" size={20} color={COLORS.text} />
            <Text style={styles.recommendationText}>
              Consider setting up a monthly budget to reach your next milestone
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'spending':
        return renderSpending();
      case 'insights':
        return renderInsights();
      default:
        return renderOverview();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      {/* Status Bar Background */}
      <View style={[styles.statusBarBackground, { height: insets.top }]} />

      {/* Mobile Header */}
      <MobileHeader
        title="Analytics"
        showBackButton={true}
        showCartButton={true}
        showSearch={false}
        showLocationHeader={false}
      />

      {/* Time Period Filter */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {timePeriods.map(period => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                selectedPeriod === period.id && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.id)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.id && styles.periodButtonTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              selectedTab === tab.id && styles.tabButtonActive,
            ]}
            onPress={() => setSelectedTab(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={selectedTab === tab.id ? COLORS.buttonText : COLORS.text}
            />
            <Text
              style={[
                styles.tabButtonText,
                selectedTab === tab.id && styles.tabButtonTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
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

  // Filter Container
  filterContainer: {
    marginBottom: SPACING.md,
  },
  filterScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  periodButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  periodButtonActive: {
    backgroundColor: COLORS.buttonBg,
    borderColor: COLORS.buttonBg,
  },
  periodButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: COLORS.buttonText,
  },

  // Tab Container
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.xs,
    ...SHADOWS.light,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  tabButtonActive: {
    backgroundColor: COLORS.buttonBg,
  },
  tabButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: COLORS.buttonText,
  },

  // Tab Content
  tabContent: {
    marginHorizontal: SPACING.md,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 12,
    ...SHADOWS.light,
  },
  metricValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 24,
  },
  metricLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  metricChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  metricChangeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontWeight: '500',
    fontSize: 11,
  },

  // Section Card
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },

  // Sources
  sourceItem: {
    marginBottom: SPACING.md,
  },
  sourceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sourceName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '500',
  },
  sourcePoints: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  sourceProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sourceProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  sourceProgressFill: {
    height: '100%',
    backgroundColor: COLORS.buttonBg,
    borderRadius: 3,
  },
  sourcePercentage: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
    minWidth: 30,
  },

  // Chart
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  chartBars: {
    width: '100%',
    height: 80,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
    marginBottom: SPACING.xs,
  },
  chartBar: {
    width: 8,
    borderRadius: 2,
    minHeight: 2,
  },
  chartLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },

  // Category
  categoryItem: {
    marginBottom: SPACING.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '500',
  },
  categoryAmount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  categoryProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  categoryProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryPercentage: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
    minWidth: 30,
  },

  // Insights
  insightsGrid: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  insightCard: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    ...SHADOWS.light,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  insightTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  insightDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Recommendations
  recommendationsList: {
    gap: SPACING.md,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  recommendationText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    flex: 1,
    lineHeight: 18,
  },

  bottomPadding: {
    height: SPACING.xxl,
  },
});
