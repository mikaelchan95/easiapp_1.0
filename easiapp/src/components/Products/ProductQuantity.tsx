import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface ProductQuantityProps {
  quantity: number;
  onChange: (quantity: number) => void;
  max: number;
  min?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const ProductQuantity: React.FC<ProductQuantityProps> = ({
  quantity,
  onChange,
  max,
  min = 1,
  size = 'md',
  disabled = false
}) => {
  const decrease = () => {
    if (quantity > min && !disabled) {
      onChange(quantity - 1);
      if (navigator.vibrate) {
        navigator.vibrate(15);
      }
    }
  };

  const increase = () => {
    if (quantity < max && !disabled) {
      onChange(quantity + 1);
      if (navigator.vibrate) {
        navigator.vibrate(15);
      }
    }
  };

  // Size configurations
  const config = {
    sm: {
      container: "px-2 py-1 rounded-lg",
      button: "w-7 h-7 rounded-md",
      icon: "w-3 h-3",
      text: "text-xs min-w-[20px]"
    },
    md: {
      container: "px-3 py-2 rounded-xl",
      button: "w-8 h-8 rounded-lg",
      icon: "w-4 h-4",
      text: "text-base min-w-[24px]"
    },
    lg: {
      container: "px-4 py-3 rounded-2xl",
      button: "w-10 h-10 rounded-xl",
      icon: "w-5 h-5",
      text: "text-lg min-w-[28px]"
    }
  };

  return (
    <div className={`flex items-center space-x-3 bg-gray-50 ${config[size].container} border border-gray-100 ${disabled ? 'opacity-50' : ''}`}>
      <button 
        onClick={decrease}
        disabled={quantity <= min || disabled}
        className={`${config[size].button} bg-white flex items-center justify-center text-gray-600 disabled:opacity-50 active:scale-95 transition-transform border border-gray-200`}
        aria-label="Decrease quantity"
      >
        <Minus className={config[size].icon} />
      </button>
      <span className={`font-bold text-gray-900 text-center ${config[size].text}`}>{quantity}</span>
      <button 
        onClick={increase}
        disabled={quantity >= max || disabled}
        className={`${config[size].button} bg-white flex items-center justify-center text-gray-600 disabled:opacity-50 active:scale-95 transition-transform border border-gray-200`}
        aria-label="Increase quantity"
      >
        <Plus className={config[size].icon} />
      </button>
    </div>
  );
};

export default ProductQuantity;