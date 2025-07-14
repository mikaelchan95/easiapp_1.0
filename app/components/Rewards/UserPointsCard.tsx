import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { formatNumber } from '../../utils/formatting';

interface UserPointsData {
  points_balance: number;
  lifetime_points: number;
  points_rank: number;
  lifetime_rank: number;
}

interface UserPointsCardProps {
  userPoints: UserPointsData | null;
  compact?: boolean;
  onPress?: () => void;
  loading?: boolean;
  error?: string | null;
}

export const UserPointsCard: React.FC<UserPointsCardProps> = ({
  userPoints,
  compact = false,
  onPress,
  loading = false,
  error = null,
}) => {
  if (loading) {
    return (
      <TouchableOpacity
        style={[styles.container, compact && styles.compactContainer]}
        onPress={onPress}
        disabled={!onPress}
      >
        <ActivityIndicator size="small" color={COLORS.primary} />
      </TouchableOpacity>
    );
  }

  if (error) {
    return (
      <TouchableOpacity
        style={[styles.container, compact && styles.compactContainer]}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.errorContent}>
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color={COLORS.textSecondary}
          />
          <Text style={styles.errorText}>Unable to load points</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (!userPoints) {
    return null;
  }

  const content = compact ? (
    <View style={styles.compactContent}>
      <View style={styles.compactRow}>
        <View style={styles.compactItem}>
          <Ionicons name="star" size={16} color={COLORS.warning} />
          <Text style={styles.compactValue}>
            {formatNumber(userPoints.points_balance)}
          </Text>
          <Text style={styles.compactLabel}>Points</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.compactItem}>
          <Ionicons name="trophy" size={16} color={COLORS.info} />
          <Text style={styles.compactValue}>#{userPoints.points_rank}</Text>
          <Text style={styles.compactLabel}>Rank</Text>
        </View>
      </View>
      {onPress && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.textSecondary}
        />
      )}
    </View>
  ) : (
    <View style={styles.fullContent}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="wallet-outline" size={24} color={COLORS.primary} />
          <Text style={styles.title}>My Points Balance</Text>
        </View>
        {onPress && (
          <TouchableOpacity onPress={onPress}>
            <Ionicons
              name="time-outline"
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.mainBalance}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceValue}>
          {formatNumber(userPoints.points_balance)}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatNumber(userPoints.lifetime_points)}
          </Text>
          <Text style={styles.statLabel}>Lifetime Points</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>#{userPoints.points_rank}</Text>
          <Text style={styles.statLabel}>Current Rank</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>#{userPoints.lifetime_rank}</Text>
          <Text style={styles.statLabel}>Best Rank</Text>
        </View>
      </View>

      {onPress && (
        <TouchableOpacity style={styles.historyButton} onPress={onPress}>
          <Text style={styles.historyButtonText}>View Points History</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.compactContainer]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  compactContainer: {
    padding: SPACING.md,
    borderRadius: 12,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  compactLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  fullContent: {
    gap: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    fontWeight: '600',
  },
  mainBalance: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  balanceLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  balanceValue: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  statLabel: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
  },
  historyButtonText: {
    ...TYPOGRAPHY.buttonSmall,
    color: COLORS.primary,
    fontWeight: '500',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: SPACING.sm,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
});
