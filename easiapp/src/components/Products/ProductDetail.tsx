import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Minus, Plus, ShoppingCart, Share2, Shield, Check, Truck } from 'lucide-react';
import { Product } from '../../types';
import { useProduct } from '../../hooks/useProduct';
import { formatPrice, getSameDayEligibilityLabel } from '../../utils/product';
import ProductQuantity from './ProductQuantity';
import ProductRecommendations from './ProductRecommendations';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onClose }) => {
  const {
    quantity,
    setQuantity,
    isFavorite,
    isAdding,
    justAdded,
    getPrice,
    getSavings,
    handleAddToCart,
    toggleFavorite,
    shareProduct,
    openProductDetail
  } = useProduct(product);
  
  const price = getPrice(product);
  const savings = getSavings(product);
  const contentRef = useRef<HTMLDivElement>(null);

  // Close with escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden'; // Prevent body scrolling
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = ''; // Restore body scrolling
    };
  }, [onClose]);

  // Reset scroll position when product changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [product]);

  const handleAddToCartClick = () => {
    handleAddToCart(product, quantity);
  };
  
  const handleRecommendationClick = (recommendedProduct: Product) => {
    // Close the current modal and open the new one
    setTimeout(() => {
      openProductDetail(recommendedProduct);
    }, 100);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="relative bg-white rounded-3xl w-full max-h-[92vh] flex flex-col mx-4 animate-fade-in overflow-hidden">
        {/* Header - Fixed position */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-100 rounded-t-3xl">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex space-x-2">
              <button 
                onClick={toggleFavorite}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-500'}`} />
              </button>
              <button 
                onClick={() => shareProduct(product)}
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
        <div ref={contentRef} className="flex-1 overflow-y-auto">
          {/* Product Image */}
          <div className="p-4">
            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                loading="lazy"
              />
              <span className="absolute bottom-3 right-3 w-3 h-3 rounded-full border-2 border-white bg-green-500"></span>
            </div>
          </div>
          
          {/* Product Info */}
          <div className="px-6 pb-32">
            {/* Category Badge */}
            <div className="mb-4">
              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full capitalize">
                {product.category}
              </span>
            </div>
            
            {/* Title and Price */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-sm text-gray-500 mb-4">SKU: {product.sku}</p>
            
            <div className="flex items-center mb-6">
              <div className="text-3xl font-bold text-gray-900 mr-3">
                {formatPrice(price)}
              </div>
              {savings > 0 && (
                <div className="text-lg text-gray-400 line-through">
                  {formatPrice(product.retailPrice)}
                </div>
              )}
            </div>
            
            {/* Stock Information */}
            <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <div className="text-sm font-medium text-gray-500">Availability</div>
                <div className={`font-bold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Delivery</div>
                <div className="font-bold text-gray-900">
                  {product.sameDayEligible !== false ? 'Same-day' : 'Standard'}
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>
            
            {/* Trust Signals */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Why Choose This</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Authentic</h3>
                    <p className="text-sm text-gray-600">Verified source with certificate of authenticity</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Premium Quality</h3>
                    <p className="text-sm text-gray-600">Proper storage and temperature control</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {product.sameDayEligible !== false ? 'Fast Delivery' : 'Standard Delivery'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {getSameDayEligibilityLabel(product)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recommendations */}
            <ProductRecommendations
              product={product}
              onProductClick={handleRecommendationClick}
            />
          </div>
        </div>
        
        {/* Fixed Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 p-4 rounded-b-3xl">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-gray-900">Quantity</span>
            <ProductQuantity 
              quantity={quantity}
              onChange={setQuantity}
              max={product.stock}
              disabled={product.stock <= 0}
            />
          </div>
          
          <button
            onClick={handleAddToCartClick}
            disabled={product.stock <= 0 || isAdding}
            className={`w-full h-12 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all ${
              justAdded
                ? 'bg-green-500 text-white'
                : product.stock <= 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white active:scale-95'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-5 h-5" />
                <span>Added to Cart</span>
              </>
            ) : isAdding ? (
              <>
                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                <span>Adding...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                <span>{product.stock <= 0 ? 'Out of Stock' : `Add to Cart • ${formatPrice(price * quantity)}`}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;