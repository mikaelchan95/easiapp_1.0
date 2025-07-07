import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductItem from '../Products/ProductItem';
import { Product } from '../../types';

interface ProductCarouselProps {
  title: string;
  icon: React.ReactNode;
  products: Product[];
  viewAllUrl?: string;
  onViewAll?: () => void;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  title,
  icon,
  products,
  viewAllUrl,
  onViewAll
}) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSizes = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      setContainerWidth(container.clientWidth);
      setMaxScroll(container.scrollWidth - container.clientWidth);
    };
    
    updateSizes();
    window.addEventListener('resize', updateSizes);
    
    return () => window.removeEventListener('resize', updateSizes);
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollAmount = direction === 'left' ? -containerWidth : containerWidth;
    
    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
    
    setScrollPosition(Math.max(0, Math.min(maxScroll, container.scrollLeft + scrollAmount)));
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    setScrollPosition(containerRef.current.scrollLeft);
  };

  return (
    <div className="mb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3 animate-fade-in">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              {icon}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          </div>
          
          {(viewAllUrl || onViewAll) && (
            <button 
              onClick={onViewAll}
              className="text-amber-600 hover:text-amber-700 font-medium hover:underline active:scale-95"
            >
              View all
            </button>
          )}
        </div>
        
        {/* Scroll Controls */}
        <div className="relative">
          {scrollPosition > 0 && (
            <button
              onClick={() => scroll('left')}
              className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          
          {scrollPosition < maxScroll && (
            <button
              onClick={() => scroll('right')}
              className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          )}
          
          <div 
            ref={containerRef}
            className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
            onScroll={handleScroll}
          >
            {products.map((product, index) => (
              <div key={product.id} className="flex-shrink-0 w-56 md:w-64">
                <ProductItem 
                  product={product}
                  index={index}
                  compact
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCarousel;