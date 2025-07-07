import React from 'react';

interface ToggleSwitchProps {
  isEnabled: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  activeColor?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  isEnabled,
  onToggle,
  size = 'md',
  activeColor = 'bg-black'
}) => {
  const sizes = {
    sm: {
      wrapper: 'w-8 h-4',
      handle: 'w-3 h-3',
      translate: 'translate-x-4'
    },
    md: {
      wrapper: 'w-12 h-6',
      handle: 'w-5 h-5',
      translate: 'translate-x-6'
    },
    lg: {
      wrapper: 'w-14 h-7',
      handle: 'w-6 h-6',
      translate: 'translate-x-7'
    }
  };

  return (
    <button
      onClick={onToggle}
      className={`${sizes[size].wrapper} rounded-full transition-colors relative 
        ${isEnabled ? activeColor : 'bg-gray-300'}`}
      aria-checked={isEnabled}
      role="switch"
    >
      <span className="sr-only">{isEnabled ? 'Enabled' : 'Disabled'}</span>
      <div
        className={`${sizes[size].handle} bg-white rounded-full shadow-md absolute top-0.5 left-0.5 transform transition-transform ${
          isEnabled ? sizes[size].translate : 'translate-x-0'
        }`}
      />
    </button>
  );
};

export default ToggleSwitch;