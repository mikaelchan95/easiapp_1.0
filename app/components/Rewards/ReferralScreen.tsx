import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Share,
  Clipboard,
  Alert,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { HapticFeedback } from '../../utils/haptics';
import MobileHeader from '../Layout/MobileHeader';

// Mock referral data
const mockReferralData = {
  referralCode: 'MIKE2024',
  totalReferrals: 12,
  pendingReferrals: 3,
  totalEarned: 2400,
  availableRewards: 1800,
  recentReferrals: [
    {
      id: '1',
      name: 'Sarah Chen',
      status: 'completed',
      earned: 200,
      date: '2024-01-15',
    },
    {
      id: '2',
      name: 'David Kim',
      status: 'pending',
      earned: 0,
      date: '2024-01-12',
    },
    {
      id: '3',
      name: 'Emma Wilson',
      status: 'completed',
      earned: 200,
      date: '2024-01-10',
    },
  ],
  referralTiers: [
    { threshold: 5, reward: 100, title: 'Bronze Referrer', achieved: true },
    { threshold: 10, reward: 250, title: 'Silver Referrer', achieved: true },
    { threshold: 20, reward: 500, title: 'Gold Referrer', achieved: false },
    {
      threshold: 50,
      reward: 1000,
      title: 'Platinum Referrer',
      achieved: false,
    },
  ],
};

