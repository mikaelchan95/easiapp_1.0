import React from 'react';
import { CreditCard, Check, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import CreditPaymentOption from '../Credit/CreditPaymentOption';
import { useCart } from '../../hooks/useCart';

interface PaymentStepProps {
  selectedMethod: string;
  onSelectMethod: (method: string) => void;
}

const paymentMethods = [
  {
    id: 'card',
    name: 'Credit Card',
    description: 'Visa, Mastercard, Amex',
    icon: CreditCard
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    description: 'Direct payment',
    icon: CreditCard
  }
];

const PaymentStep: React.FC<PaymentStepProps> = ({ selectedMethod, onSelectMethod }) => {
  const { state } = useApp();
  const { cartSummary } = useCart();
  const isTradeAccount = state.user?.role === 'trade';

  return (
    <div className="px-4 py-6 space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Method</h2>
        <p className="text-gray-600">Choose how to pay</p>
      </div>
      
      <div className="space-y-4">
        {/* Credit Payment Option - Only for trade accounts */}
        {isTradeAccount && (
          <CreditPaymentOption
            orderAmount={cartSummary.total}
            isSelected={selectedMethod === 'credit'}
            onSelect={() => onSelectMethod('credit')}
          />
        )}

        {/* Standard Payment Methods */}
        {paymentMethods.map((method) => {
          const IconComponent = method.icon;
          return (
            <button
              key={method.id}
              onClick={() => onSelectMethod(method.id)}
              className={`w-full p-6 rounded-3xl border-2 transition-all duration-200 active:scale-95 ${
                selectedMethod === method.id 
                  ? 'border-black bg-black text-white' 
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  selectedMethod === method.id ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  <IconComponent className={`w-6 h-6 ${
                    selectedMethod === method.id ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-lg">{method.name}</div>
                  <div className={`text-sm ${
                    selectedMethod === method.id ? 'text-gray-200' : 'text-gray-500'
                  }`}>
                    {method.description}
                  </div>
                </div>
                {selectedMethod === method.id && (
                  <Check className="w-6 h-6 text-white" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-blue-50 p-6 rounded-3xl border border-blue-200">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 mb-2">Secure Payment</h3>
            <p className="text-sm text-blue-700 leading-relaxed">
              256-bit SSL encryption protects your payment data
            </p>
          </div>
        </div>
      </div>

      {/* Credit Terms for trade accounts */}
      {isTradeAccount && selectedMethod === 'credit' && (
        <div className="bg-purple-50 p-6 rounded-3xl border border-purple-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-purple-900 mb-2">Credit Terms</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Payment due within 30 days of invoice</li>
                <li>• Late payments may incur additional fees</li>
                <li>• Credit subject to account standing</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentStep;