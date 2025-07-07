import React, { ReactNode } from 'react';
import { usePopup } from './PopupContext';

interface PopupContainerProps {
  children: ReactNode;
  title?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  fullScreen?: boolean;
  animation?: 'slide-up' | 'fade-in' | 'bounce';
}

const PopupContainer: React.FC<PopupContainerProps> = ({
  children,
  title,
  onClose,
  showCloseButton = true,
  fullScreen = false,
  animation = 'slide-up'
}) => {
  const { closePopup } = usePopup();
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    closePopup();
  };

  const getAnimationClass = () => {
    switch (animation) {
      case 'slide-up': return 'animate-slide-up';
      case 'fade-in': return 'animate-fade-in';
      case 'bounce': return 'animate-bounce-in';
      default: return 'animate-slide-up';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end">
      <div 
        className={`bg-white w-full max-w-sm mx-auto ${getAnimationClass()} 
          ${fullScreen ? 'min-h-screen rounded-none' : 'rounded-t-3xl max-h-[90vh]'}`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
            <div className="px-4 py-4 flex items-center justify-between">
              {title && <h2 className="text-lg font-bold text-gray-900">{title}</h2>}
              {showCloseButton && (
                <button 
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <span className="text-gray-600 text-xl leading-none">×</span>
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PopupContainer;