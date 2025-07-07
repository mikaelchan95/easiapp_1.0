import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Shield, 
  Truck,
  Clock,
  Award,
  Package,
  Info,
  Check
} from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { getCategoryIcon, Icon } from '../../utils/icons';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onClose }) => {
  const { state, addToCart } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddedConfirmation, setShowAddedConfirmation] = useState(false);
  
  const price = state.user?.role === 'trade' ? product.tradePrice : product.retailPrice;
  const savings = state.user?.role === 'trade' ? product.retailPrice - product.tradePrice : 0;
  const CategoryIcon = getCategoryIcon(product.category);

  const handleAddToCart = () => {
    if (!state.user || isAdding || product.stock === 0) return;
    
    setIsAdding(true);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    setTimeout(() => {
      addToCart(product, quantity);
      setIsAdding(false);
      setShowAddedConfirmation(true);
      
      // Hide confirmation after 2 seconds
      setTimeout(() => {
        setShowAddedConfirmation(false);
      }, 2000);
    }, 600);
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(q => q + 1);
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            aria-label="Close product details"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
          
          {/* Product Image */}
          <div className="aspect-square bg-gray-50 relative overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain"
            />
            
            {/* Stock Status Badge */}
            <div className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md ${
              product.stock > 10 
                ? 'bg-green-500/90 text-white' 
                : product.stock > 0 
                  ? 'bg-amber-500/90 text-white'
                  : 'bg-red-500/90 text-white'
            }`}>
              {product.stock > 10 
                ? 'In Stock' 
                : product.stock > 0 
                  ? `Only ${product.stock} left`
                  : 'Out of Stock'
              }
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[50vh]">
          {/* Category & SKU */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon 
                icon={CategoryIcon} 
                size="sm" 
                className="text-gray-500"
                aria-label={product.category}
              />
              <span className="text-sm font-medium text-gray-500 capitalize">
                {product.category}
              </span>
            </div>
            <span className="text-sm text-gray-400">SKU: {product.sku}</span>
          </div>

          {/* Name & Price */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-bold text-gray-900">${price.toFixed(0)}</span>
              {savings > 0 && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    ${product.retailPrice.toFixed(0)}
                  </span>
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                    Save ${savings.toFixed(0)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed">{product.description}</p>

          {/* Features */}
          <div className="space-y-3">
            {product.sameDayEligible && (
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Truck className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Same Day Delivery</p>
                  <p className="text-gray-500">Order before 2PM</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">100% Authentic</p>
                <p className="text-gray-500">Guaranteed genuine product</p>
              </div>
            </div>

            {product.featured && (
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Award className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Featured Product</p>
                  <p className="text-gray-500">Highly recommended</p>
                </div>
              </div>
            )}
          </div>

          {/* Quantity Selector */}
          {state.user && product.stock > 0 && (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Quantity:</span>
              <div className="flex items-center bg-gray-100 rounded-xl">
                <button
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="w-10 h-10 flex items-center justify-center active:bg-gray-200 rounded-l-xl transition-colors disabled:opacity-50"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-bold">{quantity}</span>
                <button
                  onClick={incrementQuantity}
                  disabled={quantity >= product.stock}
                  className="w-10 h-10 flex items-center justify-center active:bg-gray-200 rounded-r-xl transition-colors disabled:opacity-50"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-gray-500">
                ${(price * quantity).toFixed(0)} total
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100">
          {state.user ? (
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isAdding}
              className={`w-full h-14 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all active:scale-95 ${
                product.stock === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : showAddedConfirmation
                    ? 'bg-green-500 text-white'
                    : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {isAdding ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Adding...</span>
                </>
              ) : showAddedConfirmation ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-3">Please sign in to purchase</p>
              <button className="text-black font-bold underline">
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;