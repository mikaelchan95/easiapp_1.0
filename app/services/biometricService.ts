import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  warning?: string;
}

class BiometricService {
  private static readonly BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
  private static readonly STORED_CREDENTIALS_KEY = 'stored_credentials';

  /**
   * Check if the device supports biometric authentication
   */
  async checkBiometricCapabilities(): Promise<BiometricCapabilities> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      console.log('🔐 Biometric capabilities:', {
        hasHardware,
        isEnrolled,
        supportedTypes: supportedTypes.map(type => 
          type === LocalAuthentication.AuthenticationType.FINGERPRINT ? 'Fingerprint' :
          type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION ? 'Face ID' : 'Unknown'
        )
      });

      return {
        hasHardware,
        isEnrolled,
        supportedTypes
      };
    } catch (error) {
      console.error('❌ Error checking biometric capabilities:', error);
      return {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: []
      };
    }
  }

  /**
   * Check if biometric authentication is available on this device
   */
  async isBiometricAvailable(): Promise<boolean> {
    const capabilities = await this.checkBiometricCapabilities();
    return capabilities.hasHardware && capabilities.isEnrolled;
  }

  /**
   * Check if user has enabled biometric authentication for this app
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(BiometricService.BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('❌ Error checking biometric enabled status:', error);
      return false;
    }
  }

  /**
   * Enable or disable biometric authentication for this app
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(BiometricService.BIOMETRIC_ENABLED_KEY, enabled.toString());
      console.log('✅ Biometric authentication', enabled ? 'enabled' : 'disabled');
    } catch (error) {
      console.error('❌ Error setting biometric enabled status:', error);
    }
  }

  /**
   * Store encrypted credentials for biometric authentication
   */
  async storeCredentials(email: string, encryptedData: string): Promise<void> {
    try {
      const credentials = {
        email,
        encryptedData,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(BiometricService.STORED_CREDENTIALS_KEY, JSON.stringify(credentials));
      console.log('✅ Credentials stored for biometric authentication');
    } catch (error) {
      console.error('❌ Error storing credentials:', error);
    }
  }

  /**
   * Get stored credentials for biometric authentication
   */
  async getStoredCredentials(): Promise<{ email: string; encryptedData: string } | null> {
    try {
      const stored = await AsyncStorage.getItem(BiometricService.STORED_CREDENTIALS_KEY);
      if (!stored) return null;
      
      const credentials = JSON.parse(stored);
      return {
        email: credentials.email,
        encryptedData: credentials.encryptedData
      };
    } catch (error) {
      console.error('❌ Error retrieving stored credentials:', error);
      return null;
    }
  }

  /**
   * Clear stored credentials
   */
  async clearStoredCredentials(): Promise<void> {
    try {
      await AsyncStorage.removeItem(BiometricService.STORED_CREDENTIALS_KEY);
      console.log('✅ Stored credentials cleared');
    } catch (error) {
      console.error('❌ Error clearing stored credentials:', error);
    }
  }

  /**
   * Authenticate using biometrics
   */
  async authenticate(promptMessage: string = 'Authenticate to access your account'): Promise<BiometricAuthResult> {
    try {
      // Check if biometric authentication is available
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device'
        };
      }

      // Check if biometric authentication is enabled by user
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        return {
          success: false,
          error: 'Biometric authentication is not enabled'
        };
      }

      // Get supported authentication types for custom prompt
      const capabilities = await this.checkBiometricCapabilities();
      const hasFingerprint = capabilities.supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
      const hasFaceID = capabilities.supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);

      let customPrompt = promptMessage;
      if (hasFaceID) {
        customPrompt = 'Use Face ID to sign in to EASI';
      } else if (hasFingerprint) {
        customPrompt = 'Use your fingerprint to sign in to EASI';
      }

      // Perform biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: customPrompt,
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        console.log('✅ Biometric authentication successful');
        return { success: true };
      } else {
        console.log('❌ Biometric authentication failed:', result.error);
        return {
          success: false,
          error: result.error || 'Authentication failed'
        };
      }
    } catch (error) {
      console.error('❌ Error during biometric authentication:', error);
      return {
        success: false,
        error: 'An error occurred during authentication'
      };
    }
  }

  /**
   * Get a user-friendly name for the biometric authentication type
   */
  async getBiometricTypeName(): Promise<string> {
    const capabilities = await this.checkBiometricCapabilities();
    
    if (capabilities.supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    } else if (capabilities.supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Fingerprint';
    } else {
      return 'Biometric Authentication';
    }
  }

  /**
   * Setup biometric authentication for a user
   */
  async setupBiometricAuth(email: string): Promise<BiometricAuthResult> {
    try {
      // Check if biometric authentication is available
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device'
        };
      }

      // Test biometric authentication
      const authResult = await this.authenticate('Set up biometric authentication for EASI');
      if (!authResult.success) {
        return authResult;
      }

      // Store the email for future biometric logins
      await this.storeCredentials(email, email); // In a real app, you'd store encrypted session data
      await this.setBiometricEnabled(true);

      return { success: true };
    } catch (error) {
      console.error('❌ Error setting up biometric authentication:', error);
      return {
        success: false,
        error: 'Failed to set up biometric authentication'
      };
    }
  }
}

export const biometricService = new BiometricService();