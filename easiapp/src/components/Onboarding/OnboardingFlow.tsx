import React, { useState, useEffect } from 'react';
import { Wine, Sparkles, Truck, Building, ArrowRight } from 'lucide-react';
import OnboardingScreen from './OnboardingScreen';
import OnboardingIndicator from './OnboardingIndicator';
import { useNavigationControl } from '../../hooks/useNavigationControl';

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

const onboardingScreens = [
  {
    icon: Wine,
    iconColor: 'text-purple-600',
    title: 'Discover Premium Alcohol',
    description: 'Explore a curated selection of fine wines, rare whiskies, and craft spirits from around the world.',
  },
  {
    icon: Sparkles,
    iconColor: 'text-blue-600',
    title: 'Wide Selection, Great Value',
    description: 'From everyday favorites to exclusive limited editions at competitive prices.',
  },
  {
    icon: Truck,
    iconColor: 'text-green-600',
    title: 'Fast, Reliable Delivery',
    description: 'Enjoy same-day delivery to your doorstep with age verification.',
  },
  {
    icon: Building,
    iconColor: 'text-amber-600',
    title: 'Trade Benefits',
    description: 'Businesses can access special pricing, credit terms, and wholesale support.',
  },
  {
    icon: ArrowRight,
    iconColor: 'text-black',
    title: 'Ready to Start?',
    description: 'Sign in or create an account to start exploring our premium collection.',
  },
];

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip }) => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const totalScreens = onboardingScreens.length;

  // Hide navigation for this full-screen modal
  useNavigationControl();
  
  // Add haptic feedback for transitions if available
  useEffect(() => {
    if (isTransitioning && navigator.vibrate) {
      navigator.vibrate(10); // Subtle vibration
      setIsTransitioning(false);
    }
  }, [isTransitioning]);

  const handleNext = () => {
    if (currentScreen < totalScreens - 1) {
      setIsTransitioning(true);
      setCurrentScreen(prev => prev + 1);
    } else {
      // Haptic feedback for completion
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
      onComplete();
    }
  };

  const handleSkip = () => {
    // Haptic feedback for skipping
    if (navigator.vibrate) {
      navigator.vibrate(25);
    }
    onSkip();
  };

  const currentScreenData = onboardingScreens[currentScreen];
  const isLastScreen = currentScreen === totalScreens - 1;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col max-w-sm mx-auto">
      {/* Top skip button */}
      {!isLastScreen && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 active:scale-95 transition-transform"
          >
            Skip
          </button>
        </div>
      )}

      {/* Content area - takes up most of the height */}
      <div className="flex-1 flex flex-col justify-center">
        <OnboardingScreen
          key={currentScreen} // Key for re-rendering animation
          icon={currentScreenData.icon}
          iconColor={currentScreenData.iconColor}
          title={currentScreenData.title}
          description={currentScreenData.description}
        />
      </div>

      {/* Bottom controls - fixed at the bottom */}
      <div className="w-full px-6 pb-8 safe-bottom">
        <OnboardingIndicator totalScreens={totalScreens} currentScreenIndex={currentScreen} />
        
        {/* Action buttons */}
        <button
          onClick={handleNext}
          className="w-full bg-black text-white py-3.5 rounded-xl font-bold active:scale-95 transition-transform shadow-sm flex items-center justify-center space-x-2 mt-6"
        >
          <span>{isLastScreen ? 'Get Started' : 'Next'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default OnboardingFlow;