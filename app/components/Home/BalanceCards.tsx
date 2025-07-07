import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';

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
  
  // If not logged in, show sign-in card
  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={[styles.card, styles.signInCard]} 
          onPress={onSignIn}
        >
          <View style={styles.cardContent}>
            <View style={styles.signInLeft}>
              <Text style={styles.signInTitle}>Sign in to earn points</Text>
              <Text style={styles.signInSubtitle}>Enjoy member benefits</Text>
            </View>
            <View style={styles.signInRight}>
              <View style={styles.signInButton}>
                <Text style={styles.signInButtonText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.text} />
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
        {/* Credit Card */}
        <TouchableOpacity 
          style={[styles.card, styles.creditCard]} 
          onPress={onCreditClick}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.creditIcon}>
                <Ionicons name="wallet-outline" size={16} color={COLORS.card} />
              </View>
              <Text style={styles.cardTitle}>Credit</Text>
            </View>
            <Text style={styles.balanceAmount}>$10,500</Text>
            <Text style={styles.balanceLabel}>Available</Text>
          </View>
        </TouchableOpacity>
        
        {/* Rewards Card */}
        <TouchableOpacity 
          style={[styles.card, styles.rewardsCard]} 
          onPress={onRewardsClick}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.rewardsIcon}>
                <Ionicons name="gift-outline" size={16} color={COLORS.card} />
              </View>
              <Text style={styles.cardTitle}>Rewards</Text>
            </View>
            <Text style={styles.balanceAmount}>1,250</Text>
            <Text style={styles.balanceLabel}>Points</Text>
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
    paddingTop: SPACING.element,
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
    ...SHADOWS.medium,
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
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  creditIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.element,
  },
  rewardsIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    lineHeight: 16,
  },
  signInLeft: {
    flex: 1,
  },
  signInRight: {
    alignItems: 'flex-end',
  },
  signInTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  signInSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: SPACING.element,
    paddingHorizontal: SPACING.card,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  signInButtonText: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default BalanceCards; 