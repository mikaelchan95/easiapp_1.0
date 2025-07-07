import React, { useRef, useState } from 'react';
import {
  TouchableWithoutFeedback,
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
  StyleProp
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../utils/theme';
import * as Animations from '../../utils/animations';

interface AnimatedButtonProps {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: string;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  iconColor?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  success?: boolean;
  successText?: string;
  type?: 'primary' | 'secondary' | 'outline' | 'danger';
  fullWidth?: boolean;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  label,
  onPress,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  iconSize = 20,
  iconColor,
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  success = false,
  successText = 'Success!',
  type = 'primary',
  fullWidth = false
}) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const loadingSpinValue = useRef(new Animated.Value(0)).current;
  
  // State for button press tracking
  const [isPressed, setIsPressed] = useState(false);
  
  // Handle press in animation
  const handlePressIn = () => {
    if (disabled || loading) return;
    
    setIsPressed(true);
    Animations.pressFeedback(scaleAnim).start();
    Animated.timing(opacityAnim, {
      toValue: 0.9,
      duration: 150,
      useNativeDriver: true
    }).start();
  };
  
  // Handle press out animation
  const handlePressOut = () => {
    if (disabled || loading) return;
    
    setIsPressed(false);
    Animations.releaseFeedback(scaleAnim).start();
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true
    }).start();
  };
  
  // Handle button press
  const handlePress = () => {
    if (disabled || loading) return;
    
    // Add a subtle bounce effect on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true
      })
    ]).start();
    
    // Call the provided onPress handler
    onPress();
  };
  
  // Start loading spinner animation
  React.useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(loadingSpinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Animations.TIMING.easeInOut
        })
      ).start();
    } else {
      loadingSpinValue.setValue(0);
    }
  }, [loading]);
  
  // Get button style based on type
  const getButtonStyle = () => {
    switch (type) {
      case 'primary':
        return styles.primaryButton;
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      case 'danger':
        return styles.dangerButton;
      default:
        return styles.primaryButton;
    }
  };
  
  // Get text style based on type
  const getTextStyle = () => {
    switch (type) {
      case 'primary':
        return styles.primaryText;
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'danger':
        return styles.dangerText;
      default:
        return styles.primaryText;
    }
  };
  
  // Get icon color based on type
  const getIconColor = () => {
    if (iconColor) return iconColor;
    
    switch (type) {
      case 'primary':
        return COLORS.accent;
      case 'secondary':
        return COLORS.accent;
      case 'outline':
        return COLORS.primary;
      case 'danger':
        return COLORS.accent;
      default:
        return COLORS.accent;
    }
  };
  
  // Render loading spinner
  const renderLoadingSpinner = () => {
    const spin = loadingSpinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
    });
    
    return (
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <View style={styles.loadingCircle} />
      </Animated.View>
    );
  };
  
  // Render success icon
  const renderSuccessIcon = () => {
    return <Ionicons name="checkmark-circle" size={iconSize} color={getIconColor()} />;
  };
  
  // Render button content based on state
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.contentContainer}>
          {renderLoadingSpinner()}
          <Text style={[getTextStyle(), textStyle, styles.contentText]}>{loadingText}</Text>
        </View>
      );
    }
    
    if (success) {
      return (
        <View style={styles.contentContainer}>
          {renderSuccessIcon()}
          <Text style={[getTextStyle(), textStyle, styles.contentText]}>{successText}</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.contentContainer}>
        {icon && iconPosition === 'left' && (
          <Ionicons name={icon as any} size={iconSize} color={getIconColor()} style={styles.iconLeft} />
        )}
        <Text style={[getTextStyle(), textStyle]}>{label}</Text>
        {icon && iconPosition === 'right' && (
          <Ionicons name={icon as any} size={iconSize} color={getIconColor()} style={styles.iconRight} />
        )}
      </View>
    );
  };
  
  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      <Animated.View 
        style={[
          styles.button,
          getButtonStyle(),
          {
            transform: [{ scale: scaleAnim }],
            opacity: disabled ? 0.6 : opacityAnim
          },
          fullWidth && styles.fullWidth,
          disabled && styles.disabledButton,
          style
        ]}
      >
        {renderContent()}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  fullWidth: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: '#444',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  dangerButton: {
    backgroundColor: '#D32F2F',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  primaryText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  outlineText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  dangerText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentText: {
    marginLeft: 8,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  loadingCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderTopColor: COLORS.accent,
    marginRight: 8,
  }
});

export default AnimatedButton; 