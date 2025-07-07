import React from 'react';
import { ArrowRight, Info } from 'lucide-react';
import { Reward } from '../../../types/rewards';

interface ConfirmStepProps {
  selectedReward: Reward;
  userPoints: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmStep: React.FC<ConfirmStepProps> = ({
  selectedReward,
  userPoints,
  onConfirm,
  onCancel
}) => {
  const IconComponent = selectedReward.icon;
  const remainingPoints = userPoints - selectedReward.points;
  
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-6 overflow-y-auto flex-1">
        {/* Reward Details */}
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <IconComponent className="w-8 h-8 text-gray-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-xl mb-1">{selectedReward.title}</h3>
            <p className="text-gray-600">{selectedReward.description}</p>
            {selectedReward.originalValue && (
              <div className="mt-2 bg-gray-100 inline-block px-3 py-1 rounded-lg">
                <span className="text-sm font-bold text-gray-900">
                  ${selectedReward.originalValue} value
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Points Summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-3">
          <h3 className="font-bold text-gray-900 mb-3">Points Summary</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Cost</span>
              <span className="font-bold text-red-600 text-lg">
                -{selectedReward.points.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Current Balance</span>
              <span className="font-bold text-gray-900">
                {userPoints.toLocaleString()}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">Remaining Balance</span>
                <span className={`font-bold text-lg ${remainingPoints < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {remainingPoints.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
          <p className="text-sm text-primary-800 flex items-start">
            <Info className="w-4 h-4 text-primary-800 mr-2 flex-shrink-0" />
            <span>
              This reward will be deducted from your points balance. Once redeemed, it cannot be reversed.
            </span>
          </p>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="px-4 py-4 border-t border-gray-100 bg-white">
        <div className="space-y-3">
          <button
            onClick={onConfirm}
            className="w-full bg-black text-white py-3 rounded-lg font-bold active:scale-95 transition-transform flex items-center justify-center space-x-2"
          >
            <span>Redeem {selectedReward.points.toLocaleString()} Points</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onCancel}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-bold active:scale-95 transition-transform"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmStep;