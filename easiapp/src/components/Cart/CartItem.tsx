import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '../../types';
import { formatPrice, getItemPrice, calculateItemTotal } from '../../utils/cart';

interface CartItemProps {
  item: CartItemType;
  userRole?: string;
  isRemoving?: boolean;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  index: number;
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  userRole,
  isRemoving,
  onUpdateQuantity,
  onRemove,
  index
}) => {
  const itemPrice = getItemPrice(item, userRole);
  const itemTotal = calculateItemTotal(item, userRole);

  return (
    <div 
      className={`bg-white rounded-3xl p-6 border border-gray-200 transition-all duration-300 ${
        isRemoving ? 'opacity-0 transform scale-95' : 'animate-fade-in'
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex space-x-4">
        <div className="relative">
          <img
            src={item.product.image}
            alt={item.product.name}
            className="w-20 h-20 object-cover rounded-2xl flex-shrink-0"
          />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
            {item.quantity}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight pr-2">
              {item.product.name}
            </h3>
            <button
              onClick={() => onRemove(item.product.id)}
              className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center active:scale-95 transition-transform hover:bg-red-100 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 bg-gray-50 rounded-2xl p-2 border border-gray-200">
              <button
                onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-gray-600 active:scale-95 transition-transform"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-gray-900 w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-gray-600 active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900">
                {formatPrice(itemTotal)}
              </div>
              <div className="text-sm text-gray-500">
                {formatPrice(itemPrice)} each
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;