import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import { formatStatCurrency, formatStatNumber, cleanText } from '../../utils/formatting';
import { useRewards } from '../../context/RewardsContext';
import { useAppContext } from '../../context/AppContext';
import { isCompanyUser } from '../../types/user';

type BalanceCardsProps = {
  onCreditClick?: () => void;
  onRewardsClick?: () => void;
  onSignIn?: () => void;
  isLoggedIn?: boolean;
};

const BalanceCards: React.FC<BalanceCardsProps> = ({ 
  onCreditClick, 
  onRewardsClick, 
  onSignIn,
  isLoggedIn = true
}) => {
  const [loadingCredit, setLoadingCredit] = useState(false);
  const [loadingRewards, setLoadingRewards] = useState(false);
  
  // Get actual data from contexts
  const { state: rewardsState } = useRewards();
  const { state: appState } = useAppContext();
  
  // Get user-specific data from Supabase/AppContext
  const user = appState.user;
  const company = appState.company;
  
  // Calculate account balance based on user type
  const getAccountBalance = () => {
    if (!user) return 0;
    
    if (isCompanyUser(user) && company) {
      // For company users, show company's current credit
      return company.currentCredit || 0;
    } else {
      // For individual users, get wallet balance from database
      return user.walletBalance || 0;
    }
  };
  
  // Get credit label based on user type
  const getCreditLabel = () => {
    if (!user) return 'Balance';
    
    if (isCompanyUser(user)) {
      return 'Credit';
    } else {
      return 'Balance';
    }
  };
  
  // Get credit subtext based on user type
  const getCreditSubtext = () => {
    return 'Available';
  };
  
  // Use real data from contexts
  const accountBalance = getAccountBalance();
  const rewardPoints = rewardsState.userRewards.points; // Actual points from rewards context
  
  // Log user data for debugging (behind the scenes)
  useEffect(() => {
    if (user) {
      console.log('🏠 Home: User data loaded:', {
        name: user.name,
        type: user.accountType,
        balance: accountBalance,
        company: company?.name,
        credit: company?.currentCredit
      });
    }
  }, [user, company, accountBalance]);

  const handleCreditPress = async () => {
    if (loadingCredit) return;
    setLoadingCredit(true);
    setTimeout(() => {
      setLoadingCredit(false);
      onCreditClick?.();
    }, 300);
  };

  const handleRewardsPress = async () => {
    if (loadingRewards) return;
    setLoadingRewards(true);
    setTimeout(() => {
      setLoadingRewards(false);
      onRewardsClick?.();
    }, 300);
  };

  if (!isLoggedIn || !user) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.signInCard} 
          onPress={onSignIn}
          activeOpacity={0.95}
        >
          <View style={styles.signInContent}>
            <View style={styles.signInIconContainer}>
              <Ionicons name="person-outline" size={18} color={COLORS.text} />
            </View>
            <View style={styles.signInText}>
              <Text style={styles.signInTitle}>Sign in to view balance</Text>
              <Text style={styles.signInSubtitle}>Access account & rewards</Text>
            </View>
            <View style={styles.signInAction}>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Account Balance/Credit Card */}
      <TouchableOpacity 
        style={[styles.balanceCard, loadingCredit && styles.cardLoading]} 
        onPress={handleCreditPress}
        disabled={loadingCredit}
        activeOpacity={0.95}
      >
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.balanceIconContainer}>
              {loadingCredit ? (
                <ActivityIndicator size="small" color={COLORS.textSecondary} />
              ) : (
                <Ionicons 
                  name={isCompanyUser(user) ? "business" : "wallet"} 
                  size={16} 
                  color={COLORS.textSecondary} 
                />
              )}
            </View>
            <Text style={styles.balanceCardLabel}>{getCreditLabel()}</Text>
            <View style={styles.actionIndicator}>
              <Ionicons name="chevron-forward" size={14} color={COLORS.inactive} />
            </View>
          </View>
          
          {/* Amount */}
          <View style={styles.amountContainer}>
            <Text style={styles.balanceAmount}>{formatStatCurrency(accountBalance)}</Text>
          </View>
          
          {/* Subtext */}
          <Text style={styles.balanceSubtext}>{getCreditSubtext()}</Text>
        </View>
      </TouchableOpacity>

      {/* Rewards Points Card */}
      <TouchableOpacity 
        style={[styles.rewardsCard, loadingRewards && styles.cardLoading]} 
        onPress={handleRewardsPress}
        disabled={loadingRewards}
        activeOpacity={0.95}
      >
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.rewardsIconContainer}>
              {loadingRewards ? (
                <ActivityIndicator size="small" color={COLORS.textSecondary} />
              ) : (
                <Ionicons name="gift" size={16} color={COLORS.textSecondary} />
              )}
            </View>
            <Text style={styles.rewardsCardLabel}>Points</Text>
            <View style={styles.actionIndicator}>
              <Ionicons name="chevron-forward" size={14} color={COLORS.inactive} />
            </View>
          </View>
          
          {/* Amount */}
          <View style={styles.amountContainer}>
            <Text style={styles.rewardsAmount}>{formatStatNumber(rewardPoints)}</Text>
          </View>
          
          {/* Subtext */}
          <Text style={styles.rewardsSubtext}>Ready to use</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const { width } = Dimensions.get('window');
const cardSpacing = SPACING.md;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: cardSpacing,
    paddingVertical: SPACING.md,
    gap: cardSpacing,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    minHeight: 130,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  rewardsCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    minHeight: 130,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  signInCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    minHeight: 130,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  cardLoading: {
    opacity: 0.6,
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  balanceIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rewardsIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  balanceCardLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '500',
    color: COLORS.textSecondary,
    flex: 1,
  },
  rewardsCardLabel: {
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
  balanceAmount: {
    ...TYPOGRAPHY.h1,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -1,
  },
  rewardsAmount: {
    ...TYPOGRAPHY.h1,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -1,
  },
  balanceSubtext: {
    ...TYPOGRAPHY.small,
    color: COLORS.inactive,
    fontWeight: '400',
  },
  rewardsSubtext: {
    ...TYPOGRAPHY.small,
    color: COLORS.inactive,
    fontWeight: '400',
  },
  signInContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  signInIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  signInText: {
    flex: 1,
  },
  signInTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  signInSubtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.inactive,
    fontWeight: '400',
  },
  signInAction: {
    opacity: 0.6,
  },
});

export default BalanceCards; 