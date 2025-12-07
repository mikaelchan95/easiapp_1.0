import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Animated,
  Modal,
  ActivityIndicator,
  StatusBar,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { getSupabaseImageUrl } from '../../utils/imageUtils';
import { useRewards, TierLevel } from '../../context/RewardsContext';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { useAppContext } from '../../context/AppContext';
import { isCompanyUser } from '../../types/user';
import { formatPoints, formatLargeNumber } from '../../utils/formatting';
import { auditService, PointsAuditEntry } from '../../services/auditService';

// Points History Modal Component (Refactored for cleaner code)
const PointsHistoryModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const { state } = useRewards();
  const { state: appState } = useAppContext();
  const [pointsAudit, setPointsAudit] = useState<PointsAuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPointsAudit = async () => {
      if (visible && appState.user) {
        setLoading(true);
        try {
          let auditData: PointsAuditEntry[] = [];
          if (appState.user.accountType === 'individual') {
            auditData = await auditService.getUserPointsAudit(appState.user.id);
          } else if (
            appState.user.accountType === 'company' &&
            appState.user.companyId
          ) {
            auditData = await auditService.getCompanyPointsAudit(
              appState.user.companyId
            );
          }
          setPointsAudit(auditData);
        } catch (error) {
          console.error('Error loading points audit:', error);
          setPointsAudit([]);
        } finally {
          setLoading(false);
        }
      }
    };
    loadPointsAudit();
  }, [visible, appState.user?.id, appState.user?.companyId]);

  const renderAuditItem = ({ item }: { item: PointsAuditEntry }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyContent}>
        <Text style={styles.historyDescription}>{item.description}</Text>
        <Text style={styles.historyDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.historyPointsContainer}>
        <Text
          style={[
            styles.historyPoints,
            item.points_amount > 0
              ? styles.pointsEarned
              : styles.pointsRedeemed,
          ]}
        >
          {item.points_amount > 0 ? '+' : ''}
          {formatPoints(Math.abs(item.points_amount))}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Points History</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={pointsAudit}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.historyList}
            renderItem={renderAuditItem}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No points history yet</Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
};

// Redemption Confirmation Modal
const RedemptionModal = ({
  visible,
  reward,
  onConfirm,
  onCancel,
  isProcessing,
}: {
  visible: boolean;
  reward: any;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}) => {
  if (!reward) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        style={[
          styles.redemptionModalOverlay,
          { backgroundColor: 'rgba(0,0,0,0.8)' },
        ]}
      >
        <View style={styles.redemptionCard}>
          <Image
            source={{
              uri:
                getSupabaseImageUrl(reward.imageUrl || '') ||
                'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
            }}
            style={styles.redemptionImage}
          />
          <View style={styles.redemptionContent}>
            <Text style={styles.redemptionTitle}>Redeem Reward</Text>
            <Text style={styles.redemptionText}>
              Are you sure you want to redeem {formatPoints(reward.points)} for:
            </Text>
            <Text style={styles.redemptionRewardName}>{reward.title}</Text>

            <View style={styles.redemptionActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                disabled={isProcessing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={onConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color={COLORS.accent} />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function RewardsScreen() {
  const navigation = useNavigation();
  const {
    state,
    redeemReward,
    getPointsToNextTier,
    getExpiringPoints,
    loadRewardsCatalog,
    loadUserVouchers,
  } = useRewards();
  const { state: appState } = useAppContext();

  useFocusEffect(
    useCallback(() => {
      loadRewardsCatalog();
      loadUserVouchers();
    }, [])
  );

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showHistory, setShowHistory] = useState(false);
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [claimedRewardTitle, setClaimedRewardTitle] = useState('');

  const insets = useSafeAreaInsets();
  const notificationAnim = useRef(new Animated.Value(-100)).current;

  const user = appState.user;

  // Loading State
  if (user && !state.userRewards) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Auth Required State
  if (!user || !state.userRewards) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.authText}>Please sign in to view rewards</Text>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleRedeemPress = (reward: any) => {
    setSelectedReward(reward);
    setRedeemModalVisible(true);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return;
    setIsRedeeming(true);

    // Simulate network delay for better UX feel or wait for actual promise
    const success = await redeemReward(selectedReward.id);

    setIsRedeeming(false);
    setRedeemModalVisible(false);

    if (success) {
      setClaimedRewardTitle(selectedReward.title);
      showNotification();
    }
    setSelectedReward(null);
  };

  const showNotification = () => {
    setShowSuccessNotification(true);
    Animated.sequence([
      Animated.spring(notificationAnim, {
        toValue: insets.top + 10,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.delay(3000),
      Animated.timing(notificationAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowSuccessNotification(false));
  };

  // Filter Logic
  const filteredRewards =
    selectedCategory === 'all'
      ? state.rewardsCatalog
      : state.rewardsCatalog.filter(r => r.type === selectedCategory);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'voucher', label: 'Vouchers' },
    { id: 'bundle', label: 'Bundles' },
    { id: 'experience', label: 'Experiences' },
    { id: 'swag', label: 'Merch' },
  ];

  // Calculate Progress
  const currentPoints = state.userRewards.points;
  const lifetimePoints = state.userRewards.lifetimePoints;
  const currentTier = state.userRewards.tier || 'Bronze';

  // Tier Thresholds: Bronze 0-49999, Silver 50000-199999, Gold 200000+
  const getTierProgress = () => {
    if (currentTier === 'Gold') return 100;
    const nextTierThreshold = currentTier === 'Bronze' ? 50000 : 200000;
    const currentTierBase = currentTier === 'Bronze' ? 0 : 50000;
    const progress =
      ((lifetimePoints - currentTierBase) /
        (nextTierThreshold - currentTierBase)) *
      100;
    return Math.min(Math.max(progress, 0), 100);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Success Notification */}
      {showSuccessNotification && (
        <Animated.View
          style={[
            styles.notification,
            { transform: [{ translateY: notificationAnim }] },
          ]}
        >
          <Ionicons name="checkmark-circle" size={24} color={COLORS.accent} />
          <View style={styles.notificationTextContainer}>
            <Text style={styles.notificationTitle}>Success!</Text>
            <Text style={styles.notificationMessage}>
              You redeemed: {claimedRewardTitle}
            </Text>
          </View>
        </Animated.View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SPACING.md },
        ]}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Loyalty & Rewards</Text>
          <TouchableOpacity onPress={() => setShowHistory(true)}>
            <Text style={styles.historyLink}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Loyalty Card */}
        <LinearGradient
          colors={['#1a1a1a', '#333333']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loyaltyCard}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>Current Balance</Text>
              <Text style={styles.cardPoints}>
                {formatLargeNumber(currentPoints)}{' '}
                <Text style={styles.cardPointsLabel}>PTS</Text>
              </Text>
            </View>
            <View style={styles.tierBadge}>
              <Ionicons name="trophy" size={14} color="#FFD700" />
              <Text style={styles.tierText}>{currentTier}</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>
                {currentTier === 'Gold'
                  ? 'Max Tier Reached'
                  : 'Next Tier Progress'}
              </Text>
              {currentTier !== 'Gold' && (
                <Text style={styles.progressValue}>
                  {Math.round(getTierProgress())}%
                </Text>
              )}
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${getTierProgress()}%` },
                ]}
              />
            </View>
            {currentTier !== 'Gold' && (
              <Text style={styles.nextTierText}>
                {formatLargeNumber(getPointsToNextTier())} points to{' '}
                {currentTier === 'Bronze' ? 'Silver' : 'Gold'}
              </Text>
            )}
          </View>
        </LinearGradient>

        {/* Quick Actions (Simplified) */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('VoucherTracking' as never)}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: COLORS.background },
              ]}
            >
              <Ionicons name="ticket-outline" size={20} color={COLORS.text} />
            </View>
            <Text style={styles.actionText}>My Vouchers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ReferralScreen' as never)}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: COLORS.background },
              ]}
            >
              <Ionicons name="people-outline" size={20} color={COLORS.text} />
            </View>
            <Text style={styles.actionText}>Refer Friends</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AchievementsScreen' as never)}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: COLORS.background },
              ]}
            >
              <Ionicons name="ribbon-outline" size={20} color={COLORS.text} />
            </View>
            <Text style={styles.actionText}>Achievements</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
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

        {/* Rewards List */}
        <View style={styles.rewardsGrid}>
          {filteredRewards.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={48} color={COLORS.inactive} />
              <Text style={styles.emptyStateText}>
                No rewards available in this category.
              </Text>
            </View>
          ) : (
            filteredRewards.map(reward => {
              const canRedeem = currentPoints >= reward.points;
              return (
                <TouchableOpacity
                  key={reward.id}
                  style={styles.rewardCard}
                  onPress={() => handleRedeemPress(reward)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardTop}>
                    <Image
                      source={{
                        uri:
                          getSupabaseImageUrl(
                            reward.logoUrl || reward.imageUrl || ''
                          ) || 'https://via.placeholder.com/150',
                      }}
                      style={styles.cardLogo}
                    />
                    <View style={styles.cardHeaderInfo}>
                      <Text style={styles.companyName} numberOfLines={1}>
                        {reward.title}
                      </Text>
                      <Text
                        style={[
                          styles.statusText,
                          !canRedeem && styles.statusTextDisabled,
                        ]}
                      >
                        {formatLargeNumber(reward.points)} PTS
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dashedDividerContainer}>
                    <View style={styles.dashedDivider} />
                  </View>

                  <View style={styles.cardBottom}>
                    <Text style={styles.rewardTitle} numberOfLines={2}>
                      {reward.description}
                    </Text>
                    <Text style={styles.dateRange}>
                      {canRedeem ? 'Tap to redeem' : 'Not enough points'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <PointsHistoryModal
        visible={showHistory}
        onClose={() => setShowHistory(false)}
      />

      <RedemptionModal
        visible={redeemModalVisible}
        reward={selectedReward}
        onConfirm={handleConfirmRedeem}
        onCancel={() => {
          setRedeemModalVisible(false);
          setSelectedReward(null);
        }}
        isProcessing={isRedeeming}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  authText: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.md,
    color: COLORS.textSecondary,
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  signInButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.accent,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  pageTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  historyLink: {
    ...TYPOGRAPHY.buttonSmall,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Loyalty Card
  loyaltyCard: {
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xl,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  cardPoints: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '700',
  },
  cardPointsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  tierText: {
    color: '#FFD700',
    fontWeight: '700',
    fontSize: 12,
  },
  progressSection: {
    gap: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  progressValue: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
  nextTierText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 4,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.sm,
    borderRadius: 12,
    ...SHADOWS.light,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Categories
  categoriesScroll: {
    marginBottom: SPACING.lg,
  },
  categoriesContent: {
    gap: 10,
    paddingRight: SPACING.md,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: COLORS.accent,
  },

  // Rewards Grid
  rewardsGrid: {
    gap: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  rewardCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    marginRight: SPACING.md,
  },
  cardHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  statusTextDisabled: {
    color: COLORS.inactive,
  },
  dashedDividerContainer: {
    height: 1,
    overflow: 'hidden',
    marginVertical: SPACING.md,
    width: '100%',
  },
  dashedDivider: {
    height: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 1,
    width: '100%',
  },
  cardBottom: {
    gap: 4,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 24,
  },
  dateRange: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  // Unused but kept for reference or removal
  rewardTag: {
    display: 'none',
  },
  rewardTagText: {
    display: 'none',
  },
  rewardDesc: {
    display: 'none',
  },
  rewardFooter: {
    display: 'none',
  },
  rewardCost: {
    display: 'none',
  },
  redeemBtn: {
    display: 'none',
  },
  redeemBtnDisabled: {
    display: 'none',
  },
  redeemBtnText: {
    display: 'none',
  },
  redeemBtnTextDisabled: {
    display: 'none',
  },

  // Modals
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyList: {
    padding: SPACING.md,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    ...SHADOWS.light,
  },
  historyContent: {
    flex: 1,
  },
  historyDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  historyPointsContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  historyPoints: {
    fontSize: 16,
    fontWeight: '700',
  },
  pointsEarned: {
    color: COLORS.success,
  },
  pointsRedeemed: {
    color: COLORS.error,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textSecondary,
  },

  // Redemption Modal
  redemptionModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: SPACING.lg,
  },
  redemptionCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  redemptionImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F0F0F0',
  },
  redemptionContent: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  redemptionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  redemptionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  redemptionRewardName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  redemptionActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 15,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },

  // Notification
  notification: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    backgroundColor: '#333',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 100,
  },
  notificationTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  notificationTitle: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  notificationMessage: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
});
