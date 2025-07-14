import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';

const BIOMETRIC_SETTINGS_KEY = '@easiapp_biometric_settings';

interface BiometricSetting {
  enabled: boolean;
  type: 'fingerprint' | 'face' | 'none';
  lastUpdated: string;
}

export const BiometricSettings: React.FC = () => {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face' | 'none'>('none');
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBiometricAvailability();
    loadBiometricSettings();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (compatible) {
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (enrolled) {
          const authTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
          
          if (authTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('face');
            setBiometricAvailable(true);
          } else if (authTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('fingerprint');
            setBiometricAvailable(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  const loadBiometricSettings = async () => {
    try {
      const settingsJson = await AsyncStorage.getItem(BIOMETRIC_SETTINGS_KEY);
      if (settingsJson) {
        const settings: BiometricSetting = JSON.parse(settingsJson);
        setIsEnabled(settings.enabled);
      }
    } catch (error) {
      console.error('Error loading biometric settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBiometricSettings = async (enabled: boolean) => {
    try {
      const settings: BiometricSetting = {
        enabled,
        type: biometricType,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(BIOMETRIC_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving biometric settings:', error);
    }
  };

  const handleToggleBiometric = async (value: boolean) => {
    if (value && biometricAvailable) {
      // Authenticate before enabling
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to enable biometric login',
          fallbackLabel: 'Use Passcode',
          cancelLabel: 'Cancel',
        });

        if (result.success) {
          setIsEnabled(true);
          await saveBiometricSettings(true);
        } else {
          Alert.alert(
            'Authentication Failed',
            'Please try again to enable biometric authentication.'
          );
        }
      } catch (error) {
        console.error('Authentication error:', error);
        Alert.alert('Error', 'Failed to authenticate. Please try again.');
      }
    } else {
      // Disable biometric
      setIsEnabled(false);
      await saveBiometricSettings(false);
    }
  };

  const testBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Test biometric authentication',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        Alert.alert('Success', 'Biometric authentication works correctly!');
      } else {
        Alert.alert('Failed', 'Biometric authentication was not successful.');
      }
    } catch (error) {
      console.error('Test authentication error:', error);
      Alert.alert('Error', 'Failed to test biometric authentication.');
    }
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'face':
        return 'happy-outline'; // Use a valid Ionicons name
      case 'fingerprint':
        return 'finger-print';
      default:
        return 'shield-checkmark-outline';
    }
  };

  const getBiometricName = () => {
    switch (biometricType) {
      case 'face':
        return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
      case 'fingerprint':
        return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
      default:
        return 'Biometric Authentication';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Loading biometric settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons 
          name={getBiometricIcon()} 
          size={32} 
          color={COLORS.primary} 
        />
        <Text style={styles.title}>Biometric Authentication</Text>
      </View>

      {biometricAvailable ? (
        <>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Enable {getBiometricName()}</Text>
                <Text style={styles.settingDescription}>
                  Use {getBiometricName().toLowerCase()} to quickly sign in to your account
                </Text>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={handleToggleBiometric}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.card}
                ios_backgroundColor={COLORS.border}
              />
            </View>
          </View>

          {isEnabled && (
            <TouchableOpacity style={styles.testButton} onPress={testBiometric}>
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.testButtonText}>Test {getBiometricName()}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              Your biometric data is stored securely on your device and never leaves it.
              We only receive a success or failure response when you authenticate.
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.unavailableCard}>
          <Ionicons name="lock-closed-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.unavailableTitle}>Biometric Authentication Unavailable</Text>
          <Text style={styles.unavailableText}>
            {Platform.OS === 'ios'
              ? 'Please enable Face ID or Touch ID in your device settings and try again.'
              : 'Please set up fingerprint or face recognition in your device settings and try again.'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.md,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 8,
    ...SHADOWS.light,
  },
  testButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: COLORS.infoBackground,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  unavailableCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  unavailableTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  unavailableText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.xxl,
    ...SHADOWS.light,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
});