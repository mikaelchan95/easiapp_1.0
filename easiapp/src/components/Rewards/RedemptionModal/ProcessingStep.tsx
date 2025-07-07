import React from 'react';
import { Reward } from '../../../types/rewards';

interface ProcessingStepProps {
  selectedReward: Reward;
}

const ProcessingStep: React.FC<ProcessingStepProps> = ({ selectedReward }) => {
  const getMessage = () => {
    switch (selectedReward.type) {
      case 'credit': return 'Adding credit...';
      case 'discount': return 'Generating code...';
      case 'voucher': return 'Creating voucher...';
      case 'product': return 'Processing order...';
      case 'experience': return 'Preparing voucher...';
      default: return 'Processing...';
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-6"></div>
        <h3 className="font-bold text-gray-900 mb-2">Processing</h3>
        <p className="text-gray-600">{getMessage()}</p>
      </div>
    </div>
  );
};

export default ProcessingStep;