export default function ReferralScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = useCallback(async () => {
    try {
      await Clipboard.setString(mockReferralData.referralCode);
      setCopiedCode(true);
      HapticFeedback.success();
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy referral code');
    }
  }, []);

  const handleShareCode = useCallback(async () => {
    try {
      const message = `Join me on EASI and get premium spirits delivered! Use my referral code ${mockReferralData.referralCode} and we both get rewards. Download the app now!`;

      await Share.share({
        message,
        title: 'Join EASI - Premium Spirits Delivered',
      });

      HapticFeedback.light();
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, []);

  const getCurrentTier = useCallback(() => {
    const achieved = mockReferralData.referralTiers.filter(
      tier => tier.achieved
    );
    return achieved[achieved.length - 1] || mockReferralData.referralTiers[0];
  }, []);

  const getNextTier = useCallback(() => {
    return mockReferralData.referralTiers.find(tier => !tier.achieved);
  }, []);

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      {/* Status Bar Background */}
      <View style={[styles.statusBarBackground, { height: insets.top }]} />

      {/* Mobile Header */}
      <MobileHeader
        title="Referrals"
        showBackButton={true}
        showCartButton={true}
        showSearch={false}
        showLocationHeader={false}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Stats Widget */}
        <View style={styles.statsWidget}>
          <View style={styles.widgetContainer}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>
                Invite friends & earn rewards
              </Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('InviteFriends')}
                >
                  <Ionicons
                    name="share-outline"
                    size={18}
                    color={COLORS.text}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('ReferralHistory')}
                >
                  <Ionicons name="time-outline" size={18} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.widgetContent}>
              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {mockReferralData.totalReferrals}
                  </Text>
                  <Text style={styles.statLabel}>Total Referrals</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    S${mockReferralData.totalEarned}
                  </Text>
                  <Text style={styles.statLabel}>Total Earned</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {mockReferralData.pendingReferrals}
                  </Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
              </View>

              {/* Current Tier */}
              <View style={styles.tierSection}>
                <View style={styles.tierInfo}>
                  <View style={styles.tierBadge}>
                    <Ionicons name="trophy" size={16} color={COLORS.accent} />
                  </View>
                  <View style={styles.tierDetails}>
                    <Text style={styles.tierTitle}>{currentTier.title}</Text>
                    <Text style={styles.tierSubtitle}>Current Status</Text>
                  </View>
                </View>
                {nextTier && (
                  <View style={styles.nextTierInfo}>
                    <Text style={styles.nextTierText}>
                      {nextTier.threshold - mockReferralData.totalReferrals}{' '}
                      more referrals to {nextTier.title}
                    </Text>
                    <Text style={styles.nextTierReward}>
                      +S${nextTier.reward} bonus
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Referral Code Section */}
        <View style={styles.codeSection}>
          <View style={styles.codeContainer}>
            <View style={styles.codeHeader}>
              <Text style={styles.codeTitle}>Your Referral Code</Text>
              <Text style={styles.codeSubtitle}>
                Share this code with friends
              </Text>
            </View>

            <View style={styles.codeDisplay}>
              <Text style={styles.codeText}>
                {mockReferralData.referralCode}
              </Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyCode}
              >
                <Ionicons
                  name={copiedCode ? 'checkmark' : 'copy'}
                  size={20}
                  color={COLORS.text}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareCode}
            >
              <Ionicons
                name="share-outline"
                size={20}
                color={COLORS.buttonText}
              />
              <Text style={styles.shareButtonText}>Share Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Share Your Code</Text>
                <Text style={styles.stepDescription}>
                  Send your referral code to friends via text, email, or social
                  media
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Friend Signs Up</Text>
                <Text style={styles.stepDescription}>
                  Your friend downloads the app and creates an account with your
                  code
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Both Get Rewards</Text>
                <Text style={styles.stepDescription}>
                  You both receive S$20 credit after their first purchase of
                  S$100+
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Referrals */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Referrals</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('ReferralHistory')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {mockReferralData.recentReferrals.map(referral => (
            <View key={referral.id} style={styles.referralItem}>
              <View style={styles.referralInfo}>
                <Text style={styles.referralName}>{referral.name}</Text>
                <Text style={styles.referralDate}>{referral.date}</Text>
              </View>
              <View style={styles.referralStatus}>
                <View
                  style={[
                    styles.statusBadge,
                    referral.status === 'completed'
                      ? styles.statusCompleted
                      : styles.statusPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      referral.status === 'completed'
                        ? styles.statusTextCompleted
                        : styles.statusTextPending,
                    ]}
                  >
                    {referral.status === 'completed' ? 'Completed' : 'Pending'}
                  </Text>
                </View>
                {referral.status === 'completed' && (
                  <Text style={styles.earnedAmount}>+S${referral.earned}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Back to Rewards */}
        <View style={styles.backToRewardsSection}>
          <TouchableOpacity
            style={styles.backToRewardsButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.buttonText} />
            <Text style={styles.backToRewardsText}>Back to Rewards</Text>
          </TouchableOpacity>
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
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  widgetTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widgetContent: {
    gap: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  tierSection: {
    gap: SPACING.md,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  tierBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierDetails: {
    flex: 1,
  },
  tierTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    fontWeight: '600',
  },
  tierSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  nextTierInfo: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 12,
  },
  nextTierText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '500',
  },
  nextTierReward: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // Code Section
  codeSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  codeContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.light,
  },
  codeHeader: {
    marginBottom: SPACING.lg,
  },
  codeTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
  },
  codeSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  codeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
  },
  codeText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 2,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.buttonBg,
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  shareButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.buttonText,
    fontWeight: '600',
  },

  // How It Works
  howItWorksSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.lg,
  },
  stepsContainer: {
    gap: SPACING.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.buttonBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.buttonText,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  stepDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Recent Referrals
  recentSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  viewAllText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '500',
  },
  referralItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    ...SHADOWS.light,
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    fontWeight: '500',
  },
  referralDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  referralStatus: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  statusCompleted: {
    backgroundColor: '#E8F5E8',
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextCompleted: {
    color: '#2E7D32',
  },
  statusTextPending: {
    color: '#F57C00',
  },
  earnedAmount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '600',
  },

  bottomPadding: {
    height: SPACING.xxl,
  },

  // Back to Rewards
  backToRewardsSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  backToRewardsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.buttonBg,
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  backToRewardsText: {
    ...TYPOGRAPHY.button,
    color: COLORS.buttonText,
    fontWeight: '600',
  },
});
