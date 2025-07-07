import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
  StyleProp,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS, SPACING } from '../../utils/theme';
import * as Animations from '../../utils/animations';

interface OneTapBuyProps {
  productId: string;
  productName: string;
  price: number;
  style?: StyleProp<ViewStyle>;
  onSuccess?: () => void;
}

const { width } = Dimensions.get('window');

const OneTapBuy: React.FC<OneTapBuyProps> = ({
  productId,
  productName,
  price,
  style,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<'initial' | 'confirm' | 'processing' | 'success'>('initial');
  const navigation = useNavigation();
  
  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  
  // Handle initial tap - move to confirm state
  const handleTap = () => {
    if (currentStep === 'initial') {
      // Animate button press
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
          easing: Animations.TIMING.easeOut
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 300,
          useNativeDriver: true
        })
      ]).start();
      
      setCurrentStep('confirm');
    }
  };
  
  // Handle confirm tap - initiate purchase
  const handleConfirm = () => {
    if (currentStep === 'confirm') {
      setCurrentStep('processing');
      
      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
        easing: Animations.TIMING.easeInOut
      }).start(({ finished }) => {
        if (finished) {
          setCurrentStep('success');
          
          // Show success animation
          Animated.sequence([
            Animated.timing(successAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
              easing: Animations.TIMING.easeOut
            }),
            Animated.delay(1500)
          ]).start(() => {
            // Navigate to cart or order confirmation
            if (onSuccess) onSuccess();
            navigation.navigate('Checkout');
          });
        }
      });
    }
  };
  
  // Handle cancel tap - reset to initial state
  const handleCancel = () => {
    if (currentStep === 'confirm') {
      setCurrentStep('initial');
      
      // Animate scale reset
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut
      }).start();
    }
  };
  
  // Interpolate progress width for animation
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });
  
  // Render appropriate button content based on current step
  const renderButtonContent = () => {
    switch (currentStep) {
      case 'initial':
        return (
          <View style={styles.initialContent}>
            <Ionicons name="flash-outline" size={22} color={COLORS.accent} />
            <Text style={styles.buttonText}>Buy Now • ${price.toFixed(0)}</Text>
          </View>
        );
        
      case 'confirm':
        return (
          <View style={styles.confirmContent}>
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmText}>Confirm • ${price.toFixed(0)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 'processing':
        return (
          <View style={styles.processingContent}>
            <Text style={styles.processingText}>Processing Order...</Text>
            <View style={styles.progressContainer}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  { width: progressWidth }
                ]}
              />
            </View>
          </View>
        );
        
      case 'success':
        return (
          <Animated.View 
            style={[
              styles.successContent,
              { 
                opacity: successAnim,
                transform: [
                  { 
                    scale: successAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.8, 1.1, 1]
                    })
                  }
                ]
              }
            ]}
          >
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
            </View>
            <Text style={styles.successText}>Order Confirmed!</Text>
          </Animated.View>
        );
    }
  };
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] },
        style
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          currentStep !== 'initial' && styles.buttonActive
        ]}
        onPress={handleTap}
        disabled={currentStep !== 'initial'}
        activeOpacity={0.9}
      >
        {renderButtonContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FF9800',
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  buttonActive: {
    height: 90,
  },
  initialContent: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  confirmContent: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    padding: 8,
  },
  confirmButton: {
    flex: 3,
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  confirmText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    flex: 2,
    height: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  cancelText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  processingContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  processingText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  successContent: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  successText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '700',
  }
});

export default OneTapBuy; 