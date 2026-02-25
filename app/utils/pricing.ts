/**
 * Centralized Pricing Utility for Singapore Market
 * Handles retail/trade pricing, GST calculation, and formatting
 */

export interface SizeOption {
  size: string;
  retail_price: number;
  trade_price: number;
}

export interface Product {
  id: string;
  name: string;
  retailPrice: number;
  tradePrice: number;
  category: string;
  brand?: string;
  description: string;
  sku: string;
  image: any;
  rating?: number;
  stock?: number;
  inStock?: boolean;
  lowStockThreshold?: number;
  isLowStock?: boolean;
  imageUrl?: any;
  originalPrice?: number;
  price?: number; // For backward compatibility
  sizeOptions?: SizeOption[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// Singapore GST rate
export const GST_RATE = 0.09; // 9%

/**
 * Get the base price for a product based on user role
 */
export const getBasePrice = (product: Product, userRole: UserRole): number => {
  return userRole === 'trade' ? product.tradePrice : product.retailPrice;
};

/**
 * Calculate GST amount
 */
export const calculateGST = (basePrice: number): number => {
  return Number((basePrice * GST_RATE).toFixed(2));
};

/**
 * Get price with GST included
 */
export const getPriceWithGST = (basePrice: number): number => {
  return Number((basePrice * (1 + GST_RATE)).toFixed(2));
};

/**
 * Get the final price for a product (base price + GST)
 */
export const getProductPrice = (
  product: Product,
  userRole: UserRole
): number => {
  const basePrice = getBasePrice(product, userRole);
  return getPriceWithGST(basePrice);
};

/**
 * Get price breakdown for display
 */
export const getPriceBreakdown = (
  product: Product,
  userRole: UserRole,
  quantity: number = 1
) => {
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
    quantity,
  };
};

/**
 * Format price for display
 */
export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};

/**
 * Calculate cart totals with GST breakdown
 */
export const calculateCartTotals = (
  cartItems: CartItem[],
  userRole: UserRole
) => {
  const subtotal = cartItems.reduce((total, item) => {
    const basePrice = getBasePrice(item.product, userRole);
    return total + basePrice * item.quantity;
  }, 0);

  const gst = calculateGST(subtotal);
  const total = subtotal + gst;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    gst: Number(gst.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
};


export interface DeliveryConfig {
  default_fee: number;
  express_fee: number;
  free_delivery_threshold: number;
}

/**
 * Calculate delivery fee based on order total and delivery type
 */
export const calculateDeliveryFee = (
  orderTotal: number,
  deliveryType: 'standard' | 'express' = 'standard',
  config?: DeliveryConfig
): number => {
  const freeThreshold = config?.free_delivery_threshold ?? 150;
  
  // Free delivery over threshold
  if (orderTotal >= freeThreshold) {
    return 0;
  }

  // Standard delivery fee
  if (deliveryType === 'standard') {
    return config?.default_fee ?? 5.0;
  }

  // Express delivery fee
  return config?.express_fee ?? 8.0;
};

/**
 * Calculate order total including delivery
 */
export const calculateOrderTotal = (
  cartItems: CartItem[],
  userRole: UserRole,
  deliveryType: 'standard' | 'express' = 'standard',
  config?: DeliveryConfig
) => {
  const cartTotals = calculateCartTotals(cartItems, userRole);
  const deliveryFee = calculateDeliveryFee(cartTotals.total, deliveryType, config);

  return {
    ...cartTotals,
    deliveryFee: Number(deliveryFee.toFixed(2)),
    finalTotal: Number((cartTotals.total + deliveryFee).toFixed(2)),
  };
};

// User role type
export type UserRole = 'retail' | 'trade';
