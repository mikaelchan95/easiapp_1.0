import React from 'react';
import { X } from 'lucide-react';
import { RedemptionStep, Reward } from '../../../types/rewards';
import ConfirmStep from './ConfirmStep';
import DetailsStep from './DetailsStep';
import ProcessingStep from './ProcessingStep';
import SuccessStep from './SuccessStep';

interface RedemptionModalProps {
  selectedReward: Reward;
  redemptionStep: RedemptionStep;
  userPoints: number;
  selectedDeliveryMethod: string;
  setSelectedDeliveryMethod: (method: string) => void;
  generatedCode: string;
  generatedVoucherCode: string;
  copiedCode: boolean;
  copiedVoucher: boolean;
  onConfirm: () => void;
  onProceed: () => void;
  onReset: () => void;
  onCopyCode: () => void;
  onCopyVoucherCode: () => void;
  onStepBack: () => void;
}

const RedemptionModal: React.FC<RedemptionModalProps> = ({
  selectedReward,
  redemptionStep,
  userPoints,
  selectedDeliveryMethod,
  setSelectedDeliveryMethod,
  generatedCode,
  generatedVoucherCode,
  copiedCode,
  copiedVoucher,
  onConfirm,
  onProceed,
  onReset,
  onCopyCode,
  onCopyVoucherCode,
  onStepBack
}) => {
  const getStepTitle = () => {
    switch (redemptionStep) {
      case 'confirm': return 'Redeem Reward';
      case 'details': return 'Reward Details';
      case 'processing': return 'Processing';
      case 'success': return 'Complete';
      default: return 'Redeem Reward';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-sm max-h-[85vh] overflow-hidden animate-scale-in flex flex-col relative m-4">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{getStepTitle()}</h2>
          {redemptionStep !== 'processing' && (
            <button 
              onClick={onReset}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
        
        {/* Step Content */}
        {redemptionStep === 'confirm' && (
          <ConfirmStep
            selectedReward={selectedReward}
            userPoints={userPoints}
            onConfirm={onConfirm}
            onCancel={onReset}
          />
        )}
        
        {redemptionStep === 'details' && (
          <DetailsStep
            selectedReward={selectedReward}
            selectedDeliveryMethod={selectedDeliveryMethod}
            setSelectedDeliveryMethod={setSelectedDeliveryMethod}
            onProceed={onProceed}
            onBack={onStepBack}
          />
        )}
        
        {redemptionStep === 'processing' && (
          <ProcessingStep selectedReward={selectedReward} />
        )}
        
        {redemptionStep === 'success' && (
          <SuccessStep
            selectedReward={selectedReward}
            generatedCode={generatedCode}
            generatedVoucherCode={generatedVoucherCode}
            copiedCode={copiedCode}
            copiedVoucher={copiedVoucher}
            onCopyCode={onCopyCode}
            onCopyVoucherCode={onCopyVoucherCode}
            onDone={onReset}
          />
        )}
      </div>
    </div>
  );
};

export default RedemptionModal;