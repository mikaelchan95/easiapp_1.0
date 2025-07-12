import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCompanyPoints } from '../../hooks/useCompanyPoints';
import { UserPointsCard } from './UserPointsCard';
import { PointsHistoryModal } from './PointsHistoryModal';
import { User, Company, isCompanyUser } from '../../types/user';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { formatNumber } from '../../utils/formatting';

interface CompanyPointsSectionProps {
  user: User;
  company: Company | null;
}

export const CompanyPointsSection: React.FC<CompanyPointsSectionProps> = ({
  user,
  company,
}) => {
  const navigation = useNavigation();
  const [showHistory, setShowHistory] = useState(false);

  // Only render for company users with a company
  if (!isCompanyUser(user) || !company) {
    return null;
  }

  const {
    userPoints,
    companySummary,
    loading,
    error,
  } = useCompanyPoints(user.id, company.id);

  const handleViewFullDashboard = () => {
    // Navigate to the full company points screen
    // This would need to be added to the navigation structure
    // TODO: Navigate to full company points dashboard
  };

  const handleViewHistory = () => {
    setShowHistory(true);
  };

  if (error) {
    return (
      <View style={styles.errorCard}>
        <Ionicons name="alert-circle-outline" size={24} color={COLORS.textSecondary} />
        <Text style={styles.errorText}>Unable to load company points</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Company Points</Text>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={handleViewFullDashboard}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {companySummary ? formatNumber(companySummary.company_total_points) : formatNumber(company.totalPoints || 0)}
              </Text>
              <Text style={styles.summaryLabel}>Company Total</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {userPoints ? formatNumber(userPoints.points_balance) : '0'}
              </Text>
              <Text style={styles.summaryLabel}>My Points</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {userPoints ? `#${userPoints.points_rank}` : '--'}
              </Text>
              <Text style={styles.summaryLabel}>My Rank</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewHistory}
          >
            <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
            <Text style={styles.actionText}>View History</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewFullDashboard}
          >
            <Ionicons name="analytics-outline" size={20} color={COLORS.primary} />
            <Text style={styles.actionText}>Full Dashboard</Text>
          </TouchableOpacity>
        </View>

        {/* Individual User Points Card */}
        <UserPointsCard
          userPoints={userPoints}
          compact={true}
          onPress={handleViewHistory}
        />
      </View>

      {/* Points History Modal */}
      <PointsHistoryModal
        visible={showHistory}
        userId={user.id}
        companyId={company.id}
        onClose={() => setShowHistory(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    gap: 8,
    ...SHADOWS.light,
  },
  actionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '500',
  },
  errorCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
  },
  errorText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});