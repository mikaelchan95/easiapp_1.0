import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import { useRewards } from '../../context/RewardsContext';
import { useAppContext } from '../../context/AppContext';

type BalanceCardsProps = {
  onCreditClick?: () => void;
  onRewardsClick?: () => void;
  onSignIn?: () => void;
  isLoggedIn?: boolean;
};

// Utility function to format numbers in shortened form
const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    const formatted = (num / 1000000000).toFixed(1);
    return formatted.endsWith('.0') ? `${Math.floor(num / 1000000000)}B` : `${formatted}B`;
  }
  if (num >= 1000000) {
    const formatted = (num / 1000000).toFixed(1);
    return formatted.endsWith('.0') ? `${Math.floor(num / 1000000)}M` : `${formatted}M`;
  }
  if (num >= 1000) {
    const formatted = (num / 1000).toFixed(1);
    return formatted.endsWith('.0') ? `${Math.floor(num / 1000)}k` : `${formatted}k`;
  }
  return num.toString();
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
  
  // Use real data from contexts
  const accountBalance = 10500; // This would come from user/payment context in real app
  const rewardPoints = rewardsState.userRewards.points; // Actual points from rewards context

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

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.signInCard} 
          onPress={onSignIn}
          activeOpacity={0.95}
        >
          <View style={styles.signInContent}>
            <View style={styles.signInIconContainer}>
              <Ionicons name="person-outline" size={18} color="hsl(0, 0%, 0%)" />
            </View>
            <View style={styles.signInText}>
              <Text style={styles.signInTitle}>Sign in to view balance</Text>
              <Text style={styles.signInSubtitle}>Access your account & rewards</Text>
            </View>
            <View style={styles.signInAction}>
              <Ionicons name="chevron-forward" size={18} color="hsl(0, 0%, 30%)" />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Account Balance Card */}
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
                <ActivityIndicator size="small" color="hsl(0, 0%, 30%)" />
              ) : (
                <Ionicons name="wallet" size={16} color="hsl(0, 0%, 30%)" />
              )}
            </View>
            <Text style={styles.balanceCardLabel}>Account Balance</Text>
            <View style={styles.actionIndicator}>
              <Ionicons name="chevron-forward" size={14} color="hsl(0, 0%, 50%)" />
            </View>
          </View>
          
          {/* Amount */}
          <View style={styles.amountContainer}>
            <Text style={styles.balanceAmount}>${formatNumber(accountBalance)}</Text>
          </View>
          
          {/* Subtext */}
          <Text style={styles.balanceSubtext}>Available to spend</Text>
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
                <ActivityIndicator size="small" color="hsl(0, 0%, 30%)" />
              ) : (
                <Ionicons name="gift" size={16} color="hsl(0, 0%, 30%)" />
              )}
            </View>
            <Text style={styles.rewardsCardLabel}>Reward Points</Text>
            <View style={styles.actionIndicator}>
              <Ionicons name="chevron-forward" size={14} color="hsl(0, 0%, 50%)" />
            </View>
          </View>
          
          {/* Amount */}
          <View style={styles.amountContainer}>
            <Text style={styles.rewardsAmount}>{formatNumber(rewardPoints)}</Text>
          </View>
          
          {/* Subtext */}
          <Text style={styles.rewardsSubtext}>Ready to redeem</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const { width } = Dimensions.get('window');
const cardSpacing = 16;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: cardSpacing,
    paddingVertical: 16,
    gap: cardSpacing,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: 'hsl(0, 0%, 100%)', // Pure white
    borderRadius: 20,
    minHeight: 130,
    borderWidth: 1,
    borderColor: 'hsl(0, 0%, 90%)',
    // Enhanced shadow
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  rewardsCard: {
    flex: 1,
    backgroundColor: 'hsl(0, 0%, 98%)', // Very light grey
    borderRadius: 20,
    minHeight: 130,
    borderWidth: 1,
    borderColor: 'hsl(0, 0%, 90%)',
    // Enhanced shadow
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  signInCard: {
    flex: 1,
    backgroundColor: 'hsl(0, 0%, 100%)',
    borderRadius: 20,
    minHeight: 130,
    borderWidth: 1,
    borderColor: 'hsl(0, 0%, 90%)',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
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
    marginBottom: 16,
  },
  balanceIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'hsl(0, 0%, 95%)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rewardsIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'hsl(0, 0%, 92%)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  balanceCardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'hsl(0, 0%, 30%)',
    flex: 1,
  },
  rewardsCardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'hsl(0, 0%, 30%)',
    flex: 1,
  },
  actionIndicator: {
    opacity: 0.6,
  },
  amountContainer: {
    marginVertical: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: 'hsl(0, 0%, 0%)',
    letterSpacing: -1,
    lineHeight: 36,
  },
  rewardsAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: 'hsl(0, 0%, 0%)',
    letterSpacing: -1,
    lineHeight: 36,
  },
  balanceSubtext: {
    fontSize: 13,
    color: 'hsl(0, 0%, 50%)',
    fontWeight: '400',
    lineHeight: 16,
  },
  rewardsSubtext: {
    fontSize: 13,
    color: 'hsl(0, 0%, 50%)',
    fontWeight: '400',
    lineHeight: 16,
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
    backgroundColor: 'hsl(0, 0%, 96%)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  signInText: {
    flex: 1,
  },
  signInTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'hsl(0, 0%, 0%)',
    marginBottom: 4,
    lineHeight: 20,
  },
  signInSubtitle: {
    fontSize: 13,
    color: 'hsl(0, 0%, 50%)',
    fontWeight: '400',
    lineHeight: 16,
  },
  signInAction: {
    opacity: 0.6,
  },
});

export default BalanceCards; 