import React, { useEffect } from 'react';
import { ArrowRight, ArrowLeft, Share2, Truck, Clock, MapPin, Package, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCredit } from '../../hooks/useCredit';
import InvoiceView from '../Credit/InvoiceView';

interface OrderSuccessProps {
  orderId: string;
  onContinueShopping: () => void;
  onViewOrders: () => void;
}

const OrderSuccess: React.FC<OrderSuccessProps> = ({ 
  orderId, 
  onContinueShopping, 
  onViewOrders 
}) => {
  const { state } = useApp();
  const { invoices } = useCredit();
  const [showInvoice, setShowInvoice] = React.useState(false);
  const [step, setStep] = React.useState(0);
  
  const isTradeAccount = state.user?.role === 'trade';
  const orderInvoice = invoices.find(inv => inv.orderId === orderId);
  
  const order = state.orders.find(o => o.id === orderId);
  const isSameDayDelivery = order?.sameDay || false;
  const orderTotal = order?.total || 0;

  useEffect(() => {
    // Haptic feedback for success
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
    
    // Animate steps
    const stepTimer = setInterval(() => {
      setStep(prev => {
        if (prev < 2) return prev + 1;
        clearInterval(stepTimer);
        return prev;
      });
    }, 800);

    return () => {
      clearInterval(stepTimer);
    };
  }, []);

  const shareOrder = () => {
    if (navigator.share) {
      navigator.share({
        title: 'EASI Order Placed',
        text: `Just ordered from EASI! Order ${orderId}`,
        url: window.location.href
      });
    }
  };

  const getDeliveryTiming = () => {
    const deliveryTimeSlot = order?.deliverySlot?.timeSlot || 
      (isSameDayDelivery ? "6 PM - 9 PM today" : "12 PM - 3 PM tomorrow");
    
    return isSameDayDelivery 
      ? `Arrives ${deliveryTimeSlot}`
      : `Scheduled for ${deliveryTimeSlot}`;
  };

  return (
    <div className="bg-white min-h-screen max-w-sm mx-auto flex flex-col relative">
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 relative z-20">
        {/* Success Icon */}
        <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center mb-8 animate-bounce-in relative">
          <div className="w-10 h-10 border-4 border-white rounded-full"></div>
          <div className="absolute left-1/2 top-1/2 h-5 w-2.5 border-r-4 border-b-4 border-white transform rotate-45 translate-y-[-5px] translate-x-[-10px]"></div>
          <div className="absolute inset-0 bg-primary-400 rounded-full animate-ping opacity-75"></div>
        </div>
        
        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3 text-center animate-fade-in">Order Placed!</h1>
        <p className="text-gray-600 text-center mb-8 animate-fade-in leading-relaxed">
          Your order is confirmed and being prepared
        </p>
        
        {/* Order Details */}
        <div className="w-full bg-gray-50 rounded-3xl p-6 mb-8 border border-gray-200 animate-slide-up">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Order Confirmation</h2>
            <p className="text-black font-bold text-lg">{orderId}</p>
          </div>
          
          <div className="space-y-4">
            <div className={`flex items-center space-x-4 p-4 bg-white rounded-2xl transition-all duration-500 ${
              step >= 0 ? 'animate-fade-in' : 'opacity-0'
            }`}>
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Preparing</h3>
                <p className="text-sm text-gray-600">Packing your items with care</p>
              </div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            
            <div className={`flex items-center space-x-4 p-4 bg-white rounded-2xl transition-all duration-500 ${
              step >= 1 ? 'animate-fade-in' : 'opacity-0'
            }`} style={{ animationDelay: '400ms' }}>
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">
                  {isSameDayDelivery ? 'Same-Day Delivery' : 'Scheduled Delivery'}
                </h3>
                <p className="text-sm text-gray-600">{getDeliveryTiming()}</p>
              </div>
              <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-xl text-xs font-bold">
                {orderTotal >= 250 || isTradeAccount ? 'Free' : `$${order?.deliverySlot?.price || '5'}`}
              </div>
            </div>
            
            {/* Credit Invoice for Trade Accounts */}
            {isTradeAccount && orderInvoice && (
              <div className={`flex items-center space-x-4 p-4 bg-white rounded-2xl transition-all duration-500 ${
                step >= 2 ? 'animate-fade-in' : 'opacity-0'
              }`} style={{ animationDelay: '800ms' }}>
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">Credit Invoice</h3>
                  <p className="text-sm text-gray-600">
                    Due in {orderInvoice.paymentTerms} days
                  </p>
                </div>
                <button
                  onClick={() => setShowInvoice(true)}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                >
                  View
                </button>
              </div>
            )}
            
            <div className={`flex items-center space-x-4 p-4 bg-white rounded-2xl transition-all duration-500 ${
              step >= 2 ? 'animate-fade-in' : 'opacity-0'
            }`} style={{ animationDelay: '800ms' }}>
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Delivery Updates</h3>
                <p className="text-sm text-gray-600">Real-time status notifications</p>
              </div>
              <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Age Verification Info */}
        <div className="w-full bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8 animate-fade-in">
          <div className="flex items-start space-x-3">
            <ShieldCheck className="w-6 h-6 text-yellow-600 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-800 text-lg mb-1">ID Verification Required</h3>
              <p className="text-sm text-yellow-700 leading-relaxed">
                Valid ID must be shown for alcohol delivery. Our delivery partner will verify you are 21+ before handing over products.
              </p>
            </div>
          </div>
        </div>

        {/* Delivery Timing Info */}
        <div className="w-full bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8 animate-fade-in">
          <div className="flex items-start space-x-3">
            <Clock className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-bold text-blue-800 text-lg mb-1">Delivery Information</h3>
              <p className="text-sm text-blue-700 leading-relaxed">
                {isSameDayDelivery 
                  ? "Your order will arrive today during your selected time slot. Our driver will contact you 30 minutes before arrival."
                  : "Your delivery is scheduled for the date and time you selected. You'll receive a confirmation the day before delivery."}
              </p>
            </div>
          </div>
        </div>

        {/* Share Order */}
        <button
          onClick={shareOrder}
          className="flex items-center space-x-2 text-gray-600 mb-8 active:scale-95 transition-transform"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm font-medium">Share order</span>
        </button>
      </div>
      
      {/* Action Buttons */}
      <div className="px-8 pb-8 space-y-4 relative z-20">
        <button
          onClick={onViewOrders}
          className="w-full h-14 bg-black text-white rounded-2xl font-bold animate-fade-in flex items-center justify-center space-x-2 active:scale-95 transition-transform"
        >
          <span>Track Order</span>
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={onContinueShopping}
          className="w-full h-14 bg-white text-black rounded-2xl font-bold border border-gray-200 animate-fade-in active:scale-95 transition-transform"
        >
          Continue Shopping
        </button>

        {/* Rating Prompt */}
        <div className="text-center pt-4">
          <div className="flex items-center justify-center space-x-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-5 h-5 bg-primary-400 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-primary-200 rounded-full"></div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600">
            Rate your experience in the App Store
          </p>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && orderInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-white rounded-3xl max-w-sm w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-100">
              <button
                onClick={() => setShowInvoice(false)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="p-4">
              <InvoiceView
                invoice={orderInvoice}
                onDownload={() => {}}
                onShare={() => {}}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSuccess;