import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { useAppContext } from '../../context/AppContext';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { User } from '../../types/user';

interface SignUpScreenProps {
  onSignIn: () => void;
  onSuccess: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onSignIn,
  onSuccess,
}) => {
  const { signUp, state } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    accountType: 'individual' as 'individual' | 'company',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (!formData.agreeToTerms) {
      Alert.alert('Error', 'Please agree to the terms and conditions');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      const userData: Partial<User> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        accountType: formData.accountType,
      };

      // If company account, add additional company setup data
      if (formData.accountType === 'company') {
        // First user of a company becomes the admin
        userData.role = 'admin';
        userData.permissions = {
          canCreateOrders: true,
          canApproveOrders: true,
          canViewAllOrders: true,
          canManageUsers: true,
          canInviteUsers: true,
          canSetPermissions: true,
          canEditCompanyInfo: true,
          canManageBilling: true,
          canViewReports: true,
          canViewTradePrice: true,
          canAccessExclusiveProducts: true,
        };
      }

      const user = await signUp(
        formData.email.trim(),
        formData.password,
        userData
      );

      if (user) {
        Alert.alert(
          'Success',
          formData.accountType === 'company'
            ? 'Company account created successfully! You are now the admin. Please check your email to verify your account.'
            : 'Account created successfully! Please check your email to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => {
                console.log(
                  'Sign up success - waiting for user to be set in context'
                );
                // Let the auth state listener handle the transition
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to create account. Please try again.');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert(
        'Error',
        'An error occurred while creating your account. Please try again.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join EasiApp today</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={value => updateFormData('name', value)}
              placeholder="Enter your full name"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={value => updateFormData('email', value)}
              placeholder="Enter your email"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={value => updateFormData('phone', value)}
              placeholder="Enter your phone number"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="phone-pad"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.password}
                onChangeText={value => updateFormData('password', value)}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.showPasswordText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.confirmPassword}
                onChangeText={value => updateFormData('confirmPassword', value)}
                placeholder="Confirm your password"
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.showPasswordText}>
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.accountTypeContainer}>
            <Text style={styles.label}>Account Type</Text>
            <View style={styles.accountTypeOptions}>
              <TouchableOpacity
                style={[
                  styles.accountTypeOption,
                  formData.accountType === 'individual' &&
                    styles.accountTypeOptionSelected,
                ]}
                onPress={() => updateFormData('accountType', 'individual')}
              >
                <Text
                  style={[
                    styles.accountTypeText,
                    formData.accountType === 'individual' &&
                      styles.accountTypeTextSelected,
                  ]}
                >
                  Individual
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.accountTypeOption,
                  formData.accountType === 'company' &&
                    styles.accountTypeOptionSelected,
                ]}
                onPress={() => updateFormData('accountType', 'company')}
              >
                <Text
                  style={[
                    styles.accountTypeText,
                    formData.accountType === 'company' &&
                      styles.accountTypeTextSelected,
                  ]}
                >
                  Company
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.termsContainer}>
            <Switch
              value={formData.agreeToTerms}
              onValueChange={value => updateFormData('agreeToTerms', value)}
              trackColor={{ false: COLORS.border, true: COLORS.text }}
              thumbColor={COLORS.card}
            />
            <Text style={styles.termsText}>
              I agree to the Terms of Service and Privacy Policy
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.signUpButton,
              state.loading && styles.disabledButton,
            ]}
            onPress={handleSignUp}
            disabled={state.loading}
          >
            <Text style={styles.signUpButtonText}>
              {state.loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={onSignIn}>
              <Text style={styles.signInLink}>Sign In</Text>
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
    padding: SPACING.xl,
  },
  formContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.xl,
    ...SHADOWS.medium,
  },
  title: {
    ...TYPOGRAPHY.h1,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
  },
  showPasswordButton: {
    padding: SPACING.md,
  },
  showPasswordText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  accountTypeContainer: {
    marginBottom: SPACING.lg,
  },
  accountTypeOptions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  accountTypeOption: {
    flex: 1,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  accountTypeOptionSelected: {
    borderColor: COLORS.text,
    backgroundColor: COLORS.text,
  },
  accountTypeText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  accountTypeTextSelected: {
    color: COLORS.card,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  termsText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  signUpButton: {
    backgroundColor: COLORS.text,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: COLORS.card,
    fontSize: 18,
    fontWeight: 'bold',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signInText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  signInLink: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
