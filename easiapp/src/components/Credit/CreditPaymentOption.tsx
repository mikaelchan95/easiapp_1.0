import React from 'react';
import { CreditCard, Check, AlertTriangle, TrendingUp } from 'lucide-react';
import { useCredit } from '../../hooks/useCredit';

interface CreditPaymentOptionProps {
  orderAmount: number;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

const CreditPaymentOption: React.FC<CreditPaymentOptionProps> = ({
  orderAmount,
  isSelected,
  onSelect,
  disabled = false
}) => {
  const { 
    creditAccount, 
    canUseCreditForAmount, 
    creditUtilization,
    creditStatus,
    formatCurrency,
    formatPaymentTerms 
  } = useCredit();

  if (!creditAccount) return null;

  const canUseCredit = canUseCreditForAmount(orderAmount);
  const newUtilization = ((creditAccount.usedCredit + orderAmount) / creditAccount.creditLimit) * 100;

  return (
    <button
      onClick={onSelect}
      disabled={disabled || !canUseCredit}
      className={`w-full p-6 rounded-3xl border-2 transition-all duration-200 active:scale-95 ${
        disabled || !canUseCredit
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
          : isSelected 
          ? 'border-black bg-black text-white shadow-lg' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            disabled || !canUseCredit
              ? 'bg-gray-200'
              : isSelected 
              ? 'bg-white/20' 
              : 'bg-blue-50'
          }`}>
            <CreditCard className={`w-6 h-6 ${
              disabled || !canUseCredit
                ? 'text-gray-400'
                : isSelected 
                ? 'text-white' 
                : 'text-blue-600'
            }`} />
          </div>
          <div className="text-left flex-1">
            <div className={`font-bold text-lg ${
              disabled || !canUseCredit ? 'text-gray-400' : ''
            }`}>
              Credit Account
            </div>
            <div className={`text-sm ${
              disabled || !canUseCredit
                ? 'text-gray-400'
                : isSelected 
                ? 'text-gray-200' 
                : 'text-gray-500'
            }`}>
              {formatPaymentTerms(creditAccount.paymentTerms)}
            </div>
          </div>
          {isSelected && canUseCredit && (
            <Check className="w-6 h-6 text-white" />
          )}
        </div>

        {/* Credit Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`text-left ${
            disabled || !canUseCredit ? 'opacity-50' : ''
          }`}>
            <div className={`text-xs font-bold uppercase ${
              isSelected ? 'text-gray-200' : 'text-gray-500'
            }`}>
              Available
            </div>
            <div className={`font-bold ${
              canUseCredit 
                ? isSelected ? 'text-white' : 'text-green-600'
                : 'text-red-600'
            }`}>
              {formatCurrency(creditAccount.availableCredit)}
            </div>
          </div>
          <div className={`text-right ${
            disabled || !canUseCredit ? 'opacity-50' : ''
          }`}>
            <div className={`text-xs font-bold uppercase ${
              isSelected ? 'text-gray-200' : 'text-gray-500'
            }`}>
              Limit
            </div>
            <div className={`font-bold ${
              isSelected ? 'text-white' : 'text-gray-900'
            }`}>
              {formatCurrency(creditAccount.creditLimit)}
            </div>
          </div>
        </div>

        {/* Insufficient Credit Warning */}
        {!canUseCredit && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-left">
                <div className="font-bold text-red-900 mb-1">Insufficient Credit</div>
                <div className="text-sm text-red-700">
                  Need {formatCurrency(orderAmount - creditAccount.availableCredit)} more
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage After Purchase */}
        {canUseCredit && (
          <div className={`border rounded-2xl p-4 ${
            isSelected 
              ? 'border-white/20 bg-white/10' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-bold ${
                isSelected ? 'text-gray-200' : 'text-gray-700'
              }`}>
                After Purchase
              </span>
              <TrendingUp className={`w-4 h-4 ${
                isSelected ? 'text-gray-200' : 'text-gray-500'
              }`} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className={isSelected ? 'text-gray-200' : 'text-gray-600'}>
                  Used
                </span>
                <span className={`font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(creditAccount.usedCredit + orderAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={isSelected ? 'text-gray-200' : 'text-gray-600'}>
                  Available
                </span>
                <span className={`font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(creditAccount.availableCredit - orderAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={isSelected ? 'text-gray-200' : 'text-gray-600'}>
                  Utilization
                </span>
                <span className={`font-bold ${
                  newUtilization >= 90 
                    ? 'text-red-400' 
                    : newUtilization >= 70 
                    ? 'text-yellow-400' 
                    : isSelected ? 'text-green-200' : 'text-green-600'
                }`}>
                  {newUtilization.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </button>
  );
};

export default CreditPaymentOption;