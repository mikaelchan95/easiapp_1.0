/**
 * Centralized Pricing Utility for Singapore Market
 * Handles retail/trade pricing, GST calculation, and formatting
 */

export interface Product {
  id: string;
  name: string;
  retailPrice: number;
  tradePrice: number;
  stock: number;
  category: string;
  description: string;
  sku: string;
  image: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type UserRole = 'retail' | 'trade';

// Singapore GST rate
export const GST_RATE = 0.09; // 9%

/**
 * Get the base price for a product based on user role
 */
export const getBasePrice = (product: Product, userRole: UserRole): number => {
  return userRole === 'trade' ? product.tradePrice : product.retailPrice;
};

/**
 * Calculate GST amount for a given price
 */
export const calculateGST = (basePrice: number): number => {
  return basePrice * GST_RATE;
};

/**
 * Get total price including GST
 */
export const getPriceWithGST = (basePrice: number): number => {
  return basePrice + calculateGST(basePrice);
};

/**
 * Get the final price for a product (base price + GST)
 */
export const getProductPrice = (product: Product, userRole: UserRole): number => {
  const basePrice = getBasePrice(product, userRole);
  return getPriceWithGST(basePrice);
};

/**
 * Get price breakdown for display
 */
export const getPriceBreakdown = (product: Product, userRole: UserRole, quantity: number = 1) => {
  const basePrice = getBasePrice(product, userRole);
  const unitBasePrice = basePrice;
  const unitGST = calculateGST(basePrice);
  const unitTotal = getPriceWithGST(basePrice);
  
  const totalBasePrice = unitBasePrice * quantity;
  const totalGST = unitGST * quantity;
  const totalWithGST = unitTotal * quantity;
  
  return {
    unitBasePrice: Number(unitBasePrice.toFixed(2)),
    unitGST: Number(unitGST.toFixed(2)),
    unitTotal: Number(unitTotal.toFixed(2)),
    totalBasePrice: Number(totalBasePrice.toFixed(2)),
    totalGST: Number(totalGST.toFixed(2)),
    totalWithGST: Number(totalWithGST.toFixed(2)),
    quantity
  };
};

/**
 * Calculate cart totals with GST breakdown
 */
export const calculateCartTotals = (cartItems: CartItem[], userRole: UserRole) => {
  let subtotal = 0;
  let totalGST = 0;
  
  cartItems.forEach(item => {
    const breakdown = getPriceBreakdown(item.product, userRole, item.quantity);
    subtotal += breakdown.totalBasePrice;
    totalGST += breakdown.totalGST;
  });
  
  const total = subtotal + totalGST;
  
  return {
    subtotal: Number(subtotal.toFixed(2)),
    gst: Number(totalGST.toFixed(2)),
    total: Number(total.toFixed(2)),
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
  };
};

/**
 * Format price for display (Singapore dollars)
 */
export const formatPrice = (price: number, showCents: boolean = true): string => {
  if (showCents) {
    return `$${price.toFixed(2)}`;
  }
  return `$${Math.round(price)}`;
};

/**
 * Format price range for display
 */
export const formatPriceRange = (minPrice: number, maxPrice: number, showCents: boolean = true): string => {
  if (minPrice === maxPrice) {
    return formatPrice(minPrice, showCents);
  }
  return `${formatPrice(minPrice, showCents)} - ${formatPrice(maxPrice, showCents)}`;
};

/**
 * Check if product is in stock for requested quantity
 */
export const isProductInStock = (product: Product, requestedQuantity: number = 1): boolean => {
  return product.stock >= requestedQuantity && product.stock > 0;
};

/**
 * Get stock status information
 */
export const getStockStatus = (product: Product) => {
  if (product.stock === 0) {
    return {
      status: 'out_of_stock',
      message: 'Out of Stock',
      color: '#D32F2F',
      backgroundColor: '#FFEBEE'
    };
  } else if (product.stock <= 5) {
    return {
      status: 'low_stock',
      message: `Only ${product.stock} left`,
      color: '#FFA000',
      backgroundColor: '#FFF8E1'
    };
  } else {
    return {
      status: 'in_stock',
      message: 'In Stock',
      color: '#388E3C',
      backgroundColor: '#E8F5E9'
    };
  }
};

/**
 * Validate if item can be added to cart
 */
export const validateAddToCart = (product: Product, requestedQuantity: number): {
  valid: boolean;
  error?: string;
} => {
  if (!isProductInStock(product, requestedQuantity)) {
    if (product.stock === 0) {
      return {
        valid: false,
        error: 'This item is currently out of stock'
      };
    } else {
      return {
        valid: false,
        error: `Only ${product.stock} items available. Please reduce quantity.`
      };
    }
  }
  
  if (requestedQuantity <= 0) {
    return {
      valid: false,
      error: 'Quantity must be greater than 0'
    };
  }
  
  return { valid: true };
};

/**
 * Get maximum quantity that can be added to cart
 */
export const getMaxQuantity = (product: Product, currentCartQuantity: number = 0): number => {
  return Math.max(0, product.stock - currentCartQuantity);
};

/**
 * Calculate delivery fee (if needed)
 */
export const calculateDeliveryFee = (orderTotal: number, deliveryType: 'standard' | 'express' | 'same_day' = 'standard'): number => {
  // Free delivery for orders above $150
  if (orderTotal >= 150) {
    return 0;
  }
  
  switch (deliveryType) {
    case 'same_day':
      return 15;
    case 'express':
      return 10;
    case 'standard':
    default:
      return 5;
  }
};

/**
 * Calculate final order total with delivery
 */
export const calculateOrderTotal = (
  cartItems: CartItem[], 
  userRole: UserRole, 
  deliveryType: 'standard' | 'express' | 'same_day' = 'standard'
) => {
  const cartTotals = calculateCartTotals(cartItems, userRole);
  const deliveryFee = calculateDeliveryFee(cartTotals.total, deliveryType);
  const finalTotal = cartTotals.total + deliveryFee;
  
  return {
    ...cartTotals,
    deliveryFee: Number(deliveryFee.toFixed(2)),
    finalTotal: Number(finalTotal.toFixed(2)),
    freeDeliveryEligible: cartTotals.total >= 150
  };
};