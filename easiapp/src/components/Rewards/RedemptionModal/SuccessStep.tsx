import React from 'react';
import { Copy, Check, QrCode, Share2, Download, ArrowRight, Info } from 'lucide-react';
import { Reward } from '../../../types/rewards';

interface SuccessStepProps {
  selectedReward: Reward;
  generatedCode: string;
  generatedVoucherCode: string;
  copiedCode: boolean;
  copiedVoucher: boolean;
  onCopyCode: () => void;
  onCopyVoucherCode: () => void;
  onDone: () => void;
}

const SuccessStep: React.FC<SuccessStepProps> = ({
  selectedReward,
  generatedCode,
  generatedVoucherCode,
  copiedCode,
  copiedVoucher,
  onCopyCode,
  onCopyVoucherCode,
  onDone
}) => {
  const isCredit = selectedReward.type === 'credit';
  const isDiscount = selectedReward.type === 'discount';
  const isVoucher = selectedReward.type === 'voucher';
  const isProduct = selectedReward.type === 'product';
  const isExperience = selectedReward.type === 'experience';
  const IconComponent = selectedReward.icon;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex-1 overflow-y-auto">
        {/* Success Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-4 border-white rounded-full"></div>
            <div className="absolute left-1/2 top-1/2 h-4 w-2 border-r-4 border-b-4 border-white transform rotate-45 translate-y-[-4px] translate-x-[-9px]"></div>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-1">Success!</h3>
          <p className="text-gray-600 text-sm">Your reward has been added to your account</p>
        </div>
        
        {/* Reward Content */}
        {isCredit && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <IconComponent className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="font-bold text-gray-900">${selectedReward.originalValue} Credit Added</div>
                <div className="text-sm text-gray-600">Available in your account</div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <div className="flex items-center justify-center">
                <div className="font-bold text-green-700">Balance Updated</div>
              </div>
            </div>
          </div>
        )}

        {isDiscount && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <IconComponent className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="font-bold text-gray-900">{selectedReward.discount} Discount</div>
                <div className="text-sm text-gray-600">Use at checkout</div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
              <div className="text-xs font-bold text-gray-500 mb-1">Code</div>
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-gray-900">{generatedCode}</span>
                <button
                  onClick={onCopyCode}
                  className="bg-black text-white px-2 py-1 rounded-md text-xs font-bold flex items-center space-x-1"
                >
                  {copiedCode ? (
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
            <div className="text-xs text-gray-600 text-center">
              Valid for orders above $200
            </div>
          </div>
        )}

        {(isVoucher || isExperience) && (
          <div className="bg-black rounded-xl p-4 text-white mb-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-lg">{selectedReward.title}</h4>
                <p className="text-gray-300 text-sm">{selectedReward.description}</p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-3 mb-3">
              <div className="text-xs font-bold text-gray-300 mb-1">Code</div>
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-white">{generatedVoucherCode}</span>
                <button
                  onClick={onCopyVoucherCode}
                  className="bg-white/20 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center space-x-1"
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
            
            <div className="flex justify-between text-sm">
              <div>
                <div className="font-bold">${selectedReward.originalValue}</div>
                <div className="text-gray-300 text-xs">Value</div>
              </div>
              <div className="text-right">
                <div className="font-bold">#{generatedVoucherCode.slice(-4)}</div>
                <div className="text-gray-300 text-xs">Valid {selectedReward.validUntil}</div>
              </div>
            </div>
          </div>
        )}

        {isProduct && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <IconComponent className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="font-bold text-gray-900">{selectedReward.title}</div>
                <div className="text-sm text-gray-600">Will be delivered to your address</div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="text-sm text-blue-800 text-center">
                Order #RWD{Date.now().toString().slice(-6)} has been created
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <button
          onClick={onDone}
          className="w-full bg-black text-white py-3 rounded-lg font-bold active:scale-95 transition-transform flex items-center justify-center space-x-2"
        >
          <span>Done</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SuccessStep;