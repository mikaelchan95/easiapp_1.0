import React from 'react';
import { QrCode, Copy, Check, Share2 } from 'lucide-react';
import { RedeemedVoucher } from '../../types/rewards';
import { formatDate, getStatusColor } from '../../utils/rewards';

interface VoucherCardProps {
  voucher: RedeemedVoucher;
  index: number;
  onCopyVoucherCode: (code: string) => void;
  copiedVoucher: boolean;
}

const VoucherCard: React.FC<VoucherCardProps> = ({
  voucher,
  index,
  onCopyVoucherCode,
  copiedVoucher
}) => {
  const IconComponent = voucher.reward.icon;
  const [isExpanded, setIsExpanded] = React.useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className="bg-white rounded-xl border border-gray-100 animate-fade-in shadow-sm"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {/* Compact header - always visible */}
      <div 
        className="p-3 flex items-center justify-between cursor-pointer"
        onClick={toggleExpand}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <IconComponent className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{voucher.reward.title}</h3>
            <div className="flex items-center space-x-2">
              <div className={`text-xs px-2 py-0.5 rounded-md font-medium ${getStatusColor(voucher.status)}`}>
                {voucher.status === 'active' ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Active</span>
                  </div>
                ) : (
                  voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1)
                )}
              </div>
              <span className="text-xs text-gray-500">Expires {formatDate(voucher.expiresAt)}</span>
            </div>
          </div>
        </div>
        <div className="text-sm font-bold text-gray-900">${voucher.reward.originalValue}</div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-3 animate-fade-in">
          {/* Voucher Code */}
          {(voucher.voucherCode || voucher.discountCode) && (
            <div className="mb-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-bold text-gray-500">
                    {voucher.voucherCode ? 'Voucher Code' : 'Discount Code'}
                  </div>
                  <QrCode className="w-4 h-4 text-gray-500" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="font-mono text-sm font-bold text-gray-900">
                    {voucher.voucherCode || voucher.discountCode}
                  </div>
                  <button
                    onClick={() => onCopyVoucherCode(voucher.voucherCode || voucher.discountCode || '')}
                    className="bg-gray-900 text-white px-2 py-1.5 rounded-lg flex items-center space-x-1 text-xs font-bold active:scale-95 transition-transform"
                  >
                    {copiedVoucher ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Details */}
          <div className="text-xs text-gray-600 leading-relaxed mb-4">
            {voucher.reward.description}
          </div>

          {/* Actions */}
          {voucher.status === 'active' && (
            <div className="flex space-x-2">
              <button 
                className="flex-1 bg-black text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 active:scale-95 transition-transform"
              >
                <QrCode className="w-3 h-3" />
                <span>Show QR</span>
              </button>
              <button 
                className="flex-1 bg-gray-100 text-gray-900 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 border border-gray-200 active:scale-95 transition-transform"
              >
                <Share2 className="w-3 h-3" />
                <span>Share</span>
              </button>
            </div>
          )}

          {/* Used info */}
          {voucher.status === 'used' && voucher.usedAt && (
            <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600 text-center">
              Used on {formatDate(voucher.usedAt)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoucherCard;