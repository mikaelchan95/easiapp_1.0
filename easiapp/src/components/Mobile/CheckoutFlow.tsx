import React, { useEffect } from 'react';
import { useCheckout } from '../../hooks/useCheckout';
import { useCart } from '../../hooks/useCart';
import { useNavigationControl } from '../../hooks/useNavigationControl';
import CheckoutHeader from '../Checkout/CheckoutHeader';
import AddressStep from '../Checkout/AddressStep';
import DeliveryStep from '../Checkout/DeliveryStep';
import PaymentStep from '../Checkout/PaymentStep';
import ReviewStep from '../Checkout/ReviewStep';
import ProcessingState from '../Checkout/ProcessingState';

interface CheckoutFlowProps {
  onBack: () => void;
  onComplete: (orderId: string) => void;
}

const CheckoutFlow: React.FC<CheckoutFlowProps> = ({ onBack, onComplete }) => {
  const { cart, cartSummary, user } = useCart();
  const {
    checkoutState,
    orderTotal,
    nextStep,
    prevStep,
    updateAddress,
    selectDeliverySlot,
    selectPaymentMethod,
    processOrder,
    canProceed
  } = useCheckout();
  
  // Hide navigation for checkout flow
  useNavigationControl();

  const handleNext = () => {
    if (checkoutState.step === 'review') {
      handlePlaceOrder();
    } else {
      nextStep();
    }
  };

  const handlePlaceOrder = async () => {
    try {
      const orderId = await processOrder();
      onComplete(orderId);
    } catch (error) {
      console.error('Order failed:', error);
    }
  };

  if (checkoutState.processing) {
    return (
      <div className="bg-gray-50 min-h-screen w-full max-w-sm mx-auto">
        <CheckoutHeader currentStep={checkoutState.step} onBack={onBack} />
        <ProcessingState />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen w-full max-w-sm mx-auto">
      <CheckoutHeader currentStep={checkoutState.step} onBack={onBack} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-32 scrollbar-hide">
        {checkoutState.step === 'address' && (
          <AddressStep
            address={checkoutState.address}
            onUpdateAddress={updateAddress}
          />
        )}

        {checkoutState.step === 'delivery' && (
          <DeliveryStep
            deliverySlots={[]}
            selectedSlot={checkoutState.deliverySlot}
            onSelectSlot={selectDeliverySlot}
            orderTotal={orderTotal}
            address={checkoutState.address}
          />
        )}

        {checkoutState.step === 'payment' && (
          <PaymentStep
            selectedMethod={checkoutState.paymentMethod}
            onSelectMethod={selectPaymentMethod}
          />
        )}

        {checkoutState.step === 'review' && (
          <ReviewStep
            cart={cart}
            checkoutState={checkoutState}
            total={cartSummary.total}
            userRole={user?.role}
          />
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-60 bg-white border-t border-gray-200 max-w-sm mx-auto">
        <div className="px-4 py-4 pb-[calc(var(--sab,0px)+16px)]">
          <div className="flex space-x-3">
            {checkoutState.step !== 'address' && (
              <button
                onClick={prevStep}
                className="w-16 h-14 bg-gray-100 rounded-2xl font-bold text-gray-700 active:scale-95 transition-transform flex items-center justify-center"
              >
                Back
              </button>
            )}
            
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="flex-1 h-14 bg-black text-white rounded-2xl font-bold disabled:opacity-50 disabled:bg-gray-300 active:scale-95 transition-transform"
            >
              {checkoutState.step === 'review' ? (
                <div className="flex items-center justify-center space-x-2">
                  <span>Pay ${cartSummary.total.toFixed(0)}</span>
                </div>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutFlow;