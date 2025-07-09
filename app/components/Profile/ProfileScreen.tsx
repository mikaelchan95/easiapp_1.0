import React, { useContext, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  StatusBar,
  Image,
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { AppContext, getUserRole } from '../../context/AppContext';
import MobileHeader from '../Layout/MobileHeader';
import { isCompanyUser, CompanyUser, IndividualUser } from '../../types/user';
import { formatPrice } from '../../utils/pricing';
import { getUsersByCompany, getPendingApprovalsForUser } from '../../data/mockUsers';
import { formatStatCurrency, formatStatNumber } from '../../utils/formatting';
import { useAppContext } from '../../context/AppContext';
import { HapticFeedback } from '../../utils/haptics';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Enhanced contact interactions
const handleContactPress = async (type: 'email' | 'phone', value: string) => {
  HapticFeedback.light();
  
  if (type === 'email') {
    // Open email app
    const emailUrl = `mailto:${value}`;
    const canOpen = await Linking.canOpenURL(emailUrl);
    if (canOpen) {
      Linking.openURL(emailUrl);
    } else {
      Alert.alert('Email', value, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Copy', onPress: () => console.log('Email copied') }
      ]);
    }
  } else if (type === 'phone') {
    const phoneUrl = `tel:${value}`;
    const canOpen = await Linking.canOpenURL(phoneUrl);
    if (canOpen) {
      Linking.openURL(phoneUrl);
    } else {
      Alert.alert('Phone', value, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Copy', onPress: () => console.log('Phone copied') }
      ]);
    }
  }
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state, signOut, updateUserProfile } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompanyExpanded, setIsCompanyExpanded] = useState(false);
  const { testSupabaseIntegration, loadUserFromSupabase } = useAppContext();
  
  const { user, company } = state;
  const pendingApprovals = user ? getPendingApprovalsForUser(user.id) : [];
  const teamMembers = company ? getUsersByCompany(company.id) : [];

  // Test Supabase integration behind the scenes on component mount
  useEffect(() => {
    const testIntegration = async () => {
      try {
        console.log('🔄 Testing Supabase integration in background...');
        const success = await testSupabaseIntegration();
        if (success) {
          console.log('✅ Background Supabase test completed successfully');
        } else {
          console.log('⚠️ Background Supabase test failed, using mock data');
        }
      } catch (error) {
        console.log('⚠️ Background Supabase test error:', error);
      }
    };

    testIntegration();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            setIsLoading(true);
            const success = await signOut();
            setIsLoading(false);
            
            if (success) {
              // Navigation will be handled by app state change
              console.log('Successfully signed out');
            } else {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleFeaturePress = (feature: string) => {
    console.log(`Pressed: ${feature}`);
    
    // Navigate to specific screens
    switch (feature) {
      case 'Company Profile':
        navigation.navigate('CompanyProfile');
        break;
      case 'Team Management':
        navigation.navigate('TeamManagement');
        break;
      case 'Pending Approvals':
        // TODO: Implement PendingApprovals screen
        // navigation.navigate('PendingApprovals');
        console.log('Navigate to Pending Approvals - not implemented yet');
        break;
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

  const toggleCompanyExpansion = () => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    setIsCompanyExpanded(!isCompanyExpanded);
  };

  // Load user data behind the scenes if needed
  const loadUserData = async (userId: string) => {
    try {
      const userData = await loadUserFromSupabase(userId);
      if (userData) {
        console.log('✅ Successfully loaded user data behind the scenes:', userData.name);
      }
    } catch (error) {
      console.log('⚠️ Error loading user data:', error);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
        <View style={[styles.statusBarSpacer, { height: insets.top }]} />
        <View style={styles.headerContainer}>
          <MobileHeader 
            title="Profile" 
            showBackButton={false} 
            showSearch={false}
            showCartButton={false}
          />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.noUserText}>Please sign in to view your profile</Text>
        </View>
      </View>
    );
  }

  const renderCompanySection = () => {
    if (!isCompanyUser(user) || !company) return null;

    const companyUser = user as CompanyUser;
    
    return (
      <>
        {/* Modern Collapsible Company Widget */}
        <TouchableOpacity 
          style={styles.modernCompanyCard}
          onPress={toggleCompanyExpansion}
          activeOpacity={0.98}
        >
          {/* Compact Header */}
          <View style={styles.modernCompanyHeader}>
            <View style={styles.modernCompanyIcon}>
              <Ionicons name="business" size={24} color={COLORS.text} />
            </View>
            
            <View style={styles.modernCompanyInfo}>
              <Text style={styles.modernCompanyName}>{company.name}</Text>
              <View style={styles.modernCompanyMeta}>
                <View style={styles.modernCompanyBadge}>
                  <Text style={styles.modernCompanyBadgeText}>
                    {company.status === 'active' ? 'Verified' : 'Pending'}
                  </Text>
                </View>
                <Text style={styles.modernCompanyUEN}>UEN: {company.uen}</Text>
              </View>
            </View>
            
            <View style={styles.modernExpandButton}>
              <Ionicons 
                name={isCompanyExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={COLORS.textSecondary} 
              />
            </View>
          </View>

          {/* Compact Stats - Always Visible */}
          <View style={styles.modernStatsContainer}>
            <View style={styles.modernStatItem}>
              <Text style={styles.modernStatNumber}>
                {formatStatCurrency(company.currentCredit || 0)}
              </Text>
              <Text style={styles.modernStatLabel}>Used</Text>
            </View>
            <View style={styles.modernStatDivider} />
            <View style={styles.modernStatItem}>
              <Text style={styles.modernStatNumber}>
                {formatStatCurrency(company.creditLimit || 0)}
              </Text>
              <Text style={styles.modernStatLabel}>Limit</Text>
            </View>
            <View style={styles.modernStatDivider} />
            <View style={styles.modernStatItem}>
              <Text style={styles.modernStatNumber}>{company.paymentTerms}</Text>
              <Text style={styles.modernStatLabel}>Terms</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Expanded Content - Company Quick Actions */}
        {isCompanyExpanded && (
          <View style={styles.expandedSection}>
            <Text style={styles.expandedSectionTitle}>Company Management</Text>
            <View style={styles.modernQuickActionsGrid}>
              <TouchableOpacity 
                style={styles.modernQuickActionItem}
                onPress={() => handleFeaturePress('Team Management')}
                activeOpacity={0.7}
              >
                <View style={styles.modernQuickActionIcon}>
                  <Ionicons name="people-outline" size={20} color={COLORS.text} />
                </View>
                <Text style={styles.modernQuickActionLabel}>Team</Text>
                {teamMembers.length > 0 && (
                  <View style={styles.modernQuickActionBadge}>
                    <Text style={styles.modernQuickActionBadgeText}>{teamMembers.length}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modernQuickActionItem}
                onPress={() => handleFeaturePress('Pending Approvals')}
                activeOpacity={0.7}
              >
                <View style={styles.modernQuickActionIcon}>
                  <MaterialIcons name="approval" size={20} color={COLORS.text} />
                </View>
                <Text style={styles.modernQuickActionLabel}>Approvals</Text>
                {pendingApprovals.length > 0 && (
                  <View style={styles.modernQuickActionBadge}>
                    <Text style={styles.modernQuickActionBadgeText}>{pendingApprovals.length}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modernQuickActionItem}
                onPress={() => handleFeaturePress('Order History')}
                activeOpacity={0.7}
              >
                <View style={styles.modernQuickActionIcon}>
                  <Ionicons name="receipt-outline" size={20} color={COLORS.text} />
                </View>
                <Text style={styles.modernQuickActionLabel}>Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modernQuickActionItem}
                onPress={() => handleFeaturePress('Company Reports')}
                activeOpacity={0.7}
              >
                <View style={styles.modernQuickActionIcon}>
                  <Ionicons name="bar-chart-outline" size={20} color={COLORS.text} />
                </View>
                <Text style={styles.modernQuickActionLabel}>Reports</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Access to Company Profile */}
            <TouchableOpacity 
              style={styles.modernProfileButton}
              onPress={() => handleFeaturePress('Company Profile')}
              activeOpacity={0.7}
            >
              <Text style={styles.modernProfileButtonText}>View Full Company Profile</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  };

  const renderUserProfile = () => {
    const isCompany = isCompanyUser(user);
    const userRole = getUserRole(user);
    
    return (
      <View style={styles.profileCard}>
        {/* Enhanced Profile Header with Better UX */}
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.avatarSection}
            onPress={() => handleFeaturePress('Edit Profile')}
            activeOpacity={0.8}
          >
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
              {/* Visual indicator that avatar is tappable */}
              <View style={styles.editIndicator}>
                <Ionicons name="camera" size={16} color={COLORS.card} />
              </View>
            </View>
          </TouchableOpacity>
          
          <View style={styles.userInfoSection}>
            <View style={styles.userMainInfo}>
              <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">{user.name}</Text>
              <View style={styles.contactInfo}>
                <TouchableOpacity 
                  style={styles.contactItem}
                  onPress={() => handleContactPress('email', user.email)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="mail" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.userEmail} numberOfLines={1} ellipsizeMode="tail">{user.email}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.contactItem}
                  onPress={() => handleContactPress('phone', user.phone)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.userPhone} numberOfLines={1} ellipsizeMode="tail">{user.phone}</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {isCompany && (
              <View style={styles.professionalInfo}>
                <Text style={styles.userPosition} numberOfLines={1} ellipsizeMode="tail">
                  {(user as CompanyUser).position} • {(user as CompanyUser).department}
                </Text>
                <Text style={styles.userRole}>
                  {userRole === 'trade' ? 'Trade Pricing' : 'Retail Pricing'}
                </Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => handleFeaturePress('Edit Profile')}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Enhanced User Stats with Better UX */}
        {!isCompany && (
          <View style={styles.userStatsSection}>
            <View style={styles.statsSectionHeader}>
              <Text style={styles.statsTitle}>Your Activity</Text>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => handleFeaturePress('Order History')}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.textSecondary} />
              </TouchableOpacity>
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
      
      {/* Safe Area Status Bar Spacer */}
      <View style={[styles.statusBarSpacer, { height: insets.top }]} />
      
      {/* Header */}
      <View style={styles.headerContainer}>
        <MobileHeader 
          title="Profile" 
          showBackButton={false} 
          showSearch={false}
          showCartButton={false}
        />
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        {renderUserProfile()}

        {/* Company Section (only for company users) */}
        {renderCompanySection()}

        

        {/* Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activities</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleFeaturePress('Order History')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="receipt-outline" size={20} color={COLORS.text} />
                </View>
                <View style={styles.menuLabelContainer}>
                  <Text style={styles.menuLabel}>Order History</Text>
                  <Text style={styles.menuSubLabel}>Track orders & delivery</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleFeaturePress('Wishlist')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="heart-outline" size={20} color={COLORS.text} />
                </View>
                <View style={styles.menuLabelContainer}>
                  <Text style={styles.menuLabel}>Wishlist</Text>
                  <Text style={styles.menuSubLabel}>Saved items & favorites</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('Rewards')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="gift-outline" size={20} color={COLORS.text} />
                </View>
                <View style={styles.menuLabelContainer}>
                  <Text style={styles.menuLabel}>Rewards & Points</Text>
                  <Text style={styles.menuSubLabel}>Earn points & rewards</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleFeaturePress('Personal Information')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="person-outline" size={20} color={COLORS.text} />
                </View>
                <Text style={styles.menuLabel}>Personal Information</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleFeaturePress('Delivery Addresses')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="location-outline" size={20} color={COLORS.text} />
                </View>
                <Text style={styles.menuLabel}>Delivery Addresses</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleFeaturePress('Payment Methods')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="card-outline" size={20} color={COLORS.text} />
                </View>
                <Text style={styles.menuLabel}>Payment Methods</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {isCompanyUser(user) && user.permissions?.canManageBilling && (
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleFeaturePress('Billing & Invoices')}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIcon}>
                    <Ionicons name="document-text-outline" size={20} color={COLORS.text} />
                  </View>
                  <Text style={styles.menuLabel}>Billing & Invoices</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.card} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>EASI by Epico</Text>
          <Text style={styles.versionNumber}>Version 1.0.0</Text>
          {isCompanyUser(user) && (
            <Text style={styles.versionNumber}>Trade Edition</Text>
          )}
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
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noUserText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },

  // Profile Card
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
    position: 'relative',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarContainer: {
    position: 'relative',
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
  editIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  userInfoSection: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  userMainInfo: {
    marginBottom: SPACING.xs,
  },
  userName: {
    ...TYPOGRAPHY.h3,
    marginBottom: 4,
    flex: 1,
  },
  contactInfo: {
    flexDirection: 'column',
    gap: 2,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  userEmail: {
    ...TYPOGRAPHY.caption,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  userPhone: {
    ...TYPOGRAPHY.small,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  professionalInfo: {
    marginTop: SPACING.xs,
  },
  userPosition: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    flex: 1,
  },
  userRole: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    flex: 1,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Company Card
  modernCompanyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modernCompanyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modernCompanyIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  modernCompanyInfo: {
    flex: 1,
  },
  modernCompanyName: {
    ...TYPOGRAPHY.h3,
    marginBottom: 2,
  },
  modernCompanyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  modernCompanyBadge: {
    backgroundColor: COLORS.text,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginRight: SPACING.sm,
  },
  modernCompanyBadgeText: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.card,
    fontWeight: 'bold',
  },
  modernCompanyUEN: {
    ...TYPOGRAPHY.small,
    marginTop: 4,
  },
  modernExpandButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
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

   // Sections
   section: {
     marginBottom: SPACING.md,
   },
   sectionTitle: {
     ...TYPOGRAPHY.h4,
     marginBottom: SPACING.sm,
     paddingHorizontal: 4,
   },
   expandedSection: {
     backgroundColor: COLORS.card,
     borderRadius: 16,
     padding: SPACING.lg,
     marginTop: SPACING.sm,
     ...SHADOWS.light,
   },
  expandedSectionTitle: {
    ...TYPOGRAPHY.h4,
    marginBottom: SPACING.sm,
  },
  modernQuickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modernQuickActionItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    ...SHADOWS.light,
    minHeight: 88,
    position: 'relative',
  },
  modernQuickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modernQuickActionLabel: {
    ...TYPOGRAPHY.small,
    textAlign: 'center',
    fontWeight: '600',
  },
  modernQuickActionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.text,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  modernQuickActionBadgeText: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.card,
    fontWeight: 'bold',
  },
  modernProfileButton: {
    backgroundColor: COLORS.text,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.lg,
    ...SHADOWS.medium,
    minHeight: 48,
  },
  modernProfileButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.card,
    fontWeight: '600',
    marginLeft: SPACING.sm,
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
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
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
    backgroundColor: COLORS.background,
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

  // Sign Out Button
  signOutButton: {
    backgroundColor: COLORS.text,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.lg,
    ...SHADOWS.medium,
    minHeight: 48,
  },
  signOutText: {
    ...TYPOGRAPHY.button,
    color: COLORS.card,
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
    color: COLORS.textSecondary,
  },

  // Bottom Padding
  bottomPadding: {
    height: 100,
  },

  // Status Bar Spacer
  statusBarSpacer: {
    backgroundColor: COLORS.card,
  },

  // Header Container
  headerContainer: {
    backgroundColor: COLORS.card,
    zIndex: 10,
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
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  viewAllText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginRight: SPACING.xs,
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