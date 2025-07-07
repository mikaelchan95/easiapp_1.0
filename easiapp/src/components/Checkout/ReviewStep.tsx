import React from 'react';
import { MapPin, Calendar, Package, Truck } from 'lucide-react';
import { CartItem } from '../../types';
import { CheckoutState } from '../../types/cart';
import { formatPrice, getItemPrice } from '../../utils/cart';

interface ReviewStepProps {
  cart: CartItem[];
  checkoutState: CheckoutState;
  total: number;
  userRole?: string;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ 
  cart, 
  checkoutState, 
  total, 
  userRole 
}) => {
  const isSameDayDelivery = checkoutState.deliverySlot?.sameDayAvailable;
  const deliveryFee = checkoutState.deliverySlot?.price || 0;

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Order</h2>
        <p className="text-gray-600">Check everything looks good</p>
      </div>
      
      {/* Items */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-4">Items ({cart.length})</h3>
        <div className="space-y-4">
          {cart.map((item, index) => {
            const price = getItemPrice(item, userRole);
            return (
              <div 
                key={item.product.id} 
                className="flex items-center space-x-4 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-14 h-14 object-cover rounded-2xl"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 line-clamp-1">{item.product.name}</h4>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <span className="font-bold text-gray-900">{formatPrice(price * item.quantity)}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Address */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-4">Delivery</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-gray-500" />
            <div className="text-gray-700">
              {checkoutState.address.street}{checkoutState.address.unit && `, ${checkoutState.address.unit}`}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Truck className="w-5 h-5 text-gray-500" />
            <div className="text-gray-700">
              {isSameDayDelivery ? 'Same-day delivery' : 'Standard delivery'}
            </div>
          </div>
          {checkoutState.deliverySlot && (
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div className="text-gray-700">
                {checkoutState.deliverySlot.date} • {checkoutState.deliverySlot.timeSlot}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Total */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200">
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-bold text-gray-900">{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">GST (9%)</span>
            <span className="font-bold text-gray-900">{formatPrice(total * 0.09)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery</span>
            {deliveryFee > 0 ? (
              <span className="font-bold text-gray-900">${deliveryFee.toFixed(2)}</span>
            ) : (
              <span className="font-bold text-green-600">Free</span>
            )}
          </div>
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between">
              <span className="font-bold text-gray-900 text-xl">Total</span>
              <span className="font-bold text-2xl text-gray-900">{formatPrice(total * 1.09 + deliveryFee)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;