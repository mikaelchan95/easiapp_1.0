import React, { useState } from 'react';
import { Wine, Zap, Glasses, Grape } from 'lucide-react';

interface CategoryGridProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ activeCategory, onCategoryChange }) => {
  const [pressedCategory, setPressedCategory] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'All', icon: null },
    { id: 'wine', name: 'Wine', icon: Wine },
    { id: 'whisky', name: 'Whisky', icon: Zap },
    { id: 'spirits', name: 'Spirits', icon: Glasses },
    { id: 'liqueurs', name: 'Liqueurs', icon: Grape },
  ];

  const handleCategoryPress = (categoryId: string) => {
    setPressedCategory(categoryId);
    
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    setTimeout(() => {
      onCategoryChange(categoryId);
      setPressedCategory(null);
    }, 100);
  };

  return (
    <div className="grid grid-cols-5 gap-2">
      {categories.map((category, index) => {
        const IconComponent = category.icon;
        const isActive = activeCategory === category.id;
        const isPressed = pressedCategory === category.id;
        
        return (
          <button
            key={category.id}
            onClick={() => handleCategoryPress(category.id)}
            className={`aspect-square rounded-2xl font-medium transition-all duration-200 flex flex-col items-center justify-center space-y-1 p-2 ${
              isPressed ? 'scale-95' : ''
            } ${
              isActive 
                ? 'bg-black text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50 active:scale-95'
            }`}
            style={{ 
              animationDelay: `${index * 50}ms`,
              boxShadow: isActive 
                ? '0 4px 16px rgba(0, 0, 0, 0.15)' 
                : '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            {IconComponent && (
              <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-600'}`} />
            )}
            <span className={`text-xs font-medium leading-none ${isActive ? 'text-white' : 'text-gray-700'}`}>
              {category.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryGrid;