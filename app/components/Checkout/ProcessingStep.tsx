import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import AnimatedButton from '../UI/AnimatedButton';

interface ProcessingStepProps {
  onComplete?: () => void;
}

const ProcessingStep: React.FC<ProcessingStepProps> = ({ onComplete }) => {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const totalSteps = 4;

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];
  const progressAnim = useState(new Animated.Value(0))[0];
  const stepAnimations = useState(
    Array.from({ length: totalSteps }, () => new Animated.Value(0))
  )[0];
  const completeAnim = useState(new Animated.Value(0))[0];

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

          // Animate progress bar
          Animated.timing(progressAnim, {
            toValue: newStep / totalSteps,
            duration: 500,
            useNativeDriver: false,
          }).start();

          // Animate step completion
          Animated.spring(stepAnimations[newStep - 1], {
            toValue: 1,
            useNativeDriver: true,
            tension: 150,
            friction: 8,
          }).start();

          return newStep;
        } else if (prevStep === totalSteps && !isComplete) {
          // All steps complete - show completion animation
          setIsComplete(true);
          Animated.sequence([
            Animated.timing(completeAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.delay(1000),
          ]).start(() => {
            onComplete && onComplete();
          });
        }
        clearInterval(timer);
        return prevStep;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [isComplete]);

  const getStepColor = (stepNumber: number) => {
    if (stepNumber < step) return COLORS.success; // Completed
    if (stepNumber === step) return COLORS.success; // Current (green)
    return COLORS.textSecondary; // Upcoming
  };

  const getStepBackgroundColor = (stepNumber: number) => {
    if (stepNumber < step) return COLORS.success;
    if (stepNumber === step) return COLORS.success;
    return COLORS.border;
  };

  return (
    <>
      <View style={styles.wrapper}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              paddingBottom: 140, // Space for bottom nav
            },
          ]}
        >
          <View style={styles.stepsContainer}>
            <Animated.View
              style={[
                styles.step,
                {
                  opacity: step >= 1 ? 1 : 0.5,
                  transform: [
                    {
                      scale: stepAnimations[0].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.95, 1.02],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.stepIcon,
                  { backgroundColor: getStepBackgroundColor(1) },
                  step >= 1 && {
                    shadowColor: COLORS.success,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 4,
                  },
                ]}
              >
                {step > 1 ? (
                  <Animated.View
                    style={{
                      transform: [{ scale: stepAnimations[0] }],
                      opacity: stepAnimations[0],
                    }}
                  >
                    <Ionicons name="checkmark" size={18} color={COLORS.card} />
                  </Animated.View>
                ) : step === 1 ? (
                  <ActivityIndicator size="small" color={COLORS.card} />
                ) : (
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                )}
              </Animated.View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepText, { color: getStepColor(1) }]}>
                  Verifying Order
                </Text>
                <Text style={styles.stepDescription}>
                  Checking product availability and stock
                </Text>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.stepConnector,
                {
                  backgroundColor: step > 1 ? COLORS.success : COLORS.border,
                  opacity: stepAnimations[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ]}
            />

            <Animated.View
              style={[
                styles.step,
                {
                  opacity: step >= 2 ? 1 : 0.5,
                  transform: [
                    {
                      scale: stepAnimations[1].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.95, 1.02],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.stepIcon,
                  { backgroundColor: getStepBackgroundColor(2) },
                  step >= 2 && {
                    shadowColor: COLORS.success,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 4,
                  },
                ]}
              >
                {step > 2 ? (
                  <Animated.View
                    style={{
                      transform: [{ scale: stepAnimations[1] }],
                      opacity: stepAnimations[1],
                    }}
                  >
                    <Ionicons name="checkmark" size={18} color={COLORS.card} />
                  </Animated.View>
                ) : step === 2 ? (
                  <ActivityIndicator size="small" color={COLORS.card} />
                ) : (
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                )}
              </Animated.View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepText, { color: getStepColor(2) }]}>
                  Processing Payment
                </Text>
                <Text style={styles.stepDescription}>
                  Securely processing your payment method
                </Text>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.stepConnector,
                {
                  backgroundColor: step > 2 ? COLORS.success : COLORS.border,
                  opacity: stepAnimations[1].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ]}
            />

            <Animated.View
              style={[
                styles.step,
                {
                  opacity: step >= 3 ? 1 : 0.5,
                  transform: [
                    {
                      scale: stepAnimations[2].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.95, 1.02],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.stepIcon,
                  { backgroundColor: getStepBackgroundColor(3) },
                  step >= 3 && {
                    shadowColor: COLORS.success,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 4,
                  },
                ]}
              >
                {step > 3 ? (
                  <Animated.View
                    style={{
                      transform: [{ scale: stepAnimations[2] }],
                      opacity: stepAnimations[2],
                    }}
                  >
                    <Ionicons name="checkmark" size={18} color={COLORS.card} />
                  </Animated.View>
                ) : step === 3 ? (
                  <ActivityIndicator size="small" color={COLORS.card} />
                ) : (
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                )}
              </Animated.View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepText, { color: getStepColor(3) }]}>
                  Confirming Delivery
                </Text>
                <Text style={styles.stepDescription}>
                  Scheduling your delivery slot
                </Text>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.stepConnector,
                {
                  backgroundColor: step > 3 ? COLORS.success : COLORS.border,
                  opacity: stepAnimations[2].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ]}
            />

            <Animated.View
              style={[
                styles.step,
                {
                  opacity: step >= 4 ? 1 : 0.5,
                  transform: [
                    {
                      scale: stepAnimations[3].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.95, 1.02],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.stepIcon,
                  { backgroundColor: getStepBackgroundColor(4) },
                  step >= 4 && {
                    shadowColor: COLORS.success,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 4,
                  },
                ]}
              >
                {step > 4 ? (
                  <Animated.View
                    style={{
                      transform: [{ scale: stepAnimations[3] }],
                      opacity: stepAnimations[3],
                    }}
                  >
                    <Ionicons name="checkmark" size={18} color={COLORS.card} />
                  </Animated.View>
                ) : step === 4 ? (
                  <ActivityIndicator size="small" color={COLORS.card} />
                ) : (
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>4</Text>
                  </View>
                )}
              </Animated.View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepText, { color: getStepColor(4) }]}>
                  Finalizing Order
                </Text>
                <Text style={styles.stepDescription}>
                  Preparing your order confirmation
                </Text>
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Navigation Bar - Fixed to screen bottom */}
      <View
        style={[
          styles.bottomContainer,
          { paddingBottom: Math.max(insets.bottom, SPACING.md) },
        ]}
      >
        {/* Progress Bar */}
        <View style={styles.bottomProgressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          {/* Step indicators */}
          <View style={styles.stepIndicators}>
            {Array.from({ length: totalSteps }, (_, index) => {
              const isActive = index + 1 === step;
              const isCompleted = index + 1 < step;
              const isInactive = index + 1 > step;

              return (
                <React.Fragment key={index}>
                  <Animated.View
                    style={[
                      styles.stepDot,
                      isCompleted && styles.completedStepDot,
                      isActive && styles.activeStepDot,
                      isInactive && styles.inactiveStepDot,
                      {
                        transform: [
                          {
                            scale: stepAnimations[index].interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1.1],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    {isCompleted && (
                      <Animated.View
                        style={{
                          opacity: stepAnimations[index],
                          transform: [{ scale: stepAnimations[index] }],
                        }}
                      >
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={COLORS.card}
                        />
                      </Animated.View>
                    )}
                    {isActive && (
                      <Animated.View
                        style={{
                          opacity: stepAnimations[index],
                          transform: [{ scale: stepAnimations[index] }],
                        }}
                      >
                        <View style={styles.activeStepIndicator} />
                      </Animated.View>
                    )}
                  </Animated.View>
                  {index < totalSteps - 1 && (
                    <Animated.View
                      style={[
                        styles.stepLine,
                        isCompleted && styles.completedStepLine,
                        {
                          opacity: stepAnimations[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3, 1],
                          }),
                        },
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Status Text */}
        <View style={styles.footer}>
          <Text style={styles.statusText}>
            {isComplete ? 'Complete!' : `Step ${step} of ${totalSteps}`}
          </Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  stepsContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
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
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    ...TYPOGRAPHY.h5,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  stepDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  stepConnector: {
    width: 2,
    height: SPACING.lg,
    backgroundColor: COLORS.border,
    marginLeft: 15,
    borderRadius: 1,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.medium,
    zIndex: 1000,
  },
  bottomProgressContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.card,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 3,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStepDot: {
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: '#66BB6A',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveStepDot: {
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    opacity: 0.6,
  },
  completedStepDot: {
    backgroundColor: COLORS.success,
    borderWidth: 0,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  completedStepLine: {
    backgroundColor: COLORS.success,
  },
  activeStepIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.card,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});

export default ProcessingStep;
