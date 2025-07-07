import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';

export type StatusType = 'loading' | 'success' | 'error' | 'warning' | 'info';

interface StatusFeedbackProps {
  type: StatusType;
  message: string;
  visible: boolean;
  duration?: number; // Auto-hide duration in ms
  onDismiss?: () => void;
  showIcon?: boolean;
  compact?: boolean;
}

const StatusFeedback: React.FC<StatusFeedbackProps> = ({
  type,
  message,
  visible,
  duration = 3000,
  onDismiss,
  showIcon = true,
  compact = false
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 300,
          friction: 20,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 20,
          useNativeDriver: true,
        })
      ]).start();

      // Auto-hide after duration (except for loading)
      if (type !== 'loading' && duration > 0) {
        const timer = setTimeout(() => {
          hideStatus();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      hideStatus();
    }
  }, [visible, type, duration]);

  const hideStatus = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      onDismiss?.();
    });
  };

  const getStatusConfig = () => {
    switch (type) {
      case 'loading':
        return {
          backgroundColor: COLORS.primary,
          icon: null,
          iconColor: COLORS.accent,
          textColor: COLORS.accent,
        };
      case 'success':
        return {
          backgroundColor: COLORS.success,
          icon: 'checkmark-circle',
          iconColor: COLORS.accent,
          textColor: COLORS.accent,
        };
      case 'error':
        return {
          backgroundColor: COLORS.error,
          icon: 'close-circle',
          iconColor: COLORS.accent,
          textColor: COLORS.accent,
        };
      case 'warning':
        return {
          backgroundColor: '#FF9500',
          icon: 'warning',
          iconColor: COLORS.accent,
          textColor: COLORS.accent,
        };
      case 'info':
        return {
          backgroundColor: '#007AFF',
          icon: 'information-circle',
          iconColor: COLORS.accent,
          textColor: COLORS.accent,
        };
      default:
        return {
          backgroundColor: COLORS.primary,
          icon: 'information-circle',
          iconColor: COLORS.accent,
          textColor: COLORS.accent,
        };
    }
  };

  const config = getStatusConfig();

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        compact ? styles.compactContainer : styles.fullContainer,
        {
          backgroundColor: config.backgroundColor,
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      <View style={styles.content}>
        {showIcon && (
          <View style={styles.iconContainer}>
            {type === 'loading' ? (
              <ActivityIndicator size="small" color={config.iconColor} />
            ) : (
              <Ionicons 
                name={config.icon as any} 
                size={compact ? 16 : 20} 
                color={config.iconColor} 
              />
            )}
          </View>
        )}
        
        <Text 
          style={[
            compact ? styles.compactText : styles.text,
            { color: config.textColor }
          ]}
          numberOfLines={compact ? 1 : 2}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    ...SHADOWS.medium,
    overflow: 'hidden',
  },
  fullContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
  },
  compactContainer: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginHorizontal: SPACING.sm,
    marginVertical: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: SPACING.sm,
    width: 20,
    alignItems: 'center',
  },
  text: {
    ...TYPOGRAPHY.button,
    fontWeight: '600',
    flex: 1,
  },
  compactText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    flex: 1,
  },
});

export default StatusFeedback; 