import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import MobileHeader from '../Layout/MobileHeader';

// Mock achievements data
const mockAchievements = [
  {
    id: '1',
    title: 'First Purchase',
    description: 'Made your first purchase on EASI',
    icon: 'bag-check',
    category: 'purchase',
    points: 100,
    unlocked: true,
    unlockedDate: '2024-01-10',
    progress: 100,
    requirement: 'Make 1 purchase',
    rarity: 'common',
  },
  {
    id: '2',
    title: 'Whisky Connoisseur',
    description: 'Purchased 5 different whisky brands',
    icon: 'wine',
    category: 'collection',
    points: 250,
    unlocked: true,
    unlockedDate: '2024-01-15',
    progress: 100,
    requirement: 'Purchase 5 whisky brands',
    rarity: 'rare',
  },
  {
    id: '3',
    title: 'Premium Collector',
    description: 'Spent over S$1,000 on premium spirits',
    icon: 'diamond',
    category: 'spending',
    points: 500,
    unlocked: true,
    unlockedDate: '2024-01-20',
    progress: 100,
    requirement: 'Spend S$1,000+',
    rarity: 'epic',
  },
  {
    id: '4',
    title: 'Social Butterfly',
    description: 'Refer 10 friends to EASI',
    icon: 'people',
    category: 'referral',
    points: 300,
    unlocked: false,
    unlockedDate: null,
    progress: 70,
    requirement: 'Refer 10 friends',
    rarity: 'rare',
  },
  {
    id: '5',
    title: 'Speed Shopper',
    description: 'Complete 3 orders in a single day',
    icon: 'flash',
    category: 'activity',
    points: 150,
    unlocked: false,
    unlockedDate: null,
    progress: 33,
    requirement: 'Complete 3 orders in 1 day',
    rarity: 'uncommon',
  },
  {
    id: '6',
    title: 'Loyalty Champion',
    description: 'Maintain Gold tier for 6 months',
    icon: 'trophy',
    category: 'loyalty',
    points: 750,
    unlocked: false,
    unlockedDate: null,
    progress: 20,
    requirement: 'Gold tier for 6 months',
    rarity: 'legendary',
  },
  {
    id: '7',
    title: 'Night Owl',
    description: 'Place an order after midnight',
    icon: 'moon',
    category: 'activity',
    points: 50,
    unlocked: true,
    unlockedDate: '2024-01-08',
    progress: 100,
    requirement: 'Order after midnight',
    rarity: 'common',
  },
  {
    id: '8',
    title: 'Celebration Master',
    description: 'Purchase champagne 3 times',
    icon: 'celebrate',
    category: 'collection',
    points: 200,
    unlocked: false,
    unlockedDate: null,
    progress: 66,
    requirement: 'Buy champagne 3 times',
    rarity: 'uncommon',
  },
];

const mockStats = {
  totalAchievements: mockAchievements.length,
  unlockedAchievements: mockAchievements.filter(a => a.unlocked).length,
  totalPoints: mockAchievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0),
  nextMilestone: 'Reach 10 achievements',
  completionRate: Math.round(
    (mockAchievements.filter(a => a.unlocked).length /
      mockAchievements.length) *
      100
  ),
};

const categories = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'purchase', label: 'Purchase', icon: 'bag' },
  { id: 'collection', label: 'Collection', icon: 'library' },
  { id: 'spending', label: 'Spending', icon: 'card' },
  { id: 'referral', label: 'Referral', icon: 'people' },
  { id: 'activity', label: 'Activity', icon: 'pulse' },
  { id: 'loyalty', label: 'Loyalty', icon: 'star' },
];

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return { bg: '#E8F5E8', border: '#4CAF50', text: '#2E7D32' };
    case 'uncommon':
      return { bg: '#E3F2FD', border: '#2196F3', text: '#1976D2' };
    case 'rare':
      return { bg: '#FFF3E0', border: '#FF9800', text: '#F57C00' };
    case 'epic':
      return { bg: '#F3E5F5', border: '#9C27B0', text: '#7B1FA2' };
    case 'legendary':
      return { bg: '#FFF8E1', border: '#FFC107', text: '#F57F17' };
    default:
      return {
        bg: COLORS.background,
        border: COLORS.border,
        text: COLORS.textSecondary,
      };
  }
};

