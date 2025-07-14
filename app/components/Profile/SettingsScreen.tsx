import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { AppContext } from '../../context/AppContext';
import { HapticFeedback } from '../../utils/haptics';
import { biometricService } from '../../services/biometricService';
import BiometricSettings from '../Settings/BiometricSettings';

interface UserSettings {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Notification Preferences
  pushNotifications: boolean;
  emailNotifications: boolean;
  orderUpdates: boolean;
  promotionalEmails: boolean;
  smsNotifications: boolean;

  // App Preferences
  darkMode: boolean;
  language: string;
  currency: string;
  defaultView: 'grid' | 'list';

  // Privacy & Security
  profileVisibility: 'public' | 'private';
  shareDataForAnalytics: boolean;
  twoFactorAuth: boolean;
  biometricAuth: boolean;

  // Delivery Preferences
  defaultDeliveryAddress: string;
  preferredDeliveryTime: string;
  deliveryInstructions: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  pushNotifications: true,
  emailNotifications: true,
  orderUpdates: true,
  promotionalEmails: false,
  smsNotifications: false,
  darkMode: false,
  language: 'English',
  currency: 'SGD',
  defaultView: 'grid',
  profileVisibility: 'private',
  shareDataForAnalytics: false,
  twoFactorAuth: false,
  biometricAuth: false,
  defaultDeliveryAddress: '',
  preferredDeliveryTime: 'Any time',
  deliveryInstructions: '',
};

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useContext(AppContext);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // State
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'personal',
  ]);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricTypeName, setBiometricTypeName] = useState(
    'Biometric Authentication'
  );

  useEffect(() => {
    // Load user settings from context or storage
    loadUserSettings();

    // Check biometric availability
    checkBiometricAvailability();

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadUserSettings = async () => {
    try {
      // Start with default settings merged with context settings
      let initialSettings = { ...DEFAULT_SETTINGS, ...state.userSettings };

      // If user is logged in, populate with user data
      if (state.user) {
        initialSettings = {
          ...initialSettings,
          firstName: state.user?.name?.split(' ')[0] || '',
          lastName: state.user?.name?.split(' ').slice(1).join(' ') || '',
          email: state.user?.email || '',
          phone: state.user?.phone || '',
        };
      }

      // Load saved settings from AsyncStorage
      try {
        const savedSettings = await AsyncStorage.getItem('userSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          initialSettings = { ...initialSettings, ...parsedSettings };
        }
      } catch (storageError) {
        console.log('No saved settings found, using defaults');
      }

      setSettings(initialSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const checkBiometricAvailability = async () => {
    try {
      const isAvailable = await biometricService.isBiometricAvailable();
      const isEnabled = await biometricService.isBiometricEnabled();
      const typeName = await biometricService.getBiometricTypeName();

      setBiometricAvailable(isAvailable);
      setBiometricTypeName(typeName);

      // Update settings with current biometric status
      setSettings(prev => ({ ...prev, biometricAuth: isEnabled }));

      console.log('🔐 Biometric availability in settings:', {
        isAvailable,
        isEnabled,
        typeName,
      });
    } catch (error) {
      console.error('❌ Error checking biometric availability:', error);
    }
  };

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    HapticFeedback.light();
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled) {
      // Enable biometric authentication
      try {
        if (!state.user?.email) {
          Alert.alert(
            'Error',
            'Unable to set up biometric authentication. Please try signing in again.'
          );
          return;
        }

        const setupResult = await biometricService.setupBiometricAuth(
          state.user.email
        );
        if (setupResult.success) {
          handleSettingChange('biometricAuth', true);
          Alert.alert(
            'Success',
            `${biometricTypeName} has been enabled successfully!`
          );
        } else {
          Alert.alert(
            'Setup Failed',
            setupResult.error || 'Failed to enable biometric authentication.'
          );
        }
      } catch (error) {
        console.error('❌ Error enabling biometric authentication:', error);
        Alert.alert(
          'Error',
          'An unexpected error occurred while enabling biometric authentication.'
        );
      }
    } else {
      // Disable biometric authentication
      Alert.alert(
        'Disable Biometric Authentication',
        `Are you sure you want to disable ${biometricTypeName}? You'll need to use your email and password to sign in.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              try {
                await biometricService.setBiometricEnabled(false);
                await biometricService.clearStoredCredentials();
                handleSettingChange('biometricAuth', false);
                Alert.alert(
                  'Disabled',
                  `${biometricTypeName} has been disabled.`
                );
              } catch (error) {
                console.error(
                  '❌ Error disabling biometric authentication:',
                  error
                );
                Alert.alert(
                  'Error',
                  'An error occurred while disabling biometric authentication.'
                );
              }
            },
          },
        ]
      );
    }
  };

  const handleSaveSettings = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    HapticFeedback.medium();

    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));

      // Update context state
      dispatch({
        type: 'SAVE_USER_SETTINGS',
        payload: settings,
      });

      // Update user profile if personal info changed
      if (
        settings.firstName ||
        settings.lastName ||
        settings.email ||
        settings.phone
      ) {
        dispatch({
          type: 'UPDATE_USER_PROFILE',
          payload: {
            name: `${settings.firstName} ${settings.lastName}`.trim(),
            email: settings.email,
            phone: settings.phone,
          },
        });
      }

      setHasChanges(false);
      Alert.alert('Success', 'Your settings have been saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const renderSettingItem = (
    title: string,
    value: any,
    onValueChange: (value: any) => void,
    type: 'text' | 'switch' | 'select' = 'text',
    placeholder?: string,
    options?: string[]
  ) => (
    <View style={styles.settingItem}>
      <Text style={styles.settingLabel}>{title}</Text>
      {type === 'text' && (
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onValueChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
        />
      )}
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: COLORS.border, true: COLORS.primary + '40' }}
          thumbColor={value ? COLORS.primary : COLORS.card}
        />
      )}
      {type === 'select' && options && (
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => {
            // Show picker modal for options
            Alert.alert(
              'Select ' + title,
              '',
              options.map(option => ({
                text: option,
                onPress: () => onValueChange(option),
              }))
            );
          }}
        >
          <Text style={styles.selectText}>{value}</Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSection = (
    title: string,
    icon: string,
    sectionKey: string,
    children: React.ReactNode
  ) => {
    const isExpanded = expandedSections.includes(sectionKey);

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(sectionKey)}
        >
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name={icon as any} size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View style={styles.sectionContent}>
            {children}
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Customize your app experience
          </Text>
        </View>

        {hasChanges && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : (
              <Ionicons name="checkmark" size={20} color={COLORS.accent} />
            )}
          </TouchableOpacity>
        )}
      </Animated.View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Personal Information */}
          {renderSection(
            'Personal Information',
            'person-outline',
            'personal',
            <>
              {renderSettingItem(
                'First Name',
                settings.firstName,
                value => handleSettingChange('firstName', value),
                'text',
                'Enter your first name'
              )}
              {renderSettingItem(
                'Last Name',
                settings.lastName,
                value => handleSettingChange('lastName', value),
                'text',
                'Enter your last name'
              )}
              {renderSettingItem(
                'Email',
                settings.email,
                value => handleSettingChange('email', value),
                'text',
                'Enter your email address'
              )}
              {renderSettingItem(
                'Phone',
                settings.phone,
                value => handleSettingChange('phone', value),
                'text',
                'Enter your phone number'
              )}
            </>
          )}

          {/* Notifications */}
          {renderSection(
            'Notifications',
            'notifications-outline',
            'notifications',
            <>
              {renderSettingItem(
                'Push Notifications',
                settings.pushNotifications,
                value => handleSettingChange('pushNotifications', value),
                'switch'
              )}
              {renderSettingItem(
                'Email Notifications',
                settings.emailNotifications,
                value => handleSettingChange('emailNotifications', value),
                'switch'
              )}
              {renderSettingItem(
                'Order Updates',
                settings.orderUpdates,
                value => handleSettingChange('orderUpdates', value),
                'switch'
              )}
              {renderSettingItem(
                'Promotional Emails',
                settings.promotionalEmails,
                value => handleSettingChange('promotionalEmails', value),
                'switch'
              )}
              {renderSettingItem(
                'SMS Notifications',
                settings.smsNotifications,
                value => handleSettingChange('smsNotifications', value),
                'switch'
              )}
            </>
          )}

          {/* App Preferences */}
          {renderSection(
            'App Preferences',
            'settings-outline',
            'preferences',
            <>
              {renderSettingItem(
                'Dark Mode',
                settings.darkMode,
                value => handleSettingChange('darkMode', value),
                'switch'
              )}
              {renderSettingItem(
                'Language',
                settings.language,
                value => handleSettingChange('language', value),
                'select',
                undefined,
                ['English', 'Chinese', 'Malay', 'Tamil']
              )}
              {renderSettingItem(
                'Currency',
                settings.currency,
                value => handleSettingChange('currency', value),
                'select',
                undefined,
                ['SGD', 'USD', 'EUR', 'GBP']
              )}
              {renderSettingItem(
                'Default View',
                settings.defaultView,
                value => handleSettingChange('defaultView', value),
                'select',
                undefined,
                ['grid', 'list']
              )}
            </>
          )}

          {/* Privacy & Security */}
          {renderSection(
            'Privacy & Security',
            'shield-outline',
            'privacy',
            <>
              {renderSettingItem(
                'Profile Visibility',
                settings.profileVisibility,
                value => handleSettingChange('profileVisibility', value),
                'select',
                undefined,
                ['public', 'private']
              )}
              {renderSettingItem(
                'Share Data for Analytics',
                settings.shareDataForAnalytics,
                value => handleSettingChange('shareDataForAnalytics', value),
                'switch'
              )}
              {renderSettingItem(
                'Two-Factor Authentication',
                settings.twoFactorAuth,
                value => handleSettingChange('twoFactorAuth', value),
                'switch'
              )}
              <View style={styles.biometricContainer}>
                <BiometricSettings
                  userEmail={state.user?.email}
                  onBiometricEnabledChange={enabled =>
                    handleSettingChange('biometricAuth', enabled)
                  }
                />
              </View>
            </>
          )}

          {/* Delivery Preferences */}
          {renderSection(
            'Delivery Preferences',
            'location-outline',
            'delivery',
            <>
              {renderSettingItem(
                'Default Delivery Address',
                settings.defaultDeliveryAddress,
                value => handleSettingChange('defaultDeliveryAddress', value),
                'text',
                'Enter your default address'
              )}
              {renderSettingItem(
                'Preferred Delivery Time',
                settings.preferredDeliveryTime,
                value => handleSettingChange('preferredDeliveryTime', value),
                'select',
                undefined,
                [
                  'Any time',
                  'Morning (9am-12pm)',
                  'Afternoon (12pm-6pm)',
                  'Evening (6pm-9pm)',
                ]
              )}
              {renderSettingItem(
                'Delivery Instructions',
                settings.deliveryInstructions,
                value => handleSettingChange('deliveryInstructions', value),
                'text',
                'Special delivery instructions'
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Floating Save Button */}
      {hasChanges && (
        <Animated.View
          style={[styles.floatingSaveButton, { opacity: fadeAnim }]}
        >
          <TouchableOpacity
            style={styles.saveButtonMain}
            onPress={handleSaveSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <ActivityIndicator size="small" color={COLORS.accent} />
                <Text style={styles.saveButtonText}>Saving...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color={COLORS.accent} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.light,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginLeft: SPACING.md,
    fontWeight: '600',
  },
  sectionContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
    fontWeight: '500',
  },
  textInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 150,
    textAlign: 'right',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 120,
  },
  selectText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
    marginRight: SPACING.xs,
  },
  floatingSaveButton: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: SPACING.lg,
    right: SPACING.lg,
  },
  saveButtonMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: 16,
    ...SHADOWS.medium,
  },
  saveButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.accent,
    marginLeft: SPACING.sm,
    fontWeight: '600',
  },
  biometricContainer: {
    marginVertical: SPACING.md,
    paddingHorizontal: 0,
  },
});
