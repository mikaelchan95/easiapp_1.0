import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import MobileHeader from '../Layout/MobileHeader';

// Mock referral history data
const mockReferralHistory = [
  {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    status: 'completed',
    earned: 200,
    date: '2024-01-15',
    joinDate: '2024-01-10',
    firstPurchase: '2024-01-12',
  },
  {
    id: '2',
    name: 'David Kim',
    email: 'david@example.com',
    status: 'pending',
    earned: 0,
    date: '2024-01-12',
    joinDate: '2024-01-12',
    firstPurchase: null,
  },
  {
    id: '3',
    name: 'Emma Wilson',
    email: 'emma@example.com',
    status: 'completed',
    earned: 200,
    date: '2024-01-10',
    joinDate: '2024-01-05',
    firstPurchase: '2024-01-08',
  },
  {
    id: '4',
    name: 'Michael Brown',
    email: 'michael@example.com',
    status: 'expired',
    earned: 0,
    date: '2024-01-01',
    joinDate: '2024-01-01',
    firstPurchase: null,
  },
  {
    id: '5',
    name: 'Lisa Zhang',
    email: 'lisa@example.com',
    status: 'completed',
    earned: 200,
    date: '2023-12-28',
    joinDate: '2023-12-20',
    firstPurchase: '2023-12-25',
  },
  {
    id: '6',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    status: 'completed',
    earned: 200,
    date: '2023-12-15',
    joinDate: '2023-12-10',
    firstPurchase: '2023-12-12',
  },
  {
    id: '7',
    name: 'Maria Garcia',
    email: 'maria@example.com',
    status: 'pending',
    earned: 0,
    date: '2023-12-10',
    joinDate: '2023-12-10',
    firstPurchase: null,
  },
  {
    id: '8',
    name: 'James Lee',
    email: 'james@example.com',
    status: 'completed',
    earned: 200,
    date: '2023-12-05',
    joinDate: '2023-11-30',
    firstPurchase: '2023-12-02',
  },
];

const mockStats = {
  totalReferrals: 8,
  completedReferrals: 5,
  pendingReferrals: 2,
  expiredReferrals: 1,
  totalEarned: 1000,
  averageEarning: 125,
};

export default function ReferralHistoryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All', count: mockStats.totalReferrals },
    {
      id: 'completed',
      label: 'Completed',
      count: mockStats.completedReferrals,
    },
    { id: 'pending', label: 'Pending', count: mockStats.pendingReferrals },
    { id: 'expired', label: 'Expired', count: mockStats.expiredReferrals },
  ];

  const filteredReferrals =
    selectedFilter === 'all'
      ? mockReferralHistory
      : mockReferralHistory.filter(
          referral => referral.status === selectedFilter
        );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#E8F5E8', text: '#2E7D32' };
      case 'pending':
        return { bg: '#FFF3E0', text: '#F57C00' };
      case 'expired':
        return { bg: '#FFEBEE', text: '#C62828' };
      default:
        return { bg: COLORS.background, text: COLORS.textSecondary };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'expired':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const renderReferralItem = ({
    item,
  }: {
    item: (typeof mockReferralHistory)[0];
  }) => {
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);

    return (
      <View style={styles.referralItem}>
        <View style={styles.referralHeader}>
          <View style={styles.referralInfo}>
            <Text style={styles.referralName}>{item.name}</Text>
            <Text style={styles.referralEmail}>{item.email}</Text>
          </View>
          <View style={styles.referralStatus}>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}
            >
              <Ionicons name={statusIcon} size={14} color={statusColor.text} />
              <Text style={[styles.statusText, { color: statusColor.text }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
            {item.status === 'completed' && (
              <Text style={styles.earnedAmount}>+S${item.earned}</Text>
            )}
          </View>
        </View>

        <View style={styles.referralDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Referred:</Text>
            <Text style={styles.detailValue}>{item.date}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Joined:</Text>
            <Text style={styles.detailValue}>{item.joinDate}</Text>
          </View>
          {item.firstPurchase && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>First Purchase:</Text>
              <Text style={styles.detailValue}>{item.firstPurchase}</Text>
            </View>
          )}
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
        title="Referral History"
        showBackButton={true}
        showCartButton={true}
        showSearch={false}
        showLocationHeader={false}
      />

      {/* Summary Stats */}
      <View style={styles.summaryWidget}>
        <View style={styles.widgetContainer}>
          <Text style={styles.widgetTitle}>Your Referral Performance</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{mockStats.totalReferrals}</Text>
              <Text style={styles.statLabel}>Total Referrals</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>S${mockStats.totalEarned}</Text>
              <Text style={styles.statLabel}>Total Earned</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {mockStats.completedReferrals}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>S${mockStats.averageEarning}</Text>
              <Text style={styles.statLabel}>Avg. Earning</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                selectedFilter === filter.id && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter.id && styles.filterButtonTextActive,
                ]}
              >
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Referrals List */}
      <FlatList
        data={filteredReferrals}
        renderItem={renderReferralItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="people-outline"
              size={64}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyTitle}>No referrals found</Text>
            <Text style={styles.emptyDescription}>
              {selectedFilter === 'all'
                ? 'Start referring friends to see your history here'
                : `No ${selectedFilter} referrals to show`}
            </Text>
          </View>
        }
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

  // Summary Widget
  summaryWidget: {
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 12,
  },
  statValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 24,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },

  // Filter Container
  filterContainer: {
    marginBottom: SPACING.lg,
  },
  filterScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.buttonBg,
    borderColor: COLORS.buttonBg,
  },
  filterButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: COLORS.buttonText,
  },

  // List Container
  listContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },

  // Referral Item
  referralItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    fontWeight: '600',
  },
  referralEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  referralStatus: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '500',
  },
  earnedAmount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '600',
  },
  referralDetails: {
    gap: SPACING.sm,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  detailValue: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: SPACING.lg,
  },
  emptyDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
});
