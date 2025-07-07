import React from 'react';

interface OnboardingIndicatorProps {
  totalScreens: number;
  currentScreenIndex: number;
}

const OnboardingIndicator: React.FC<OnboardingIndicatorProps> = ({
  totalScreens,
  currentScreenIndex,
}) => {
  return (
    <div className="flex justify-center space-x-1.5">
      {Array.from({ length: totalScreens }).map((_, index) => (
        <div
          key={index}
          className={`transition-all duration-300 ${
            index === currentScreenIndex 
              ? 'w-5 h-1.5 bg-black rounded-full' 
              : 'w-1.5 h-1.5 bg-gray-300 rounded-full'
          }`}
        />
      ))}
    </div>
  );
};

export default OnboardingIndicator;