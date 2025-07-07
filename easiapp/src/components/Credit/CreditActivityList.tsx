import React from 'react';
import { DollarSign, ArrowDownLeft, Calendar } from 'lucide-react';
import { CreditPayment } from '../../types/credit';
import { useCredit } from '../../hooks/useCredit';

interface CreditActivityListProps {
  payments: CreditPayment[];
  isLoading?: boolean;
}

const CreditActivityList: React.FC<CreditActivityListProps> = ({ 
  payments,
  isLoading = false
}) => {
  const { formatCurrency } = useCredit();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
              <div className="w-16 h-5 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 text-center">
        <DollarSign className="w-6 h-6 text-gray-400 mx-auto mb-2" />
        <h3 className="font-bold text-gray-900 mb-1">No Payment Activity</h3>
        <p className="text-sm text-gray-600">Your payment history will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div 
          key={payment.id}
          className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <ArrowDownLeft className="w-5 h-5 text-primary-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between mb-0.5">
                <h3 className="font-bold text-gray-900 text-sm">Payment Received</h3>
                <span className="font-bold text-gray-900">{formatCurrency(payment.amount)}</span>
              </div>
              
              <div className="flex justify-between">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {new Date(payment.paymentDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: '2-digit'
                    })}
                  </span>
                </div>
                <div className="text-xs font-medium text-primary-600">Completed</div>
              </div>
            </div>
          </div>
          
          <div className="mt-2.5 pt-2.5 border-t border-gray-100 text-xs text-gray-500">
            {payment.paymentMethod.replace('_', ' ')} • Ref: {payment.reference.slice(-6)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CreditActivityList;