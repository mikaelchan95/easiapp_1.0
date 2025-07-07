import React from 'react';
import { CheckCircle, Truck, MapPin, Package } from 'lucide-react';
import { Reward } from '../../../types/rewards';
import { DELIVERY_METHODS } from '../../../data/rewards';

interface DetailsStepProps {
  selectedReward: Reward;
  selectedDeliveryMethod: string;
  setSelectedDeliveryMethod: (method: string) => void;
  onProceed: () => void;
  onBack: () => void;
}

const DetailsStep: React.FC<DetailsStepProps> = ({
  selectedReward,
  selectedDeliveryMethod,
  setSelectedDeliveryMethod,
  onProceed,
  onBack
}) => {
  const isVoucher = selectedReward.type === 'voucher';
  const isProduct = selectedReward.type === 'product';
  const isExperience = selectedReward.type === 'experience';

  return (
    <>
      <div className="px-6 py-4 overflow-y-auto flex-1">
        {(isVoucher || isExperience) && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Delivery</h3>
              <div className="space-y-3">
                {DELIVERY_METHODS.slice(0, 1).map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedDeliveryMethod(method.id)}
                      className={`w-full p-4 rounded-2xl border-2 transition-all text-left active:scale-95 ${
                        selectedDeliveryMethod === method.id
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900">{method.name}</div>
                          <div className="text-sm text-gray-600">{method.description}</div>
                        </div>
                        <div className="text-sm font-bold text-gray-900">{method.time}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-900 mb-1">Valid {selectedReward.validUntil}</h4>
                  <p className="text-sm text-blue-700">
                    Use at participating stores
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isProduct && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Shipping</h3>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-bold text-gray-900">John Doe</div>
                    <div className="text-sm text-gray-600">123 Marina Bay Sands, #12-34</div>
                    <div className="text-sm text-gray-600">Singapore 018956</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="flex items-start space-x-3">
                <Truck className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-green-900 mb-1">Free Delivery</h4>
                  <p className="text-sm text-green-700">3-5 days, age verification required</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="px-6 py-4 border-t border-gray-100 bg-white flex-shrink-0">
        <div className="space-y-3">
          <button
            onClick={onProceed}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold active:scale-95 transition-transform"
          >
            {isExperience ? 'Get Voucher' : 'Confirm'}
          </button>
          <button
            onClick={onBack}
            className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold active:scale-95 transition-transform"
          >
            Back
          </button>
        </div>
      </div>
    </>
  );
};

export default DetailsStep;