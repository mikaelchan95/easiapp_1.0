import { useState, useCallback } from 'react';

export type CheckoutStep =
  | 'address'
  | 'delivery'
  | 'payment'
  | 'review'
  | 'processing';

export interface CheckoutNavigationState {
  currentStep: CheckoutStep;
  currentStepIndex: number;
  completedSteps: CheckoutStep[];
  canProceed: boolean;
  canGoBack: boolean;
}

const CHECKOUT_STEPS: CheckoutStep[] = [
  'address',
  'delivery',
  'payment',
  'review',
  'processing',
];

export function useCheckoutNavigation(initialStep: CheckoutStep = 'address') {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(initialStep);
  const [completedSteps, setCompletedSteps] = useState<CheckoutStep[]>([]);

  const currentStepIndex = CHECKOUT_STEPS.indexOf(currentStep);
  const canGoBack = currentStepIndex > 0 && currentStep !== 'processing';
  const canProceed = currentStepIndex < CHECKOUT_STEPS.length - 1;

  const navigateToStep = useCallback(
    (step: CheckoutStep) => {
      const stepIndex = CHECKOUT_STEPS.indexOf(step);
      const currentIndex = CHECKOUT_STEPS.indexOf(currentStep);

      // Don't allow skipping ahead unless steps are completed
      if (stepIndex > currentIndex) {
        const stepsToComplete = CHECKOUT_STEPS.slice(currentIndex, stepIndex);
        const allCompleted = stepsToComplete.every(s =>
          completedSteps.includes(s)
        );

        if (!allCompleted) {
          console.warn(
            `Cannot skip to ${step}. Complete previous steps first.`
          );
          return false;
        }
      }

      setCurrentStep(step);
      return true;
    },
    [currentStep, completedSteps]
  );

  const nextStep = useCallback(() => {
    if (!canProceed) return false;

    const nextStepIndex = currentStepIndex + 1;
    const nextStep = CHECKOUT_STEPS[nextStepIndex];

    // Mark current step as completed
    setCompletedSteps(prev => {
      if (!prev.includes(currentStep)) {
        return [...prev, currentStep];
      }
      return prev;
    });

    setCurrentStep(nextStep);
    return true;
  }, [currentStep, currentStepIndex, canProceed]);

  const previousStep = useCallback(() => {
    if (!canGoBack) return false;

    const prevStepIndex = currentStepIndex - 1;
    const prevStep = CHECKOUT_STEPS[prevStepIndex];

    setCurrentStep(prevStep);
    return true;
  }, [currentStepIndex, canGoBack]);

  const markStepCompleted = useCallback((step: CheckoutStep) => {
    setCompletedSteps(prev => {
      if (!prev.includes(step)) {
        return [...prev, step];
      }
      return prev;
    });
  }, []);

  const markStepIncomplete = useCallback((step: CheckoutStep) => {
    setCompletedSteps(prev => prev.filter(s => s !== step));
  }, []);

  const isStepCompleted = useCallback(
    (step: CheckoutStep) => {
      return completedSteps.includes(step);
    },
    [completedSteps]
  );

  const isStepAccessible = useCallback(
    (step: CheckoutStep) => {
      const stepIndex = CHECKOUT_STEPS.indexOf(step);
      const currentIndex = CHECKOUT_STEPS.indexOf(currentStep);

      // Current step is always accessible
      if (step === currentStep) return true;

      // Previous completed steps are accessible
      if (stepIndex < currentIndex) return true;

      // Next step is accessible if current step is completed
      if (stepIndex === currentIndex + 1) {
        return completedSteps.includes(currentStep);
      }

      // Other future steps require all previous steps to be completed
      const requiredSteps = CHECKOUT_STEPS.slice(0, stepIndex);
      return requiredSteps.every(s => completedSteps.includes(s));
    },
    [currentStep, completedSteps]
  );

  const getStepProgress = useCallback(() => {
    return {
      current: currentStepIndex + 1,
      total: CHECKOUT_STEPS.length,
      percentage: ((currentStepIndex + 1) / CHECKOUT_STEPS.length) * 100,
    };
  }, [currentStepIndex]);

  const reset = useCallback((step: CheckoutStep = 'address') => {
    setCurrentStep(step);
    setCompletedSteps([]);
  }, []);

  const getStepTitle = useCallback((step: CheckoutStep) => {
    const titles: Record<CheckoutStep, string> = {
      address: 'Delivery Address',
      delivery: 'Delivery Options',
      payment: 'Payment Method',
      review: 'Review Order',
      processing: 'Processing Order',
    };
    return titles[step];
  }, []);

  const getStepDescription = useCallback((step: CheckoutStep) => {
    const descriptions: Record<CheckoutStep, string> = {
      address: 'Where should we deliver your order?',
      delivery: 'When would you like to receive your order?',
      payment: 'How would you like to pay?',
      review: 'Please review your order details',
      processing: 'We are processing your order...',
    };
    return descriptions[step];
  }, []);

  return {
    // State
    currentStep,
    currentStepIndex,
    completedSteps,
    canProceed,
    canGoBack,

    // Navigation functions
    navigateToStep,
    nextStep,
    previousStep,

    // Step management
    markStepCompleted,
    markStepIncomplete,
    isStepCompleted,
    isStepAccessible,

    // Utility functions
    getStepProgress,
    getStepTitle,
    getStepDescription,
    reset,

    // Constants
    steps: CHECKOUT_STEPS,
  };
}
