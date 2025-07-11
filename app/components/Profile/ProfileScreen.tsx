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
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { AppContext, getUserRole } from '../../context/AppContext';
import MobileHeader from '../Layout/MobileHeader';
import { isCompanyUser, CompanyUser, IndividualUser } from '../../types/user';
import { formatPrice } from '../../utils/pricing';
import { formatStatCurrency, formatStatNumber } from '../../utils/formatting';
import { useAppContext } from '../../context/AppContext';
import { useRewards } from '../../context/RewardsContext';
import { HapticFeedback } from '../../utils/haptics';
import notificationService from '../../services/notificationService';

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
  const { state, dispatch, signOut, updateUserProfile } = useContext(AppContext);
  const { state: rewardsState } = useRewards();
  const [isLoading, setIsLoading] = useState(false);
  const [isCompanyExpanded, setIsCompanyExpanded] = useState(false);
  const [isChangingProfilePicture, setIsChangingProfilePicture] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now()); // Force image refresh
  const { testSupabaseIntegration, loadUserFromSupabase } = useAppContext();
  
  // Function to manually refresh company data
  const refreshCompanyData = async () => {
    if (user?.accountType === 'company' && user?.companyId) {
      console.log('🔄 Manually refreshing company data...');
      try {
        const { supabaseService } = await import('../../services/supabaseService');
        const company = await supabaseService.getCompanyById(user.companyId);
        if (company) {
          console.log('✅ Company refreshed:', company.name);
          dispatch({ type: 'SET_COMPANY', payload: company });
        } else {
          console.log('❌ No company found for ID:', user.companyId);
        }
      } catch (error) {
        console.error('❌ Error refreshing company data:', error);
      }
    }
  };
  
  const { user, company, userStats } = state;
  const [teamMembers, setTeamMembers] = useState<CompanyUser[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  
  // Load actual team members from Supabase
  const loadTeamMembers = async () => {
    if (company && user?.accountType === 'company') {
      try {
        const { supabaseService } = await import('../../services/supabaseService');
        const members = await supabaseService.getCompanyTeamMembers(company.id);
        setTeamMembers(members || []);
        console.log('✅ Loaded team members:', members?.length || 0);
      } catch (error) {
        console.error('❌ Error loading team members:', error);
        setTeamMembers([]);
      }
    }
  };
  
  // Load actual pending approvals from Supabase
  const loadPendingApprovals = async () => {
    if (user?.accountType === 'company') {
      try {
        // For now, just set empty array - can implement real approvals later
        setPendingApprovals([]);
        console.log('✅ Loaded pending approvals: 0 (not implemented yet)');
      } catch (error) {
        console.error('❌ Error loading pending approvals:', error);
        setPendingApprovals([]);
      }
    }
  };
  
  // Load team members and approvals when company changes
  useEffect(() => {
    loadTeamMembers();
    loadPendingApprovals();
  }, [company?.id]);

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
            console.log('🔄 User confirmed sign out');
            
            // Don't manage loading state locally - let global state handle it
            const success = await signOut();
            
            if (success) {
              console.log('✅ Sign out initiated successfully');
              // Navigation and state cleanup handled by auth state listener
            } else {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleProfilePictureChange = async () => {
    HapticFeedback.light();
    
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => takePhoto() },
        { text: 'Choose from Library', onPress: () => pickFromLibrary() }
      ]
    );
  };

  const takePhoto = async () => {
    try {
      setIsChangingProfilePicture(true);
      
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Camera permission is needed to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await updateProfilePicture(imageUri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsChangingProfilePicture(false);
    }
  };

  const pickFromLibrary = async () => {
    try {
      setIsChangingProfilePicture(true);
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Photo library permission is needed to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await updateProfilePicture(imageUri);
      }
    } catch (error) {
      console.error('Error picking from library:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    } finally {
      setIsChangingProfilePicture(false);
    }
  };

  const updateProfilePicture = async (imageUri: string) => {
    try {
      if (user && updateUserProfile) {
        setIsLoading(true);
        console.log('📸 Uploading profile image to Supabase Storage...');
        
        // Upload directly to Supabase storage - no fallback to local
        const fileName = `profile-${user.id}-${Date.now()}.jpg`;
        
        const { supabaseService } = await import('../../services/supabaseService');
        const publicUrl = await supabaseService.uploadProfileImageFromUri(user.id, imageUri, fileName);
        
        if (!publicUrl) {
          throw new Error('Failed to upload image to Supabase Storage');
        }
        
        console.log('✅ Image uploaded to Supabase Storage:', publicUrl);
        
        // Update user profile with Supabase Storage URL (with cache busting)
        const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;
        const success = await updateUserProfile({ profileImage: cacheBustedUrl });
        
        if (!success) {
          throw new Error('Failed to update user profile in database');
        }
        
        // Force image refresh
        setImageKey(Date.now());
        
        HapticFeedback.success();
        console.log('✅ Profile picture updated successfully in Supabase');
        Alert.alert('Success', 'Profile picture updated and saved to cloud storage!');
      }
    } catch (error) {
      console.error('❌ Error updating profile picture:', error);
      Alert.alert(
        'Upload Failed', 
        'Failed to upload profile picture to cloud storage. Please check your internet connection and try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotifications = async () => {
    try {
      await notificationService.simulateOrderProgress('TEST-ORDER-123');
      Alert.alert('Test Notifications', 'Order progress notifications scheduled! You should see them over the next 30 seconds.');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule test notifications');
    }
  };


  const handleFeaturePress = (feature: string) => {
    console.log(`Pressed: ${feature}`);
    
    // Handle test notifications
    if (feature === 'Test Notifications') {
      handleTestNotifications();
      return;
    }
    
    
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
      case 'Settings':
        navigation.navigate('Settings');
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
  
  // Auto-refresh company data when component mounts
  useEffect(() => {
    refreshCompanyData();
  }, [user?.id]);

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
    if (!isCompanyUser(user)) {
      return null;
    }

    // Show loading placeholder if company user but no company data
    if (!company) {
      return (
        <View style={styles.modernCompanyCard}>
          <View style={styles.modernCompanyHeader}>
            <View style={styles.modernCompanyIcon}>
              <Ionicons name="business" size={24} color={COLORS.text} />
            </View>
            <View style={styles.modernCompanyInfo}>
              <Text style={styles.modernCompanyName}>Loading Company...</Text>
              <Text style={styles.modernCompanyUEN}>Please wait while we load your company information.</Text>
            </View>
            <TouchableOpacity 
              style={styles.modernExpandButton}
              onPress={refreshCompanyData}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

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

          {/* Company Status Indicator */}
          <View style={styles.companyStatusContainer}>
            <View style={styles.companyStatusItem}>
              <Ionicons 
                name={company.status === 'active' ? 'checkmark-circle' : 'time'} 
                size={20} 
                color={company.status === 'active' ? COLORS.text : COLORS.textSecondary} 
              />
              <Text style={styles.companyStatusText}>
                {company.status === 'active' ? 'Account Active' : 'Account Pending'}
              </Text>
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
        {/* Center-aligned Header */}
        <View style={styles.headerTopRow}>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
        </View>

        {/* Enhanced Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.avatarSection}
            onPress={handleProfilePictureChange}
            activeOpacity={0.8}
            disabled={isChangingProfilePicture}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                {user.profileImage ? (
                  <Image 
                    key={imageKey}
                    source={{ uri: user.profileImage.split('?')[0] }} 
                    style={styles.avatarImage}
                    onError={(error) => {
                      console.log('❌ Image load error:', error.nativeEvent.error);
                      console.log('❌ Failed URL:', user.profileImage);
                    }}
                    onLoad={() => console.log('✅ Image loaded successfully:', user.profileImage)}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </Text>
                  </View>
                )}
                {isChangingProfilePicture && (
                  <View style={styles.avatarLoader}>
                    <ActivityIndicator size="small" color={COLORS.card} />
                  </View>
                )}
              </View>
              <View style={styles.editIndicator}>
                <Ionicons name="camera" size={14} color={COLORS.card} />
              </View>
            </View>
          </TouchableOpacity>
          
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
                <Text style={styles.rewardTier}>{rewardsState.userRewards.tier} Tier</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={handleLogout}
              activeOpacity={0.7}
              disabled={state.loading}
            >
              {state.loading ? (
                <ActivityIndicator size="small" color={COLORS.text} />
              ) : (
                <Ionicons name="log-out-outline" size={22} color={COLORS.text} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleFeaturePress('Order History')}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="receipt-outline" size={18} color={COLORS.text} />
            </View>
            <Text style={styles.quickActionLabel}>Orders</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleFeaturePress('Wishlist')}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="heart-outline" size={18} color={COLORS.text} />
            </View>
            <Text style={styles.quickActionLabel}>Wishlist</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Rewards')}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="gift-outline" size={18} color={COLORS.text} />
            </View>
            <Text style={styles.quickActionLabel}>Rewards</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleFeaturePress('Support')}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="help-circle-outline" size={18} color={COLORS.text} />
            </View>
            <Text style={styles.quickActionLabel}>Support</Text>
          </TouchableOpacity>
          
        </View>

      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
      
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        {/* User Profile Header */}
        {renderUserProfile()}
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >

        {/* Company Section (only for company users) */}
        {renderCompanySection()}

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
    paddingTop: SPACING.md,
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

  // Profile Card (now header)
  profileCard: {
    backgroundColor: 'transparent',
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
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
    marginBottom: SPACING.lg,
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
  avatarLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 32,
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
  contactInfo: {
    flexDirection: 'column',
    gap: 2,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: 6,
  },
  contactIconWrapper: {
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  userEmail: {
    ...TYPOGRAPHY.caption,
    flex: 1,
    color: COLORS.textSecondary,
  },
  userPhone: {
    ...TYPOGRAPHY.small,
    flex: 1,
    color: COLORS.textSecondary,
  },
  professionalInfo: {
    marginTop: SPACING.sm,
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
  headerButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
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
  companyStatusContainer: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  companyStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyStatusText: {
    ...TYPOGRAPHY.body,
    marginLeft: SPACING.xs,
    fontWeight: '500',
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
    paddingBottom: SPACING.sm,
  },


  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    ...SHADOWS.light,
  },
  quickActionLabel: {
    ...TYPOGRAPHY.small,
    fontWeight: '500',
    textAlign: 'center',
    color: COLORS.text,
  },

}); 