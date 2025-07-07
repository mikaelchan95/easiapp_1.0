import React from 'react';
import { Gift, TicketX } from 'lucide-react';
import { RedeemedVoucher } from '../../types/rewards';
import VoucherCard from './VoucherCard';

interface RedeemedVouchersProps {
  vouchers: RedeemedVoucher[];
  onViewModeChange: (mode: 'browse') => void;
  onCopyVoucherCode: (code: string) => void;
  copiedVoucher: boolean;
}

const RedeemedVouchers: React.FC<RedeemedVouchersProps> = ({
  vouchers,
  onViewModeChange,
  onCopyVoucherCode,
  copiedVoucher
}) => {
  if (vouchers.length === 0) {
    return (
      <div className="px-4 flex-1 flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 animate-bounce-in">
          <TicketX className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 animate-fade-in">No Vouchers</h3>
        <p className="text-gray-500 text-center mb-6 animate-fade-in">Redeem rewards to see them here</p>
        <button
          onClick={() => onViewModeChange('browse')}
          className="bg-black text-white px-6 py-3 rounded-lg font-bold active:scale-95 transition-transform animate-fade-in"
        >
          Browse Rewards
        </button>
      </div>
    );
  }

  // Count active and expired/used vouchers
  const activeVouchers = vouchers.filter(v => v.status === 'active');
  const otherVouchers = vouchers.filter(v => v.status !== 'active');

  return (
    <div className="px-4 pb-24">
      {/* Active section */}
      {activeVouchers.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <Gift className="w-3 h-3 text-green-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Active Vouchers</h3>
          </div>
          
          <div className="space-y-3">
            {activeVouchers.map((voucher, index) => (
              <VoucherCard
                key={voucher.id}
                voucher={voucher}
                index={index}
                onCopyVoucherCode={onCopyVoucherCode}
                copiedVoucher={copiedVoucher}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past vouchers section */}
      {otherVouchers.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
              <TicketX className="w-3 h-3 text-gray-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Past Vouchers</h3>
          </div>
          
          <div className="space-y-3">
            {otherVouchers.map((voucher, index) => (
              <VoucherCard
                key={voucher.id}
                voucher={voucher}
                index={index}
                onCopyVoucherCode={onCopyVoucherCode}
                copiedVoucher={copiedVoucher}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* No active vouchers but has past vouchers */}
      {activeVouchers.length === 0 && otherVouchers.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => onViewModeChange('browse')}
            className="w-full bg-gray-100 text-gray-900 border border-gray-200 py-3 rounded-lg font-bold my-4 active:scale-95 transition-transform"
          >
            Browse Rewards
          </button>
        </div>
      )}
    </div>
  );
};

export default RedeemedVouchers;