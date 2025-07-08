import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
<<<<<<< HEAD
<<<<<<< HEAD
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
=======
import { COLORS, TYPOGRAPHY, SPACING } from '../../utils/theme';
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance)
=======
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import { useRewards } from '../../context/RewardsContext';
import { useAppContext } from '../../context/AppContext';
>>>>>>> 9385301 (🚀 Fix Google Maps Places API search: remove strictbounds/bounds, use location+radius for SG, ensure Uber-style location picker works for all place types)

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
<<<<<<< HEAD
            <View style={styles.signInRight}>
<<<<<<< HEAD
              <View style={styles.signInButton}>
                <Text style={styles.signInButtonText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.text} />
=======
              <View style={[styles.signInButton, loadingSignIn && styles.buttonLoading]}>
                {loadingSignIn ? (
                  <ActivityIndicator size="small" color="#1A1A1A" />
                ) : (
                  <>
                    <Text style={styles.signInButtonText}>Join Now</Text>
                    <Ionicons name="arrow-forward" size={14} color="#1A1A1A" />
                  </>
                )}
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance)
              </View>
=======
            <View style={styles.signInText}>
              <Text style={styles.signInTitle}>Sign in to view balance</Text>
              <Text style={styles.signInSubtitle}>Access your account & rewards</Text>
            </View>
            <View style={styles.signInAction}>
              <Ionicons name="chevron-forward" size={18} color="hsl(0, 0%, 30%)" />
>>>>>>> 9385301 (🚀 Fix Google Maps Places API search: remove strictbounds/bounds, use location+radius for SG, ensure Uber-style location picker works for all place types)
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
<<<<<<< HEAD
      <View style={styles.row}>
        {/* Credit Card - Improved messaging */}
        <TouchableOpacity 
          style={[styles.card, styles.creditCard, loadingCredit && styles.cardLoading]} 
          onPress={handleCreditPress}
          disabled={loadingCredit}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.creditIcon}>
<<<<<<< HEAD
                <Ionicons name="wallet-outline" size={16} color={COLORS.card} />
=======
                {loadingCredit ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                <Ionicons name="wallet-outline" size={16} color="#fff" />
                )}
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance)
              </View>
              <Text style={styles.cardTitle}>Account Balance</Text>
=======
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
>>>>>>> 9385301 (🚀 Fix Google Maps Places API search: remove strictbounds/bounds, use location+radius for SG, ensure Uber-style location picker works for all place types)
            </View>
            <Text style={styles.balanceCardLabel}>Account Balance</Text>
            <View style={styles.actionIndicator}>
              <Ionicons name="chevron-forward" size={14} color="hsl(0, 0%, 50%)" />
            </View>
          </View>
<<<<<<< HEAD
        </TouchableOpacity>
        
        {/* Rewards Card - Improved messaging */}
        <TouchableOpacity 
          style={[styles.card, styles.rewardsCard, loadingRewards && styles.cardLoading]} 
          onPress={handleRewardsPress}
          disabled={loadingRewards}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.rewardsIcon}>
<<<<<<< HEAD
                <Ionicons name="gift-outline" size={16} color={COLORS.card} />
=======
                {loadingRewards ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                <Ionicons name="gift-outline" size={16} color="#fff" />
                )}
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance)
              </View>
              <Text style={styles.cardTitle}>Reward Points</Text>
=======
          
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
>>>>>>> 9385301 (🚀 Fix Google Maps Places API search: remove strictbounds/bounds, use location+radius for SG, ensure Uber-style location picker works for all place types)
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
<<<<<<< HEAD
    paddingHorizontal: SPACING.md,
<<<<<<< HEAD
    paddingTop: SPACING.element,
=======
    paddingTop: SPACING.sm,
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance)
    paddingBottom: SPACING.md,
  },
  row: {
=======
>>>>>>> 9385301 (🚀 Fix Google Maps Places API search: remove strictbounds/bounds, use location+radius for SG, ensure Uber-style location picker works for all place types)
    flexDirection: 'row',
    paddingHorizontal: cardSpacing,
    paddingVertical: 16,
    gap: cardSpacing,
  },
<<<<<<< HEAD
  card: {
    width: cardWidth,
    borderRadius: 16,
    overflow: 'hidden',
<<<<<<< HEAD
    ...SHADOWS.medium,
=======
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 120,
  },
  cardLoading: {
    opacity: 0.7,
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance)
  },
  creditCard: {
    backgroundColor: COLORS.text, // Black background
=======
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
>>>>>>> 9385301 (🚀 Fix Google Maps Places API search: remove strictbounds/bounds, use location+radius for SG, ensure Uber-style location picker works for all place types)
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
<<<<<<< HEAD
    padding: SPACING.md,
<<<<<<< HEAD
=======
    flex: 1,
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance)
=======
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
>>>>>>> 9385301 (🚀 Fix Google Maps Places API search: remove strictbounds/bounds, use location+radius for SG, ensure Uber-style location picker works for all place types)
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
<<<<<<< HEAD
<<<<<<< HEAD
    marginBottom: SPACING.md,
=======
    marginBottom: SPACING.sm,
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance)
=======
    marginBottom: 16,
>>>>>>> 9385301 (🚀 Fix Google Maps Places API search: remove strictbounds/bounds, use location+radius for SG, ensure Uber-style location picker works for all place types)
  },
  balanceIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'hsl(0, 0%, 95%)',
    justifyContent: 'center',
    alignItems: 'center',
<<<<<<< HEAD
<<<<<<< HEAD
    marginRight: SPACING.element,
=======
    marginRight: SPACING.xs,
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance)
=======
    marginRight: 10,
>>>>>>> 9385301 (🚀 Fix Google Maps Places API search: remove strictbounds/bounds, use location+radius for SG, ensure Uber-style location picker works for all place types)
  },
  rewardsIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'hsl(0, 0%, 92%)',
    justifyContent: 'center',
    alignItems: 'center',
<<<<<<< HEAD
<<<<<<< HEAD
    marginRight: SPACING.element,
  },
  cardTitle: {
    color: COLORS.card,
    fontSize: 14,
    fontWeight: '600',
  },
  balanceAmount: {
    color: COLORS.card,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    lineHeight: 32,
=======
    marginRight: SPACING.xs,
  },
  cardTitle: {
    ...TYPOGRAPHY.label,
    color: '#fff',
    fontWeight: '600',
  },
  balanceAmount: {
    ...TYPOGRAPHY.h2,
    color: '#fff',
    fontWeight: '800',
    marginBottom: 2,
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance)
  },
  balanceLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255, 255, 255, 0.7)',
<<<<<<< HEAD
    fontSize: 12,
    lineHeight: 16,
=======
    marginBottom: SPACING.xs,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
  },
  actionText: {
    ...TYPOGRAPHY.tiny,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 4,
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance)
  },
  signInLeft: {
    flex: 1,
  },
  signInRight: {
    alignItems: 'flex-end',
  },
  signInTitle: {
<<<<<<< HEAD
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  signInSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
=======
    ...TYPOGRAPHY.h5,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  signInSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.secondary,
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance)
=======
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
>>>>>>> 9385301 (🚀 Fix Google Maps Places API search: remove strictbounds/bounds, use location+radius for SG, ensure Uber-style location picker works for all place types)
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
<<<<<<< HEAD
    backgroundColor: '#FFD700',
<<<<<<< HEAD
    paddingVertical: SPACING.element,
    paddingHorizontal: SPACING.card,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  signInButtonText: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
=======
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    gap: 4,
    minWidth: 80,
    justifyContent: 'center',
=======
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
>>>>>>> 9385301 (🚀 Fix Google Maps Places API search: remove strictbounds/bounds, use location+radius for SG, ensure Uber-style location picker works for all place types)
  },
  signInText: {
    flex: 1,
  },
<<<<<<< HEAD
  signInButtonText: {
    ...TYPOGRAPHY.button,
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance)
    fontWeight: '600',
    color: COLORS.text,
=======
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
>>>>>>> 9385301 (🚀 Fix Google Maps Places API search: remove strictbounds/bounds, use location+radius for SG, ensure Uber-style location picker works for all place types)
  },
});

export default BalanceCards; 