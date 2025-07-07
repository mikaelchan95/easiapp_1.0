import React, { useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Pressable,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { AppContext } from '../../context/AppContext';
import MobileHeader from '../Layout/MobileHeader';

// Mock user data with more details
const user = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+65 8123 4567',
  memberSince: 'March 2023',
  totalOrders: 12,
  rewardPoints: 1250,
  preferredStore: 'Marina Bay'
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state } = useContext(AppContext);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => console.log('Logged out') }
      ]
    );
  };

  const handleFeaturePress = (feature: string) => {
    console.log(`Pressed: ${feature}`);
    
    // Navigate to specific screens
    switch (feature) {
      case 'Order History':
        navigation.navigate('OrderHistory');
        break;
      case 'Wishlist':
        navigation.navigate('Wishlist');
        break;
      case 'Reviews':
        navigation.navigate('Reviews');
        break;
      case 'Support':
        navigation.navigate('Support');
        break;
      default:
        console.log('Feature not implemented:', feature);
    }
  };

  return (
    <View style={styles.container}>
      {/* Status Bar Background */}
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      
      {/* Header */}
      <MobileHeader 
        title="Profile" 
        showBackButton={false} 
        showSearch={false}
        showCartButton={false}
      />

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
            </View>
            
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.memberSince}>Member since {user.memberSince}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleFeaturePress('Edit Profile')}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={20} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* User Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.totalOrders}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.rewardPoints}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4.9</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={() => handleFeaturePress('Order History')}
              activeOpacity={0.7}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="receipt-outline" size={24} color="#000000" />
              </View>
              <Text style={styles.quickActionLabel}>Order History</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('Main', { screen: 'Rewards' })}
              activeOpacity={0.7}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="gift-outline" size={24} color="#000000" />
              </View>
              <Text style={styles.quickActionLabel}>Rewards</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={() => handleFeaturePress('Wishlist')}
              activeOpacity={0.7}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="heart-outline" size={24} color="#000000" />
              </View>
              <Text style={styles.quickActionLabel}>Wishlist</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={() => handleFeaturePress('Support')}
              activeOpacity={0.7}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="help-circle-outline" size={24} color="#000000" />
              </View>
              <Text style={styles.quickActionLabel}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Activities</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleFeaturePress('Order History')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#4CAF5015' }]}>
                  <Ionicons name="receipt-outline" size={20} color="#4CAF50" />
                </View>
                <View style={styles.menuLabelContainer}>
                  <Text style={styles.menuLabel}>Order History</Text>
                  <Text style={styles.menuSubLabel}>Track past & current orders</Text>
                </View>
              </View>
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>2</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleFeaturePress('Wishlist')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#E91E6315' }]}>
                  <Ionicons name="heart-outline" size={20} color="#E91E63" />
                </View>
                <View style={styles.menuLabelContainer}>
                  <Text style={styles.menuLabel}>Wishlist</Text>
                  <Text style={styles.menuSubLabel}>Saved items & favorites</Text>
                </View>
              </View>
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>5</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleFeaturePress('Reviews')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#FF980015' }]}>
                  <Ionicons name="star-outline" size={20} color="#FF9800" />
                </View>
                <View style={styles.menuLabelContainer}>
                  <Text style={styles.menuLabel}>Reviews & Ratings</Text>
                  <Text style={styles.menuSubLabel}>Share your experience</Text>
                </View>
              </View>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('Rewards')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#9C27B015' }]}>
                  <Ionicons name="gift-outline" size={20} color="#9C27B0" />
                </View>
                <View style={styles.menuLabelContainer}>
                  <Text style={styles.menuLabel}>Rewards & Points</Text>
                  <Text style={styles.menuSubLabel}>Earn points, get rewards</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleFeaturePress('Personal Information')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="person-outline" size={20} color="#000000" />
                </View>
                <Text style={styles.menuLabel}>Personal Information</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleFeaturePress('Delivery Addresses')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="location-outline" size={20} color="#000000" />
                </View>
                <Text style={styles.menuLabel}>Delivery Addresses</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleFeaturePress('Payment Methods')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="card-outline" size={20} color="#000000" />
                </View>
                <Text style={styles.menuLabel}>Payment Methods</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleFeaturePress('Security & Privacy')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#000000" />
                </View>
                <Text style={styles.menuLabel}>Security & Privacy</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleFeaturePress('Notifications')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="notifications-outline" size={20} color="#000000" />
                </View>
                <Text style={styles.menuLabel}>Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleFeaturePress('App Settings')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="settings-outline" size={20} color="#000000" />
                </View>
                <Text style={styles.menuLabel}>App Settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('MomentumShowcase')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="trending-up" size={20} color="#000000" />
                </View>
                <Text style={styles.menuLabel}>Progress & Momentum</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support & Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleFeaturePress('Help Center')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="help-circle-outline" size={20} color="#000000" />
                </View>
                <Text style={styles.menuLabel}>Help Center</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleFeaturePress('Contact Support')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="chatbubble-outline" size={20} color="#000000" />
                </View>
                <Text style={styles.menuLabel}>Contact Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleFeaturePress('Terms & Privacy')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="document-text-outline" size={20} color="#000000" />
                </View>
                <Text style={styles.menuLabel}>Terms & Privacy</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>EASI by Epico</Text>
          <Text style={styles.versionNumber}>Version 1.0.0</Text>
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
    backgroundColor: COLORS.background, // Frame background (98% lightness)
  },
  statusBarBackground: {
    backgroundColor: COLORS.card,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },

  // Profile Card
  profileCard: {
    backgroundColor: COLORS.card, // Canvas white
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#000000', // Black background
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...TYPOGRAPHY.h3,
    marginBottom: 2,
  },
  userEmail: {
    ...TYPOGRAPHY.caption,
    marginBottom: 2,
  },
  memberSince: {
    ...TYPOGRAPHY.small,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5', // Border color (90% lightness)
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...TYPOGRAPHY.h2,
    marginBottom: 4,
  },
  statLabel: {
    ...TYPOGRAPHY.small,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E5E5',
  },

  // Sections
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    ...SHADOWS.light,
    minHeight: 88, // Ensure proper touch target
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  quickActionLabel: {
    ...TYPOGRAPHY.small,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Menu
  menuContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    ...SHADOWS.light,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 56, // Proper touch target
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  menuLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
  },
  menuLabelContainer: {
    flex: 1,
  },
  menuSubLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  menuBadge: {
    backgroundColor: '#4CAF50',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  menuBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  newBadge: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Sign Out Button
  signOutButton: {
    backgroundColor: '#000000', // Black button
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.lg,
    ...SHADOWS.medium,
    minHeight: 48, // Proper touch target
  },
  signOutText: {
    color: '#FFFFFF', // White text on black button
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },

  // Version
  versionContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  versionText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    marginBottom: 2,
  },
  versionNumber: {
    ...TYPOGRAPHY.small,
  },

  // Bottom Padding
  bottomPadding: {
    height: 100,
  },
}); 