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
  StatusBar,
  Image
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRewards, TierLevel } from '../../context/RewardsContext';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import MobileHeader from '../Layout/MobileHeader';
import { useAppContext } from '../../context/AppContext';
import { isCompanyUser, CompanyUser, IndividualUser } from '../../types/user';
import { formatStatCurrency, formatStatNumber } from '../../utils/formatting';

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
  const { state: appState } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showHistory, setShowHistory] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [showExpiringPoints, setShowExpiringPoints] = useState(false);
  const insets = useSafeAreaInsets();
  
  const user = appState.user;
  
  const handleFeaturePress = (feature: string) => {
    console.log(`Pressed: ${feature}`);
    // Add navigation logic here if needed
  };

  const renderUserProfile = () => {
    if (!user) return null;
    
    const isCompany = isCompanyUser(user);
    
    return (
      <View style={styles.profileCard}>
        {/* Center-aligned Header */}
        <View style={styles.headerTopRow}>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Rewards</Text>
          </View>
        </View>

        {/* Enhanced Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {user.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.userInfoSection}>
            <View style={styles.userMainInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">{user.name}</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                </View>
              </View>
              <View style={styles.userMetaInfo}>
                <Text style={styles.accountType}>
                  {isCompany ? 'Business Account' : 'Personal Account'}
                </Text>
                <Text style={styles.rewardTier}>{state.userRewards.tier} Tier</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => handleFeaturePress('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Enhanced User Stats with Better UX */}
        {!isCompany && (
          <View style={styles.userStatsSection}>
            <View style={styles.statsSectionHeader}>
              <Text style={styles.statsTitle}>Activity Overview</Text>
            </View>
            <View style={styles.modernStatsContainer}>
              <TouchableOpacity 
                style={styles.modernStatItem}
                onPress={() => handleFeaturePress('Order History')}
                activeOpacity={0.8}
              >
                <View style={styles.statIconContainer}>
                  <Ionicons name="receipt-outline" size={20} color={COLORS.text} />
                </View>
                <Text style={styles.modernStatNumber}>
                  {formatStatNumber((user as IndividualUser).totalOrders || 0)}
                </Text>
                <Text style={styles.modernStatLabel}>Orders</Text>
              </TouchableOpacity>
              <View style={styles.modernStatDivider} />
              <TouchableOpacity 
                style={styles.modernStatItem}
                onPress={() => handleFeaturePress('Order History')}
                activeOpacity={0.8}
              >
                <View style={styles.statIconContainer}>
                  <Ionicons name="trending-up-outline" size={20} color={COLORS.text} />
                </View>
                <Text style={styles.modernStatNumber}>
                  {formatStatCurrency((user as IndividualUser).totalSpent || 0)}
                </Text>
                <Text style={styles.modernStatLabel}>Spent</Text>
              </TouchableOpacity>
              <View style={styles.modernStatDivider} />
              <TouchableOpacity 
                style={styles.modernStatItem}
                onPress={() => handleFeaturePress('Reviews')}
                activeOpacity={0.8}
              >
                <View style={styles.statIconContainer}>
                  <Ionicons name="star-outline" size={20} color={COLORS.text} />
                </View>
                <Text style={styles.modernStatNumber}>4.9</Text>
                <Text style={styles.modernStatLabel}>Rating</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };
  
  // Check for expiring points
  const expiringPoints = getExpiringPoints(30);
  const urgentExpiringPoints = getExpiringPoints(7);
  
  // Animation for tier progress and carousel transitions
  const progressAnim = useRef(new Animated.Value(0)).current;
  const carouselAnim = useRef(new Animated.Value(0)).current;
  const progressBarAnim = useRef(new Animated.Value(0)).current;
  
  // Animate progress bar continuously
  React.useEffect(() => {
    const animateProgressBar = () => {
      progressBarAnim.setValue(0);
      Animated.timing(progressBarAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false
      }).start();
    };

    const progress = calculateProgress();
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false
    }).start();

    animateProgressBar();
    const interval = setInterval(animateProgressBar, 5000);
    return () => clearInterval(interval);
  }, [state.userRewards.yearlySpend]);

  // Carousel animation - alternate between progress and expiring points every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setShowExpiringPoints(prev => {
        const newValue = !prev;
        
        // Animate carousel slide
        Animated.timing(carouselAnim, {
          toValue: newValue ? 1 : 0,
          duration: 600,
          useNativeDriver: true
        }).start();
        
        return newValue;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);
  
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
    
    const getRewardIcon = () => {
      switch (item.type) {
        case 'voucher': return 'pricetag-outline';
        case 'bundle': return 'cube-outline';
        default: return 'gift-outline';
      }
    };
    
    return (
      <View style={styles.rewardCard}>
        <View style={styles.rewardHeader}>
          <View style={styles.rewardIconContainer}>
            <Ionicons 
              name={getRewardIcon()} 
              size={20} 
              color={COLORS.text} 
            />
          </View>
          <View style={styles.rewardContent}>
            <Text style={styles.rewardTitle}>{item.title}</Text>
            <Text style={styles.rewardDescription}>{item.description}</Text>
          </View>
        </View>
        
        <View style={styles.rewardFooter}>
          <View style={styles.rewardPointsContainer}>
            <Text style={styles.rewardPoints}>{item.points.toLocaleString()}</Text>
            <Text style={styles.rewardPointsLabel}>points</Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.redeemButton,
              !canRedeem && styles.redeemButtonDisabled
            ]}
            onPress={() => handleRedeem(item.id)}
            disabled={!canRedeem || isRedeeming}
            activeOpacity={0.7}
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
      
      {/* Header Container */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        {/* User Profile Header */}
        {renderUserProfile()}
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Rewards Balance Cards */}
        <View style={styles.balanceCardsContainer}>
          {/* Points Card */}
          <TouchableOpacity 
            style={styles.pointsCard}
            onPress={() => setShowHistory(true)}
            activeOpacity={0.95}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.pointsIconContainer}>
                  <Ionicons name="gift" size={16} color={COLORS.textSecondary} />
                </View>
                <Text style={styles.cardLabel}>Points</Text>
                <View style={styles.actionIndicator}>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.inactive} />
                </View>
              </View>
              <View style={styles.amountContainer}>
                <Text style={styles.pointsAmount}>{state.userRewards.points.toLocaleString()}</Text>
              </View>
              <Text style={styles.cardSubtext}>Available to use</Text>
            </View>
          </TouchableOpacity>

          {/* Tier Card */}
          <TouchableOpacity 
            style={styles.tierCard}
            onPress={() => navigation.navigate('TierBenefitsScreen')}
            activeOpacity={0.95}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.tierIconContainer}>
                  <TierBadge tier={state.userRewards.tier} size="small" />
                </View>
                <Text style={styles.cardLabel}>Tier</Text>
                <View style={styles.actionIndicator}>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.inactive} />
                </View>
              </View>
              <View style={styles.amountContainer}>
                <Text style={styles.tierAmount}>{state.userRewards.tier}</Text>
              </View>
              <Text style={styles.cardSubtext}>Member status</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Combined Progress/Expiring Points Carousel */}
        {(getPointsToNextTier() > 0 || urgentExpiringPoints.length > 0) && (
          <View style={styles.progressCard}>
            <View style={styles.carouselContainer}>
              <Animated.View 
                style={[
                  styles.carouselTrack,
                  {
                    transform: [{
                      translateX: carouselAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '-50%'] // Move to show second slide
                      })
                    }]
                  }
                ]}
              >
                {/* Progress to next tier slide */}
                <View style={styles.carouselSlide}>
                  <View style={styles.progressHeader}>
                    <Ionicons name="trending-up" size={16} color={COLORS.primary} />
                    <Text style={styles.progressTitle}>
                      S${getPointsToNextTier().toLocaleString()} to {
                        state.userRewards.tier === 'Bronze' ? 'Silver' : 'Gold'
                      }
                    </Text>
                  </View>
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
                    <Animated.View 
                      style={[
                        styles.progressBarGlow,
                        {
                          width: progressAnim.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%']
                          }),
                          opacity: progressBarAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0.3, 1, 0.3]
                          })
                        }
                      ]}
                    />
                  </View>
                </View>

                {/* Expiring points slide */}
                {urgentExpiringPoints.length > 0 && (
                  <View style={styles.carouselSlide}>
                    <View style={styles.expiringHeader}>
                      <Ionicons name="warning" size={16} color={COLORS.error} />
                      <Text style={styles.expiringTitle}>Points Expiring Soon!</Text>
                    </View>
                    <View style={styles.expiringDescription}>
                      <Text style={styles.expiringText}>
                        {urgentExpiringPoints.reduce((sum, entry) => sum + entry.points, 0).toLocaleString()} points expire within 7 days
                      </Text>
                      <TouchableOpacity 
                        style={styles.expiringButton}
                        onPress={() => navigation.navigate('VoucherTracking')}
                      >
                        <Text style={styles.expiringButtonText}>View Details</Text>
                        <Ionicons name="arrow-forward" size={14} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </Animated.View>
            </View>
            
            {/* Carousel indicators */}
            <View style={styles.carouselIndicators}>
              <View style={[
                styles.indicator,
                !showExpiringPoints && styles.activeIndicator
              ]} />
              {urgentExpiringPoints.length > 0 && (
                <View style={[
                  styles.indicator,
                  showExpiringPoints && styles.activeIndicator
                ]} />
              )}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Explore More</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('ReferralScreen')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="people-outline" size={24} color={COLORS.text} />
              </View>
              <Text style={styles.quickActionLabel}>Referrals</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('AchievementsScreen')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="trophy-outline" size={24} color={COLORS.text} />
              </View>
              <Text style={styles.quickActionLabel}>Achievements</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('MilestonesScreen')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="flag-outline" size={24} color={COLORS.text} />
              </View>
              <Text style={styles.quickActionLabel}>Milestones</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('RewardsAnalytics')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="analytics-outline" size={24} color={COLORS.text} />
              </View>
              <Text style={styles.quickActionLabel}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* Rewards Catalog */}
        <View style={styles.catalogSection}>
          <View style={styles.catalogHeader}>
            <View style={styles.catalogTitleContainer}>
              <Ionicons name="gift" size={20} color={COLORS.primary} style={styles.catalogIcon} />
              <Text style={styles.catalogTitle}>Redeem Rewards</Text>
              <View style={styles.catalogCountBadge}>
                <Text style={styles.catalogCountText}>{filteredRewards.length}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.catalogViewAllButton}
              onPress={() => navigation.navigate('RewardsAnalytics')}
            >
              <Text style={styles.catalogViewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
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
  headerContainer: {
    backgroundColor: COLORS.card,
    zIndex: 10,
    ...SHADOWS.light,
    paddingBottom: SPACING.xs,
  },
  scrollView: {
    flex: 1,
  },
  
  // Balance Cards Container
  balanceCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  
  // Points Card
  pointsCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    minHeight: 130,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  
  // Tier Card
  tierCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    minHeight: 130,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  
  // Card Content
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '500',
    color: COLORS.textSecondary,
    flex: 1,
  },
  actionIndicator: {
    opacity: 0.6,
  },
  amountContainer: {
    marginVertical: SPACING.xs,
  },
  pointsAmount: {
    ...TYPOGRAPHY.h1,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -1,
  },
  tierAmount: {
    ...TYPOGRAPHY.h1,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -1,
    fontSize: 28,
  },
  cardSubtext: {
    ...TYPOGRAPHY.small,
    color: COLORS.inactive,
    fontWeight: '400',
  },
  
  // Icon Containers
  pointsIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  tierIconContainer: {
    marginRight: 10,
  },
  
  // Progress Card
  progressCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  // Carousel Container
  carouselContainer: {
    overflow: 'hidden',
    minHeight: 80,
  },
  carouselTrack: {
    flexDirection: 'row',
    width: '200%', // Double width to fit both slides
  },
  carouselSlide: {
    width: '50%', // Each slide takes half the track width
    padding: SPACING.lg,
    minHeight: 56,
    justifyContent: 'space-between',
  },
  
  // Progress Section
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  progressTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: COLORS.background,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.text,
    borderRadius: 2,
  },
  progressBarGlow: {
    position: 'absolute',
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Expiring Points Section
  expiringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  expiringTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    fontWeight: '600',
  },
  expiringDescription: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiringText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  expiringButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  expiringButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    fontWeight: '600',
  },
  
  // Carousel Indicators
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: SPACING.md,
    gap: SPACING.xs,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.inactive,
  },
  activeIndicator: {
    backgroundColor: COLORS.primary,
    width: 18,
  },
  
  // Legacy Tier Badge
  tierBadge: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  
  
  // Catalog Section
  catalogSection: {
    paddingHorizontal: SPACING.md,
  },
  catalogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  catalogTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catalogIcon: {
    marginRight: SPACING.element,
  },
  catalogTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  catalogCountBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  catalogCountText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  catalogViewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '10',
    minWidth: 80,
    justifyContent: 'center',
  },
  catalogViewAllText: {
    ...TYPOGRAPHY.button,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 4,
  },
  categoryScroll: {
    marginBottom: SPACING.md,
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
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  categoryButtonText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '500',
    color: COLORS.text,
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
  rewardContent: {
    flex: 1,
  },
  rewardTitle: {
    ...TYPOGRAPHY.h5,
    marginBottom: SPACING.xs,
    color: COLORS.text,
  },
  rewardDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardPointsContainer: {
    alignItems: 'flex-start',
  },
  rewardPoints: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    fontWeight: '600',
  },
  rewardPointsLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  redeemButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.text,
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
  

  // Quick Actions Card
  quickActionsCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    ...SHADOWS.light,
  },
  quickActionsTitle: {
    ...TYPOGRAPHY.h4,
    marginBottom: SPACING.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  quickActionLabel: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Bottom Padding
  bottomPadding: {
    height: SPACING.xxl,
  },

  // Profile Header Styles
  profileCard: {
    backgroundColor: 'transparent',
    padding: SPACING.lg,
    paddingBottom: SPACING.sm,
    position: 'relative',
  },
  
  // Enhanced Header Top Row
  headerTopRow: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Enhanced Profile Section
  profileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  userInfoSection: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  userMainInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  userName: {
    ...TYPOGRAPHY.h3,
    marginRight: SPACING.xs,
    fontWeight: '600',
  },
  verifiedBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMetaInfo: {
    flexDirection: 'column',
    gap: 4,
  },
  accountType: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  rewardTier: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    fontWeight: '600',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },

  // User Stats Section
  userStatsSection: {
    marginBottom: SPACING.md,
  },
  statsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  statsTitle: {
    ...TYPOGRAPHY.h4,
    marginBottom: 0,
  },
  modernStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modernStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  modernStatNumber: {
    ...TYPOGRAPHY.h2,
    marginBottom: 4,
  },
  modernStatLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  modernStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
}); 