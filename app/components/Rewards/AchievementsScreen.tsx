import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Animated,
  Dimensions,
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
    icon: 'bag-check-outline',
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
    icon: 'wine-outline',
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
    icon: 'diamond-outline',
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
    icon: 'people-outline',
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
    icon: 'flash-outline',
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
    icon: 'trophy-outline',
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
    icon: 'moon-outline',
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
    icon: 'glass-outline',
    category: 'collection',
    points: 200,
    unlocked: false,
    unlockedDate: null,
    progress: 66,
    requirement: 'Buy champagne 3 times',
    rarity: 'uncommon',
  },
];

const categories = [
  { id: 'all', label: 'All', icon: 'apps-outline' },
  { id: 'purchase', label: 'Purchase', icon: 'bag-outline' },
  { id: 'collection', label: 'Collection', icon: 'library-outline' },
  { id: 'spending', label: 'Spending', icon: 'card-outline' },
  { id: 'referral', label: 'Referral', icon: 'people-outline' },
  { id: 'activity', label: 'Activity', icon: 'pulse-outline' },
  { id: 'loyalty', label: 'Loyalty', icon: 'star-outline' },
];

export default function AchievementsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    return selectedCategory === 'all'
      ? mockAchievements
      : mockAchievements.filter(a => a.category === selectedCategory);
  }, [selectedCategory]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = mockAchievements.length;
    const unlocked = mockAchievements.filter(a => a.unlocked).length;
    const points = mockAchievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + a.points, 0);
    const progress = Math.round((unlocked / total) * 100);
    return { total, unlocked, points, progress };
  }, []);

  const renderAchievementItem = ({
    item,
  }: {
    item: (typeof mockAchievements)[0];
  }) => {
    const isUnlocked = item.unlocked;

    return (
      <View style={[styles.card, !isUnlocked && styles.cardLocked]}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconContainer,
              isUnlocked && styles.iconContainerUnlocked,
            ]}
          >
            <Ionicons
              name={item.icon as any}
              size={24}
              color={isUnlocked ? COLORS.text : COLORS.inactive}
            />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, !isUnlocked && styles.textLocked]}>
                {item.title}
              </Text>
              {isUnlocked && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={COLORS.text}
                />
              )}
            </View>
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>

            {/* Progress Bar for locked items */}
            {!isUnlocked && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${item.progress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {item.progress}% • {item.requirement}
                </Text>
              </View>
            )}

            {/* Unlocked Date for unlocked items */}
            {isUnlocked && item.unlockedDate && (
              <Text style={styles.unlockedDate}>
                Unlocked on {new Date(item.unlockedDate).toLocaleDateString()}
              </Text>
            )}
          </View>

          <View style={styles.pointsContainer}>
            <Text
              style={[styles.pointsValue, !isUnlocked && styles.textLocked]}
            >
              +{item.points}
            </Text>
            <Text style={styles.pointsLabel}>pts</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Background for Status Bar */}
      <View
        style={{ height: insets.top, backgroundColor: COLORS.background }}
      />

      <MobileHeader
        title="Achievements"
        showBackButton={true}
        showCartButton={false} // Cleaner look
        showSearch={false}
        showLocationHeader={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Section */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{stats.unlocked}</Text>
                <Text style={styles.summaryLabel}>Unlocked</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{stats.points}</Text>
                <Text style={styles.summaryLabel}>Points Earned</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{stats.progress}%</Text>
                <Text style={styles.summaryLabel}>Complete</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
          style={styles.categoriesContainer}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon as any}
                size={16}
                color={selectedCategory === cat.id ? COLORS.card : COLORS.text}
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.id && styles.categoryTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Achievements List */}
        <View style={styles.listContainer}>
          {filteredAchievements.map(item => (
            <View key={item.id}>{renderAchievementItem({ item })}</View>
          ))}
        </View>

        {/* Bottom Padding */}
        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  summaryContainer: {
    padding: SPACING.md,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  categoriesContainer: {
    marginBottom: SPACING.md,
  },
  categoriesContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '500',
    color: COLORS.text,
  },
  categoryTextActive: {
    color: COLORS.card,
  },
  listContainer: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardLocked: {
    backgroundColor: COLORS.background, // Slightly different bg for locked
    borderColor: COLORS.border,
    opacity: 0.9,
    // Remove shadow for locked items
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconContainerUnlocked: {
    backgroundColor: COLORS.card, // White bg
    borderColor: COLORS.primary, // Black border
    borderWidth: 2,
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  title: {
    ...TYPOGRAPHY.h5,
    fontWeight: '600',
  },
  textLocked: {
    color: COLORS.textSecondary,
  },
  description: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.textSecondary,
    borderRadius: 2,
  },
  progressText: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.textSecondary,
  },
  unlockedDate: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.text,
    marginTop: 4,
    fontWeight: '500',
  },
  pointsContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingTop: 4,
  },
  pointsValue: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.text,
  },
  pointsLabel: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
});
