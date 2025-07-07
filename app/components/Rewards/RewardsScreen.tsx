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
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRewards, TierLevel } from '../../context/RewardsContext';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';

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
  
  const iconSize = size === 'large' ? 32 : 20;
  const containerSize = size === 'large' ? 64 : 40;
  
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
  const { state, redeemReward, getTierBenefits, getPointsToNextTier } = useRewards();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showHistory, setShowHistory] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  
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
    { id: 'all', label: 'All Rewards' },
    { id: 'voucher', label: 'Vouchers' },
    { id: 'bundle', label: 'Bundles' },
    { id: 'swag', label: 'Merchandise' }
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
              size={24} 
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
                {canRedeem ? 'Redeem' : 'Insufficient Points'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Rewards</Text>
            <Text style={styles.subtitle}>Earn → Build → Redeem</Text>
          </View>
        </View>
        
        {/* Tier Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.tierLabel}>Current Status</Text>
              <Text style={styles.tierName}>{state.userRewards.tier} Member</Text>
            </View>
            <TierBadge tier={state.userRewards.tier} />
          </View>
          
          <View style={styles.pointsSection}>
            <Text style={styles.pointsLabel}>Available Points</Text>
            <Text style={styles.pointsValue}>{state.userRewards.points.toLocaleString()}</Text>
          </View>
          
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>12-Month Spend</Text>
              <Text style={styles.progressValue}>S${state.userRewards.yearlySpend.toLocaleString()}</Text>
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
            </View>
            
            {getPointsToNextTier() > 0 && (
              <Text style={styles.progressText}>
                S${getPointsToNextTier().toLocaleString()} to {
                  state.userRewards.tier === 'Bronze' ? 'Silver' : 'Gold'
                }
              </Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => setShowHistory(true)}
          >
            <Text style={styles.historyButtonText}>View Points History</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        
        {/* Tier Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Your {state.userRewards.tier} Benefits</Text>
          {getTierBenefits(state.userRewards.tier).map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
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
      </ScrollView>
      
      {/* Points History Modal */}
      <PointsHistoryModal 
        visible={showHistory} 
        onClose={() => setShowHistory(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
  },
  
  // Status Card
  statusCard: {
    margin: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    ...SHADOWS.medium,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  tierLabel: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.xs,
  },
  tierName: {
    ...TYPOGRAPHY.h2,
  },
  tierBadge: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  
  // Points Section
  pointsSection: {
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  pointsLabel: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.xs,
  },
  pointsValue: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
  },
  
  // Progress Section
  progressSection: {
    marginBottom: SPACING.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  progressLabel: {
    ...TYPOGRAPHY.caption,
  },
  progressValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    ...TYPOGRAPHY.small,
    textAlign: 'center',
  },
  
  // History Button
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  historyButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    fontWeight: '600',
    marginRight: SPACING.xs,
  },
  
  // Benefits Card
  benefitsCard: {
    margin: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    ...SHADOWS.light,
  },
  benefitsTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  benefitText: {
    ...TYPOGRAPHY.body,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  
  // Catalog Section
  catalogSection: {
    padding: SPACING.md,
  },
  catalogTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.md,
  },
  categoryScroll: {
    marginBottom: SPACING.lg,
  },
  categoryButton: {
    paddingHorizontal: SPACING.lg,
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
    ...TYPOGRAPHY.body,
    fontSize: 14,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    ...TYPOGRAPHY.h4,
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
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
  },
  redeemButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  redeemButtonText: {
    ...TYPOGRAPHY.body,
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
    ...TYPOGRAPHY.h2,
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
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.xs,
  },
  historyDate: {
    ...TYPOGRAPHY.small,
  },
  historyOrderId: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  historyPoints: {
    ...TYPOGRAPHY.h4,
  },
  pointsEarned: {
    color: COLORS.success,
  },
  pointsRedeemed: {
    color: COLORS.error,
  },
}); 