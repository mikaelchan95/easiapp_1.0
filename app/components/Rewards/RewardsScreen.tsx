import React, { useState, useCallback, useRef } from 'react';
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
  StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRewards, TierLevel } from '../../context/RewardsContext';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import MobileHeader from '../Layout/MobileHeader';

// Mock rewards data
const mockRewards = [
  {
    id: '1',
    title: '10% Off Your Next Purchase',
    description: 'Get 10% off your next purchase of $100 or more',
    points: 500,
    expiry: '30 days after redemption',
    imageUrl: 'https://images.unsplash.com/photo-1581237058004-34789da7e6b4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    category: 'discount'
  },
  {
    id: '2',
    title: 'Free Shipping',
    description: 'Get free shipping on your next order with no minimum purchase',
    points: 300,
    expiry: '14 days after redemption',
    imageUrl: 'https://images.unsplash.com/photo-1586936893866-470173892b26?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    category: 'shipping'
  },
  {
    id: '3',
    title: 'Exclusive Macallan Tasting',
    description: 'Exclusive invitation to a Macallan whisky tasting event',
    points: 1000,
    expiry: 'Valid for events in the next 3 months',
    imageUrl: 'https://images.unsplash.com/photo-1527281400683-1aefee6bca6e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    category: 'experience'
  },
  {
    id: '4',
    title: 'Limited Edition Gift Box',
    description: 'Redeem for a limited edition Macallan gift box with your next purchase',
    points: 750,
    expiry: 'While supplies last',
    imageUrl: 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    category: 'merchandise'
  }
];

// Mock user loyalty data
const mockLoyalty = {
  tier: 'Gold',
  points: 2500,
  nextTier: 'Platinum',
  pointsToNextTier: 2500,
  history: [
    { id: '1', date: '2023-12-10', description: 'Purchase', points: 150 },
    { id: '2', date: '2023-11-25', description: 'Birthday Bonus', points: 500 },
    { id: '3', date: '2023-11-05', description: 'Purchase', points: 220 },
  ]
};

// Tier Badge Component
const TierBadge = ({ tier, size = 'large' }: { tier: TierLevel; size?: 'small' | 'large' }) => {
  const colors = {
    Bronze: '#CD7F32',
    Silver: '#C0C0C0', 
    Gold: '#FFD700'
  };
  
  const iconSize = size === 'large' ? 28 : 18;
  const containerSize = size === 'large' ? 56 : 36;
  
  return (
    <View style={[
      styles.tierBadge,
      { 
        backgroundColor: colors[tier], 
        width: containerSize, 
        height: containerSize 
      }
    ]}>
      <Ionicons name="trophy" size={iconSize} color={COLORS.accent} />
    </View>
  );
};

// Points History Modal
const PointsHistoryModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { state } = useRewards();
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Points History</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={state.userRewards.pointsHistory}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.historyList}
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              <View style={styles.historyContent}>
                <Text style={styles.historyDescription}>{item.description}</Text>
                <Text style={styles.historyDate}>{item.date}</Text>
                {item.orderId && (
                  <Text style={styles.historyOrderId}>Order: {item.orderId}</Text>
                )}
              </View>
              <Text style={[
                styles.historyPoints,
                item.type === 'earned' ? styles.pointsEarned : styles.pointsRedeemed
              ]}>
                {item.type === 'earned' ? '+' : ''}{item.points.toLocaleString()}
              </Text>
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
};

