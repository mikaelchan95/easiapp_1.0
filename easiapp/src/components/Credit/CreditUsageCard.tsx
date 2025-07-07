import React from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { CreditAccount } from '../../types/credit';
import { useCredit } from '../../hooks/useCredit';

interface CreditUsageCardProps {
  creditAccount: CreditAccount;
  onViewHistory: () => void;
}

const CreditUsageCard: React.FC<CreditUsageCardProps> = ({ 
  creditAccount,
  onViewHistory
}) => {
  const { 
    creditUtilization, 
    creditStatus, 
    formatCurrency 
  } = useCredit();

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'bg-red-500';
    if (utilization >= 70) return 'bg-yellow-500';
    return 'bg-primary-500';
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <div className="p-4 bg-black text-white">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-bold">Credit Usage</h2>
          <button 
            onClick={onViewHistory}
            className="text-xs font-bold text-white/90 bg-white/10 py-1.5 px-3 rounded-lg active:scale-95 transition-transform"
          >
            View History
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white/10 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="text-xs text-white/80 mb-1">Available</div>
            <div className="text-base font-bold">{formatCurrency(creditAccount.availableCredit)}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="text-xs text-white/80 mb-1">Credit Limit</div>
            <div className="text-base font-bold">{formatCurrency(creditAccount.creditLimit)}</div>
          </div>
        </div>
        
        {/* Usage Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-white/80 mb-1.5">
            <span>Usage</span>
            <span>{creditUtilization.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getUtilizationColor(creditUtilization)}`}
              style={{ width: `${Math.min(creditUtilization, 100)}%` }}
            />
          </div>
        </div>
        
        {/* Status Message */}
        <div className="flex items-center space-x-2">
          {creditUtilization >= 70 ? (
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
          ) : (
            <TrendingUp className="w-4 h-4 text-primary-400" />
          )}
          <span className="text-xs font-bold text-white/90">
            {creditStatus.message}
          </span>
        </div>
      </div>
      
      {/* Credit Terms */}
      <div className="grid grid-cols-2 divide-x divide-gray-100 text-center">
        <div className="p-3">
          <div className="text-xs text-gray-500">Used Credit</div>
          <div className="font-bold text-gray-900">{formatCurrency(creditAccount.usedCredit)}</div>
        </div>
        <div className="p-3">
          <div className="text-xs text-gray-500">Terms</div>
          <div className="font-bold text-gray-900">Net {creditAccount.paymentTerms}</div>
        </div>
      </div>
    </div>
  );
};

export default CreditUsageCard;