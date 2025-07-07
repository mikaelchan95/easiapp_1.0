import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useCredit } from '../../hooks/useCredit';
import { useApp } from '../../context/AppContext';

interface CreditSummaryProps {
  showDetails?: boolean;
}

const CreditSummary: React.FC<CreditSummaryProps> = ({ showDetails = true }) => {
  const { 
    creditAccount, 
    creditUtilization, 
    creditStatus,
    formatCurrency,
    formatPaymentTerms 
  } = useCredit();
  
  const { state } = useApp();
  const userName = state.user?.name || 'User';

  if (!creditAccount) return null;

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'bg-red-500';
    if (utilization >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    switch (creditStatus.status) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-gray-900">{userName}'s Credit Account</h3>
          <p className="text-sm text-gray-500">Trade account benefits</p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`text-sm font-bold ${
            creditStatus.status === 'critical' ? 'text-red-600' :
            creditStatus.status === 'warning' ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {creditStatus.message}
          </span>
        </div>
      </div>

      {/* Credit Limit Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-gray-700">Credit Usage</span>
          <span className="text-sm font-bold text-gray-900">
            {creditUtilization.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getUtilizationColor(creditUtilization)}`}
            style={{ width: `${Math.min(creditUtilization, 100)}%` }}
          />
        </div>
      </div>

      {/* Credit Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <div className="text-xs font-bold text-gray-500 uppercase mb-2">Available</div>
          <div className="font-bold text-gray-900 text-xl">
            {formatCurrency(creditAccount.availableCredit)}
          </div>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <div className="text-xs font-bold text-gray-500 uppercase mb-2">Limit</div>
          <div className="font-bold text-gray-900 text-xl">
            {formatCurrency(creditAccount.creditLimit)}
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Payment Terms</span>
            <span className="font-bold text-gray-900">
              {formatPaymentTerms(creditAccount.paymentTerms)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Credit Score</span>
            <span className="font-bold text-gray-900">
              {creditAccount.creditScore}
            </span>
          </div>
          {creditAccount.nextPaymentDue && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Next Payment</span>
              <span className="font-bold text-gray-900">
                {new Date(creditAccount.nextPaymentDue).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreditSummary;