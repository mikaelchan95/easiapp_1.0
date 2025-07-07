import React from 'react';
import { RewardCategory, RewardCategoryId } from '../../types/rewards';

interface CategoryFilterProps {
  categories: RewardCategory[];
  activeCategory: RewardCategoryId;
  onCategoryChange: (categoryId: RewardCategoryId) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  onCategoryChange
}) => {
  return (
    <div className="px-4 mb-5">
      <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((category, index) => {
          const IconComponent = category.icon;
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex items-center px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap active:scale-95 ${
                isActive
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <IconComponent className="w-3.5 h-3.5 mr-1.5" />
              <span className="text-xs">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilter;