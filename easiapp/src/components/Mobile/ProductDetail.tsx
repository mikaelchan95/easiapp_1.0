import React, { useState, useEffect } from 'react';
import { X, Heart, Minus, Plus, ShoppingCart, Share2, Shield, Check, Truck } from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../context/NavigationContext';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onClose }) => {
  const { addToCart, state } = useApp();
  const { hideNavigation, showNavigation } = useNavigation();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const price = state.user?.role === 'trade' ? product.tradePrice : product.retailPrice;
  const savings = state.user?.role === 'trade' ? product.retailPrice - product.tradePrice : 0;

  // Hide navigation when modal is open
  useEffect(() => {
    hideNavigation();
    return () => showNavigation();
  }, [hideNavigation, showNavigation]);

  const handleAddToCart = () => {
    if (state.user && !isAdding && product.stock > 0) {
      setIsAdding(true);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 25, 50]);
      }
      
      setTimeout(() => {
        addToCart(product, quantity);
        setIsAdding(false);
        setJustAdded(true);
        
        setTimeout(() => {
          setJustAdded(false);
          onClose();
        }, 1500);
      }, 800);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out this premium ${product.category}`,
        url: window.location.href
      });
    }
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-100 rounded-t-3xl">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex space-x-2">
              <button 
                onClick={handleFavorite}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-500'}`} />
              </button>
              <button 
                onClick={handleShare}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              >
                <Share2 className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          <div className="p-4 space-y-6">
            {/* Product Image */}
            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                loading="lazy"
              />
            </div>
            
            {/* Category & Status */}
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-500 capitalize bg-gray-100 px-3 py-1 rounded-lg">
                {product.category}
              </div>
              <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                product.stock > 10 ? 'bg-green-100 text-green-700' : 
                product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 
                'bg-red-100 text-red-700'
              }`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>
            
            {/* Price */}
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-bold text-gray-900">
                ${price.toFixed(0)}
              </span>
              {savings > 0 && (
                <span className="text-lg text-gray-500 line-through">
                  ${product.retailPrice.toFixed(0)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-700 leading-relaxed">
              {product.description}
            </p>
            
            {/* Trust Signals */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Product Details</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Authentic</h3>
                    <p className="text-sm text-gray-600">Verified source with certificate</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Premium Quality</h3>
                    <p className="text-sm text-gray-600">Temperature controlled storage</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Truck className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Fast Delivery</h3>
                    <p className="text-sm text-gray-600">Same-day delivery available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-gray-900">Quantity</span>
            <div className="flex items-center space-x-3 bg-gray-50 rounded-xl p-2 border border-gray-100">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-600 active:scale-95 transition-transform border border-gray-200"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-gray-900 w-8 text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-600 active:scale-95 transition-transform border border-gray-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || !state.user || isAdding}
            className="w-full h-12 bg-black text-white rounded-xl font-bold disabled:bg-gray-300 flex items-center justify-center space-x-3 active:scale-95 transition-transform relative overflow-hidden"
          >
            {justAdded ? (
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5" />
                <span>Added to Cart!</span>
              </div>
            ) : isAdding ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>Adding...</span>
              </div>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                <span>
                  {!state.user ? 'Sign In to Purchase' : 
                   product.stock === 0 ? 'Out of Stock' : 
                   `Add to Cart • $${(price * quantity).toFixed(0)}`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;