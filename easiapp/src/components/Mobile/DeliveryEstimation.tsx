import React, { useState, useEffect } from 'react';
import { Clock, Truck, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';

interface DeliveryEstimationProps {
  address: string;
  postalCode: string;
  orderValue: number;
}

type DeliverySlot = {
  id: string;
  timeRange: string;
  date: string;
  available: boolean;
  price: number;
  type: 'same-day' | 'next-day' | 'scheduled';
  popular?: boolean;
};

const DeliveryEstimation: React.FC<DeliveryEstimationProps> = ({ 
  address, 
  postalCode, 
  orderValue 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const deliverySlots: DeliverySlot[] = [
    {
      id: '1',
      timeRange: '2 PM - 6 PM',
      date: 'Today',
      available: true,
      price: orderValue >= 100 ? 0 : 8,
      type: 'same-day',
      popular: true
    },
    {
      id: '2',
      timeRange: '6 PM - 10 PM',
      date: 'Today',
      available: true,
      price: orderValue >= 100 ? 0 : 8,
      type: 'same-day'
    },
    {
      id: '3',
      timeRange: '10 AM - 2 PM',
      date: 'Tomorrow',
      available: true,
      price: orderValue >= 100 ? 0 : 5,
      type: 'next-day'
    },
    {
      id: '4',
      timeRange: '2 PM - 6 PM',
      date: 'Tomorrow',
      available: true,
      price: orderValue >= 100 ? 0 : 5,
      type: 'next-day'
    }
  ];

  useEffect(() => {
    // Simulate API call to check delivery availability
    setTimeout(() => {
      setIsLoading(false);
      setSelectedSlot(deliverySlots[0].id);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-200 animate-pulse">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="space-y-3">
          <div className="h-12 bg-gray-200 rounded-xl"></div>
          <div className="h-12 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!deliveryAvailable) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
        <div className="flex items-center space-x-3 mb-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h3 className="font-bold text-red-800">Delivery Unavailable</h3>
        </div>
        <p className="text-sm text-red-700 mb-3">
          We don't deliver to this area yet. Please try a different address or contact us.
        </p>
        <button className="text-sm font-bold text-red-600 underline">
          Contact Support
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Truck className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Delivery Options</h3>
            <p className="text-sm text-gray-600">{address}</p>
          </div>
        </div>
      </div>

      {/* Delivery Slots */}
      <div className="p-4 space-y-3">
        {deliverySlots.map((slot) => (
          <button
            key={slot.id}
            onClick={() => setSelectedSlot(slot.id)}
            disabled={!slot.available}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              selectedSlot === slot.id
                ? 'border-black bg-gray-50 scale-105'
                : slot.available
                ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-900">{slot.date}</span>
                    {slot.popular && (
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-lg text-xs font-bold">
                        Popular
                      </span>
                    )}
                    {slot.type === 'same-day' && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg text-xs font-bold">
                        Same Day
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{slot.timeRange}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  {slot.price === 0 ? (
                    <span className="text-sm font-bold text-green-600">Free</span>
                  ) : (
                    <span className="text-sm font-bold text-gray-900">${slot.price}</span>
                  )}
                </div>
                {selectedSlot === slot.id && (
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Free Delivery Info */}
      {orderValue < 100 && (
        <div className="p-4 bg-blue-50 border-t border-blue-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-800">
                Add ${(100 - orderValue).toFixed(0)} more for free delivery!
              </p>
              <p className="text-xs text-blue-700">
                Save up to $8 on delivery fees
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Age Verification Notice */}
      <div className="p-4 bg-yellow-50 border-t border-yellow-100">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-yellow-800 mb-1">Age Verification Required</p>
            <p className="text-xs text-yellow-700 leading-relaxed">
              Valid ID must be presented upon delivery. 
              Our delivery partner will verify you are 21+ before handing over alcoholic beverages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryEstimation;