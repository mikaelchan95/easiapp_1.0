import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { CheckoutStep } from '../../types/cart';

interface CheckoutHeaderProps {
  currentStep: CheckoutStep;
  onBack: () => void;
}

const steps = [
  { id: 'address', name: 'Address' },
  { id: 'delivery', name: 'Delivery' },
  { id: 'payment', name: 'Payment' },
  { id: 'review', name: 'Review' }
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
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
          </div>
          <div className="text-sm font-medium text-gray-500">
            {currentStepIndex + 1} of {steps.length}
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-3">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className={`flex flex-col items-center`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted ? 'bg-green-500' : 
                    isActive ? 'bg-black' : 'bg-gray-200'
                  }`}>
                    {isCompleted ? (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>
                        {index + 1}
                      </span>
                    )}
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-500 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CheckoutHeader;