export default function RewardsScreen() {
  const navigation = useNavigation();
  const { state, redeemReward, getTierBenefits, getPointsToNextTier, getExpiringPoints } = useRewards();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showHistory, setShowHistory] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  
  // Check for expiring points
  const expiringPoints = getExpiringPoints(30);
  const urgentExpiringPoints = getExpiringPoints(7);
  
  // Animation for tier progress
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    const progress = calculateProgress();
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false
    }).start();
  }, [state.userRewards.yearlySpend]);
  
  const calculateProgress = useCallback(() => {
    const pointsToNext = getPointsToNextTier();
    if (pointsToNext === 0) return 100; // Already Gold
    
    const currentTierMin = state.userRewards.tier === 'Bronze' ? 0 : 50001;
    const nextTierMin = state.userRewards.tier === 'Bronze' ? 50001 : 200001;
    const range = nextTierMin - currentTierMin;
    const progress = ((state.userRewards.yearlySpend - currentTierMin) / range) * 100;
    
    return Math.min(Math.max(progress, 0), 100);
  }, [state.userRewards.yearlySpend, state.userRewards.tier]);
  
  const handleRedeem = async (rewardId: string) => {
    setRedeeming(rewardId);
    const success = await redeemReward(rewardId);
    setRedeeming(null);
    
    if (success) {
      // Show success feedback
      // In real app, would show a toast/notification
    }
  };
  
  const filteredRewards = selectedCategory === 'all' 
    ? state.rewardsCatalog
    : state.rewardsCatalog.filter(r => r.type === selectedCategory);
  
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'voucher', label: 'Vouchers' },
    { id: 'bundle', label: 'Bundles' },
    { id: 'swag', label: 'Merch' }
  ];
  
  const renderRewardItem = ({ item }: { item: typeof state.rewardsCatalog[0] }) => {
    const canRedeem = state.userRewards.points >= item.points;
    const isRedeeming = redeeming === item.id;
    
    return (
      <View style={styles.rewardCard}>
        <View style={styles.rewardHeader}>
          <View style={styles.rewardIconContainer}>
            <Ionicons 
              name={
                item.type === 'voucher' ? 'pricetag' : 
                item.type === 'bundle' ? 'cube' : 
                'gift'
              } 
              size={20} 
              color={COLORS.text} 
            />
          </View>
          <View style={styles.rewardInfo}>
            <Text style={styles.rewardTitle}>{item.title}</Text>
            <Text style={styles.rewardDescription}>{item.description}</Text>
          </View>
        </View>
        
        <View style={styles.rewardFooter}>
          <Text style={styles.rewardPoints}>{item.points.toLocaleString()} pts</Text>
          <TouchableOpacity
            style={[
              styles.redeemButton,
              !canRedeem && styles.redeemButtonDisabled
            ]}
            onPress={() => handleRedeem(item.id)}
            disabled={!canRedeem || isRedeeming}
          >
            {isRedeeming ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : (
              <Text style={[
                styles.redeemButtonText,
                !canRedeem && styles.redeemButtonTextDisabled
              ]}>
                {canRedeem ? 'Redeem' : 'Insufficient'}
              </Text>
            )}
          </TouchableOpacity>
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
        title="Rewards"
        showBackButton={false}
        showCartButton={true}
        showSearch={false}
        showLocationHeader={false}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Unified Rewards Widget */}
        <View style={styles.unifiedWidget}>
          <View style={styles.widgetContainer}>
            {/* Header Row */}
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>Earn with every purchase</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('VoucherTracking')}
                >
                  <Ionicons name="receipt-outline" size={18} color={COLORS.text} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => setShowHistory(true)}
                >
                  <Ionicons name="time-outline" size={18} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Main Content */}
            <View style={styles.widgetContent}>
              {/* Points and Tier Row */}
              <View style={styles.pointsTierRow}>
                <View style={styles.pointsSection}>
                  <Text style={styles.pointsValue}>{state.userRewards.points.toLocaleString()}</Text>
                  <Text style={styles.pointsLabel}>Points Available</Text>
                </View>
                
                <View style={styles.tierSection}>
                  <View style={styles.tierBadgeContainer}>
                    <TierBadge tier={state.userRewards.tier} size="small" />
                    <View style={styles.tierInfo}>
                      <Text style={styles.tierName}>{state.userRewards.tier}</Text>
                      <Text style={styles.tierStatus}>Member</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Progress Section (if applicable) */}
              {getPointsToNextTier() > 0 && (
                <View style={styles.progressSection}>
                  <Text style={styles.progressLabel}>
                    S${getPointsToNextTier().toLocaleString()} to {
                      state.userRewards.tier === 'Bronze' ? 'Silver' : 'Gold'
                    }
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <Animated.View 
                      style={[
                        styles.progressBar,
                        {
                          width: progressAnim.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%']
                          })
                        }
                      ]}
                    />
                  </View>
                </View>
              )}

              {/* Expiring Points Alert (if applicable) */}
              {urgentExpiringPoints.length > 0 && (
                <View style={styles.expiringAlert}>
                  <View style={styles.alertContent}>
                    <Ionicons name="warning" size={16} color={COLORS.error} />
                    <View style={styles.alertText}>
                      <Text style={styles.alertTitle}>Points Expiring Soon!</Text>
                      <Text style={styles.alertDescription}>
                        {urgentExpiringPoints.reduce((sum, entry) => sum + entry.points, 0).toLocaleString()} points expire within 7 days
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.alertButton}
                      onPress={() => navigation.navigate('VoucherTracking')}
                    >
                      <Text style={styles.alertButtonText}>View Details</Text>
                      <Ionicons name="arrow-forward" size={14} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Tier Benefits */}
        <View style={styles.benefitsCard}>
          <View style={styles.benefitsHeader}>
            <Text style={styles.benefitsTitle}>Your Benefits</Text>
            <TouchableOpacity 
              style={styles.faqButton}
              onPress={() => navigation.navigate('RewardsFAQ')}
            >
              <Ionicons name="help-circle-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          {getTierBenefits(state.userRewards.tier).map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Rewards Catalog */}
        <View style={styles.catalogSection}>
          <Text style={styles.catalogTitle}>Redeem Rewards</Text>
          
          {/* Category Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category.id && styles.categoryButtonTextActive
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Rewards List */}
          <FlatList
            data={filteredRewards}
            renderItem={renderRewardItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.rewardsList}
          />
        </View>
        
        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
        
      {/* Points History Modal */}
      <PointsHistoryModal 
        visible={showHistory} 
        onClose={() => setShowHistory(false)} 
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
  scrollView: {
    flex: 1,
  },
  // Unified Widget
  unifiedWidget: {
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
  pointsTierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsSection: {
    flex: 1,
  },
  pointsValue: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 36,
    lineHeight: 40,
  },
  pointsLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  tierSection: {
    alignItems: 'flex-end',
  },
  tierBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierInfo: {
    marginLeft: SPACING.sm,
    alignItems: 'flex-end',
  },
  tierName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
  },
  tierStatus: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  tierBadge: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  
  // Progress Section
  progressSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  progressLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: COLORS.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.text,
    borderRadius: 2,
  },
  
  // Benefits Card
  benefitsCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    ...SHADOWS.light,
  },
  benefitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  benefitsTitle: {
    ...TYPOGRAPHY.h4,
  },
  faqButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  benefitText: {
    ...TYPOGRAPHY.bodySmall,
    flex: 1,
  },
  
  // Catalog Section
  catalogSection: {
    paddingHorizontal: SPACING.md,
  },
  catalogTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  categoryScroll: {
    marginBottom: SPACING.lg,
  },
  categoryButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryButtonText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  
  // Rewards List
  rewardsList: {
    paddingBottom: SPACING.xl,
  },
  rewardCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  rewardHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  rewardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    ...TYPOGRAPHY.h5,
    marginBottom: SPACING.xs,
  },
  rewardDescription: {
    ...TYPOGRAPHY.caption,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardPoints: {
    ...TYPOGRAPHY.h5,
    color: COLORS.primary,
    fontWeight: '600',
  },
  redeemButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  redeemButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  redeemButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.accent,
    fontWeight: '600',
  },
  redeemButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  historyList: {
    padding: SPACING.md,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    ...SHADOWS.light,
  },
  historyContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  historyDescription: {
    ...TYPOGRAPHY.bodySmall,
    marginBottom: SPACING.xs,
  },
  historyDate: {
    ...TYPOGRAPHY.caption,
  },
  historyOrderId: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  historyPoints: {
    ...TYPOGRAPHY.h5,
    fontWeight: '600',
  },
  pointsEarned: {
    color: COLORS.success,
  },
  pointsRedeemed: {
    color: COLORS.error,
  },
  
  // Expiring Alert
  expiringAlert: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.error,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  alertDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  alertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  alertButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    fontWeight: '600',
  },

  // Bottom Padding
  bottomPadding: {
    height: SPACING.xxl,
  },
}); 