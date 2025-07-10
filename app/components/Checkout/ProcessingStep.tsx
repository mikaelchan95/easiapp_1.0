import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';

const ProcessingStep: React.FC = () => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];
  const progressAnim = useState(new Animated.Value(0))[0];
  
  // Mount animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    // Pulse animation for the main loading indicator
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    
    return () => pulseAnimation.stop();
  }, []);
  
  // Simulate processing steps with progress animation
  useEffect(() => {
    const timer = setInterval(() => {
      setStep(prevStep => {
        if (prevStep < totalSteps) {
          const newStep = prevStep + 1;
          // Animate progress
          Animated.timing(progressAnim, {
            toValue: newStep / totalSteps,
            duration: 400,
            useNativeDriver: false,
          }).start();
          return newStep;
        }
        clearInterval(timer);
        return prevStep;
      });
    }, 800);
    
    return () => clearInterval(timer);
  }, []);
  
  const getStepColor = (stepNumber: number) => {
    if (stepNumber < step) return '#4CAF50'; // Completed
    if (stepNumber === step) return COLORS.text; // Current
    return COLORS.border; // Upcoming
  };
  
  const getStepBackgroundColor = (stepNumber: number) => {
    if (stepNumber < step) return '#4CAF50';
    if (stepNumber === step) return COLORS.text;
    return COLORS.background;
  };
  
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim
        }
      ]}
    >
      <View style={styles.loadingContainer}>
        <Animated.View 
          style={{
            transform: [{ scale: pulseAnim }]
          }}
        >
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color={COLORS.card} />
          </View>
        </Animated.View>
        <Text style={styles.loadingText}>Processing Your Order</Text>
        <Text style={styles.loadingSubtext}>Please don't close this screen while we process your order</Text>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View 
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  })
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>Step {step} of {totalSteps}</Text>
        </View>
      </View>
      
      <View style={styles.stepsContainer}>
        <Animated.View 
          style={[
            styles.step,
            {
              opacity: step >= 1 ? 1 : 0.5
            }
          ]}
        >
          <View style={[styles.stepIcon, { backgroundColor: getStepBackgroundColor(1) }]}>
            {step > 1 ? (
              <Ionicons name="checkmark" size={18} color="#fff" />
            ) : step === 1 ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
            )}
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepText, { color: getStepColor(1) }]}>Verifying Order</Text>
            <Text style={styles.stepDescription}>Checking product availability and stock</Text>
          </View>
        </Animated.View>
        
        <View style={[styles.stepConnector, { backgroundColor: step > 1 ? '#4CAF50' : COLORS.border }]} />
        
        <Animated.View 
          style={[
            styles.step,
            {
              opacity: step >= 2 ? 1 : 0.5
            }
          ]}
        >
          <View style={[styles.stepIcon, { backgroundColor: getStepBackgroundColor(2) }]}>
            {step > 2 ? (
              <Ionicons name="checkmark" size={18} color="#fff" />
            ) : step === 2 ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
            )}
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepText, { color: getStepColor(2) }]}>Processing Payment</Text>
            <Text style={styles.stepDescription}>Securely processing your payment method</Text>
          </View>
        </Animated.View>
        
        <View style={[styles.stepConnector, { backgroundColor: step > 2 ? '#4CAF50' : COLORS.border }]} />
        
        <Animated.View 
          style={[
            styles.step,
            {
              opacity: step >= 3 ? 1 : 0.5
            }
          ]}
        >
          <View style={[styles.stepIcon, { backgroundColor: getStepBackgroundColor(3) }]}>
            {step > 3 ? (
              <Ionicons name="checkmark" size={18} color="#fff" />
            ) : step === 3 ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
            )}
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepText, { color: getStepColor(3) }]}>Confirming Delivery</Text>
            <Text style={styles.stepDescription}>Scheduling your delivery slot</Text>
          </View>
        </Animated.View>
        
        <View style={[styles.stepConnector, { backgroundColor: step > 3 ? '#4CAF50' : COLORS.border }]} />
        
        <Animated.View 
          style={[
            styles.step,
            {
              opacity: step >= 4 ? 1 : 0.5
            }
          ]}
        >
          <View style={[styles.stepIcon, { backgroundColor: getStepBackgroundColor(4) }]}>
            {step > 4 ? (
              <Ionicons name="checkmark" size={18} color="#fff" />
            ) : step === 4 ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
            )}
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepText, { color: getStepColor(4) }]}>Finalizing Order</Text>
            <Text style={styles.stepDescription}>Preparing your order confirmation</Text>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl * 2,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
    elevation: 8,
  },
  loadingText: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  loadingSubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: SPACING.xl,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  progressBackground: {
    width: '80%',
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.text,
    borderRadius: 3,
  },
  progressText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  stepsContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
    elevation: 6,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  stepNumber: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  stepConnector: {
    width: 3,
    height: 24,
    backgroundColor: COLORS.border,
    marginLeft: 14.5,
    borderRadius: 1.5,
  },
});

export default ProcessingStep; 