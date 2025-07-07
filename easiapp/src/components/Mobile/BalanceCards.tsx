import React from 'react';
import { Gift, CreditCard, User, ArrowRight } from 'lucide-react';
import { useCredit } from '../../hooks/useCredit';
import CreditBalanceCard from '../Credit/CreditBalanceCard';
import { useApp } from '../../context/AppContext';

interface BalanceCardsProps {
  onCreditClick?: () => void;
  onRewardsClick?: () => void;
  onSignIn?: () => void;
}

const BalanceCards: React.FC<BalanceCardsProps> = ({ onCreditClick, onRewardsClick, onSignIn }) => {
  const { isCreditEligible } = useCredit();
  const { state } = useApp();
  
  // User must be signed in and have trade role to access credit
  const isTradeUser = state.user?.role === 'trade';
  const isLoggedIn = !!state.user;

  return (
    <div className="px-5 pt-6 mb-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Credit Balance - Only for trade accounts */}
        {isLoggedIn && isTradeUser && isCreditEligible ? (
          <CreditBalanceCard onClick={onCreditClick} />
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-xs font-medium text-gray-500">Credit</div>
              <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5 text-gray-500" />
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900 mb-1">S$ 0</div>
            <div className="text-xs text-gray-500 font-medium">
              {isLoggedIn ? 'Not Available' : 'Sign in to view'}
            </div>
          </div>
        )}

        {/* EASI Rewards */}
        {isLoggedIn ? (
          <div 
            className="bg-black rounded-2xl p-3.5 shadow-sm active:scale-95 transition-transform"
            onClick={onRewardsClick}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-xs font-medium text-white/80">EASI Rewards</div>
              <div className="w-6 h-6 bg-primary-900/50 rounded-lg flex items-center justify-center">
                <Gift className="w-3.5 h-3.5 text-primary-400" />
              </div>
            </div>
            <div className="text-lg font-bold text-white mb-1">38,412</div>
            <div className="text-xs text-primary-400 font-medium">Points</div>
          </div>
        ) : (
          <div 
            className="bg-black rounded-2xl p-3.5 shadow-sm active:scale-95 transition-transform"
            onClick={onSignIn}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-xs font-medium text-white/80">EASI Rewards</div>
              <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                <Gift className="w-3.5 h-3.5 text-white/80" />
              </div>
            </div>
            <div className="text-base font-bold text-white mb-1">Sign In</div>
            <div className="flex items-center text-xs text-primary-400 font-medium">
              <span>View Rewards</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceCards;