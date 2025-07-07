import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
<<<<<<< HEAD
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
=======
import { COLORS, TYPOGRAPHY, SPACING } from '../../utils/theme';
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance)

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
  isLoggedIn = true // For demo purposes
}) => {
  const [loadingCredit, setLoadingCredit] = useState(false);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [loadingSignIn, setLoadingSignIn] = useState(false);

  // Enhanced handlers with loading states and better messaging
  const handleCreditPress = async () => {
    if (loadingCredit) return;
    setLoadingCredit(true);
    
    // Simulate loading
    setTimeout(() => {
      setLoadingCredit(false);
      onCreditClick?.();
    }, 300);
  };

  const handleRewardsPress = async () => {
    if (loadingRewards) return;
    setLoadingRewards(true);
    
    // Simulate loading
    setTimeout(() => {
      setLoadingRewards(false);
      onRewardsClick?.();
    }, 300);
  };

  const handleSignInPress = async () => {
    if (loadingSignIn) return;
    setLoadingSignIn(true);
    
    // Simulate loading
    setTimeout(() => {
      setLoadingSignIn(false);
      onSignIn?.();
    }, 500);
  };
  
  // If not logged in, show sign-in card with improved messaging
  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={[styles.card, styles.signInCard, loadingSignIn && styles.cardLoading]} 
          onPress={handleSignInPress}
          disabled={loadingSignIn}
        >
          <View style={styles.cardContent}>
            <View style={styles.signInLeft}>
              <Text style={styles.signInTitle}>Start Earning Points</Text>
              <Text style={styles.signInSubtitle}>Get exclusive member benefits</Text>
            </View>
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
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
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
            </View>
            <Text style={styles.balanceAmount}>$10,500</Text>
            <Text style={styles.balanceLabel}>Available to spend</Text>
            <View style={styles.cardAction}>
              <Text style={styles.actionText}>Tap to manage</Text>
              <Ionicons name="chevron-forward" size={12} color="rgba(255, 255, 255, 0.7)" />
            </View>
          </View>
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
            </View>
            <Text style={styles.balanceAmount}>1,250</Text>
            <Text style={styles.balanceLabel}>Ready to redeem</Text>
            <View style={styles.cardAction}>
              <Text style={styles.actionText}>Tap to claim</Text>
              <Ionicons name="chevron-forward" size={12} color="rgba(255, 255, 255, 0.7)" />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const cardWidth = (width - (SPACING.md * 3)) / 2; // Two cards per row with proper spacing

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
<<<<<<< HEAD
    paddingTop: SPACING.element,
=======
    paddingTop: SPACING.sm,
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance)
    paddingBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
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
  },
  rewardsCard: {
    backgroundColor: '#007AFF',
  },
  signInCard: {
    backgroundColor: COLORS.card,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardContent: {
    padding: SPACING.md,
<<<<<<< HEAD
=======
    flex: 1,
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance)
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
<<<<<<< HEAD
    marginBottom: SPACING.md,
=======
    marginBottom: SPACING.sm,
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance)
  },
  creditIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
<<<<<<< HEAD
    marginRight: SPACING.element,
=======
    marginRight: SPACING.xs,
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance)
  },
  rewardsIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  buttonLoading: {
    opacity: 0.7,
  },
  signInButtonText: {
    ...TYPOGRAPHY.button,
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance)
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default BalanceCards; 