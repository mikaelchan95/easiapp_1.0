import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Home,
  Truck,
  Clock,
  Calendar,
  CreditCard,
  Shield,
  Wallet,
  ClipboardCheck,
  Package,
  DollarSign,
  Edit,
  Check,
  ChevronRight,
  Info,
  ArrowLeft
} from 'lucide-react';

// Example component showing icon-first checkout design principles
const IconFirstCheckout: React.FC = () => {
  const [currentStep, setCurrentStep] = useState('address');
  
  // Icon-based step configuration
  const checkoutSteps = [
    {
      id: 'address',
      name: 'Delivery Address',
      icon: MapPin,
      description: 'Where should we deliver?'
    },
    {
      id: 'delivery',
      name: 'Delivery Time',
      icon: Truck,
      description: 'When would you like it?'
    },
    {
      id: 'payment',
      name: 'Payment Method',
      icon: CreditCard,
      description: 'How would you like to pay?'
    },
    {
      id: 'review',
      name: 'Review Order',
      icon: ClipboardCheck,
      description: 'Confirm your details'
    }
  ];

  const getCurrentStepIndex = () => 
    checkoutSteps.findIndex(step => step.id === currentStep);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Icon Progress */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <button 
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold">Checkout</h1>
            </div>
            <span className="text-sm font-medium text-gray-500">
              Step {getCurrentStepIndex() + 1} of {checkoutSteps.length}
            </span>
          </div>

          {/* Icon-based Progress Bar */}
          <div className="relative">
            {/* Background line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
            
            {/* Active progress line */}
            <div 
              className="absolute top-5 left-0 h-0.5 bg-black transition-all duration-500"
              style={{ 
                width: `${((getCurrentStepIndex() + 1) / checkoutSteps.length) * 100}%` 
              }}
            />

            {/* Step icons */}
            <div className="relative flex justify-between">
              {checkoutSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === getCurrentStepIndex();
                const isCompleted = index < getCurrentStepIndex();
                
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <button
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        transition-all duration-300 relative
                        ${isActive 
                          ? 'bg-black text-white scale-110 shadow-lg' 
                          : isCompleted 
                            ? 'bg-black text-white' 
                            : 'bg-gray-200 text-gray-400'
                        }
                      `}
                      aria-label={`${step.name} - ${isActive ? 'Current step' : isCompleted ? 'Completed' : 'Upcoming'}`}
                    >
                      {isCompleted && !isActive ? (
                        <Check className="w-5 h-5" strokeWidth={2.5} />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                      
                      {/* Pulse animation for active step */}
                      {isActive && (
                        <span className="absolute inset-0 rounded-full bg-black animate-ping opacity-20" />
                      )}
                    </button>
                    
                    <span className={`
                      text-xs mt-2 font-medium transition-colors text-center
                      ${isActive ? 'text-black' : isCompleted ? 'text-gray-700' : 'text-gray-400'}
                    `}>
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Address Step Example */}
        {currentStep === 'address' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Delivery Address</h2>
                  <p className="text-sm text-gray-600">Where should we deliver your order?</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Address form with icon labels */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <Home className="w-4 h-4" />
                    <span>Street Address</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all"
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>Unit/Apt</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all"
                      placeholder="#12-34"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4" />
                      <span>Phone</span>
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all"
                      placeholder="+65 9123 4567"
                    />
                  </div>
                </div>
              </div>

              {/* Save address option */}
              <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black" />
                <span className="text-sm font-medium">Save this address for future orders</span>
              </label>
            </div>
          </div>
        )}

        {/* Delivery Step Example */}
        {currentStep === 'delivery' && (
          <div className="space-y-6">
            {/* Delivery Options */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Delivery Options</span>
              </h3>

              <div className="space-y-3">
                {/* Express Delivery */}
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-black transition-all">
                  <input type="radio" name="delivery" className="sr-only" />
                  <div className="flex-1 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Truck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">Express Delivery</div>
                      <div className="text-sm text-gray-600">Today, 6PM - 9PM</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">$15</div>
                      <div className="text-xs text-green-600 font-medium">Fastest</div>
                    </div>
                  </div>
                </label>

                {/* Standard Delivery */}
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-black transition-all">
                  <input type="radio" name="delivery" className="sr-only" />
                  <div className="flex-1 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">Standard Delivery</div>
                      <div className="text-sm text-gray-600">Tomorrow, 12PM - 3PM</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">FREE</div>
                      <div className="text-xs text-gray-600">Min. order $50</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-blue-50 rounded-xl p-4 flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Temperature-controlled delivery</p>
                <p>Your premium beverages will be delivered in optimal conditions.</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Step Example */}
        {currentStep === 'payment' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Payment Method</span>
              </h3>

              <div className="space-y-3">
                {/* Credit Card Option */}
                <label className="flex items-center p-4 border-2 border-black rounded-xl cursor-pointer bg-black text-white">
                  <input type="radio" name="payment" className="sr-only" defaultChecked />
                  <div className="flex-1 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">Credit/Debit Card</div>
                      <div className="text-sm opacity-80">Visa, Mastercard, AMEX</div>
                    </div>
                    <Check className="w-5 h-5" />
                  </div>
                </label>

                {/* Digital Wallet */}
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-black transition-all">
                  <input type="radio" name="payment" className="sr-only" />
                  <div className="flex-1 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">Digital Wallet</div>
                      <div className="text-sm text-gray-600">Apple Pay, Google Pay</div>
                    </div>
                  </div>
                </label>
              </div>

              {/* Security Badge */}
              <div className="mt-6 p-4 bg-green-50 rounded-xl flex items-center space-x-3">
                <Shield className="w-5 h-5 text-green-600" />
                <div className="text-sm">
                  <p className="font-medium text-green-900">Secure Payment</p>
                  <p className="text-green-700">256-bit SSL encryption</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Step Example */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-lg flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Order Summary</span>
                </h3>
              </div>

              <div className="p-6 space-y-4">
                {/* Sample Order Items */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg"></div>
                    <div className="flex-1">
                      <p className="font-medium">Macallan 18 Year Old</p>
                      <p className="text-sm text-gray-600">Qty: 1</p>
                    </div>
                    <p className="font-bold">$899</p>
                  </div>
                </div>

                {/* Order Total */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">$899</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery</span>
                    <span className="font-medium text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span className="flex items-center space-x-1">
                      <DollarSign className="w-5 h-5" />
                      <span>899</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center space-x-2">
                  <Truck className="w-5 h-5" />
                  <span>Delivery Details</span>
                </h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>123 Main Street, #12-34</p>
                <p>Singapore 123456</p>
                <p className="font-medium text-gray-900 mt-2">Tomorrow, 12PM - 3PM</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex space-x-4">
          {getCurrentStepIndex() > 0 && (
            <button
              onClick={() => {
                const prevStep = checkoutSteps[getCurrentStepIndex() - 1];
                setCurrentStep(prevStep.id);
              }}
              className="px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}
          
          <button
            onClick={() => {
              const nextIndex = getCurrentStepIndex() + 1;
              if (nextIndex < checkoutSteps.length) {
                setCurrentStep(checkoutSteps[nextIndex].id);
              }
            }}
            className="flex-1 bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
          >
            <span>
              {getCurrentStepIndex() === checkoutSteps.length - 1 
                ? 'Place Order' 
                : 'Continue'
              }
            </span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default IconFirstCheckout;