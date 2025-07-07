import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
                <Ionicons name="arrow-forward" size={14} color="#000" />
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
                <Ionicons name="wallet-outline" size={16} color="#fff" />
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
                <Ionicons name="gift-outline" size={16} color="#fff" />
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
const cardWidth = (width - 48) / 2; // Two cards per row with spacing

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    width: cardWidth,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  creditCard: {
    backgroundColor: '#1A1A1A',
  },
  rewardsCard: {
    backgroundColor: '#007AFF',
  },
  signInCard: {
    backgroundColor: '#fff',
    width: '100%',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  creditIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rewardsIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  signInLeft: {
    flex: 1,
  },
  signInRight: {
    alignItems: 'flex-end',
  },
  signInTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  signInSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  signInButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});

export default BalanceCards; 