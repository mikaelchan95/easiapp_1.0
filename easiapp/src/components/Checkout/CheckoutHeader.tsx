import React from 'react';
import { ArrowLeft, MapPin, Truck, CreditCard, ClipboardCheck } from 'lucide-react';

interface CheckoutHeaderProps {
  currentStep: string;
  onBack: () => void;
}

const steps = [
  { id: 'address', name: 'Address', icon: MapPin },
  { id: 'delivery', name: 'Delivery', icon: Truck },
  { id: 'payment', name: 'Payment', icon: CreditCard },
  { id: 'review', name: 'Review', icon: ClipboardCheck }
];

const CheckoutHeader: React.FC<CheckoutHeaderProps> = ({ currentStep, onBack }) => {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button 
              onClick={onBack}
              className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
          </div>
          <div className="text-sm font-medium text-gray-500">
            {currentStepIndex + 1} of {steps.length}
          </div>
        </div>
        
        {/* Progress Steps with Icons */}
        <div className="relative">
          {/* Progress Bar Background */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full" />
          
          {/* Active Progress */}
          <div 
            className="absolute top-5 left-0 h-1 bg-black rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
          
          {/* Step Icons */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div 
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all
                      ${isActive 
                        ? 'bg-black text-white scale-110' 
                        : isCompleted 
                          ? 'bg-black text-white' 
                          : 'bg-gray-200 text-gray-400'
                      }
                    `}
                  >
                    <StepIcon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <span 
                    className={`
                      text-xs mt-2 font-medium transition-colors
                      ${isActive 
                        ? 'text-black' 
                        : isCompleted 
                          ? 'text-gray-700' 
                          : 'text-gray-400'
                      }
                    `}
                  >
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutHeader;