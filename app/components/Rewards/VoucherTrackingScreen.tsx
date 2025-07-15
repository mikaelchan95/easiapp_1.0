import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  StatusBar,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  useRewards,
  VoucherStatus,
  PointsTransactionType,
} from '../../context/RewardsContext';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import MobileHeader from '../Layout/MobileHeader';
import AnimatedButton from '../UI/AnimatedButton';

type TabType = 'vouchers' | 'points' | 'missing' | 'expiring';

interface VoucherCardProps {
  voucher: any;
  onStatusUpdate?: (redemptionId: string, status: VoucherStatus) => void;
  showUserAttribution?: boolean;
}

const VoucherCard: React.FC<VoucherCardProps> = ({
  voucher,
  onStatusUpdate,
  showUserAttribution = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const getStatusColor = (status: VoucherStatus) => {
    // Following workspace rules - using monochrome colors
    switch (status) {
      case 'active':
        return COLORS.text; // Black for active
      case 'used':
        return COLORS.textSecondary; // Dark gray for used
      case 'expired':
        return COLORS.inactive; // Gray for expired
      case 'cancelled':
        return COLORS.inactive; // Gray for cancelled
      default:
        return COLORS.text;
    }
  };

  const getStatusIcon = (status: VoucherStatus) => {
    switch (status) {
      case 'active':
        return 'checkmark-circle-outline';
      case 'used':
        return 'checkmark-done-outline';
      case 'expired':
        return 'close-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const getStatusBackground = (status: VoucherStatus) => {
    // Subtle background colors following workspace rules
    switch (status) {
      case 'active':
        return COLORS.text; // Black background
      case 'used':
        return COLORS.textSecondary; // Dark gray background
      case 'expired':
        return COLORS.inactive; // Gray background
      case 'cancelled':
        return COLORS.inactive; // Gray background
      default:
        return COLORS.text;
    }
  };

  const getStatusTextColor = (status: VoucherStatus) => {
    // Text color for status badges
    switch (status) {
      case 'active':
        return COLORS.card; // White text on black
      case 'used':
        return COLORS.card; // White text on dark gray
      case 'expired':
        return COLORS.card; // White text on gray
      case 'cancelled':
        return COLORS.card; // White text on gray
      default:
        return COLORS.card;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isExpiringSoon = () => {
    const expiryDate = new Date(voucher.expires_at);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  return (
    <TouchableOpacity 
      style={styles.voucherCard}
      onPress={() => setIsExpanded(!isExpanded)}
      activeOpacity={0.8}
    >
      {/* Header Section - Always Visible */}
      <View style={styles.voucherHeader}>
        <View style={styles.voucherValue}>
          <Text style={styles.voucherAmount}>S${voucher.voucher_value}</Text>
          <Text style={styles.voucherLabel}>Voucher</Text>
        </View>

        <View style={styles.voucherHeaderRight}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusBackground(voucher.voucher_status) },
            ]}
          >
            <Ionicons
              name={getStatusIcon(voucher.voucher_status)}
              size={14}
              color={getStatusTextColor(voucher.voucher_status)}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusTextColor(voucher.voucher_status) },
              ]}
            >
              {voucher.voucher_status.charAt(0).toUpperCase() + voucher.voucher_status.slice(1)}
            </Text>
          </View>
          
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.textSecondary}
            style={styles.expandIcon}
          />
        </View>
      </View>

      {/* Compact Info - Always Visible */}
      <View style={styles.voucherCompact}>
        <Text style={styles.voucherTitle} numberOfLines={1}>
          {voucher.redemption?.reward?.title || 'Voucher'}
        </Text>
        
        <View style={styles.compactMeta}>
          <Text style={styles.compactText}>
            Redeemed: {formatDate(voucher.issued_at)}
          </Text>
          {showUserAttribution && voucher.redeemedBy && (
            <Text style={styles.compactText}>
              by {voucher.redeemedBy.name}
            </Text>
          )}
        </View>

        {isExpiringSoon() && voucher.voucher_status === 'active' && (
          <Text style={styles.expiryWarningCompact}>⚠️ Expires soon!</Text>
        )}
      </View>

      {/* Expanded Details - Collapsible */}
      {isExpanded && (
        <View style={styles.voucherDetails}>
          <View style={styles.voucherMeta}>
            <View style={styles.metaRow}>
              <Ionicons
                name="time-outline"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.metaText}>
                Expires: {formatDate(voucher.expires_at)}
              </Text>
            </View>

            {voucher.redemption?.confirmation_code && (
              <View style={styles.metaRow}>
                <Ionicons
                  name="receipt-outline"
                  size={16}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.metaText}>
                  Code: {voucher.redemption.confirmation_code}
                </Text>
              </View>
            )}

            <View style={styles.metaRow}>
              <Ionicons
                name="star-outline"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.metaText}>
                {voucher.redemption?.points_used?.toLocaleString() || 0} points used
              </Text>
            </View>

            {showUserAttribution && voucher.redeemedBy && (
              <View style={styles.metaRow}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.metaText}>
                  Redeemed by: {voucher.redeemedBy.name}
                </Text>
                {voucher.redeemedBy.email && (
                  <Text style={styles.metaSubText}>
                    {voucher.redeemedBy.email}
                  </Text>
                )}
              </View>
            )}

            {voucher.used_at && (
              <View style={styles.metaRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.metaText}>
                  Used on: {formatDate(voucher.used_at)}
                </Text>
              </View>
            )}

            {voucher.used_in_order_id && (
              <View style={styles.metaRow}>
                <Ionicons
                  name="receipt-outline"
                  size={16}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.metaText}>
                  Order: {voucher.used_in_order_id}
                </Text>
              </View>
            )}

            {voucher.usedBy && (
              <View style={styles.metaRow}>
                <Ionicons
                  name="person-circle-outline"
                  size={16}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.metaText}>
                  Used by: {voucher.usedBy.name}
                </Text>
              </View>
            )}

            {voucher.companyName && (
              <View style={styles.metaRow}>
                <Ionicons
                  name="business-outline"
                  size={16}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.metaText}>
                  Company: {voucher.companyName}
                </Text>
              </View>
            )}
          </View>

          {isExpiringSoon() && voucher.voucher_status === 'active' && (
            <View style={styles.expiryWarning}>
              <Ionicons name="warning-outline" size={16} color={COLORS.text} />
              <Text style={styles.expiryWarningText}>
                This voucher expires in {Math.ceil(
                  (new Date(voucher.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                )} days!
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

interface MissingPointsCardProps {
  entry: any;
  onReport?: () => void;
}

const MissingPointsCard: React.FC<MissingPointsCardProps> = ({
  entry,
  onReport,
}) => {
  const getStatusColor = (status: string) => {
    // Following workspace rules - using monochrome colors
    switch (status) {
      case 'resolved':
        return COLORS.text; // Black for resolved
      case 'investigating':
        return COLORS.textSecondary; // Dark gray for investigating
      case 'reported':
        return COLORS.text; // Black for reported
      case 'rejected':
        return COLORS.inactive; // Gray for rejected
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'resolved':
        return COLORS.text; // Black background
      case 'investigating':
        return COLORS.border; // Light gray background
      case 'reported':
        return COLORS.textSecondary; // Dark gray background
      case 'rejected':
        return COLORS.inactive; // Gray background
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return COLORS.card; // White text on black
      case 'investigating':
        return COLORS.text; // Black text on light gray
      case 'reported':
        return COLORS.card; // White text on dark gray
      case 'rejected':
        return COLORS.card; // White text on gray
      default:
        return COLORS.card;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.missingPointsCard}>
      <View style={styles.missingHeader}>
        <Text style={styles.missingOrderId}>Order {entry.orderId}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusBackground(entry.status) },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusTextColor(entry.status) },
            ]}
          >
            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
          </Text>
        </View>
      </View>

      <Text style={styles.missingReason}>{entry.reason}</Text>

      <View style={styles.missingDetails}>
        <View style={styles.missingRow}>
          <Text style={styles.missingLabel}>Expected Points:</Text>
          <Text style={styles.missingValue}>
            {entry.expectedPoints.toLocaleString()}
          </Text>
        </View>

        <View style={styles.missingRow}>
          <Text style={styles.missingLabel}>Order Date:</Text>
          <Text style={styles.missingValue}>{formatDate(entry.orderDate)}</Text>
        </View>

        <View style={styles.missingRow}>
          <Text style={styles.missingLabel}>Reported:</Text>
          <Text style={styles.missingValue}>
            {formatDate(entry.reportedDate)}
          </Text>
        </View>

        {entry.resolvedDate && (
          <View style={styles.missingRow}>
            <Text style={styles.missingLabel}>Resolved:</Text>
            <Text style={styles.missingValue}>
              {formatDate(entry.resolvedDate)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

interface ExpiringPointsCardProps {
  entry: any;
}

const ExpiringPointsCard: React.FC<ExpiringPointsCardProps> = ({ entry }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysUntilExpiry = () => {
    const expiryDate = new Date(entry.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry;
  };

  const daysLeft = getDaysUntilExpiry();
  const isUrgent = daysLeft <= 3;

  return (
    <View style={[styles.expiringCard, isUrgent && styles.expiringCardUrgent]}>
      <View style={styles.expiringHeader}>
        <View style={styles.pointsInfo}>
          <Text style={styles.expiringPoints}>
            {entry.points.toLocaleString()}
          </Text>
          <Text style={styles.expiringLabel}>Points Expiring</Text>
        </View>

        <View style={styles.expiryInfo}>
          <Text style={[styles.daysLeft, isUrgent && styles.daysLeftUrgent]}>
            {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
          </Text>
          <Ionicons
            name="time-outline"
            size={16}
            color={isUrgent ? COLORS.text : COLORS.textSecondary}
          />
        </View>
      </View>

      <Text style={styles.expiringSource}>{entry.source}</Text>

      <View style={styles.expiringDates}>
        <Text style={styles.expiringDate}>
          Earned: {formatDate(entry.earnedDate)}
        </Text>
        <Text style={styles.expiringDate}>
          Expires: {formatDate(entry.expiryDate)}
        </Text>
      </View>
    </View>
  );
};

export default function VoucherTrackingScreen() {
  const navigation = useNavigation();
  const { state } = useRewards();
  const [activeTab, setActiveTab] = useState<TabType>('vouchers');
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'earned' | 'redeemed' | 'expired'
  >('all');
  const insets = useSafeAreaInsets();

  const tabs = useMemo(
    () => [
      {
        id: 'vouchers' as TabType,
        label: 'Vouchers',
        icon: 'card-outline',
        count: state.userRewards?.availableVouchers?.length || 0,
      },
      {
        id: 'points' as TabType,
        label: 'History',
        icon: 'time-outline',
        count: state.userRewards?.pointsHistory?.length || 0,
      },
      {
        id: 'missing' as TabType,
        label: 'Missing',
        icon: 'alert-circle-outline',
        count: state.userRewards?.missingPoints?.length || 0,
      },
      {
        id: 'expiring' as TabType,
        label: 'Expiring',
        icon: 'hourglass-outline',
        count: state.userRewards?.pointsExpiring?.length || 0,
      },
    ],
    [state.userRewards]
  );

  const handleReportMissingPoints = () => {
    Alert.alert(
      'Report Missing Points',
      'Please contact our support team to report missing points from your recent purchase.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Contact Support',
          onPress: () => navigation.navigate('Support'),
        },
      ]
    );
  };

  const renderVouchersList = () => {
    const vouchers = state.userRewards?.availableVouchers || [];
    
    console.log('📋 Rendering vouchers list:', vouchers.length, 'vouchers');
    
    if (vouchers.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons
            name="card-outline"
            size={48}
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyTitle}>No Vouchers Yet</Text>
          <Text style={styles.emptyText}>
            Your redeemed vouchers will appear here. Start earning points to
            unlock rewards!
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={vouchers}
        renderItem={({ item }) => <VoucherCard voucher={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderPointsHistory = () => {
    const pointsHistory = state.userRewards?.pointsHistory || [];
    const filteredHistory = pointsHistory.filter(item => {
      if (selectedFilter === 'all') return true;
      return item.type === selectedFilter;
    });

    const filters = [
      { id: 'all', label: 'All' },
      { id: 'earned', label: 'Earned' },
      { id: 'redeemed', label: 'Redeemed' },
      { id: 'expired', label: 'Expired' },
    ];

    return (
      <View style={styles.historyContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterTab,
                selectedFilter === filter.id && styles.filterTabActive,
              ]}
              onPress={() => setSelectedFilter(filter.id as any)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedFilter === filter.id && styles.filterTabTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={filteredHistory}
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              <View style={styles.historyContent}>
                <Text style={styles.historyDescription}>
                  {item.description}
                </Text>
                <Text style={styles.historyDate}>{item.date}</Text>
                {item.orderId && (
                  <Text style={styles.historyOrderId}>
                    Order: {item.orderId}
                  </Text>
                )}
                <Text style={styles.historyCategory}>{item.type}</Text>
              </View>
              <Text
                style={[
                  styles.historyPoints,
                  item.type === 'earned'
                    ? styles.pointsEarned
                    : item.type === 'redeemed'
                      ? styles.pointsRedeemed
                      : styles.pointsExpired,
                ]}
              >
                {item.type === 'earned'
                  ? '+'
                  : item.type === 'redeemed'
                    ? '-'
                    : ''}
                {item.points.toLocaleString()}
              </Text>
            </View>
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  const renderMissingPoints = () => {
    const missingPoints = state.userRewards?.missingPoints || [];
    if (missingPoints.length === 0) {
      return (
        <View style={styles.missingContainer}>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={handleReportMissingPoints}
          >
            <Ionicons name="add-outline" size={20} color={COLORS.card} />
            <Text style={styles.reportButtonText}>Report Missing Points</Text>
          </TouchableOpacity>

          <View style={styles.emptyState}>
            <Ionicons
              name="checkmark-circle-outline"
              size={48}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyTitle}>All Points Accounted For</Text>
            <Text style={styles.emptyText}>
              No missing points reports. If you believe points are missing from
              a recent purchase, use the report button above.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.missingContainer}>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={handleReportMissingPoints}
        >
          <Ionicons name="add-outline" size={20} color={COLORS.card} />
          <Text style={styles.reportButtonText}>Report Missing Points</Text>
        </TouchableOpacity>

        <FlatList
          data={missingPoints}
          renderItem={({ item }) => <MissingPointsCard entry={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  const renderExpiringPoints = () => {
    const pointsExpiring = state.userRewards?.pointsExpiring || [];
    const urgentExpiringPoints = pointsExpiring.filter(
      entry => {
        const expiryDate = new Date(entry.expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry <= 3;
      }
    );

    if (pointsExpiring.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons
            name="time-outline"
            size={48}
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyTitle}>No Expiring Points</Text>
          <Text style={styles.emptyText}>
            Your points are safe! None of your current points are expiring soon.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.expiringContainer}>
        {urgentExpiringPoints.length > 0 && (
          <View style={styles.urgentNotice}>
            <Ionicons name="warning-outline" size={20} color={COLORS.text} />
            <Text style={styles.urgentText}>
              {urgentExpiringPoints.length} point
              {urgentExpiringPoints.length > 1 ? 's' : ''} expire within 3 days!
            </Text>
          </View>
        )}

        <FlatList
          data={pointsExpiring}
          renderItem={({ item }) => <ExpiringPointsCard entry={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'vouchers':
        return renderVouchersList();
      case 'points':
        return renderPointsHistory();
      case 'missing':
        return renderMissingPoints();
      case 'expiring':
        return renderExpiringPoints();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      {/* Status Bar Background */}
      <View style={[styles.statusBarBackground, { height: insets.top }]} />

      {/* Mobile Header */}
      <MobileHeader
        title="Voucher Tracking"
        showBackButton={true}
        showCartButton={true}
        showSearch={false}
        showLocationHeader={false}
      />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={
                  activeTab === tab.id ? COLORS.card : COLORS.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {tab.count > 99 ? '99+' : tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>
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

  // Tab Navigation - improved design
  tabContainer: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.xs,
  },
  tabScrollContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    backgroundColor: 'transparent',
    minHeight: 36,
  },
  tabActive: {
    backgroundColor: COLORS.text, // Black background for active tab
  },
  tabText: {
    ...TYPOGRAPHY.bodySmall,
    marginLeft: SPACING.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.card, // White text for active tab
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: COLORS.text,
    borderRadius: 12,
    minWidth: 24,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  tabBadgeText: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.card,
    fontWeight: '700',
  },

  // Content
  content: {
    flex: 1,
  },
  listContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },

  // Voucher Cards - improved design
  voucherCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  voucherValue: {
    alignItems: 'flex-start',
  },
  voucherAmount: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: '800',
  },
  voucherLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  voucherStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    minHeight: 32,
  },
  statusText: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    marginLeft: SPACING.xs,
    letterSpacing: 0.3,
  },
  voucherDetails: {
    gap: SPACING.md,
  },
  voucherTitle: {
    ...TYPOGRAPHY.h5,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  voucherMeta: {
    gap: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  expiryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.border,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.text,
    gap: SPACING.sm,
  },
  expiryWarningText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: '600',
  },
  usedInfo: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  usedText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  orderText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },

  // Collapsible VoucherCard styles
  voucherHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  expandIcon: {
    marginLeft: SPACING.xs,
  },
  voucherCompact: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  compactMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  compactText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  expiryWarningCompact: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  metaSubText: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
    marginLeft: SPACING.lg,
  },

  // Missing Points Cards - improved design
  missingContainer: {
    flex: 1,
  },
  missingPointsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  missingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  missingOrderId: {
    ...TYPOGRAPHY.h5,
    fontWeight: '700',
  },
  missingReason: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.md,
    color: COLORS.textSecondary,
  },
  missingDetails: {
    gap: SPACING.sm,
  },
  missingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missingLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  missingValue: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.text,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.text,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    margin: SPACING.md,
    minHeight: 48,
    gap: SPACING.sm,
    ...SHADOWS.light,
  },
  reportButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.card,
    fontWeight: '600',
  },

  // Expiring Points Cards - improved design
  expiringContainer: {
    flex: 1,
  },
  expiringCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expiringCardUrgent: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.text,
    backgroundColor: COLORS.background,
  },
  expiringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  pointsInfo: {
    alignItems: 'flex-start',
  },
  expiringPoints: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: '800',
  },
  expiringLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  daysLeft: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  daysLeftUrgent: {
    color: COLORS.text,
    fontWeight: '700',
  },
  expiringSource: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.md,
    color: COLORS.textSecondary,
  },
  expiringDates: {
    gap: SPACING.xs,
  },
  expiringDate: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  urgentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.border,
    padding: SPACING.md,
    borderRadius: 12,
    margin: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.text,
    gap: SPACING.sm,
  },
  urgentText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
  },

  // History - improved design
  historyContainer: {
    flex: 1,
  },
  filterScroll: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: 50,
  },
  filterScrollContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
    alignItems: 'center',
  },
  filterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    backgroundColor: 'transparent',
    minHeight: 28,
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.text,
  },
  filterTabText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: COLORS.card,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  historyDescription: {
    ...TYPOGRAPHY.bodySmall,
    marginBottom: SPACING.xs,
    fontWeight: '600',
    color: COLORS.text,
  },
  historyDate: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
  },
  historyOrderId: {
    ...TYPOGRAPHY.label,
    color: COLORS.text,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  historyCategory: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginTop: SPACING.xs,
    letterSpacing: 0.5,
  },
  historyPoints: {
    ...TYPOGRAPHY.h5,
    fontWeight: '700',
    color: COLORS.text,
  },
  pointsEarned: {
    color: COLORS.text,
  },
  pointsRedeemed: {
    color: COLORS.textSecondary,
  },
  pointsExpired: {
    color: COLORS.inactive,
  },

  // Empty States - improved design
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    color: COLORS.textSecondary,
    lineHeight: 24,
    maxWidth: 280,
  },
});
