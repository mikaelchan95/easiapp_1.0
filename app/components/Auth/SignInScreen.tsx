import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../../context/AppContext';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { supabase } from '../../config/supabase';
import { biometricService } from '../../services/biometricService';

interface SignInScreenProps {
  onSignUp: () => void;
  onForgotPassword: () => void;
  onSuccess: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onSignUp,
  onForgotPassword,
  onSuccess,
}) => {
  const { signIn, state } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricTypeName, setBiometricTypeName] = useState(
    'Biometric Authentication'
  );

  // Check biometric availability on component mount
  useEffect(() => {
    const checkBiometricAvailability = async () => {
      try {
        const isAvailable = await biometricService.isBiometricAvailable();
        const isEnabled = await biometricService.isBiometricEnabled();
        const typeName = await biometricService.getBiometricTypeName();

        setBiometricAvailable(isAvailable);
        setBiometricEnabled(isEnabled);
        setBiometricTypeName(typeName);

        console.log('🔐 Biometric status:', {
          isAvailable,
          isEnabled,
          typeName,
        });
      } catch (error) {
        console.error('❌ Error checking biometric availability:', error);
      }
    };

    checkBiometricAvailability();
  }, []);

  // Clear loading state when user is successfully set
  React.useEffect(() => {
    if (state.user && isLoading) {
      console.log('🔄 User detected in SignInScreen, clearing loading state');
      setIsLoading(false);
    }
  }, [state.user, isLoading]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignIn = async () => {
    // Prevent multiple submissions
    if (isLoading) {
      console.log('🔄 Sign in already in progress, ignoring duplicate request');
      return;
    }

    // Validation
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Attempting sign in with AppContext signIn method...');

      // Use AppContext signIn method instead of direct Supabase call
      const user = await signIn(email.toLowerCase().trim(), password);

      if (user) {
        console.log('✅ SignIn successful via AppContext:', user.email);
        console.log('Auth success - user loaded, authentication complete');

        // Set up biometric authentication if available but not enabled
        if (biometricAvailable && !biometricEnabled) {
          try {
            await biometricService.storeCredentials(email, email);
            console.log(
              '✅ Credentials stored for future biometric authentication'
            );
          } catch (error) {
            console.error(
              '❌ Failed to store credentials for biometric auth:',
              error
            );
          }
        }

        // Clear local loading state - auth state listener will handle navigation
        setIsLoading(false);
      } else {
        console.error('❌ SignIn failed via AppContext');
        Alert.alert(
          'Sign In Failed',
          'Invalid email or password. Please check your credentials.'
        );
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      Alert.alert(
        'Sign In Error',
        'An unexpected error occurred. Please try again.'
      );
      setIsLoading(false);
    }
  };

  const handleBiometricSignIn = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // Check if biometric auth is available and enabled
      if (!biometricAvailable || !biometricEnabled) {
        Alert.alert(
          'Biometric Authentication Unavailable',
          'Please set up biometric authentication first or use your email and password.'
        );
        setIsLoading(false);
        return;
      }

      // Get stored credentials
      const storedCredentials = await biometricService.getStoredCredentials();
      if (!storedCredentials) {
        Alert.alert(
          'No Stored Credentials',
          'Please sign in with your email and password first to enable biometric authentication.'
        );
        setIsLoading(false);
        return;
      }

      // Authenticate with biometrics
      const authResult = await biometricService.authenticate();
      if (!authResult.success) {
        console.log('❌ Biometric authentication failed:', authResult.error);
        setIsLoading(false);
        return;
      }

      // Sign in with stored credentials
      console.log('🔐 Biometric authentication successful, signing in...');

      // For demo purposes, we'll use the stored email to sign in
      // In a real app, you'd store and decrypt the full authentication token
      const user = await signIn(storedCredentials.email, 'demo_password');

      if (user) {
        console.log('✅ Biometric sign-in successful');
        setIsLoading(false);
      } else {
        console.error('❌ Biometric sign-in failed');
        Alert.alert(
          'Sign In Failed',
          'Biometric authentication succeeded but sign-in failed. Please try again.'
        );
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Biometric sign-in error:', error);
      Alert.alert(
        'Biometric Sign In Error',
        'An unexpected error occurred. Please try again.'
      );
      setIsLoading(false);
    }
  };

  const handleSetupBiometric = async () => {
    if (!email || !password) {
      Alert.alert(
        'Setup Required',
        'Please enter your email and password first, then sign in successfully before setting up biometric authentication.'
      );
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      const setupResult = await biometricService.setupBiometricAuth(email);
      if (setupResult.success) {
        setBiometricEnabled(true);
        Alert.alert(
          'Success',
          `${biometricTypeName} has been set up successfully! You can now use it to sign in.`
        );
      } else {
        Alert.alert(
          'Setup Failed',
          setupResult.error || 'Failed to set up biometric authentication.'
        );
      }
    } catch (error) {
      console.error('❌ Error setting up biometric authentication:', error);
      Alert.alert(
        'Setup Error',
        'An unexpected error occurred while setting up biometric authentication.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="wine" size={32} color={COLORS.text} />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your EASI account</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={onForgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.disabledButton]}
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.card} />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Biometric Authentication */}
            {biometricAvailable && (
              <View style={styles.biometricContainer}>
                {biometricEnabled ? (
                  <TouchableOpacity
                    style={styles.biometricButton}
                    onPress={handleBiometricSignIn}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={
                        biometricTypeName === 'Face ID'
                          ? 'face-id'
                          : 'finger-print'
                      }
                      size={24}
                      color={COLORS.text}
                      style={styles.biometricIcon}
                    />
                    <Text style={styles.biometricButtonText}>
                      Sign in with {biometricTypeName}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.biometricSetupButton}
                    onPress={handleSetupBiometric}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="settings-outline"
                      size={20}
                      color={COLORS.textSecondary}
                      style={styles.biometricIcon}
                    />
                    <Text style={styles.biometricSetupButtonText}>
                      Set up {biometricTypeName}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign Up Link */}
            <TouchableOpacity
              style={styles.signUpLink}
              onPress={onSignUp}
              disabled={isLoading}
            >
              <Text style={styles.signUpLinkText}>
                Don't have an account?{' '}
                <Text style={styles.signUpLinkTextBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
  },
  title: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginTop: SPACING.lg,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    color: COLORS.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 56,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    height: '100%',
  },
  passwordToggle: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: COLORS.text,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signInButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.card,
    fontWeight: '600',
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.md,
  },
  signUpLink: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  signUpLinkText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  signUpLinkTextBold: {
    fontWeight: '600',
    color: COLORS.text,
  },
  biometricContainer: {
    marginTop: SPACING.md,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.text,
    ...SHADOWS.light,
  },
  biometricSetupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    borderStyle: 'dashed',
  },
  biometricIcon: {
    marginRight: SPACING.sm,
  },
  biometricButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  biometricSetupButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
