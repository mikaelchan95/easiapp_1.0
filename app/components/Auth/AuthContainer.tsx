import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SignInScreen } from './SignInScreen';
import { SignUpScreen } from './SignUpScreen';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';
import { useAppContext } from '../../context/AppContext';

type AuthScreenType = 'signin' | 'signup' | 'forgot-password';

interface AuthContainerProps {
  onAuthSuccess: () => void;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({ onAuthSuccess }) => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreenType>('signin');
  const { isAuthenticated } = useAppContext();

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (authenticated) {
        // Don't call onAuthSuccess here - let the auth state listener handle it
        console.log('✅ User already authenticated, letting auth state listener handle transition');
      }
    };
    
    checkAuth();
  }, []);

  const handleSignUp = () => setCurrentScreen('signup');
  const handleSignIn = () => setCurrentScreen('signin');
  const handleForgotPassword = () => setCurrentScreen('forgot-password');
  const handleBack = () => setCurrentScreen('signin');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'signin':
        return (
          <SignInScreen
            onSignUp={handleSignUp}
            onForgotPassword={handleForgotPassword}
            onSuccess={onAuthSuccess}
          />
        );
      case 'signup':
        return (
          <SignUpScreen
            onSignIn={handleSignIn}
            onSuccess={onAuthSuccess}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordScreen
            onBack={handleBack}
          />
        );
      default:
        return (
          <SignInScreen
            onSignUp={handleSignUp}
            onForgotPassword={handleForgotPassword}
            onSuccess={onAuthSuccess}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});