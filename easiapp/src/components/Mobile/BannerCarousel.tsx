import React, { useRef, useEffect } from 'react';
import { ArrowRight, Star, Zap, Gift } from 'lucide-react';

interface BannerCarouselProps {
  currentBanner: number;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ currentBanner }) => {
  const bannerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Ensure banner properly fits even on notched devices
    if (bannerRef.current) {
      const updateHeight = () => {
        const width = bannerRef.current?.clientWidth || 0;
        const height = width * 0.45; // 16:9 aspect ratio
        if (bannerRef.current) {
          bannerRef.current.style.height = `${height}px`;
        }
      };
      
      updateHeight();
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, []);
  
  const banners = [
    {
      id: 1,
      title: 'Premium Collection',
      subtitle: 'Rare & Limited',
      description: 'Handpicked spirits from renowned distilleries',
      ctaText: 'Explore',
      background: 'bg-black',
      accentColor: 'green',
      icon: Star,
      textColor: 'text-white'
    },
    {
      id: 2,
      title: 'Weekend Sale',
      subtitle: '20% Off',
      description: 'Limited offer on selected vintages',
      ctaText: 'Shop Now',
      background: 'bg-black',
      accentColor: 'white',
      icon: Zap,
      textColor: 'text-white'
    },
    {
      id: 3,
      title: 'EASI Rewards',
      subtitle: 'Earn Points',
      description: 'Redeem for exclusive experiences',
      ctaText: 'Learn More',
      background: 'bg-black',
      accentColor: 'green',
      icon: Gift,
      textColor: 'text-white'
    },
  ];

  const currentBannerData = banners[currentBanner];
  const IconComponent = currentBannerData.icon;

  const getAccentClasses = (color: string) => {
    switch (color) {
      case 'green':
        return {
          iconBg: 'bg-primary-400',
          button: 'bg-primary-500 active:bg-primary-400 text-white',
          dot: 'bg-primary-400'
        };
      case 'white':
        return {
          iconBg: 'bg-white/20',
          button: 'bg-white active:bg-gray-100 text-gray-900',
          dot: 'bg-white'
        };
      default:
        return {
          iconBg: 'bg-primary-400',
          button: 'bg-primary-500 active:bg-primary-400 text-white',
          dot: 'bg-primary-400'
        };
    }
  };

  const accentClasses = getAccentClasses(currentBannerData.accentColor);

  return (
    <div className="px-4 mb-6">
      <div 
        ref={bannerRef}
        className={`relative rounded-2xl overflow-hidden ${currentBannerData.background} shadow-lg`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white transform translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white transform -translate-x-12 translate-y-12"></div>
        </div>
        
        {/* Content */}
        <div className="relative h-full flex items-center justify-between p-5">
          {/* Left Content */}
          <div className="flex-1">
            {/* Badge */}
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-7 h-7 ${accentClasses.iconBg} rounded-lg flex items-center justify-center`}>
                <IconComponent className={`w-3.5 h-3.5 ${currentBannerData.accentColor === 'white' ? 'text-white' : 'text-white'}`} />
              </div>
              <span className="text-xs font-bold text-white/90 uppercase tracking-wide">
                {currentBannerData.subtitle}
              </span>
            </div>
            
            {/* Title */}
            <h3 className={`text-lg font-bold ${currentBannerData.textColor} mb-1 leading-tight`}>
              {currentBannerData.title}
            </h3>
            
            {/* Description - only on larger screens */}
            <p className="text-xs text-white/80 mb-3 leading-relaxed max-w-[200px]">
              {currentBannerData.description}
            </p>
            
            {/* CTA Button */}
            <button className={`${accentClasses.button} px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 shadow-sm flex items-center space-x-1.5 active:scale-95`}>
              <span>{currentBannerData.ctaText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Indicators */}
          <div className="absolute bottom-3 right-3 flex space-x-1.5">
            {banners.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  index === currentBanner 
                    ? `${accentClasses.dot} scale-125` 
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerCarousel;