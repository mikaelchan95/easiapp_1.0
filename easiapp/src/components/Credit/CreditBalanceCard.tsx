import React from 'react';
import { CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { useCredit } from '../../hooks/useCredit';

interface CreditBalanceCardProps {
  onClick?: () => void;
}

const CreditBalanceCard: React.FC<CreditBalanceCardProps> = ({ onClick }) => {
  const { 
    creditAccount, 
    creditUtilization, 
    creditStatus,
    formatCurrency 
  } = useCredit();

  if (!creditAccount) return null;

  return (
    <button 
      onClick={onClick}
      className="w-full bg-black rounded-2xl p-3.5 shadow-sm text-left active:scale-95 transition-transform"
      disabled={!onClick}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-xs font-bold text-white/80 uppercase tracking-wide">Credit</div>
        <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
          <CreditCard className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      
      <div className="text-lg font-bold text-white mb-1.5">${creditAccount.availableCredit.toLocaleString()}</div>
      
      {/* Credit Usage Bar */}
      <div className="mb-1.5">
        <div className="w-full bg-white/10 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all duration-500 ${
              creditUtilization >= 90 ? 'bg-red-500' :
              creditUtilization >= 70 ? 'bg-yellow-500' :
              'bg-primary-500'
            }`}
            style={{ width: `${Math.min(creditUtilization, 100)}%` }}
          />
        </div>
      </div>
      
      {/* Status */}
      <div className="flex items-center space-x-1.5">
        {creditUtilization >= 70 ? (
          <AlertTriangle className="w-3 h-3 text-yellow-400" />
        ) : (
          <TrendingUp className="w-3 h-3 text-primary-400" />
        )}
        <span className="text-xs text-white/80">
          {creditStatus.message}
        </span>
      </div>
    </button>
  );
};

export default CreditBalanceCard;