// Icon System for EASI App
// Following icon-first design principles with consistent visual language

import React from 'react';
import { 
  Wine, 
  Beer, 
  GlassWater,
  Package,
  Truck,
  CreditCard,
  Star,
  Bell,
  DollarSign,
  MapPin,
  ShoppingCart,
  Tag,
  Target,
  Flame,
  Zap,
  Award,
  Trophy,
  Gem,
  Crown,
  Sparkles,
  Rocket,
  CheckCircle,
  Gift,
  Palette
} from 'lucide-react';

// Product Category Icons
export const CategoryIcons = {
  wine: Wine,
  whisky: Beer, // Using Beer as whisky icon
  spirits: GlassWater,
  liqueurs: GlassWater,
  all: Package
} as const;

// UI State Icons
export const StateIcons = {
  streak: Flame,
  levelUp: Zap,
  success: CheckCircle,
  reward: Award,
  premium: Crown,
  exclusive: Gem,
  featured: Star,
  new: Sparkles,
  hot: Flame,
  fast: Rocket
} as const;

// Commerce Icons
export const CommerceIcons = {
  delivery: Truck,
  payment: CreditCard,
  price: DollarSign,
  location: MapPin,
  cart: ShoppingCart,
  discount: Tag,
  target: Target,
  notification: Bell,
  package: Package,
  gift: Gift
} as const;

// Achievement Icons
export const AchievementIcons = {
  trophy: Trophy,
  award: Award,
  star: Star,
  gem: Gem,
  crown: Crown
} as const;

// Get icon component by category
export const getCategoryIcon = (category: string) => {
  return CategoryIcons[category as keyof typeof CategoryIcons] || CategoryIcons.all;
};

// Icon wrapper for consistent styling
export interface IconProps {
  icon: React.ComponentType<any>;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  'aria-label'?: string;
}

const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
};

export const Icon: React.FC<IconProps> = ({ 
  icon: IconComponent, 
  size = 'md', 
  className = '',
  'aria-label': ariaLabel
}) => {
  return (
    <IconComponent 
      className={`${iconSizes[size as keyof typeof iconSizes]} ${className}`}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    />
  );
};

// Icon button component for consistent interactive elements
export interface IconButtonProps extends IconProps {
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const IconButton: React.FC<IconButtonProps> = ({
  onClick,
  disabled,
  variant = 'secondary',
  className = '',
  ...iconProps
}) => {
  const variants = {
    primary: 'bg-black text-white hover:bg-gray-800',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant as keyof typeof variants]} ${className}`}
      aria-label={iconProps['aria-label']}
    >
      <Icon {...iconProps} />
    </button>
  );
};