export default function AchievementsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredAchievements =
    selectedCategory === 'all'
      ? mockAchievements
      : mockAchievements.filter(
          achievement => achievement.category === selectedCategory
        );

  const renderAchievementItem = ({
    item,
  }: {
    item: (typeof mockAchievements)[0];
  }) => {
    const rarityColor = getRarityColor(item.rarity);

    return (
      <View
        style={[styles.achievementCard, { borderColor: rarityColor.border }]}
      >
        <View style={styles.achievementHeader}>
          <View
            style={[
              styles.achievementIcon,
              {
                backgroundColor: item.unlocked
                  ? rarityColor.bg
                  : COLORS.background,
                borderColor: rarityColor.border,
              },
            ]}
          >
            <Ionicons
              name={item.icon as any}
              size={24}
              color={item.unlocked ? rarityColor.text : COLORS.textSecondary}
            />
          </View>
          <View style={styles.achievementInfo}>
            <Text
              style={[
                styles.achievementTitle,
                { color: item.unlocked ? COLORS.text : COLORS.textSecondary },
              ]}
            >
              {item.title}
            </Text>
            <Text style={styles.achievementDescription}>
              {item.description}
            </Text>
            <Text style={styles.achievementRequirement}>
              {item.requirement}
            </Text>
          </View>
          <View style={styles.achievementReward}>
            <View
              style={[styles.rarityBadge, { backgroundColor: rarityColor.bg }]}
            >
              <Text style={[styles.rarityText, { color: rarityColor.text }]}>
                {item.rarity.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.pointsText}>+{item.points} pts</Text>
          </View>
        </View>

        {!item.unlocked && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Progress</Text>
              <Text style={styles.progressPercent}>{item.progress}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${item.progress}%`,
                    backgroundColor: rarityColor.border,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {item.unlocked && item.unlockedDate && (
          <View style={styles.unlockedSection}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={COLORS.success}
            />
            <Text style={styles.unlockedText}>
              Unlocked on {item.unlockedDate}
            </Text>
          </View>
        )}
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
        title="Achievements"
        showBackButton={true}
        showCartButton={true}
        showSearch={false}
        showLocationHeader={false}
      />

      {/* Stats Widget */}
      <View style={styles.statsWidget}>
        <View style={styles.widgetContainer}>
          <Text style={styles.widgetTitle}>Your Achievement Progress</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {mockStats.unlockedAchievements}
              </Text>
              <Text style={styles.statLabel}>Unlocked</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mockStats.totalPoints}</Text>
              <Text style={styles.statLabel}>Points Earned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mockStats.completionRate}%</Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
          </View>

          <View style={styles.nextMilestone}>
            <Text style={styles.milestoneText}>{mockStats.nextMilestone}</Text>
          </View>
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons
                name={category.icon as any}
                size={16}
                color={
                  selectedCategory === category.id
                    ? COLORS.buttonText
                    : COLORS.text
                }
              />
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category.id &&
                    styles.categoryButtonTextActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Achievements List */}
      <FlatList
        data={filteredAchievements}
        renderItem={renderAchievementItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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

  // Stats Widget
  statsWidget: {
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  statItem: {
    flex: 1,
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
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  nextMilestone: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  milestoneText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Filter Container
  filterContainer: {
    marginBottom: SPACING.lg,
  },
  filterScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.buttonBg,
    borderColor: COLORS.buttonBg,
  },
  categoryButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: COLORS.buttonText,
  },

  // List Container
  listContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },

  // Achievement Card
  achievementCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 2,
    ...SHADOWS.light,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 2,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    ...TYPOGRAPHY.h5,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  achievementDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  achievementRequirement: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
  },
  achievementReward: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  rarityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  rarityText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  pointsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '600',
  },

  // Progress Section
  progressSection: {
    marginBottom: SPACING.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  progressText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  progressPercent: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },

  // Unlocked Section
  unlockedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  unlockedText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontWeight: '500',
  },
});
