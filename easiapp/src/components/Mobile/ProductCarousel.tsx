import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../../types';
import ProductCard from '../Products/ProductCard';

interface ProductCarouselProps {
  title: string;
  subtitle?: string;
  products: Product[];
  onProductClick: (product: Product) => void;
  onViewAll?: () => void;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  title,
  subtitle,
  products,
  onProductClick,
  onViewAll
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Function to handle scrolling
  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
  };

  // Check scroll on mount and resize
  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [products]);

  // Scroll left/right
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const { clientWidth } = scrollRef.current;
    const scrollAmount = direction === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
    
    scrollRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  };

  if (products.length === 0) return null;

  return (
    <div className="relative mb-8 py-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-black font-bold hover:underline active:scale-95 transition-transform"
          >
            View all
          </button>
        )}
      </div>

      {/* Scroll Controls */}
      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute -left-3 top-1/2 z-10 transform -translate-y-1/2 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}
        
        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute -right-3 top-1/2 z-10 transform -translate-y-1/2 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        )}
        
        {/* Products */}
        <div 
          ref={scrollRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide px-4"
          onScroll={handleScroll}
        >
          {products.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-44">
              <ProductCard
                product={product}
                compact
                onCardClick={onProductClick}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductCarousel;