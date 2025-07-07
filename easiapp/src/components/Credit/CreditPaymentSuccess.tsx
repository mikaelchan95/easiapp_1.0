import React, { useEffect } from 'react';
import { Check, ArrowRight, Receipt } from 'lucide-react';
import { CreditPayment } from '../../types/credit';

interface CreditPaymentSuccessProps {
  payment: CreditPayment;
  onViewInvoices: () => void;
  onClose: () => void;
}

const CreditPaymentSuccess: React.FC<CreditPaymentSuccessProps> = ({
  payment,
  onViewInvoices,
  onClose
}) => {
  useEffect(() => {
    // Haptic feedback for success
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden animate-bounce-in">
        <div className="p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in relative">
            <Check className="w-10 h-10 text-white" />
            <div className="absolute inset-0 bg-primary-400 rounded-full animate-ping opacity-75"></div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Payment Successful</h2>
          <p className="text-gray-600 mb-6">
            Your payment of ${payment.amount.toFixed(2)} has been processed
          </p>
          
          {/* Payment Details */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200 text-left">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-bold text-gray-900">${payment.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-bold text-gray-900">
                  {new Date(payment.paymentDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reference</span>
                <span className="font-bold text-gray-900">{payment.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Method</span>
                <span className="font-bold text-gray-900 capitalize">
                  {payment.paymentMethod.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
          
          {/* Receipt */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-8">
            <div className="flex items-center space-x-3">
              <Receipt className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <div className="font-bold text-blue-900">Receipt Sent</div>
                <div className="text-sm text-blue-700">Check your email for details</div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={onViewInvoices}
              className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform"
            >
              <span>View Invoices</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-900 py-4 rounded-2xl font-bold active:scale-95 transition-transform"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditPaymentSuccess;