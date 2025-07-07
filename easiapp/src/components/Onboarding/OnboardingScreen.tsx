import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface OnboardingScreenProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  icon: Icon,
  iconColor,
  title,
  description,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 pt-8 pb-4 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6 animate-bounce-in">
        <Icon className={`w-10 h-10 ${iconColor}`} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4 animate-fade-in">
        {title}
      </h2>
      <p className="text-gray-600 leading-relaxed animate-fade-in max-w-xs">
        {description}
      </p>
    </div>
  );
};

export default OnboardingScreen;